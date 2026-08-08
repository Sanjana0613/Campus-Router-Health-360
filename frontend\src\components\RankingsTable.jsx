// components/RankingsTable.jsx
// Shows worst-10 routers ranked by health score (ascending = worst first)

import { getScoreColor, getScoreLabel } from './ScoreUtils.js'

export default function RankingsTable({ routers, selectedId, onSelect, loading, error }) {
  if (loading) {
    return (
      <div className="loading-spinner" style={{ height: '200px' }}>
        <div className="spinner" />
        <span>Loading router data…</span>
      </div>
    )
  }

  if (error) {
    return <div className="error-box">Failed to load rankings: {error}</div>
  }

  // Show worst-10
  const worst10 = routers.slice(0, 10)

  return (
    <>
      <div className="panel-header">
        <div className="panel-title">Worst Performing Routers</div>
        <div className="panel-count">
          {worst10.length}
          <span>of {routers.length} routers</span>
        </div>
      </div>

      <div className="router-list">
        {worst10.map((router, index) => {
          const color = getScoreColor(router.score)
          const isSelected = router.router_id === selectedId

          return (
            <div
              key={router.router_id}
              id={`router-card-${router.router_id}`}
              className={`router-card${isSelected ? ' selected' : ''}`}
              style={{ '--score-color': color }}
              onClick={() => onSelect(router.router_id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && onSelect(router.router_id)}
              aria-label={`Router ${router.router_id}, score ${router.score}`}
              aria-pressed={isSelected}
            >
              <div className="card-top">
                <div>
                  <div className="card-rank">#{index + 1} · {getScoreLabel(router.score)}</div>
                  <div className="card-id">{router.router_id}</div>
                </div>
                <div className="score-badge">
                  <div className="score-value" style={{ color }}>
                    {router.score.toFixed(1)}
                  </div>
                  <div className="score-label">/ 100</div>
                </div>
              </div>

              <div className="score-bar-track">
                <div
                  className="score-bar-fill"
                  style={{ width: `${router.score}%`, background: color }}
                />
              </div>

              <div className="card-meta">
                <span className="meta-chip">🏢 {router.building}</span>
                <span className="meta-chip">📡 {router.model}</span>
                <span className="meta-chip">🔢 {router.sample_count}h</span>
              </div>

              <div className="card-metrics-row">
                <div className="mini-metric">
                  <div className="mini-metric-val">{router.avg_speed.toFixed(0)}</div>
                  <div className="mini-metric-key">Mbps</div>
                </div>
                <div className="mini-metric">
                  <div className="mini-metric-val">{router.avg_latency.toFixed(0)}</div>
                  <div className="mini-metric-key">ms</div>
                </div>
                <div className="mini-metric">
                  <div className="mini-metric-val">{router.avg_packet_loss.toFixed(1)}%</div>
                  <div className="mini-metric-key">pkt loss</div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}
