"""
scoring.py — computes per-router health scores.

HEALTH SCORE FORMULA (also documented in README.md):
====================================================
1. Per-router aggregates: for each router, compute mean of each metric over all
   available hourly readings:
     avg_speed_mbps, avg_latency_ms, avg_packet_loss_pct,
     avg_disconnects_per_hr, avg_signal_dbm

2. Minimum sample gate: routers with fewer than MIN_SAMPLES hourly readings are
   excluded from rankings. (All 60 routers have 24 samples in the current dataset,
   so none are excluded — but the gate is enforced for correctness.)

3. Normalization (fleet-wide, percentile-clipped to 5th–95th):
   Each raw metric is clipped to its fleet 5th–95th percentile to prevent a single
   extreme outlier from collapsing everyone else's normalized score.
   Then min-max scaled to [0, 1] where 1 = best.
   For metrics where higher is worse (latency, packet_loss, disconnects), we invert:
     goodness = 1 - normalized_value

4. Weighted average → score in [0, 100]:
     score = (
       0.30 * goodness_speed       +  # throughput quality
       0.25 * goodness_latency     +  # responsiveness
       0.25 * goodness_packet_loss +  # reliability
       0.15 * goodness_disconnects +  # connection stability
       0.05 * goodness_signal         # physical signal strength
     ) * 100

   Higher score = healthier router.
   Sorted ascending (worst first) for the rankings endpoint.
"""

import numpy as np
import pandas as pd

MIN_SAMPLES = 12  # routers with fewer samples are excluded from worst-10 ranking

WEIGHTS = {
    "speed": 0.30,
    "latency": 0.25,
    "packet_loss": 0.25,
    "disconnects": 0.15,
    "signal": 0.05,
}

CLIP_LOW = 5    # percentile lower bound
CLIP_HIGH = 95  # percentile upper bound


def _clip_normalize(series: pd.Series, higher_is_better: bool) -> pd.Series:
    """
    Clip to [p5, p95] then min-max normalize to [0,1].
    If higher_is_better=False, invert so 1 = best.
    """
    lo = np.percentile(series.dropna(), CLIP_LOW)
    hi = np.percentile(series.dropna(), CLIP_HIGH)

    if hi == lo:
        # All values identical — assign perfect goodness
        return pd.Series(1.0, index=series.index)

    clipped = series.clip(lower=lo, upper=hi)
    normalized = (clipped - lo) / (hi - lo)  # 0→1 where 1 = highest raw value

    if not higher_is_better:
        normalized = 1.0 - normalized

    return normalized


def compute_scores(metrics: pd.DataFrame) -> pd.DataFrame:
    """
    Compute per-router health scores.

    Returns a DataFrame with columns:
      router_id, avg_speed, avg_latency, avg_packet_loss, avg_disconnects,
      avg_signal, sample_count,
      goodness_speed, goodness_latency, goodness_packet_loss,
      goodness_disconnects, goodness_signal, score
    """
    # --- Step 1: Aggregate per router ---
    agg = (
        metrics.groupby("router_id")
        .agg(
            avg_speed=("avg_speed_mbps", "mean"),
            avg_latency=("latency_ms", "mean"),
            avg_packet_loss=("packet_loss_pct", "mean"),
            avg_disconnects=("disconnects", "mean"),
            avg_signal=("signal_dbm", "mean"),
            sample_count=("avg_speed_mbps", "count"),
        )
        .reset_index()
    )

    # --- Step 2: Minimum sample gate ---
    eligible = agg[agg["sample_count"] >= MIN_SAMPLES].copy()

    # --- Step 3: Normalize (fleet-wide, percentile-clipped) ---
    eligible["goodness_speed"] = _clip_normalize(eligible["avg_speed"], higher_is_better=True)
    eligible["goodness_latency"] = _clip_normalize(eligible["avg_latency"], higher_is_better=False)
    eligible["goodness_packet_loss"] = _clip_normalize(eligible["avg_packet_loss"], higher_is_better=False)
    eligible["goodness_disconnects"] = _clip_normalize(eligible["avg_disconnects"], higher_is_better=False)
    eligible["goodness_signal"] = _clip_normalize(eligible["avg_signal"], higher_is_better=True)

    # --- Step 4: Weighted average → 0–100 score ---
    eligible["score"] = (
        WEIGHTS["speed"]        * eligible["goodness_speed"] +
        WEIGHTS["latency"]      * eligible["goodness_latency"] +
        WEIGHTS["packet_loss"]  * eligible["goodness_packet_loss"] +
        WEIGHTS["disconnects"]  * eligible["goodness_disconnects"] +
        WEIGHTS["signal"]       * eligible["goodness_signal"]
    ) * 100

    # Round for readability
    eligible["score"] = eligible["score"].round(2)
    for col in ["avg_speed", "avg_latency", "avg_packet_loss", "avg_disconnects", "avg_signal"]:
        eligible[col] = eligible[col].round(3)

    return eligible.sort_values("score", ascending=True).reset_index(drop=True)


def get_fleet_stats(scored: pd.DataFrame) -> dict:
    """Return fleet-wide percentiles for Copilot comparison context."""
    return {
        "fleet_avg_speed": round(scored["avg_speed"].mean(), 2),
        "fleet_avg_latency": round(scored["avg_latency"].mean(), 2),
        "fleet_avg_packet_loss": round(scored["avg_packet_loss"].mean(), 2),
        "fleet_avg_disconnects": round(scored["avg_disconnects"].mean(), 2),
        "fleet_avg_signal": round(scored["avg_signal"].mean(), 2),
        "fleet_p75_packet_loss": round(scored["avg_packet_loss"].quantile(0.75), 2),
        "fleet_p25_signal": round(scored["avg_signal"].quantile(0.25), 2),
        "fleet_p75_disconnects": round(scored["avg_disconnects"].quantile(0.75), 2),
    }
