import { NUMERIC_COLUMNS } from '../../data/dataset'
import { formatNumber } from '../../lib/format'
import { correlationColor } from '../../lib/palette'

interface CorrelationMatrixProps {
  matrix: number[][]
}

/** Matriz de correlaciones de Pearson: color por signo e intensidad del coeficiente. */
export function CorrelationMatrix({ matrix }: CorrelationMatrixProps) {
  return (
    <div className="overflow-x-auto">
      <table className="border-separate border-spacing-1 text-[12px]">
        <thead>
          <tr>
            <th className="w-24" />
            {NUMERIC_COLUMNS.map((column) => (
              <th
                key={column}
                scope="col"
                className="px-1 pb-1 text-right text-[11px] font-semibold uppercase tracking-wider text-[var(--app-ink-muted)]"
              >
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {NUMERIC_COLUMNS.map((rowColumn, rowIndex) => (
            <tr key={rowColumn}>
              <th
                scope="row"
                className="pr-2 text-left text-[11px] font-semibold uppercase tracking-wider text-[var(--app-ink-muted)]"
              >
                {rowColumn}
              </th>
              {NUMERIC_COLUMNS.map((column, columnIndex) => {
                const value = matrix[rowIndex]?.[columnIndex] ?? Number.NaN
                return (
                  <td
                    key={column}
                    className="numeric h-11 min-w-24 rounded-md px-3 text-center font-medium text-[var(--app-ink)]"
                    style={{ backgroundColor: correlationColor(value) }}
                    title={`r(${rowColumn}, ${column}) = ${formatNumber(value, 3)}`}
                  >
                    {formatNumber(value, 3)}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
