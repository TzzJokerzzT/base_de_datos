import { formatNumber } from '../../lib/format'
import { SET2, STEELBLUE } from '../../lib/palette'
import { linearScale, niceScale } from '../../lib/scale'
import type { Quartiles } from '../../lib/stats'
import { useElementWidth } from '../../lib/useElementWidth'

export interface BoxGroup {
  label: string
  stats: Quartiles
  color?: string
}

interface BoxPlotChartProps {
  groups: BoxGroup[]
  orientation?: 'vertical' | 'horizontal'
  /** Nombre de la variable graficada, para el eje de valores. */
  valueLabel?: string
  showOutliers?: boolean
  digits?: number
}

/**
 * Diagrama de caja propio (SVG): caja = cuartiles, línea central = mediana,
 * bigotes = extremos dentro de 1.5 × RIC y puntos = atípicos, igual que seaborn.
 * El SVG se dibuja en píxeles reales para que el texto no se reduzca.
 */
export function BoxPlotChart({
  groups,
  orientation = 'vertical',
  valueLabel,
  showOutliers = true,
  digits = 1,
}: BoxPlotChartProps) {
  const [containerRef, width] = useElementWidth<HTMLDivElement>()
  const usable = groups.filter((group) => Number.isFinite(group.stats.median))
  if (usable.length === 0) {
    return <p className="text-sm text-[var(--app-ink-muted)]">Sin datos para la selección actual.</p>
  }

  const allValues = usable.flatMap((group) => [
    group.stats.whiskerLow,
    group.stats.whiskerHigh,
    group.stats.q1,
    group.stats.q3,
    ...(showOutliers ? group.stats.outliers : []),
  ])
  const { domain, ticks } = niceScale(Math.min(...allValues), Math.max(...allValues), 4)
  const vertical = orientation === 'vertical'

  const height = vertical ? 250 : 190
  const padding = vertical
    ? { top: 14, right: 12, bottom: valueLabel ? 42 : 28, left: 46 }
    : { top: 14, right: 16, bottom: 26, left: 84 }

  const plotWidth = Math.max(60, width - padding.left - padding.right)
  const plotHeight = height - padding.top - padding.bottom

  const valueToPosition = vertical
    ? linearScale(domain, [padding.top + plotHeight, padding.top])
    : linearScale(domain, [padding.left, padding.left + plotWidth])

  const slot = vertical ? plotWidth / usable.length : plotHeight / usable.length
  const boxThickness = Math.min(vertical ? 46 : 30, slot * 0.5)

  return (
    <div ref={containerRef} className="h-full w-full">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        height="100%"
        role="img"
        aria-label={
          valueLabel
            ? `Diagrama de caja de ${valueLabel}`
            : `Diagrama de caja de ${usable.map((group) => group.label).join(', ')}`
        }
      >
        {ticks.map((tick) => {
          const position = valueToPosition(tick)
          return vertical ? (
            <g key={`grid-${tick}`}>
              <line
                x1={padding.left}
                x2={padding.left + plotWidth}
                y1={position}
                y2={position}
                stroke="var(--app-grid)"
                strokeDasharray="2 4"
              />
              <text
                x={padding.left - 8}
                y={position + 3.5}
                textAnchor="end"
                fontSize={10.5}
                fill="var(--app-ink-muted)"
              >
                {formatNumber(tick, Math.abs(tick) >= 10 ? 0 : 1)}
              </text>
            </g>
          ) : (
            <g key={`grid-${tick}`}>
              <line
                x1={position}
                x2={position}
                y1={padding.top}
                y2={padding.top + plotHeight}
                stroke="var(--app-grid)"
                strokeDasharray="2 4"
              />
              <text
                x={position}
                y={height - 8}
                textAnchor="middle"
                fontSize={10.5}
                fill="var(--app-ink-muted)"
              >
                {formatNumber(tick, Math.abs(tick) >= 10 ? 0 : 1)}
              </text>
            </g>
          )
        })}

        {usable.map((group, index) => {
          const color = group.color ?? (usable.length === 1 ? STEELBLUE : SET2[index % SET2.length])
          const center = vertical
            ? padding.left + slot * (index + 0.5)
            : padding.top + slot * (index + 0.5)
          const { q1, q3, median, whiskerLow, whiskerHigh, outliers } = group.stats
          const boxStart = valueToPosition(q3)
          const boxEnd = valueToPosition(q1)
          const boxLength = Math.max(1.5, Math.abs(boxEnd - boxStart))

          const box = vertical
            ? { x: center - boxThickness / 2, y: boxStart, width: boxThickness, height: boxLength }
            : { x: boxStart, y: center - boxThickness / 2, width: boxLength, height: boxThickness }
          const medianLine = vertical
            ? {
                x1: center - boxThickness / 2,
                x2: center + boxThickness / 2,
                y1: valueToPosition(median),
                y2: valueToPosition(median),
              }
            : {
                x1: valueToPosition(median),
                x2: valueToPosition(median),
                y1: center - boxThickness / 2,
                y2: center + boxThickness / 2,
              }
          const whiskers = vertical
            ? [
                { x1: center, x2: center, y1: boxStart, y2: valueToPosition(whiskerHigh) },
                { x1: center, x2: center, y1: boxEnd, y2: valueToPosition(whiskerLow) },
              ]
            : [
                { x1: boxStart, x2: valueToPosition(whiskerHigh), y1: center, y2: center },
                { x1: boxEnd, x2: valueToPosition(whiskerLow), y1: center, y2: center },
              ]
          const caps = vertical
            ? [
                {
                  x1: center - boxThickness / 4,
                  x2: center + boxThickness / 4,
                  y1: valueToPosition(whiskerHigh),
                  y2: valueToPosition(whiskerHigh),
                },
                {
                  x1: center - boxThickness / 4,
                  x2: center + boxThickness / 4,
                  y1: valueToPosition(whiskerLow),
                  y2: valueToPosition(whiskerLow),
                },
              ]
            : [
                {
                  x1: valueToPosition(whiskerHigh),
                  x2: valueToPosition(whiskerHigh),
                  y1: center - boxThickness / 4,
                  y2: center + boxThickness / 4,
                },
                {
                  x1: valueToPosition(whiskerLow),
                  x2: valueToPosition(whiskerLow),
                  y1: center - boxThickness / 4,
                  y2: center + boxThickness / 4,
                },
              ]

          return (
            <g key={group.label}>
              <title>
                {`${group.label}: mediana ${formatNumber(median, digits)} · Q1 ${formatNumber(q1, digits)} · ` +
                  `Q3 ${formatNumber(q3, digits)} · ${outliers.length} atípicos`}
              </title>
              {whiskers.map((line, lineIndex) => (
                <line
                  key={`whisker-${lineIndex}`}
                  x1={line.x1}
                  x2={line.x2}
                  y1={line.y1}
                  y2={line.y2}
                  stroke="var(--app-ink-muted)"
                  strokeWidth={1}
                />
              ))}
              {caps.map((line, lineIndex) => (
                <line
                  key={`cap-${lineIndex}`}
                  x1={line.x1}
                  x2={line.x2}
                  y1={line.y1}
                  y2={line.y2}
                  stroke="var(--app-ink-muted)"
                  strokeWidth={1}
                />
              ))}
              <rect
                {...box}
                fill={color}
                fillOpacity={0.55}
                stroke={color}
                strokeWidth={1.2}
                rx={2}
              />
              <line {...medianLine} stroke="var(--app-ink)" strokeWidth={2} strokeLinecap="round" />
              {showOutliers
                ? outliers.map((value, outlierIndex) => (
                    <circle
                      key={`outlier-${outlierIndex}`}
                      cx={vertical ? center : valueToPosition(value)}
                      cy={vertical ? valueToPosition(value) : center}
                      r={2.6}
                      fill="var(--app-panel)"
                      stroke={color}
                      strokeWidth={1.2}
                    />
                  ))
                : null}
              <text
                x={vertical ? center : padding.left - 10}
                y={vertical ? height - (valueLabel ? 20 : 10) : center + 3.5}
                textAnchor={vertical ? 'middle' : 'end'}
                fontSize={11}
                fill="var(--app-ink-muted)"
              >
                {group.label}
              </text>
            </g>
          )
        })}

        {valueLabel ? (
          <text
            x={vertical ? padding.left + plotWidth / 2 : padding.left - 10}
            y={vertical ? height - 3 : 9}
            textAnchor={vertical ? 'middle' : 'end'}
            fontSize={10.5}
            fill="var(--app-ink-muted)"
          >
            {valueLabel}
          </text>
        ) : null}
      </svg>
    </div>
  )
}
