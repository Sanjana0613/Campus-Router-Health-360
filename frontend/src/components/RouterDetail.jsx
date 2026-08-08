// components/RouterDetail.jsx — Detailed Router Panel (Metrics Overview, Metadata Grid, Charts, Complaints, Copilot)

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
        <Wifi className="w-12 h-12 mb-3 opacity-30 animate-pulse" />
        <h3 className="text-base font-bold text-[var(--text-main)] mb-1">No Router Selected</h3>
        <p className="text-xs max-w-xs">
          Select any router from the fleet navigation on the left to inspect detailed metrics, complaints, and AI diagnostics.
        </p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-12 text-[var(--text-muted)] gap-3">
        <div className="w-8 h-8 border-3 border-[var(--border-card)] border-t-[var(--color-accent-blue)] rounded-full animate-spin" />
        <span className="text-xs font-medium">Loading details for {routerId}…</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 m-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-xs">
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

  // 5 Metric Overview Cards Specs
  const metricCards = [
    {
      key: 'speed',
      label: 'Avg Speed',
      val: stats.avg_speed?.toFixed(1),
      unit: 'Mbps',
      icon: Zap,
      color: '#3b82f6',
      tooltip: 'Fleet benchmark avg ~47.8 Mbps. Higher is better.',
    },
    {
      key: 'latency',
      label: 'Avg Latency',
      val: stats.avg_latency?.toFixed(0),
      unit: 'ms',
      icon: Clock,
      color: '#8b5cf6',
      tooltip: 'Fleet benchmark avg ~41.4 ms. Lower is better.',
    },
    {
      key: 'packet_loss',
      label: 'Packet Loss',
      val: stats.avg_packet_loss?.toFixed(1),
      unit: '%',
      icon: ShieldAlert,
      color: '#ef4444',
      tooltip: 'Fleet benchmark avg ~0.9%. Lower is better.',
    },
    {
      key: 'disconnects',
      label: 'Disconnects',
      val: stats.avg_disconnects?.toFixed(1),
      unit: '/hr',
      icon: RefreshCw,
      color: '#f59e0b',
      tooltip: 'Fleet benchmark avg ~0.96/hr. Lower is better.',
    },
    {
      key: 'signal',
      label: 'Signal Strength',
      val: stats.avg_signal?.toFixed(0),
      unit: 'dBm',
      icon: Radio,
      color: '#10b981',
      tooltip: 'Fleet benchmark avg ~-53.8 dBm. Higher (closer to 0) is better.',
    },
  ]

  // Metadata items
  const metadataItems = [
    { label: 'Model', val: router.model, icon: HardDrive },
    { label: 'Firmware', val: router.firmware_version, icon: RefreshCw },
    { label: 'Building', val: router.building, icon: Building },
    { label: 'Room', val: `Room ${router.room}`, icon: MapPin },
    { label: 'User Type', val: router.user_type, icon: User },
    { label: 'Issue Date', val: router.issue_date, icon: Calendar },
  ]

  return (
    <div className="space-y-6 pb-8" id="router-detail-container">
      
      {/* 1. Header Overview Banner */}
      <div className="theme-card p-6 relative overflow-hidden">
        
        {/* Accent Bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5" style={{ backgroundColor: color }} />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-2xl font-extrabold font-mono text-[var(--text-main)] tracking-tight">
                {router.router_id}
              </h2>
              <span className={`status-badge ${statusBadgeClass}`}>
                {statusLabel}
              </span>
              <span
                className="px-2.5 py-0.5 rounded-full text-xs font-semibold"
                style={{ backgroundColor: pattern.bg, color: pattern.color }}
                title={pattern.desc}
              >
                {pattern.label}
              </span>
            </div>

            <p className="text-xs text-[var(--text-muted)]">
              {router.building} · Room {router.room} · Assigned to {router.user_type} users
            </p>
          </div>

          {/* Large Health Score Ring / Box */}
          <div className="flex items-center gap-3 sm:border-l sm:border-[var(--border-app)] sm:pl-6">
            <div className="text-right">
              <div className="text-3xl font-black font-mono leading-none" style={{ color }}>
                {score.toFixed(1)}
              </div>
              <div className="text-[10px] uppercase font-bold tracking-wider text-[var(--text-subtle)] mt-1">
                Health Score ({stats.sample_count}h sampled)
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* 2. Top 5 Metric Cards Summary */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-3 flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-blue-500" /> Metric Performance Overview
        </h3>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {metricCards.map((m) => {
            const IconComponent = m.icon
            return (
              <div key={m.key} className="theme-card p-3.5 relative group theme-card-hover">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                    {m.label}
                  </span>
                  <div
                    className="w-6 h-6 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${m.color}18`, color: m.color }}
                  >
                    <IconComponent className="w-3.5 h-3.5" />
                  </div>
                </div>

                <div className="text-xl font-extrabold font-mono text-[var(--text-main)] leading-none">
                  {m.val ?? '—'}{' '}
                  <span className="text-xs font-normal text-[var(--text-subtle)] font-sans">{m.unit}</span>
                </div>

                {/* Tooltip on hover */}
                <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block z-30 w-44 p-2 rounded-lg text-[10px] bg-slate-900 text-slate-100 border border-slate-700 shadow-lg pointer-events-none">
                  {m.tooltip}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* 3. Hardware & Inventory Metadata Grid */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-3">
          Hardware & Location Inventory
        </h3>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {metadataItems.map((m) => {
            const IconComp = m.icon
            return (
              <div key={m.label} className="theme-card p-3">
                <div className="flex items-center gap-1.5 text-[10px] font-medium text-[var(--text-muted)] uppercase mb-1">
                  <IconComp className="w-3 h-3 text-[var(--color-accent-blue)]" />
                  <span>{m.label}</span>
                </div>
                <div className="text-xs font-bold font-mono text-[var(--text-main)] truncate">
                  {m.val ?? '—'}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* 4. Time-Series Metric Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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

      {/* 5. Complaints Ticket History */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-2">
            <MessageSquare className="w-3.5 h-3.5 text-amber-500" />
            User Complaint History
          </h3>
          <span className="text-xs font-mono text-[var(--text-muted)]">
            {complaints.length} Ticket{complaints.length !== 1 ? 's' : ''} Logged
          </span>
        </div>

        {complaints.length === 0 ? (
          <div className="theme-card p-4 text-center text-xs text-[var(--text-muted)] border-dashed">
            No complaints filed for this router.
          </div>
        ) : (
          <div className="space-y-2" id="complaints-list-container">
            {complaints.map((c) => (
              <div
                key={c.ticket_id}
                className="theme-card p-3.5 border-l-4 border-l-amber-500 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div>
                  <p className="text-xs font-medium text-[var(--text-main)] italic">
                    "{c.complaint_text}"
                  </p>
                  <span className="text-[10px] font-mono text-[var(--text-subtle)] mt-1 block">
                    Ticket ID: {c.ticket_id}
                  </span>
                </div>
                <span className="text-[11px] font-mono text-[var(--text-muted)] shrink-0">
                  {c.date}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 6. AI Copilot Diagnosis Panel */}
      <CopilotPanel routerId={router.router_id} isDark={isDark} />

    </div>
  )
}
