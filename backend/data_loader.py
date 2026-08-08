"""
data_loader.py — loads and caches the three CSVs at startup.
Column names verified from sample data:
  routers  : router_id, model, firmware_version, building, room, user_type, issue_date
  metrics  : router_id, hour, avg_speed_mbps, latency_ms, packet_loss_pct,
             disconnects, connected_devices, signal_dbm
  complaints: ticket_id, router_id, date, complaint_text
"""

import os
import pandas as pd

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")


def load_data() -> tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    """Load all three CSVs. Called once at startup and cached in app state."""
    routers = pd.read_csv(os.path.join(DATA_DIR, "routers.csv"))
    metrics = pd.read_csv(os.path.join(DATA_DIR, "metrics.csv"), parse_dates=["hour"])
    complaints = pd.read_csv(os.path.join(DATA_DIR, "complaints.csv"), parse_dates=["date"])

    # Basic cleanup
    routers["router_id"] = routers["router_id"].str.strip()
    metrics["router_id"] = metrics["router_id"].str.strip()
    complaints["router_id"] = complaints["router_id"].str.strip()

    # Sanity print at startup
    print(f"[DataLoader] routers: {routers.shape}, metrics: {metrics.shape}, complaints: {complaints.shape}")
    print(f"[DataLoader] Metric samples per router: min={metrics.groupby('router_id').size().min()}, "
          f"max={metrics.groupby('router_id').size().max()}")

    return routers, metrics, complaints
