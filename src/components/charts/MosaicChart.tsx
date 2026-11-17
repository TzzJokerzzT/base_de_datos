import { colorForLevel } from '../../lib/palette'
import type { ContingencyTable } from '../../lib/stats'
import { useElementWidth } from '../../lib/useElementWidth'

interface MosaicChartProps {
  table: ContingencyTable
  rowLabel: string
  columnLabel: string
}

const HEIGHT = 280
const PADDING = { top: 10, right: 10, bottom: 32, left: 10 }
const GAP = 3

interface MosaicBlock {
  key: string
  x: number
  y: number
  width: number
  height: number
  color: string
  rowLevel: string
  columnLevel: string
  count: number
  shareOfTotal: number
  shareOfRow: number
}

/**
 * Diagrama de mosaico propio: el ancho de cada columna es la frecuencia de la primera
 * variable y, dentro de ella, el alto de cada bloque es la frecuencia de la segunda.
 * Las áreas quedan proporcionales a las frecuencias conjuntas.
 */
export function MosaicChart({ table, rowLabel, columnLabel }: MosaicChartProps) {
  const [containerRef, width] = useElementWidth<HTMLDivElement>()

  if (table.total === 0) {
    return <p className="text-sm text-[var(--app-ink-muted)]">Sin datos para la selección actual.</p>
  }

  const plotWidth = Math.max(120, width - PADDING.left - PADDING.right)
  const plotHeight = HEIGHT - PADDING.top - PADDING.bottom

  const blocks: MosaicBlock[] = []
  const rowLabels: { key: string; x: number; width: number; label: string }[] = []
  // El último nivel de la segunda variable se dibuja arriba, como en seaborn/statsmodels.
  const columnIndices = table.columnLevels.map((_, index) => index).reverse()

  let x = PADDING.left
  table.rowLevels.forEach((rowLevel, rowIndex) => {
    const rowTotal = table.rowTotals[rowIndex] ?? 0
    const columnWidth = (rowTotal / table.total) * plotWidth
    const cells = table.counts[rowIndex] ?? []

    let y = PADDING.top
    for (const columnIndex of columnIndices) {
      const count = cells[columnIndex] ?? 0
      if (count === 0) continue
      const blockHeight = (count / rowTotal) * plotHeight
      const columnLevel = table.columnLevels[columnIndex] ?? ''
      blocks.push({
        key: `${rowLevel}-${columnLevel}`,
        x,
        y,
        width: Math.max(1, columnWidth - GAP),
        height: Math.max(1, blockHeight - GAP),
        color: colorForLevel(columnLevel, table.columnLevels),
        rowLevel,
        columnLevel,
        count,
        shareOfTotal: table.totalPercents[rowIndex]?.[columnIndex] ?? 0,
        shareOfRow: table.rowPercents[rowIndex]?.[columnIndex] ?? 0,
      })
      y += blockHeight
    }

    const usableWidth = Math.max(1, columnWidth - GAP)
    rowLabels.push({
      key: `label-${rowLevel}`,
      x: x + usableWidth / 2,
      width: usableWidth,
      label: usableWidth > 84 ? `${rowLevel} (${rowTotal})` : rowLevel,
    })
    x += columnWidth
  })

  return (
    <div ref={containerRef} className="h-full w-full">
      <svg
        viewBox={`0 0 ${width} ${HEIGHT}`}
        width="100%"
        height="100%"
        role="img"
        aria-label={`Diagrama de mosaico de ${rowLabel} y ${columnLabel}`}
      >
        {blocks.map((block) => {
          const showLabel = block.width > 92 && block.height > 34
          return (
            <g key={block.key}>
              <rect
                x={block.x}
                y={block.y}
                width={block.width}
                height={block.height}
                fill={block.color}
                fillOpacity={0.9}
                rx={3}
              >
                <title>
                  {`${rowLabel}=${block.rowLevel} · ${columnLabel}=${block.columnLevel}: ${block.count} mesas ` +
                    `(${block.shareOfTotal.toFixed(2)} % del total, ${block.shareOfRow.toFixed(1)} % de ${block.rowLevel})`}
                </title>
              </rect>
              {showLabel ? (
                <text
                  x={block.x + block.width / 2}
                  y={block.y + block.height / 2}
                  textAnchor="middle"
                  fontSize={11.5}
                  fill="#1b2230"
                  style={{ pointerEvents: 'none' }}
                >
                  <tspan x={block.x + block.width / 2} dy="-6">
                    {block.rowLevel} · {block.columnLevel}
                  </tspan>
                  <tspan x={block.x + block.width / 2} dy="15" fontWeight={600}>
                    {block.count}
                  </tspan>
                </text>
              ) : null}
            </g>
          )
        })}
        {rowLabels.map((label) => (
          <text
            key={label.key}
            x={label.x}
            y={HEIGHT - 14}
            textAnchor="middle"
            fontSize={11}
            fill="var(--app-ink-muted)"
          >
            {label.width > 30 ? label.label : ''}
          </text>
        ))}
        <text
          x={PADDING.left}
          y={HEIGHT - 2}
          fontSize={10.5}
          fill="var(--app-ink-muted)"
        >
          {rowLabel} · el ancho es la frecuencia de cada nivel
        </text>
      </svg>
    </div>
  )
}
