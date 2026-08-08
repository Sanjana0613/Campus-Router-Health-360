"""
main.py — FastAPI application for Router Health Monitor.

Endpoints:
  GET  /health            → health check
  GET  /rankings          → all eligible routers sorted by score (worst first)
  GET  /routers/{id}      → router metadata + full metrics time series + complaints
  POST /copilot           → AI-grounded diagnosis with cause, numbers, and one fix
"""

import os
from contextlib import asynccontextmanager
from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from data_loader import load_data
from scoring import compute_scores, get_fleet_stats
from copilot import diagnose

# ---------------------------------------------------------------------------
# App state (loaded once at startup)
# ---------------------------------------------------------------------------
app_state: dict[str, Any] = {}


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load CSVs and compute scores once at startup."""
    routers, metrics, complaints = load_data()
    scored = compute_scores(metrics)
    fleet_stats = get_fleet_stats(scored)

    app_state["routers"] = routers
    app_state["metrics"] = metrics
    app_state["complaints"] = complaints
    app_state["scored"] = scored
    app_state["fleet_stats"] = fleet_stats

    print(f"[Startup] Scores computed for {len(scored)} routers.")
    print(f"[Startup] Worst 3: {scored.head(3)[['router_id','score']].to_dict('records')}")
    yield
    # Cleanup (nothing to clean up for in-memory data)


# ---------------------------------------------------------------------------
# CORS — allow frontend origins
# ---------------------------------------------------------------------------
ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:5173,http://localhost:3000"
).split(",")

app = FastAPI(title="Router Health Monitor API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------
class CopilotRequest(BaseModel):
    router_id: str
    question: str = "Why is this router performing badly?"


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@app.get("/health")
def health_check():
    return {"status": "ok", "routers_loaded": len(app_state.get("scored", []))}


@app.get("/rankings")
def get_rankings():
    """
    Returns all eligible routers sorted ascending by health score (worst first).
    Includes key fields for the frontend rankings table.
    """
    scored = app_state["scored"]
    routers = app_state["routers"]

    # Merge with router metadata
    merged = scored.merge(
        routers[["router_id", "model", "firmware_version", "building", "room", "user_type"]],
        on="router_id",
        how="left",
    )

    result = merged[[
        "router_id", "building", "room", "model", "firmware_version", "user_type",
        "score", "sample_count",
        "avg_speed", "avg_latency", "avg_packet_loss", "avg_disconnects", "avg_signal",
        "goodness_speed", "goodness_latency", "goodness_packet_loss",
        "goodness_disconnects", "goodness_signal",
    ]].to_dict(orient="records")

    return result


@app.get("/routers/{router_id}")
def get_router_detail(router_id: str):
    """
    Returns:
    - router metadata
    - full hourly metrics time series (for charting)
    - linked complaints
    - computed stats
    """
    routers = app_state["routers"]
    metrics = app_state["metrics"]
    complaints = app_state["complaints"]
    scored = app_state["scored"]

    # Router metadata
    router_row = routers[routers["router_id"] == router_id]
    if router_row.empty:
        raise HTTPException(status_code=404, detail=f"Router {router_id} not found")

    router_info = router_row.iloc[0].to_dict()

    # Metrics time series — sorted by hour
    router_metrics = (
        metrics[metrics["router_id"] == router_id]
        .sort_values("hour")
        .copy()
    )
    # Convert timestamp to string for JSON serialization
    router_metrics["hour"] = router_metrics["hour"].astype(str)
    metrics_list = router_metrics[[
        "hour", "avg_speed_mbps", "latency_ms", "packet_loss_pct",
        "disconnects", "connected_devices", "signal_dbm"
    ]].to_dict(orient="records")

    # Complaints
    router_complaints = (
        complaints[complaints["router_id"] == router_id]
        .sort_values("date", ascending=False)
        .copy()
    )
    router_complaints["date"] = router_complaints["date"].astype(str)
    complaints_list = router_complaints[["ticket_id", "date", "complaint_text"]].to_dict(orient="records")

    # Computed stats from scoring
    scored_row = scored[scored["router_id"] == router_id]
    stats = {}
    if not scored_row.empty:
        stats = scored_row.iloc[0][[
            "score", "sample_count",
            "avg_speed", "avg_latency", "avg_packet_loss",
            "avg_disconnects", "avg_signal",
        ]].to_dict()

    return {
        "router": router_info,
        "metrics": metrics_list,
        "complaints": complaints_list,
        "stats": stats,
    }


@app.post("/copilot")
def copilot(request: CopilotRequest):
    """
    AI-grounded diagnosis for a specific router.
    Pulls real stats first, then passes to Gemini (or rule-based fallback).
    Never invents data.
    """
    router_id = request.router_id
    question = request.question

    routers = app_state["routers"]
    complaints = app_state["complaints"]
    scored = app_state["scored"]
    fleet_stats = app_state["fleet_stats"]

    # Router must exist
    router_row = routers[routers["router_id"] == router_id]
    if router_row.empty:
        raise HTTPException(status_code=404, detail=f"Router {router_id} not found")

    router_info = router_row.iloc[0].to_dict()

    # Scored stats
    scored_row = scored[scored["router_id"] == router_id]
    if scored_row.empty:
        raise HTTPException(
            status_code=422,
            detail=f"Router {router_id} has insufficient metric samples for scoring."
        )
    router_stats = scored_row.iloc[0][[
        "score", "sample_count",
        "avg_speed", "avg_latency", "avg_packet_loss",
        "avg_disconnects", "avg_signal",
    ]].to_dict()

    # Complaint texts
    router_complaints = complaints[complaints["router_id"] == router_id]
    complaint_texts = router_complaints["complaint_text"].tolist()

    result = diagnose(
        router_id=router_id,
        question=question,
        router_info=router_info,
        router_stats=router_stats,
        fleet_stats=fleet_stats,
        complaint_texts=complaint_texts,
    )

    return {
        "router_id": router_id,
        **result,
    }
