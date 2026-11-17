import {
  CATEGORICAL_COLUMNS,
  CATEGORY_LEVELS,
  COLUMN_LABELS,
  type CategoricalColumn,
  type TipRow,
} from '../data/dataset'
import { ChartFrame } from '../components/ChartFrame'
import { SectionCard } from '../components/SectionCard'
import { StatTable } from '../components/StatTable'
import { DonutChart } from '../components/charts/DonutChart'
import { HBarChart } from '../components/charts/HBarChart'
import { formatInteger, formatNumber, formatPercent } from '../lib/format'
import { categoricalText } from '../lib/interpretations'
import { colorForLevel } from '../lib/palette'
import { frequencyTables, type FrequencyRow } from '../lib/stats'

export function CategoricalSection({ rows }: { rows: TipRow[] }) {
  const tables = frequencyTables(rows)

  return (
    <SectionCard
      id="cualitativas"
      number={7}
      title="Variables cualitativas: tablas y gráficos"
      description="Identifique la categoría más frecuente y su porcentaje en cada variable. Compare la utilidad de barras y sectores."
      interpretation={categoricalText(rows, tables)}
    >
      {CATEGORICAL_COLUMNS.map((column: CategoricalColumn) => {
        const table: FrequencyRow[] = tables[column]
        const levels = CATEGORY_LEVELS[column]
        const leader = table[0]
        return (
          <div key={column} className="panel flex min-w-0 flex-col gap-3 rounded-xl p-4">
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <h3 className="text-[13px] font-semibold text-[var(--app-ink)]">{column}</h3>
              <p className="text-[11.5px] text-[var(--app-ink-muted)]">
                {COLUMN_LABELS[column]}
                {leader ? (
                  <>
                    {' · más frecuente: '}
                    <span className="font-medium text-[var(--app-ink)]">{leader.level}</span>
                    {` (${formatPercent(leader.percent, 1)})`}
                  </>
                ) : null}
              </p>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              <StatTable
                rowHeaderKey="nivel"
                columns={[
                  { key: 'nivel', label: 'Nivel' },
                  { key: 'total', label: 'Total', align: 'right' },
                  { key: 'porcentaje', label: 'Porcentaje', align: 'right', unit: '%' },
                ]}
                rows={table.map((row) => ({
                  nivel: row.level,
                  total: formatInteger(row.count),
                  porcentaje: formatNumber(row.percent, 2),
                }))}
                highlightKey={leader?.level}
                caption={`Total de casos: ${formatInteger(rows.length)}.`}
              />

              <ChartFrame title="Frecuencias" subtitle="barras" height={190}>
                <HBarChart
                  data={table.map((row) => ({
                    label: row.level,
                    value: row.count,
                    color: colorForLevel(row.level, levels),
                    detail: `${row.percent.toFixed(1)} %`,
                  }))}
                  unit="mesas"
                  digits={0}
                  yWidth={72}
                />
              </ChartFrame>

              <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
                <ChartFrame title="Composición" subtitle="sectores" height={160}>
                  <DonutChart rows={table} levels={levels} />
                </ChartFrame>
                <ul className="flex flex-col gap-1 text-[11.5px]">
                  {table.map((row) => (
                    <li key={row.level} className="flex items-center gap-1.5 whitespace-nowrap">
                      <span
                        aria-hidden="true"
                        className="size-2.5 shrink-0 rounded-[3px]"
                        style={{ backgroundColor: colorForLevel(row.level, levels) }}
                      />
                      <span className="text-[var(--app-ink-muted)]">{row.level}</span>
                      <span className="numeric font-medium text-[var(--app-ink)]">
                        {formatPercent(row.percent, 1)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )
      })}
    </SectionCard>
  )
}
