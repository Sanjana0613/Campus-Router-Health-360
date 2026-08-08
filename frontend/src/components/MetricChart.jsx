// components/MetricChart.jsx — Recharts Line Chart with Day/Night Theme adaptation & tooltips

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Area
} from 'recharts'

const CustomTooltip = ({ active, payload, label, unit, isDark }) => {
  if (!active || !payload?.length) return null
  const hourStr = label?.split?.('T')?.[1]?.slice(0, 5) || label
  
  return (
    <div className={`p-2.5 rounded-xl text-xs shadow-lg border backdrop-blur-md transition-colors ${
      isDark
        ? 'bg-slate-900/90 border-slate-700 text-slate-100'
        : 'bg-white/95 border-slate-200 text-slate-900'
    }`}>
      <div className="text-[10px] text-slate-400 font-mono mb-1">Time: {hourStr}</div>
      <div className="font-bold font-mono text-sm" style={{ color: payload[0].color }}>
        {payload[0].value?.toFixed(2)} {unit}
      </div>
    </div>
  )
}

export default function MetricChart({ data, dataKey, label, color, unit = '', avg, isDark }) {
  const formatHour = (val) => val?.split?.('T')?.[1]?.slice(0, 5) || val

  const gradientId = `gradient-${dataKey}`

  return (
    <div className="theme-card p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
          <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
            {label} over time
          </h4>
        </div>
        {avg !== undefined && (
          <span className="text-[11px] font-mono text-[var(--text-muted)]">
            Fleet Avg: <strong className="text-[var(--text-main)] font-semibold">{avg?.toFixed?.(2)} {unit}</strong>
          </span>
        )}
      </div>

      <div className="h-[160px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.25} />
                <stop offset="95%" stopColor={color} stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              stroke={isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)'}
              vertical={false}
            />

            <XAxis
              dataKey="hour"
              tickFormatter={formatHour}
              tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
            />

            <YAxis
              tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 10 }}
              tickLine={false}
              axisLine={false}
            />

            <Tooltip content={<CustomTooltip unit={unit} isDark={isDark} />} />

            {avg !== undefined && (
              <ReferenceLine
                y={avg}
                stroke={color}
                strokeDasharray="4 4"
                strokeOpacity={0.5}
              />
            )}

            <Area
              type="monotone"
              dataKey={dataKey}
              stroke="none"
              fill={`url(#${gradientId})`}
            />

            <Line
              type="monotone"
              dataKey={dataKey}
              stroke={color}
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 5, fill: color, stroke: isDark ? '#0b0f19' : '#ffffff', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
