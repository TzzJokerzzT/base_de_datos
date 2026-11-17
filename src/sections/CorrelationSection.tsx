import { SCATTER_PAIRS, type NumericColumn, type TipRow } from '../data/dataset'
import { ChartFrame } from '../components/ChartFrame'
import { SectionCard } from '../components/SectionCard'
import { StatTable } from '../components/StatTable'
import { CorrelationMatrix } from '../components/charts/CorrelationMatrix'
import { ScatterPlot } from '../components/charts/ScatterPlot'
import { formatNumber } from '../lib/format'
import { correlationText } from '../lib/interpretations'
import { SET2 } from '../lib/palette'
import { pairCorrelations, pearsonMatrix } from '../lib/stats'

function intensityOf(value: number): string {
  if (!Number.isFinite(value)) return '—'
  const magnitude = Math.abs(value)
  if (magnitude < 0.3) return 'débil'
  if (magnitude < 0.7) return 'moderada'
  return 'fuerte'
}

function signOf(value: number): string {
  if (!Number.isFinite(value)) return '—'
  return value >= 0 ? 'positiva' : 'negativa'
}

function pairLabel(pair: [NumericColumn, NumericColumn]): string {
  return `${pair[0]} – ${pair[1]}`
}

export function CorrelationSection({ rows }: { rows: TipRow[] }) {
  const matrix = pearsonMatrix(rows)
  const pairs = pairCorrelations(matrix)

  return (
    <SectionCard
      id="correlacion"
      number={6}
      title="Correlaciones y diagramas de dispersión"
      description="Interprete signo e intensidad de las correlaciones. Contraste los coeficientes con las nubes de puntos. Correlación no significa causalidad."
      interpretation={correlationText(rows, matrix)}
    >
      <div className="grid gap-5 lg:grid-cols-2">
        <ChartFrame
          title="Matriz de correlaciones de Pearson"
          subtitle="r"
          height={200}
          footnote="El color sigue el signo y la intensidad: mientras más intenso, más cerca de −1 o de 1."
        >
          <div className="flex h-full items-center">
            <CorrelationMatrix matrix={matrix} />
          </div>
        </ChartFrame>
        <div className="flex min-w-0 flex-col gap-2">
          <h3 className="text-[12px] font-semibold uppercase tracking-wider text-[var(--app-ink-muted)]">
            Coeficientes por pareja
          </h3>
          <StatTable
            rowHeaderKey="pareja"
            columns={[
              { key: 'pareja', label: 'Pareja' },
              { key: 'r', label: 'r', align: 'right' },
              { key: 'signo', label: 'Signo' },
              { key: 'intensidad', label: 'Intensidad' },
            ]}
            rows={pairs.map(({ pair, value }) => ({
              pareja: pairLabel(pair),
              r: formatNumber(value, 3),
              signo: signOf(value),
              intensidad: intensityOf(value),
            }))}
            caption="Intensidad según |r|: débil < 0.3 ≤ moderada < 0.7 ≤ fuerte."
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {SCATTER_PAIRS.map(([xColumn, yColumn], index) => (
          <ChartFrame
            key={`${xColumn}-${yColumn}`}
            title={`${xColumn} vs ${yColumn}`}
            height={210}
            footnote={`r = ${formatNumber(pairs[index]?.value ?? Number.NaN, 3)}`}
          >
            <ScatterPlot
              points={rows.map((row) => ({ x: row[xColumn], y: row[yColumn] }))}
              xLabel={xColumn}
              yLabel={yColumn}
              color={SET2[index % SET2.length]}
            />
          </ChartFrame>
        ))}
      </div>
    </SectionCard>
  )
}
