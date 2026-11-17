import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { STEELBLUE } from '../../lib/palette'
import { histogramOf } from '../../lib/stats'
import { TOOLTIP_STYLE, tooltipFormatter } from './tooltip'

interface HistogramChartProps {
  values: number[]
  bins?: number
  color?: string
  xLabel?: string
}

/** Histograma de frecuencias con intervalos de igual ancho (`bins` como el enunciado). */
export function HistogramChart({ values, bins = 12, color = STEELBLUE, xLabel }: HistogramChartProps) {
  const data = histogramOf(values, bins).map((bin) => ({
    label: bin.start.toFixed(bin.end - bin.start < 1 ? 1 : 0),
    range: `${bin.start.toFixed(2)} – ${bin.end.toFixed(2)}`,
    count: bin.count,
  }))

  if (data.length === 0) {
    return <p className="text-sm text-[var(--app-ink-muted)]">Sin datos para la selección actual.</p>
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 4, left: -18 }} barCategoryGap={1}>
        <CartesianGrid stroke="var(--app-grid)" strokeDasharray="2 4" vertical={false} />
        <XAxis
          dataKey="label"
          interval="preserveStartEnd"
          tick={{ fontSize: 11, fill: 'var(--app-ink-muted)' }}
          tickLine={false}
          axisLine={{ stroke: 'var(--app-hairline)' }}
          label={
            xLabel
              ? {
                  value: xLabel,
                  position: 'insideBottom',
                  offset: -2,
                  fontSize: 11,
                  fill: 'var(--app-ink-muted)',
                }
              : undefined
          }
        />
        <YAxis
          tick={{ fontSize: 11, fill: 'var(--app-ink-muted)' }}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
        />
        <Tooltip
          contentStyle={TOOLTIP_STYLE}
          labelStyle={{ color: 'var(--app-ink-muted)', fontSize: 11 }}
          formatter={tooltipFormatter((value, payload) => [
            `${value} mesas`,
            `Intervalo ${String(payload.range ?? '')}`,
          ])}
        />
        <Bar dataKey="count" radius={[2, 2, 0, 0]} isAnimationActive={false}>
          {data.map((entry) => (
            <Cell key={entry.range} fill={color} fillOpacity={0.85} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
