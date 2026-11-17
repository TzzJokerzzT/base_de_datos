import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { colorForLevel } from '../../lib/palette'
import type { FrequencyRow } from '../../lib/stats'
import { TOOLTIP_STYLE, payloadOf, tooltipFormatter } from './tooltip'

interface DonutChartProps {
  rows: FrequencyRow[]
  levels: string[]
}

/** Gráfico circular (dona) de la composición porcentual. */
export function DonutChart({ rows, levels }: DonutChartProps) {
  if (rows.length === 0) {
    return <p className="text-sm text-[var(--app-ink-muted)]">Sin datos para la selección actual.</p>
  }
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
        <Pie
          data={rows}
          dataKey="count"
          nameKey="level"
          innerRadius="52%"
          outerRadius="82%"
          paddingAngle={1.5}
          stroke="var(--app-panel)"
          strokeWidth={2}
          isAnimationActive={false}
        >
          {rows.map((row) => (
            <Cell key={row.level} fill={colorForLevel(row.level, levels)} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={TOOLTIP_STYLE}
          formatter={tooltipFormatter((value, payload) => [
            `${value} mesas (${(payloadOf<FrequencyRow>(payload).percent ?? 0).toFixed(1)} %)`,
            'Frecuencia',
          ])}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}
