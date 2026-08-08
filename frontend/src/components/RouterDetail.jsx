// components/RouterDetail.jsx — right panel: metadata, charts, complaints, copilot

import { useEffect, useState } from 'react'
import { getRouterDetail } from '../api/client.js'
import MetricChart from './MetricChart.jsx'
import CopilotPanel from './CopilotPanel.jsx'
import { getScoreColor, getScoreLabel } from './ScoreUtils.js'

export default function RouterDetail({ routerId }) {
  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!routerId) return
    setLoading(true)
    setError(null)
    setDetail(null)

    getRouterDetail(routerId)
      .then(setDetail)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [routerId])

  if (!routerId) {
    return (
      <div className="empty-state">
        <div className="empty-icon">📡</div>
        <div className="empty-title">Select a router to inspect</div>
        <div className="empty-subtitle">
          Click any router in the worst-10 list to see its metrics, complaints, and AI diagnosis.
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner" />
        <span>Loading {routerId}…</span>
      </div>
    )
  }

  if (error) {
    return <div className="error-box">Error loading {routerId}: {error}</div>
  }

  if (!detail) return null

  const { router, metrics, complaints, stats } = detail
  const scoreColor = getScoreColor(stats.score)
  const scoreLabel = getScoreLabel(stats.score)

  // Stat goodness bars (from score breakdown — we don't have per-goodness here, but can approximate visually)
  const statItems = [
    { key: 'avg_speed', label: 'Avg Speed', value: stats.avg_speed, unit: 'Mbps', color: 'var(--accent-blue)' },
    { key: 'avg_latency', label: 'Latency', value: stats.avg_latency, unit: 'ms', color: 'var(--accent-purple)' },
    { key: 'avg_packet_loss', label: 'Pkt Loss', value: stats.avg_packet_loss, unit: '%', color: 'var(--accent-red)' },
    { key: 'avg_disconnects', label: 'Disconnects', value: stats.avg_disconnects, unit: '/hr', color: 'var(--accent-orange)' },
    { key: 'avg_signal', label: 'Signal', value: stats.avg_signal, unit: 'dBm', color: 'var(--accent-teal)' },
  ]

  const metaItems = [
    { label: 'Model', value: router.model },
    { label: 'Firmware', value: router.firmware_version },
    { label: 'Building', value: router.building },
    { label: 'Room', value: router.room },
    { label: 'User Type', value: router.user_type },
    { label: 'Issue Date', value: router.issue_date },
  ]

  return (
    <div id="router-detail-panel">
      {/* Header */}
      <div className="detail-header">
        <div>
          <div className="detail-id">{router.router_id}</div>
          <div className="detail-building">
            {router.building} · Room {router.room} · {router.user_type}
          </div>
        </div>
        <div className="detail-score-block">
          <div className="detail-score-num" style={{ color: scoreColor }}>
            {stats.score?.toFixed(1)}
          </div>
          <div className="detail-score-label">{scoreLabel} · {stats.sample_count}h sampled</div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="stats-grid">
        {statItems.map((s) => (
          <div key={s.key} className="stat-card">
            <div className="stat-val" style={{ color: s.color }}>
              {s.value?.toFixed(s.unit === 'Mbps' ? 1 : s.unit === 'dBm' ? 0 : 2)}
            </div>
            <div className="stat-key">{s.label}</div>
            <div className="stat-key" style={{ fontSize: 9 }}>{s.unit}</div>
          </div>
        ))}
      </div>

      {/* Router metadata */}
      <div className="section-heading">Router Info</div>
      <div className="meta-grid">
        {metaItems.map((m) => (
          <div key={m.label} className="meta-item">
            <div className="meta-label">{m.label}</div>
            <div className="meta-value">{m.value ?? '—'}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="section-heading">Metrics Over Time</div>
      <div className="charts-grid">
        <MetricChart
          data={metrics}
          dataKey="avg_speed_mbps"
          label="Speed"
          color="var(--accent-blue)"
          unit="Mbps"
          avg={stats.avg_speed}
        />
        <MetricChart
          data={metrics}
          dataKey="packet_loss_pct"
          label="Packet Loss"
          color="var(--accent-red)"
          unit="%"
          avg={stats.avg_packet_loss}
        />
      </div>

      {/* Complaints */}
      <div className="complaints-section">
        <div className="section-heading">
          Complaints
          <span style={{ fontSize: 11, fontWeight: 500, textTransform: 'none', letterSpacing: 0, color: 'var(--accent-orange)' }}>
            {complaints.length > 0 ? ` ${complaints.length} ticket${complaints.length !== 1 ? 's' : ''}` : ''}
          </span>
        </div>
        {complaints.length === 0 ? (
          <div className="no-complaints">No complaints filed for this router.</div>
        ) : (
          <div className="complaints-list" id="complaints-list">
            {complaints.map((c) => (
              <div key={c.ticket_id} className="complaint-item">
                <div className="complaint-text">"{c.complaint_text}"</div>
                <div className="complaint-meta">{c.ticket_id} · {c.date}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Copilot */}
      <CopilotPanel routerId={router.router_id} />
    </div>
  )
}
