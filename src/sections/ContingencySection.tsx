import { CONTINGENCY_PAIRS, type CategoricalColumn, type TipRow } from '../data/dataset'
import { ChartFrame } from '../components/ChartFrame'
import { SectionCard } from '../components/SectionCard'
import { StatTable } from '../components/StatTable'
import { MosaicChart } from '../components/charts/MosaicChart'
import { formatInteger, formatNumber } from '../lib/format'
import { contingencyText } from '../lib/interpretations'
import { colorForLevel } from '../lib/palette'
import { contingencyTable } from '../lib/stats'

interface ContingencyBlockProps {
  rows: TipRow[]
  rowColumn: CategoricalColumn
  columnColumn: CategoricalColumn
}

const INTERPRETATION_PANEL =
  'rounded-r-lg border-l-[3px] border-[var(--app-accent)] bg-[var(--app-accent-soft)]/60 px-4 py-3'

/** Un cruce de variables cualitativas: frecuencias, porcentajes del total y mosaico. */
function ContingencyBlock({ rows, rowColumn, columnColumn }: ContingencyBlockProps) {
  const table = contingencyTable(rows, rowColumn, columnColumn)
  const title = `${rowColumn} × ${columnColumn}`

  if (table.total === 0) {
    return (
      <div className="panel flex min-w-0 flex-col gap-2 rounded-xl p-4">
        <h3 className="text-[13px] font-semibold text-[var(--app-ink)]">{title}</h3>
        <p className="text-[13px] leading-relaxed text-[var(--app-ink-muted)]">
          {`No hay observaciones con los filtros actuales para cruzar ${rowColumn} con ${columnColumn}: ajuste los filtros para ver este cruce.`}
        </p>
      </div>
    )
  }

  const columnKeys = table.columnLevels.map((_, index) => `column-${index}`)
  const countColumns = [
    { key: 'nivel', label: rowColumn },
    ...table.columnLevels.map((level, index) => ({
      key: columnKeys[index] ?? '',
      label: level,
      align: 'right' as const,
    })),
    { key: 'total', label: 'All', align: 'right' as const },
  ]

  const countRows: Record<string, string>[] = table.rowLevels.map((level, rowIndex) => {
    const cells: Record<string, string> = { nivel: level }
    columnKeys.forEach((key, columnIndex) => {
      cells[key] = formatInteger(table.counts[rowIndex]?.[columnIndex] ?? 0)
    })
    cells.total = formatInteger(table.rowTotals[rowIndex] ?? 0)
    return cells
  })
  const countTotals: Record<string, string> = { nivel: 'Total' }
  columnKeys.forEach((key, columnIndex) => {
    countTotals[key] = formatInteger(table.columnTotals[columnIndex] ?? 0)
  })
  countTotals.total = formatInteger(table.total)
  countRows.push(countTotals)

  const percentRows: Record<string, string>[] = table.rowLevels.map((level, rowIndex) => {
    const percents = table.totalPercents[rowIndex] ?? []
    const cells: Record<string, string> = { nivel: level }
    columnKeys.forEach((key, columnIndex) => {
      cells[key] = formatNumber(percents[columnIndex], 2)
    })
    const rowTotal = percents.reduce((accumulator, value) => accumulator + (Number.isFinite(value) ? value : 0), 0)
    cells.total = formatNumber(rowTotal, 2)
    return cells
  })
  const percentTotals: Record<string, string> = { nivel: 'Total' }
  let grandTotalPercent = 0
  columnKeys.forEach((key, columnIndex) => {
    const columnTotal = table.rowLevels.reduce(
      (accumulator, _, rowIndex) =>
        accumulator + (table.totalPercents[rowIndex]?.[columnIndex] ?? 0),
      0,
    )
    grandTotalPercent += columnTotal
    percentTotals[key] = formatNumber(columnTotal, 2)
  })
  percentTotals.total = formatNumber(grandTotalPercent, 2)
  percentRows.push(percentTotals)

  const percentColumns = [
    { key: 'nivel', label: rowColumn },
    ...table.columnLevels.map((level, index) => ({
      key: columnKeys[index] ?? '',
      label: level,
      align: 'right' as const,
      unit: '%',
    })),
    { key: 'total', label: 'All', align: 'right' as const, unit: '%' },
  ]

  return (
    <div className="panel flex min-w-0 flex-col gap-4 rounded-xl p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h3 className="text-[13px] font-semibold text-[var(--app-ink)]">{title}</h3>
        <p className="text-[11.5px] text-[var(--app-ink-muted)]">
          {`${formatInteger(table.total)} mesas cruzadas`}
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="flex min-w-0 flex-col gap-2">
          <h4 className="text-[11px] font-semibold uppercase tracking-wider text-[var(--app-ink-muted)]">
            Frecuencias absolutas
          </h4>
          <StatTable
            rowHeaderKey="nivel"
            columns={countColumns}
            rows={countRows}
            caption="Filas = niveles de la primera variable; columnas = niveles de la segunda; «All» y «Total» son los márgenes."
          />
        </div>
        <div className="flex min-w-0 flex-col gap-2">
          <h4 className="text-[11px] font-semibold uppercase tracking-wider text-[var(--app-ink-muted)]">
            Porcentaje del total
          </h4>
          <StatTable
            rowHeaderKey="nivel"
            columns={percentColumns}
            rows={percentRows}
            caption="Cada celda es el porcentaje del gran total; los márgenes cierran en 100 %."
          />
        </div>
      </div>

      <ChartFrame
        title="Diagrama de mosaico"
        subtitle={`ancho = ${rowColumn} · alto = ${columnColumn}`}
        height={270}
        legend={table.columnLevels.map((level) => ({
          label: level,
          color: colorForLevel(level, table.columnLevels),
        }))}
        footnote="El área de cada bloque es proporcional a la frecuencia conjunta: bloques de igual alto dentro de una columna indican independencia."
      >
        <MosaicChart table={table} rowLabel={rowColumn} columnLabel={columnColumn} />
      </ChartFrame>

      <div className={INTERPRETATION_PANEL}>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--app-accent)]">
          Interpretación
        </p>
        <p className="mt-1 text-[13.5px] leading-relaxed text-[var(--app-ink)]">
          {contingencyText(rows, rowColumn, columnColumn)}
        </p>
      </div>
    </div>
  )
}

export function ContingencySection({ rows }: { rows: TipRow[] }) {
  return (
    <SectionCard
      id="contingencia"
      number={8}
      title="Contingencia y diagramas de mosaico"
      description="Examine dos cruces de variables cualitativas: frecuencias, porcentajes del total y diagrama de mosaico."
    >
      {CONTINGENCY_PAIRS.map(([rowColumn, columnColumn]) => (
        <ContingencyBlock
          key={`${rowColumn}-${columnColumn}`}
          rows={rows}
          rowColumn={rowColumn}
          columnColumn={columnColumn}
        />
      ))}
    </SectionCard>
  )
}
