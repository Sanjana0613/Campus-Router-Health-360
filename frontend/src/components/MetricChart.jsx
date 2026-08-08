// components/MetricChart.jsx — reusable Recharts line chart

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine
} from 'recharts'

const CustomTooltip = ({ active, payload, label, unit }) => {
  if (!active || !payload?.length) return null
  const hour = label?.split('T')[1]?.slice(0, 5) || label
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border-bright)',
      borderRadius: '8px',
      padding: '8px 12px',
      fontSize: '12px',
    }}>
      <div style={{ color: 'var(--text-muted)', marginBottom: 4 }}>{hour}</div>
      <div style={{ color: payload[0].color, fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
        {payload[0].value?.toFixed(2)} {unit}
      </div>
    </div>
  )
}

export default function MetricChart({ data, dataKey, label, color, unit = '', avg }) {
  // Format x-axis: show only hour part
  const formatHour = (val) => val?.split?.('T')?.[1]?.slice(0, 5) || val

  return (
    <div className="chart-card">
      <div className="chart-title">
        <span className="chart-dot" style={{ background: color }} />
        {label}
        {avg !== undefined && (
          <span style={{ marginLeft: 'auto', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>
            avg {avg?.toFixed?.(2)} {unit}
          </span>
        )}
      </div>
      <ResponsiveContainer width="100%" height={140}>
        <LineChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis
            dataKey="hour"
            tickFormatter={formatHour}
            tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<CustomTooltip unit={unit} />} />
          {avg !== undefined && (
            <ReferenceLine
              y={avg}
              stroke={color}
              strokeDasharray="4 4"
              strokeOpacity={0.4}
            />
          )}
          <Line
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: color, stroke: 'var(--bg-primary)', strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
