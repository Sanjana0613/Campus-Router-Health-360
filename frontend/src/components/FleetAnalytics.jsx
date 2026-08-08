// components/FleetAnalytics.jsx — Datadog-style Fleet Health Distribution & Failure Pattern Clusters

import { AlertTriangle, AlertCircle, CheckCircle2, Sliders } from 'lucide-react'
import { getRouterStatus, getFailurePattern } from './ScoreUtils.js'

export default function FleetAnalytics({ routers, activeStatusFilter, onSelectStatusFilter }) {
  if (!routers || routers.length === 0) return null

  const total = routers.length

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
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-5">
      
      {/* 1. Fleet Distribution Overview */}
      <div className="lg:col-span-7 enterprise-card p-4">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <Sliders className="w-3.5 h-3.5 text-blue-500" />
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              Fleet Health Breakdown
            </h3>
          </div>
          <span className="text-[11px] font-mono text-[var(--text-subtle)]">{total} Routers</span>
        </div>

        {/* Fleet Distribution Bar */}
        <div className="h-2 w-full rounded-full bg-[var(--bg-chip)] overflow-hidden flex mb-3 border border-[var(--border-card)]">
          <div
            style={{ width: `${criticalPct}%` }}
            className="bg-red-500 transition-all duration-300"
            title={`Critical: ${critical.length} (${criticalPct}%)`}
          />
          <div
            style={{ width: `${warningPct}%` }}
            className="bg-amber-500 transition-all duration-300"
            title={`Warning: ${warning.length} (${warningPct}%)`}
          />
          <div
            style={{ width: `${healthyPct}%` }}
            className="bg-emerald-500 transition-all duration-300"
            title={`Healthy: ${healthy.length} (${healthyPct}%)`}
          />
        </div>

        {/* 3 Metric Filter Cards */}
        <div className="grid grid-cols-3 gap-2.5">
          <button
            onClick={() => onSelectStatusFilter(activeStatusFilter === 'critical' ? 'all' : 'critical')}
            className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer border-t-2 ${
              activeStatusFilter === 'critical'
                ? 'bg-red-500/10 border-red-500 border-t-red-500'
                : 'bg-[var(--bg-card)] border-[var(--border-card)] border-t-red-500 hover:bg-[var(--bg-card-hover)]'
            }`}
          >
            <div className="flex items-center justify-between text-[11px] font-medium text-red-500 mb-0.5">
              <span className="flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Critical</span>
              <span className="font-mono">{criticalPct}%</span>
            </div>
            <div className="text-base font-bold font-mono text-[var(--text-main)]">
              {critical.length} <span className="text-[10px] font-normal text-[var(--text-muted)] font-sans">units</span>
            </div>
          </button>

          <button
            onClick={() => onSelectStatusFilter(activeStatusFilter === 'warning' ? 'all' : 'warning')}
            className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer border-t-2 ${
              activeStatusFilter === 'warning'
                ? 'bg-amber-500/10 border-amber-500 border-t-amber-500'
                : 'bg-[var(--bg-card)] border-[var(--border-card)] border-t-amber-500 hover:bg-[var(--bg-card-hover)]'
            }`}
          >
            <div className="flex items-center justify-between text-[11px] font-medium text-amber-500 mb-0.5">
              <span className="flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Warning</span>
              <span className="font-mono">{warningPct}%</span>
            </div>
            <div className="text-base font-bold font-mono text-[var(--text-main)]">
              {warning.length} <span className="text-[10px] font-normal text-[var(--text-muted)] font-sans">units</span>
            </div>
          </button>

          <button
            onClick={() => onSelectStatusFilter(activeStatusFilter === 'healthy' ? 'all' : 'healthy')}
            className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer border-t-2 ${
              activeStatusFilter === 'healthy'
                ? 'bg-emerald-500/10 border-emerald-500 border-t-emerald-500'
                : 'bg-[var(--bg-card)] border-[var(--border-card)] border-t-emerald-500 hover:bg-[var(--bg-card-hover)]'
            }`}
          >
            <div className="flex items-center justify-between text-[11px] font-medium text-emerald-500 mb-0.5">
              <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Healthy</span>
              <span className="font-mono">{healthyPct}%</span>
            </div>
            <div className="text-base font-bold font-mono text-[var(--text-main)]">
              {healthy.length} <span className="text-[10px] font-normal text-[var(--text-muted)] font-sans">units</span>
            </div>
          </button>
        </div>
      </div>

      {/* 2. Failure Pattern Clustering Badges */}
      <div className="lg:col-span-5 enterprise-card p-4">
        <div className="flex items-center justify-between mb-2.5">
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            Failure Pattern Clusters
          </h3>
          <span className="text-[10px] font-mono text-[var(--text-subtle)]">Auto-Categorized</span>
        </div>

        <div className="flex flex-wrap gap-1.5 max-h-[82px] overflow-y-auto pr-1">
          {patternList.map((pat) => (
            <div
              key={pat.code}
              className="px-2.5 py-1 rounded-md text-[11px] flex items-center justify-between gap-2 flex-1 min-w-[130px] border"
              style={{
                backgroundColor: pat.bg,
                borderColor: `${pat.color}33`,
                color: pat.color,
              }}
              title={pat.desc}
            >
              <span className="font-medium truncate">{pat.label}</span>
              <span className="font-bold font-mono text-[10px] px-1 rounded bg-black/15">
                {pat.count}
              </span>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
