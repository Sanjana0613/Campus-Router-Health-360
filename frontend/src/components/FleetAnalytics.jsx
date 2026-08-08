// components/FleetAnalytics.jsx — Fleet Health Distribution & Failure Pattern Clustering Breakdown

import { AlertTriangle, AlertCircle, CheckCircle2, Layers } from 'lucide-react'
import { getRouterStatus, getFailurePattern } from './ScoreUtils.js'

export default function FleetAnalytics({ routers, activeStatusFilter, onSelectStatusFilter }) {
  if (!routers || routers.length === 0) return null

  const total = routers.length

  // Counts
  const critical = routers.filter((r) => getRouterStatus(r.score) === 'critical')
  const warning = routers.filter((r) => getRouterStatus(r.score) === 'warning')
  const healthy = routers.filter((r) => getRouterStatus(r.score) === 'healthy')

  const criticalPct = Math.round((critical.length / total) * 100)
  const warningPct = Math.round((warning.length / total) * 100)
  const healthyPct = Math.round((healthy.length / total) * 100)

  // Pattern clusters
  const patterns = {}
  routers.forEach((r) => {
    const pat = getFailurePattern(r)
    if (!patterns[pat.code]) {
      patterns[pat.code] = { ...pat, count: 0 }
    }
    patterns[pat.code].count += 1
  })

  const patternList = Object.values(patterns).sort((a, b) => b.count - a.count)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-6">
      
      {/* 1. Health Distribution Overview */}
      <div className="lg:col-span-7 theme-card p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[var(--color-accent-blue)]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Fleet Health Distribution
            </h3>
          </div>
          <span className="text-xs text-[var(--text-subtle)] font-mono">{total} Routers Evaluated</span>
        </div>

        {/* Stacked Distribution Bar */}
        <div className="h-3 w-full rounded-full bg-[var(--bg-chip)] overflow-hidden flex mb-4 border border-[var(--border-card)]">
          <div
            style={{ width: `${criticalPct}%` }}
            className="bg-red-500 transition-all duration-500"
            title={`Critical: ${critical.length} (${criticalPct}%)`}
          />
          <div
            style={{ width: `${warningPct}%` }}
            className="bg-amber-500 transition-all duration-500"
            title={`Warning: ${warning.length} (${warningPct}%)`}
          />
          <div
            style={{ width: `${healthyPct}%` }}
            className="bg-emerald-500 transition-all duration-500"
            title={`Healthy: ${healthy.length} (${healthyPct}%)`}
          />
        </div>

        {/* Interactive Filter Metric Badges */}
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => onSelectStatusFilter(activeStatusFilter === 'critical' ? 'all' : 'critical')}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
              activeStatusFilter === 'critical'
                ? 'bg-red-500/10 border-red-500/40 ring-2 ring-red-500/20'
                : 'bg-[var(--bg-card)] border-[var(--border-card)] hover:bg-[var(--bg-card-hover)]'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-red-500 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" /> Critical
              </span>
              <span className="text-xs font-bold font-mono text-red-500">{criticalPct}%</span>
            </div>
            <div className="text-lg font-extrabold font-mono text-[var(--text-main)]">
              {critical.length} <span className="text-xs font-normal text-[var(--text-muted)]">routers</span>
            </div>
          </button>

          <button
            onClick={() => onSelectStatusFilter(activeStatusFilter === 'warning' ? 'all' : 'warning')}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
              activeStatusFilter === 'warning'
                ? 'bg-amber-500/10 border-amber-500/40 ring-2 ring-amber-500/20'
                : 'bg-[var(--bg-card)] border-[var(--border-card)] hover:bg-[var(--bg-card-hover)]'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-amber-500 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" /> Warning
              </span>
              <span className="text-xs font-bold font-mono text-amber-500">{warningPct}%</span>
            </div>
            <div className="text-lg font-extrabold font-mono text-[var(--text-main)]">
              {warning.length} <span className="text-xs font-normal text-[var(--text-muted)]">routers</span>
            </div>
          </button>

          <button
            onClick={() => onSelectStatusFilter(activeStatusFilter === 'healthy' ? 'all' : 'healthy')}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
              activeStatusFilter === 'healthy'
                ? 'bg-emerald-500/10 border-emerald-500/40 ring-2 ring-emerald-500/20'
                : 'bg-[var(--bg-card)] border-[var(--border-card)] hover:bg-[var(--bg-card-hover)]'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-emerald-500 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" /> Healthy
              </span>
              <span className="text-xs font-bold font-mono text-emerald-500">{healthyPct}%</span>
            </div>
            <div className="text-lg font-extrabold font-mono text-[var(--text-main)]">
              {healthy.length} <span className="text-xs font-normal text-[var(--text-muted)]">routers</span>
            </div>
          </button>
        </div>
      </div>

      {/* 2. Failure Pattern Clusters */}
      <div className="lg:col-span-5 theme-card p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
            Failure Pattern Clusters
          </h3>
          <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-purple-500/10 text-purple-500 border border-purple-500/20">
            Auto-Grouped
          </span>
        </div>

        <div className="flex flex-wrap gap-2 max-h-[96px] overflow-y-auto pr-1">
          {patternList.map((pat) => (
            <div
              key={pat.code}
              className="px-2.5 py-1.5 rounded-lg border text-xs flex items-center justify-between gap-3 flex-1 min-w-[140px]"
              style={{
                backgroundColor: pat.bg,
                borderColor: `${pat.color}33`,
                color: pat.color,
              }}
              title={pat.desc}
            >
              <span className="font-semibold truncate">{pat.label}</span>
              <span className="font-bold font-mono px-1.5 py-0.2 rounded bg-black/20 text-[11px]">
                {pat.count}
              </span>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
