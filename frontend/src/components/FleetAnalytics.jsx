// components/FleetAnalytics.jsx — Datadog-style Fleet Health Breakdown & High-Contrast Donut Chart

import { useState } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Sector } from 'recharts'
import { AlertTriangle, AlertCircle, CheckCircle2, Sliders, RotateCcw, PieChart as PieIcon } from 'lucide-react'
import { getRouterStatus, getFailurePattern } from './ScoreUtils.js'

// Active slice render function for hover expansion
const renderActiveShape = (props) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props
  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius - 2}
        outerRadius={outerRadius + 8}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        stroke="#23314e"
        strokeWidth={2}
      />
    </g>
  )
}

export default function FleetAnalytics({
  routers,
  activeStatusFilter,
  onSelectStatusFilter,
  activePatternFilter,
  onSelectPatternFilter,
}) {
  const [activeIndex, setActiveIndex] = useState(null)

  if (!routers || routers.length === 0) return null

  const total = routers.length

  const critical = routers.filter((r) => getRouterStatus(r.score) === 'critical')
  const warning = routers.filter((r) => getRouterStatus(r.score) === 'warning')
  const healthy = routers.filter((r) => getRouterStatus(r.score) === 'healthy')

  const criticalPct = Math.round((critical.length / total) * 100)
  const warningPct = Math.round((warning.length / total) * 100)
  const healthyPct = Math.round((healthy.length / total) * 100)

  const patterns = {}
  routers.forEach((r) => {
    const pat = getFailurePattern(r)
    if (!patterns[pat.code]) {
      patterns[pat.code] = { ...pat, count: 0 }
    }
    patterns[pat.code].count += 1
  })

  const donutData = Object.values(patterns)
    .sort((a, b) => b.count - a.count)
    .map((pat) => ({
      name: pat.label,
      code: pat.code,
      value: pat.count,
      color: pat.color,
      pct: ((pat.count / total) * 100).toFixed(1),
      desc: pat.desc,
    }))

  const selectedPatternObj = donutData.find((d) => d.code === activePatternFilter)
  const centerValue = selectedPatternObj ? selectedPatternObj.value : total
  const centerLabel = selectedPatternObj ? selectedPatternObj.name : 'Total Fleet'

  const handlePieClick = (_, index) => {
    const clickedPattern = donutData[index]
    if (clickedPattern) {
      if (activePatternFilter === clickedPattern.code) {
        onSelectPatternFilter('all')
      } else {
        onSelectPatternFilter(clickedPattern.code)
      }
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-5">
      
      {/* 1. Fleet Health Status Breakdown */}
      <div className="lg:col-span-6 enterprise-card p-4 bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-[#23314e]">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <Sliders className="w-3.5 h-3.5 text-blue-500" />
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-200">
              Fleet Health Breakdown
            </h3>
          </div>
          <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">{total} Monitored</span>
        </div>

        {/* Stacked Distribution Bar */}
        <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-[#1a243b] overflow-hidden flex mb-3 border border-slate-200 dark:border-[#23314e]">
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

        {/* 3 Status Filter Cards */}
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => onSelectStatusFilter(activeStatusFilter === 'critical' ? 'all' : 'critical')}
            className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer border-t-2 ${
              activeStatusFilter === 'critical'
                ? 'bg-red-500/10 border-red-500 border-t-red-500'
                : 'bg-slate-50 dark:bg-[#1a243b] border-slate-200 dark:border-[#23314e] border-t-red-500 hover:bg-slate-100 dark:hover:bg-[#1f2c47]'
            }`}
          >
            <div className="flex items-center justify-between text-[11px] font-medium text-red-600 dark:text-red-400 mb-0.5">
              <span className="flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Critical</span>
              <span className="font-mono">{criticalPct}%</span>
            </div>
            <div className="text-base font-bold font-mono text-slate-900 dark:text-white">
              {critical.length} <span className="text-[10px] font-normal text-slate-500 dark:text-slate-400 font-sans">units</span>
            </div>
          </button>

          <button
            onClick={() => onSelectStatusFilter(activeStatusFilter === 'warning' ? 'all' : 'warning')}
            className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer border-t-2 ${
              activeStatusFilter === 'warning'
                ? 'bg-amber-500/10 border-amber-500 border-t-amber-500'
                : 'bg-slate-50 dark:bg-[#1a243b] border-slate-200 dark:border-[#23314e] border-t-amber-500 hover:bg-slate-100 dark:hover:bg-[#1f2c47]'
            }`}
          >
            <div className="flex items-center justify-between text-[11px] font-medium text-amber-600 dark:text-amber-400 mb-0.5">
              <span className="flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Warning</span>
              <span className="font-mono">{warningPct}%</span>
            </div>
            <div className="text-base font-bold font-mono text-slate-900 dark:text-white">
              {warning.length} <span className="text-[10px] font-normal text-slate-500 dark:text-slate-400 font-sans">units</span>
            </div>
          </button>

          <button
            onClick={() => onSelectStatusFilter(activeStatusFilter === 'healthy' ? 'all' : 'healthy')}
            className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer border-t-2 ${
              activeStatusFilter === 'healthy'
                ? 'bg-emerald-500/10 border-emerald-500 border-t-emerald-500'
                : 'bg-slate-50 dark:bg-[#1a243b] border-slate-200 dark:border-[#23314e] border-t-emerald-500 hover:bg-slate-100 dark:hover:bg-[#1f2c47]'
            }`}
          >
            <div className="flex items-center justify-between text-[11px] font-medium text-emerald-600 dark:text-emerald-400 mb-0.5">
              <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Healthy</span>
              <span className="font-mono">{healthyPct}%</span>
            </div>
            <div className="text-base font-bold font-mono text-slate-900 dark:text-white">
              {healthy.length} <span className="text-[10px] font-normal text-slate-500 dark:text-slate-400 font-sans">units</span>
            </div>
          </button>
        </div>
      </div>

      {/* 2. Donut Chart with Crisp White Central Text */}
      <div className="lg:col-span-6 enterprise-card p-4 bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-[#23314e]">
        
        {/* Header & Reset Filter */}
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <PieIcon className="w-3.5 h-3.5 text-indigo-500" />
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-200">
              Failure Pattern Clustering
            </h3>
          </div>

          {activePatternFilter !== 'all' && (
            <button
              onClick={() => onSelectPatternFilter('all')}
              className="text-[10px] font-medium px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20 transition-all flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-2.5 h-2.5" /> Clear Filter
            </button>
          )}
        </div>

        {/* Donut Chart & Legend */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
          
          {/* Donut Ring with Center Callout */}
          <div className="sm:col-span-5 h-[160px] relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  activeIndex={activeIndex}
                  activeShape={renderActiveShape}
                  data={donutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={52}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                  onClick={handlePieClick}
                  onMouseEnter={(_, index) => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(null)}
                  cursor="pointer"
                >
                  {donutData.map((entry) => {
                    const isSelected = activePatternFilter === 'all' || activePatternFilter === entry.code
                    return (
                      <Cell
                        key={`cell-${entry.code}`}
                        fill={entry.color}
                        stroke="#23314e"
                        strokeWidth={1.5}
                        opacity={isSelected ? 1 : 0.3}
                      />
                    )
                  })}
                </Pie>
              </PieChart>
            </ResponsiveContainer>

            {/* Crisp White Central Text inside Donut Hole */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
              <span className="text-2xl font-black font-mono leading-none text-slate-900 dark:text-white">
                {centerValue}
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 max-w-[75px] truncate mt-1">
                {centerLabel}
              </span>
            </div>
          </div>

          {/* Interactive Legend List */}
          <div className="sm:col-span-7 space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
            {donutData.map((pat) => {
              const isSelected = activePatternFilter === 'all' || activePatternFilter === pat.code
              return (
                <div
                  key={pat.code}
                  onClick={() => onSelectPatternFilter(activePatternFilter === pat.code ? 'all' : pat.code)}
                  className={`p-1.5 rounded-md border text-[11px] flex items-center justify-between cursor-pointer transition-all ${
                    activePatternFilter === pat.code
                      ? 'bg-indigo-500/15 border-indigo-500 ring-1 ring-indigo-500/30'
                      : 'bg-slate-50 dark:bg-[#1a243b] border-slate-200 dark:border-[#23314e] hover:bg-slate-100 dark:hover:bg-[#1f2c47]'
                  } ${!isSelected ? 'opacity-40' : ''}`}
                  title={pat.desc}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: pat.color }} />
                    <span className="font-medium text-slate-900 dark:text-slate-200 truncate">{pat.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 font-mono text-[10px]">
                    <span className="font-bold text-slate-900 dark:text-white">{pat.value}</span>
                    <span className="text-slate-500 dark:text-slate-400">({pat.pct}%)</span>
                  </div>
                </div>
              )
            })}
          </div>

        </div>

      </div>

    </div>
  )
}
