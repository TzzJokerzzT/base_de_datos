import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { TOOLTIP_STYLE, tooltipFormatter } from './tooltip'

export interface HBarDatum {
  label: string
  value: number
  color?: string
  detail?: string
}

interface HBarChartProps {
  data: HBarDatum[]
  /** Unidad que se muestra en el tooltip, por ejemplo «mesas» o «%». */
  unit?: string
  digits?: number
  yWidth?: number
}

/** Barras horizontales genéricas: frecuencias, coeficientes de variación, etc. */
export function HBarChart({ data, unit = '', digits = 1, yWidth = 68 }: HBarChartProps) {
  if (data.length === 0) {
    return <p className="text-sm text-[var(--app-ink-muted)]">Sin datos para la selección actual.</p>
  }
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 26, bottom: 4, left: 4 }} barCategoryGap={6}>
        <XAxis
          type="number"
          tick={{ fontSize: 11, fill: 'var(--app-ink-muted)' }}
          tickLine={false}
          axisLine={{ stroke: 'var(--app-hairline)' }}
          allowDecimals={digits > 0}
        />
        <YAxis
          type="category"
          dataKey="label"
          width={yWidth}
          tick={{ fontSize: 11.5, fill: 'var(--app-ink)' }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          contentStyle={TOOLTIP_STYLE}
          cursor={{ fill: 'var(--app-accent-soft)', fillOpacity: 0.35 }}
          formatter={tooltipFormatter((value, payload) => [
            `${value.toFixed(digits)}${unit ? ` ${unit}` : ''}${payload.detail ? ` · ${String(payload.detail)}` : ''}`,
            String(payload.label ?? ''),
          ])}
        />
        <Bar dataKey="value" radius={[0, 3, 3, 0]} isAnimationActive={false}>
          {data.map((row) => (
            <Cell key={row.label} fill={row.color ?? 'var(--app-accent)'} fillOpacity={0.85} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
