# Router Health Monitor

A real-time health monitoring dashboard for a college ISP with ~10,000 deployed Wi-Fi routers.

**Live Demo:**
- Frontend: `https://<your-vercel-app>.vercel.app`
- Backend API: `https://<your-render-app>.onrender.com`

---

## Architecture

```
GitHub Monorepo
├── backend/    FastAPI + pandas (Render)
└── frontend/   React + Vite + Recharts (Vercel)
```

**Data flow:**
1. CSVs are loaded into memory at startup — no database.
2. Backend computes health scores once at startup; endpoints serve the cached results.
3. Frontend fetches `/rankings` on load; clicking a router fetches `/routers/{id}`; Copilot calls `POST /copilot`.

---

## Health Score Formula

Documented here and in [`backend/scoring.py`](./backend/scoring.py).

### Step 1 — Per-router aggregates
For each router, compute the **mean** of each metric over all available hourly readings:

| Metric | Column | Unit |
|--------|--------|------|
| Speed | `avg_speed_mbps` | Mbps |
| Latency | `latency_ms` | ms |
| Packet Loss | `packet_loss_pct` | % |
| Disconnects | `disconnects` | /hr |
| Signal | `signal_dbm` | dBm |

### Step 2 — Minimum sample gate
Routers with **fewer than 12 hourly readings** are excluded from the worst-10 rankings entirely. A router with a single bad hour must not rank as poorly as one with sustained bad performance.

### Step 3 — Normalization (fleet-wide, percentile-clipped)
Each raw aggregate is **clipped to the fleet 5th–95th percentile** before normalization. This prevents a single extreme outlier from collapsing everyone else's normalized score.

After clipping, each metric is **min-max normalized to [0, 1]** where **1 = best**:
- Speed, Signal: higher raw → higher goodness
- Latency, Packet Loss, Disconnects: lower raw → higher goodness (inverted)

```
goodness_speed         = minmax_clip(avg_speed,       higher_is_better=True)
goodness_latency       = minmax_clip(avg_latency,     higher_is_better=False)
goodness_packet_loss   = minmax_clip(avg_packet_loss, higher_is_better=False)
goodness_disconnects   = minmax_clip(avg_disconnects, higher_is_better=False)
goodness_signal        = minmax_clip(avg_signal,      higher_is_better=True)
```

### Step 4 — Weighted average → 0–100 score

```
health_score = (
  0.30 × goodness_speed       +   # throughput quality
  0.25 × goodness_latency     +   # responsiveness
  0.25 × goodness_packet_loss +   # reliability
  0.15 × goodness_disconnects +   # connection stability
  0.05 × goodness_signal          # physical signal strength
) × 100
```

**Score range:** 0 (worst) → 100 (best).  
Routers are sorted **ascending** in the rankings table (worst first).  
Score is **deterministic**: same inputs → same score. You can explain any score in one sentence.

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Health check |
| `GET` | `/rankings` | All eligible routers, sorted worst-first |
| `GET` | `/routers/{router_id}` | Metadata + full metrics time series + complaints |
| `POST` | `/copilot` | AI-grounded diagnosis with cause, numbers, one fix |

### Copilot grounding
The Copilot **never** invents data. It:
1. Pulls the router's actual computed stats in Python
2. Passes them as structured context to Gemini 1.5 Flash
3. Instructs the model explicitly: "Only use the numbers provided. Cite them. Recommend exactly ONE fix."
4. Falls back to a deterministic rule-based decision tree if no API key is configured

Fix options: `firmware update` | `relocate router` | `replace router` | `user education`

---

## Setup

### Prerequisites
- Python 3.11+
- Node.js 18+

### Backend

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env        # add GEMINI_API_KEY
uvicorn main:app --reload
```

Backend runs at `http://localhost:8000`. API docs at `http://localhost:8000/docs`.

### Frontend

```bash
cd frontend
npm install
# Edit .env to set VITE_API_BASE_URL=http://localhost:8000
npm run dev
```

Frontend runs at `http://localhost:5173`.

---

## Deployment

### Backend → Render
1. Connect GitHub repo to Render
2. Set root directory: `backend`
3. Build command: `pip install -r requirements.txt`
4. Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Environment variables: `GEMINI_API_KEY`, `ALLOWED_ORIGINS`

### Frontend → Vercel
1. Connect GitHub repo to Vercel
2. Root directory: `frontend`
3. Build command: `npm run build`
4. Output: `dist`
5. Environment variable: `VITE_API_BASE_URL=https://<render-app>.onrender.com`

---

## Data Files

| File | Rows | Description |
|------|------|-------------|
| `routers.csv` | 60 | Router inventory: model, firmware, building, room, user type |
| `metrics.csv` | 1440 | Hourly metrics per router: speed, latency, packet loss, disconnects, signal |
| `complaints.csv` | 30 | Support tickets linked to routers |

---

## Validation

- ✅ Router with sustained bad metrics ranks in worst-10 (all have 24 samples — all eligible)
- ✅ Copilot on bad router → cause + real cited numbers + exactly one fix
- ✅ Copilot on healthy router → "healthy" response + real numbers, fix=null
- ✅ Router with complaints but healthy metrics → "user education" recommended
