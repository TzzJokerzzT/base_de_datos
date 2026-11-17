import { Chip } from '@heroui/react'

import { type TipRow } from '../data/dataset'
import { describeFilters, type Filters } from '../lib/filters'
import { formatInteger } from '../lib/format'
import {
  categoricalText,
  categoryBoxesText,
  centralTendencyText,
  contingencyText,
  correlationText,
  dispersionText,
  distributionsText,
  overviewText,
} from '../lib/interpretations'
import {
  dispersionShape,
  frequencyTables,
  pearsonMatrix,
} from '../lib/stats'

interface ReportCoverProps {
  /** Filas de la selección (ya filtradas). */
  rows: TipRow[]
  /** Filas del conjunto completo (dataset original + propias). */
  totalRows: number
  /** Filas agregadas por el usuario e incluidas en el conjunto. */
  userRowCount: number
  filters: Filters
  generatedAt: Date
}

/**
 * Portada del informe: metadatos de la selección y resumen narrativo de los ocho pasos.
 * Es la primera página del PDF y el encabezado de la vista de informe.
 */
export function ReportCover({ rows, totalRows, userRowCount, filters, generatedAt }: ReportCoverProps) {
  const activeFilters = describeFilters(filters)
  const dispersion = dispersionShape(rows)
  const summary: { number: number; title: string; text: string }[] = [
    { number: 1, title: 'Carga y exploración de datos', text: overviewText(rows) },
    { number: 2, title: 'Tendencia central', text: centralTendencyText(rows) },
    { number: 3, title: 'Dispersión y forma', text: dispersionText(rows, dispersion) },
    { number: 4, title: 'Histogramas y diagramas de caja', text: distributionsText(rows, dispersion) },
    { number: 5, title: 'Cajas por categorías', text: categoryBoxesText(rows) },
    { number: 6, title: 'Correlaciones y dispersión', text: correlationText(rows, pearsonMatrix(rows)) },
    { number: 7, title: 'Variables cualitativas', text: categoricalText(rows, frequencyTables(rows)) },
    {
      number: 8,
      title: 'Contingencia y diagramas de mosaico',
      text: `${contingencyText(rows, 'day', 'time')} ${contingencyText(rows, 'sex', 'smoker')}`,
    },
  ]

  return (
    <section id="report-cover" className="panel rounded-2xl px-6 py-6">
      <header>
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-[var(--app-accent)]">
          Informe descriptivo
        </p>
        <h1 className="mt-1.5 text-[22px] font-semibold leading-tight text-[var(--app-ink)]">
          Dataset <span className="font-mono text-[19px]">tips</span> · estadística descriptiva
        </h1>
        <p className="mt-1 text-[12.5px] text-[var(--app-ink-muted)]">
          Mesas de un restaurante · 7 variables · generado el{' '}
          {new Intl.DateTimeFormat('es', { dateStyle: 'long', timeStyle: 'short' }).format(generatedAt)}
        </p>
      </header>

      <dl className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl bg-[var(--app-accent-soft)]/50 px-3 py-2.5">
          <dt className="text-[10.5px] font-semibold uppercase tracking-wider text-[var(--app-ink-muted)]">
            Observaciones
          </dt>
          <dd className="numeric mt-0.5 text-[15px] font-semibold text-[var(--app-ink)]">
            {formatInteger(rows.length)} de {formatInteger(totalRows)}
          </dd>
          <p className="mt-0.5 text-[11px] text-[var(--app-ink-muted)]">mesas en la selección</p>
        </div>
        <div className="rounded-xl bg-[var(--app-accent-soft)]/50 px-3 py-2.5">
          <dt className="text-[10.5px] font-semibold uppercase tracking-wider text-[var(--app-ink-muted)]">
            Filas propias incluidas
          </dt>
          <dd className="numeric mt-0.5 text-[15px] font-semibold text-[var(--app-ink)]">
            {formatInteger(userRowCount)}
          </dd>
          <p className="mt-0.5 text-[11px] text-[var(--app-ink-muted)]">
            guardadas en el navegador (localStorage)
          </p>
        </div>
        <div className="rounded-xl bg-[var(--app-accent-soft)]/50 px-3 py-2.5">
          <dt className="text-[10.5px] font-semibold uppercase tracking-wider text-[var(--app-ink-muted)]">
            Variables
          </dt>
          <dd className="numeric mt-0.5 text-[15px] font-semibold text-[var(--app-ink)]">7</dd>
          <p className="mt-0.5 text-[11px] text-[var(--app-ink-muted)]">
            3 cuantitativas · 4 cualitativas
          </p>
        </div>
      </dl>

      <div className="mt-4">
        <h2 className="text-[10.5px] font-semibold uppercase tracking-wider text-[var(--app-ink-muted)]">
          Filtros aplicados
        </h2>
        {activeFilters.length === 0 ? (
          <p className="mt-1 text-[12.5px] text-[var(--app-ink)]">
            Sin filtros: el informe incluye todas las observaciones del conjunto.
          </p>
        ) : (
          <ul className="mt-1.5 flex flex-wrap gap-1.5">
            {activeFilters.map((description) => (
              <li key={description}>
                <Chip size="sm" variant="soft" color="accent">
                  {description}
                </Chip>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-5 border-t border-[var(--app-hairline)] pt-4">
        <h2 className="text-[13px] font-semibold text-[var(--app-ink)]">Resumen de los ocho puntos</h2>
        <ol className="mt-2.5 flex flex-col gap-2.5">
          {summary.map((item) => (
            <li key={item.number} className="flex gap-2.5">
              <span
                aria-hidden="true"
                className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-md bg-[var(--app-accent-soft)] text-[11px] font-semibold text-[var(--app-accent)]"
              >
                {item.number}
              </span>
              <div className="min-w-0">
                <p className="text-[12.5px] font-semibold text-[var(--app-ink)]">{item.title}</p>
                <p className="mt-0.5 text-[12px] leading-relaxed text-[var(--app-ink-muted)]">
                  {item.text}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <p className="mt-4 text-[10.5px] leading-relaxed text-[var(--app-ink-muted)]">
        Todos los estadísticos se calculan en el navegador con las mismas definiciones que pandas
        (varianza muestral, asimetría y curtosis corregidas por sesgo, cuartiles por interpolación
        lineal). El detalle numérico y los gráficos de cada punto están en las páginas siguientes.
      </p>
    </section>
  )
}
