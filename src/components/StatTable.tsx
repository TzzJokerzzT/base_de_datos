import type { ReactNode } from 'react'

export interface StatColumn {
  key: string
  label: string
  align?: 'left' | 'right'
  /** Sufijo opcional, por ejemplo «%» o «USD». */
  unit?: string
}

export interface StatTableProps {
  columns: StatColumn[]
  rows: Record<string, ReactNode>[]
  rowHeaderKey: string
  caption?: string
  /** Fila destacada (por ejemplo, la de mayor coeficiente de variación). */
  highlightKey?: string
}

/**
 * Tabla compacta de estadísticos: encabezado tenue, números alineados a la derecha
 * y encabezado de fila fijo para leerla en móvil.
 */
export function StatTable({ columns, rows, rowHeaderKey, caption, highlightKey }: StatTableProps) {
  if (rows.length === 0) {
    return <p className="text-sm text-[var(--app-ink-muted)]">Sin datos para la selección actual.</p>
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-[13px]">
        {caption ? <caption className="caption-bottom pt-2 text-left text-xs text-[var(--app-ink-muted)]">{caption}</caption> : null}
        <thead>
          <tr className="border-b border-[var(--app-hairline)]">
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className={`px-2.5 py-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--app-ink-muted)] ${
                  column.align === 'right' ? 'text-right' : 'text-left'
                } first:pl-0 last:pr-0`}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => {
            const headerValue = String(row[rowHeaderKey] ?? index)
            const highlighted = highlightKey !== undefined && headerValue === highlightKey
            return (
              <tr
                key={`${headerValue}-${index}`}
                className={`border-b border-[var(--app-hairline)]/60 last:border-0 ${
                  highlighted ? 'bg-[var(--app-accent-soft)]/50' : ''
                }`}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={`px-2.5 py-2 first:pl-0 last:pr-0 ${
                      column.align === 'right' ? 'numeric text-right' : 'text-left'
                    } ${column.key === rowHeaderKey ? 'font-medium text-[var(--app-ink)]' : 'text-[var(--app-ink)]/90'}`}
                  >
                    {row[column.key] ?? '—'}
                    {column.unit ? (
                      <span className="ml-1 text-[11px] text-[var(--app-ink-muted)]">{column.unit}</span>
                    ) : null}
                  </td>
                ))}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
