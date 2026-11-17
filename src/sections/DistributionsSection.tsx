import { NUMERIC_COLUMNS, type NumericColumn, type TipRow } from '../data/dataset'
import { ChartFrame } from '../components/ChartFrame'
import { SectionCard } from '../components/SectionCard'
import { BoxPlotChart } from '../components/charts/BoxPlotChart'
import { HistogramChart } from '../components/charts/HistogramChart'
import { formatInteger, formatNumber } from '../lib/format'
import { distributionsText } from '../lib/interpretations'
import { dispersionShape, quartilesOf, valuesOf } from '../lib/stats'

const BINS = 12

function unitOf(column: NumericColumn): string {
  return column === 'size' ? 'personas' : 'USD'
}

export function DistributionsSection({ rows }: { rows: TipRow[] }) {
  const shape = dispersionShape(rows)
  const blocks = NUMERIC_COLUMNS.map((column) => ({
    column,
    values: valuesOf(rows, column),
    quartiles: quartilesOf(valuesOf(rows, column)),
  }))

  return (
    <SectionCard
      id="distribuciones"
      number={4}
      title="Histogramas y diagramas de caja"
      description="Describa el comportamiento de las distribuciones, su dispersión y los posibles valores atípicos."
      interpretation={distributionsText(rows, shape)}
    >
      {blocks.map(({ column, values, quartiles }) => {
        const unit = unitOf(column)
        return (
          <div key={column} className="flex min-w-0 flex-col gap-3">
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-[var(--app-hairline)] pb-1.5">
              <h3 className="text-[13px] font-semibold text-[var(--app-ink)]">{column}</h3>
              <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11.5px] text-[var(--app-ink-muted)]">
                <li>
                  Media{' '}
                  <span className="numeric font-medium text-[var(--app-ink)]">
                    {formatNumber(quartiles.mean)} {unit}
                  </span>
                </li>
                <li>
                  Mediana{' '}
                  <span className="numeric font-medium text-[var(--app-ink)]">
                    {formatNumber(quartiles.median)} {unit}
                  </span>
                </li>
                <li>
                  Atípicos{' '}
                  <span className="numeric font-medium text-[var(--app-ink)]">
                    {formatInteger(quartiles.outliers.length)}
                  </span>
                </li>
              </ul>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <ChartFrame title="Histograma" subtitle={`${formatInteger(BINS)} intervalos`} height={210}>
                <HistogramChart values={values} bins={BINS} />
              </ChartFrame>
              <ChartFrame title="Diagrama de caja" subtitle="criterio 1.5 × RIC" height={210}>
                <BoxPlotChart
                  groups={[{ label: column, stats: quartiles }]}
                  orientation="horizontal"
                  valueLabel={column}
                />
              </ChartFrame>
            </div>
          </div>
        )
      })}
    </SectionCard>
  )
}
