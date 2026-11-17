import {
  CartesianGrid,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { SET2 } from '../../lib/palette'
import { TOOLTIP_STYLE, tooltipFormatter } from './tooltip'

interface ScatterPlotProps {
  points: { x: number; y: number }[]
  xLabel: string
  yLabel: string
  color?: string
}

/** Nube de puntos de dos variables cuantitativas. */
export function ScatterPlot({ points, xLabel, yLabel, color = SET2[2] }: ScatterPlotProps) {
  if (points.length === 0) {
    return <p className="text-sm text-[var(--app-ink-muted)]">Sin datos para la selección actual.</p>
  }
  return (
    <ResponsiveContainer width="100%" height="100%">
      <ScatterChart margin={{ top: 8, right: 12, bottom: 16, left: -14 }}>
        <CartesianGrid stroke="var(--app-grid)" strokeDasharray="2 4" />
        <XAxis
          type="number"
          dataKey="x"
          name={xLabel}
          domain={['dataMin', 'dataMax']}
          tick={{ fontSize: 11, fill: 'var(--app-ink-muted)' }}
          tickLine={false}
          axisLine={{ stroke: 'var(--app-hairline)' }}
          label={{ value: xLabel, position: 'insideBottom', offset: -10, fontSize: 11, fill: 'var(--app-ink-muted)' }}
        />
        <YAxis
          type="number"
          dataKey="y"
          name={yLabel}
          domain={['dataMin', 'dataMax']}
          tick={{ fontSize: 11, fill: 'var(--app-ink-muted)' }}
          tickLine={false}
          axisLine={false}
          width={44}
        />
        <Tooltip
          contentStyle={TOOLTIP_STYLE}
          cursor={{ strokeDasharray: '3 3', stroke: 'var(--app-ink-muted)' }}
          formatter={tooltipFormatter((value, payload) => [
            value.toFixed(2),
            String(payload.name ?? ''),
          ])}
        />
        <Scatter data={points} fill={color} fillOpacity={0.7} isAnimationActive={false} />
      </ScatterChart>
    </ResponsiveContainer>
  )
}
