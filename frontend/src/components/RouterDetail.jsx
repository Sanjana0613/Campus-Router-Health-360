// components/RouterDetail.jsx — Enterprise Detail Pane (Metric Overview, Metadata Grid, Recharts, Complaints, Copilot)

import { useEffect, useState } from 'react'
import {
  Wifi, Zap, Clock, ShieldAlert, RefreshCw, Radio, HardDrive,
  Building, MapPin, User, Calendar, MessageSquare, Info
} from 'lucide-react'
import { getRouterDetail } from '../api/client.js'
import MetricChart from './MetricChart.jsx'
import CopilotPanel from './CopilotPanel.jsx'
import {
  getScoreColor, getStatusBadgeClass, getStatusLabel, getFailurePattern
} from './ScoreUtils.js'

export default function RouterDetail({ routerId, isDark }) {
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
      <div className="h-full flex flex-col items-center justify-center text-center p-8 text-[var(--text-muted)]">
        <Wifi className="w-10 h-10 mb-2 opacity-30 animate-pulse" />
        <h3 className="text-sm font-bold text-[var(--text-main)] mb-1">Select a Router</h3>
        <p className="text-xs max-w-xs">
          Click any router from the inventory list to view detailed metrics, time-series charts, complaints, and AI diagnosis.
        </p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-12 text-[var(--text-muted)] gap-2">
        <div className="w-6 h-6 border-2 border-[var(--border-card)] border-t-blue-500 rounded-full animate-spin" />
        <span className="text-xs font-medium">Fetching details for {routerId}…</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-3 m-3 rounded-md bg-red-500/10 border border-red-500/30 text-red-500 text-xs">
        Error loading {routerId}: {error}
      </div>
    )
  }

  if (!detail) return null

  const { router, metrics, complaints, stats } = detail
  const score = stats.score ?? 0
  const color = getScoreColor(score)
  const statusBadgeClass = getStatusBadgeClass(score)
  const statusLabel = getStatusLabel(score)
  const pattern = getFailurePattern({ ...router, ...stats, complaints_count: complaints.length })

  // 5 Metric Overview Cards with 2px top accents
  const metricCards = [
    {
      key: 'speed',
      label: 'Avg Speed',
      val: stats.avg_speed?.toFixed(1),
      unit: 'Mbps',
      icon: Zap,
      accentBorder: 'border-t-blue-500',
      textColor: 'text-blue-600 dark:text-blue-400',
      tooltip: 'Fleet benchmark avg ~47.8 Mbps. Higher is better.',
    },
    {
      key: 'latency',
      label: 'Avg Latency',
      val: stats.avg_latency?.toFixed(0),
      unit: 'ms',
      icon: Clock,
      accentBorder: 'border-t-purple-500',
      textColor: 'text-purple-600 dark:text-purple-400',
      tooltip: 'Fleet benchmark avg ~41.4 ms. Lower is better.',
    },
    {
      key: 'packet_loss',
      label: 'Packet Loss',
      val: stats.avg_packet_loss?.toFixed(1),
      unit: '%',
      icon: ShieldAlert,
      accentBorder: 'border-t-rose-500',
      textColor: 'text-rose-600 dark:text-rose-400',
      tooltip: 'Fleet benchmark avg ~0.9%. Lower is better.',
    },
    {
      key: 'disconnects',
      label: 'Disconnects',
      val: stats.avg_disconnects?.toFixed(1),
      unit: '/hr',
      icon: RefreshCw,
      accentBorder: 'border-t-amber-500',
      textColor: 'text-amber-600 dark:text-amber-400',
      tooltip: 'Fleet benchmark avg ~0.96/hr. Lower is better.',
    },
    {
      key: 'signal',
      label: 'Signal Strength',
      val: stats.avg_signal?.toFixed(0),
      unit: 'dBm',
      icon: Radio,
      accentBorder: 'border-t-emerald-500',
      textColor: 'text-emerald-600 dark:text-emerald-400',
      tooltip: 'Fleet benchmark avg ~-53.8 dBm. Higher (closer to 0) is better.',
    },
  ]

  const metadataItems = [
    { label: 'Model', val: router.model, icon: HardDrive },
    { label: 'Firmware', val: router.firmware_version, icon: RefreshCw },
    { label: 'Building', val: router.building, icon: Building },
    { label: 'Room', val: `Room ${router.room}`, icon: MapPin },
    { label: 'User Type', val: router.user_type, icon: User },
    { label: 'Issue Date', val: router.issue_date, icon: Calendar },
  ]

  return (
    <div className="space-y-5 pb-8" id="router-detail-container">
      
      {/* Header Banner */}
      <div className="enterprise-card p-5 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <h2 className="text-xl font-bold font-mono text-[var(--text-main)] tracking-tight">
                {router.router_id}
              </h2>
              <span className={`status-badge ${statusBadgeClass}`}>
                {statusLabel}
              </span>
              <span
                className="px-2 py-0.5 rounded text-[10px] font-medium"
                style={{ backgroundColor: pattern.bg, color: pattern.color }}
              >
                {pattern.label}
              </span>
            </div>

            <p className="text-xs text-[var(--text-muted)]">
              {router.building} · Room {router.room} · {router.user_type} users
            </p>
          </div>

          <div className="flex items-center gap-3 sm:border-l sm:border-[var(--border-app)] sm:pl-5">
            <div className="text-right">
              <div className="text-2xl font-extrabold font-mono" style={{ color }}>
                {score.toFixed(1)}
              </div>
              <div className="text-[10px] uppercase font-semibold text-[var(--text-subtle)]">
                Score ({stats.sample_count}h sampled)
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 5 Metric Summary Cards Grid with 2px Top Accents */}
      <div>
        <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-2">
          <Info className="w-3.5 h-3.5 text-blue-500" />
          <span>Metric Overview</span>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
          {metricCards.map((m) => {
            const IconComp = m.icon
            return (
              <div
                key={m.key}
                className={`enterprise-card p-3 border-t-2 ${m.accentBorder} relative group`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                    {m.label}
                  </span>
                  <IconComp className={`w-3.5 h-3.5 ${m.textColor}`} />
                </div>

                <div className="text-lg font-bold font-mono text-[var(--text-main)]">
                  {m.val ?? '—'}{' '}
                  <span className="text-[11px] font-normal text-[var(--text-subtle)] font-sans">{m.unit}</span>
                </div>

                {/* Tooltip */}
                <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1.5 hidden group-hover:block z-30 w-44 p-2 rounded text-[10px] bg-slate-900 text-slate-100 border border-slate-700 shadow-md pointer-events-none">
                  {m.tooltip}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Hardware & Location Inventory Grid */}
      <div>
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-2">
          Hardware & Inventory
        </h3>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {metadataItems.map((m) => {
            const IconComp = m.icon
            return (
              <div key={m.label} className="enterprise-card p-2.5">
                <div className="flex items-center gap-1 text-[10px] font-medium text-[var(--text-muted)] uppercase mb-0.5">
                  <IconComp className="w-3 h-3 text-blue-500" />
                  <span>{m.label}</span>
                </div>
                <div className="text-xs font-semibold font-mono text-[var(--text-main)] truncate">
                  {m.val ?? '—'}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Metric Time-Series Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
        <MetricChart
          data={metrics}
          dataKey="avg_speed_mbps"
          label="Speed (Mbps)"
          color="#3b82f6"
          unit="Mbps"
          avg={stats.avg_speed}
          isDark={isDark}
        />
        <MetricChart
          data={metrics}
          dataKey="packet_loss_pct"
          label="Packet Loss (%)"
          color="#ef4444"
          unit="%"
          avg={stats.avg_packet_loss}
          isDark={isDark}
        />
      </div>

      {/* Complaints Section */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-amber-500" />
            Support Ticket History
          </h3>
          <span className="text-[11px] font-mono text-[var(--text-muted)]">
            {complaints.length} Ticket{complaints.length !== 1 ? 's' : ''}
          </span>
        </div>

        {complaints.length === 0 ? (
          <div className="enterprise-card p-3 text-center text-xs text-[var(--text-muted)] border-dashed">
            No complaints logged for this router.
          </div>
        ) : (
          <div className="space-y-1.5">
            {complaints.map((c) => (
              <div
                key={c.ticket_id}
                className="enterprise-card p-3 border-l-2 border-l-amber-500 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5"
              >
                <div>
                  <p className="text-xs text-[var(--text-main)] italic">
                    "{c.complaint_text}"
                  </p>
                  <span className="text-[10px] font-mono text-[var(--text-subtle)] mt-0.5 block">
                    ID: {c.ticket_id}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-[var(--text-muted)] shrink-0">
                  {c.date}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Grounded AI Copilot Panel */}
      <CopilotPanel routerId={router.router_id} isDark={isDark} />

    </div>
  )
}
