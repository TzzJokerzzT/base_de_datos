import { Button, Chip } from '@heroui/react'
import { useEffect, useMemo, useState } from 'react'

import { DataDialog } from './components/DataDialog'
import { FilterPanel } from './components/FilterPanel'
import { MetricCard } from './components/MetricCard'
import { ReportCover } from './components/ReportCover'
import { DATASET_ROWS, DATASET_SOURCE, type TipRow } from './data/dataset'
import { CategoryBoxSection } from './sections/CategoryBoxSection'
import { CategoricalSection } from './sections/CategoricalSection'
import { CentralTendencySection } from './sections/CentralTendencySection'
import { ContingencySection } from './sections/ContingencySection'
import { CorrelationSection } from './sections/CorrelationSection'
import { DispersionSection } from './sections/DispersionSection'
import { DistributionsSection } from './sections/DistributionsSection'
import { OverviewSection } from './sections/OverviewSection'
import {
  applyFilters,
  clampFilters,
  computeBounds,
  emptyFilters,
  type Filters,
} from './lib/filters'
import { formatInteger, formatNumber } from './lib/format'
import { meanOf, valuesOf } from './lib/stats'
import {
  createUserRow,
  defaultStorage,
  loadUserRows,
  mergeRows,
  saveUserRows,
  type UserRow,
} from './lib/userRows'

const NAV = [
  { id: 'exploracion', label: 'Exploración' },
  { id: 'tendencia-central', label: 'Tendencia central' },
  { id: 'dispersion', label: 'Dispersión' },
  { id: 'distribuciones', label: 'Distribuciones' },
  { id: 'cajas-categoria', label: 'Cajas por categoría' },
  { id: 'correlacion', label: 'Correlación' },
  { id: 'cualitativas', label: 'Cualitativas' },
  { id: 'contingencia', label: 'Contingencia' },
]

const THEME_KEY = 'tips-theme'

type View = 'dashboard' | 'report'

function initialDark(): boolean {
  try {
    const stored = localStorage.getItem(THEME_KEY)
    if (stored === 'dark') return true
    if (stored === 'light') return false
  } catch {
    // localStorage puede no estar disponible (modo privado): se usa la preferencia del sistema.
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

export default function App() {
  const [storedFilters, setStoredFilters] = useState<Filters>(emptyFilters)
  const [dark, setDark] = useState<boolean>(initialDark)
  const [view, setView] = useState<View>('dashboard')
  const [userRows, setUserRows] = useState<UserRow[]>(() => loadUserRows())
  const [storageAvailable, setStorageAvailable] = useState(() => defaultStorage() !== null)
  const [generatedAt] = useState(() => new Date())

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    try {
      localStorage.setItem(THEME_KEY, dark ? 'dark' : 'light')
    } catch {
      // sin persistencia: el tema sigue funcionando durante la sesión.
    }
  }, [dark])

  const allRows = useMemo(() => mergeRows(DATASET_ROWS, userRows), [userRows])
  const bounds = useMemo(() => computeBounds(allRows), [allRows])

  // Al cambiar los límites (por ejemplo al borrar filas propias) un rango activo se ajusta
  // durante el render: no hace falta un efecto que vuelva a escribir el estado.
  const filters = useMemo(() => clampFilters(storedFilters, bounds), [storedFilters, bounds])

  const rows = useMemo(() => applyFilters(allRows, filters), [allRows, filters])

  const averageBill = meanOf(valuesOf(rows, 'total_bill'))
  const averageTip = meanOf(valuesOf(rows, 'tip'))
  const averageSize = meanOf(valuesOf(rows, 'size'))
  const tipShare =
    rows.length === 0
      ? Number.NaN
      : (100 * valuesOf(rows, 'tip').reduce((a, b) => a + b, 0)) /
        valuesOf(rows, 'total_bill').reduce((a, b) => a + b, 0)

  const commitRows = (next: UserRow[]) => {
    setUserRows(next)
    setStorageAvailable(saveUserRows(next))
  }
  const addRow = (row: TipRow) => {
    commitRows([...userRows, createUserRow(row)])
  }
  const deleteRow = (id: string) => {
    commitRows(userRows.filter((row) => row.id !== id))
  }
  const clearRows = () => {
    commitRows([])
  }

  const sections = (
    <>
      <OverviewSection rows={rows} totalRows={allRows.length} />
      <CentralTendencySection rows={rows} />
      <DispersionSection rows={rows} />
      <DistributionsSection rows={rows} />
      <CategoryBoxSection rows={rows} />
      <CorrelationSection rows={rows} />
      <CategoricalSection rows={rows} />
      <ContingencySection rows={rows} />
    </>
  )

  return (
    <div className="min-h-dvh">
      <header className="no-print sticky top-0 z-30 border-b border-[var(--app-hairline)] bg-[var(--app-canvas)]/85 backdrop-blur">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-3 px-4 py-2.5 lg:px-8">
          <div className="flex items-center gap-3">
            <span aria-hidden="true" className="accent-bar h-7 w-1 rounded-full" />
            <div>
              <h1 className="text-[15px] font-semibold leading-tight text-[var(--app-ink)]">
                Análisis descriptivo · dataset <span className="font-mono text-[13px]">tips</span>
              </h1>
              <p className="text-[11.5px] text-[var(--app-ink-muted)]">
                Estadística descriptiva interactiva · {DATASET_SOURCE.replace('seaborn.', '')}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Chip size="sm" variant="soft" color="accent" className="numeric">
              {allRows.length} × 7
            </Chip>
            {userRows.length > 0 ? (
              <Chip size="sm" variant="soft" color="success" className="numeric">
                +{userRows.length} propia{userRows.length === 1 ? '' : 's'}
              </Chip>
            ) : null}
            <DataDialog
              bounds={bounds}
              totalRows={allRows.length}
              rows={userRows}
              onAdd={addRow}
              onDelete={deleteRow}
              onClear={clearRows}
            />
            {view === 'dashboard' ? (
              <Button size="sm" onPress={() => setView('report')} className="text-[12.5px]">
                Informe PDF
              </Button>
            ) : (
              <>
                <Button
                  size="sm"
                  variant="ghost"
                  onPress={() => setView('dashboard')}
                  className="text-[12.5px]"
                >
                  Volver al tablero
                </Button>
                <Button size="sm" onPress={() => window.print()} className="text-[12.5px]">
                  Guardar como PDF
                </Button>
              </>
            )}
            <Button
              size="sm"
              variant="ghost"
              aria-label={dark ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
              onPress={() => setDark((value) => !value)}
              className="size-8 min-w-8 px-0"
            >
              {dark ? (
                <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={1.6}>
                  <circle cx="12" cy="12" r="4.2" />
                  <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M18.4 5.6L17 7M7 17l-1.4 1.4" strokeLinecap="round" />
                </svg>
              ) : (
                <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={1.6}>
                  <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z" strokeLinejoin="round" />
                </svg>
              )}
            </Button>
          </div>
        </div>
        {view === 'dashboard' ? (
          <nav
            aria-label="Secciones del análisis"
            className="mx-auto max-w-[1400px] overflow-x-auto px-4 pb-2 lg:px-8"
          >
            <ul className="flex items-center gap-1">
              {NAV.map((item, index) => (
                <li key={item.id}>
                  <a
                    href={`#${item.id}`}
                    className="flex items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-1 text-[12px] text-[var(--app-ink-muted)] transition-colors hover:bg-[var(--app-accent-soft)] hover:text-[var(--app-ink)]"
                  >
                    <span className="numeric text-[10.5px] text-[var(--app-accent)]">{index + 1}</span>
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        ) : null}
        {!storageAvailable ? (
          <p className="mx-auto max-w-[1400px] px-4 pb-2 text-[11.5px] text-[var(--app-ink-muted)] lg:px-8">
            Este navegador bloquea <code className="font-mono">localStorage</code> (modo privado o cuota
            llena): las mesas propias se conservan solo durante esta sesión.
          </p>
        ) : null}
      </header>

      {view === 'dashboard' ? (
        <main className="mx-auto grid max-w-[1400px] gap-5 px-4 py-5 lg:px-8 xl:grid-cols-[300px_minmax(0,1fr)]">
          <div className="no-print xl:sticky xl:top-[104px] xl:self-start">
            <FilterPanel
              filters={filters}
              onChange={setStoredFilters}
              bounds={bounds}
              visibleRows={rows.length}
              totalRows={allRows.length}
            />
          </div>

          <div className="flex min-w-0 flex-col gap-5">
            <section aria-label="Resumen de la selección" className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
              <MetricCard
                label="Mesas en la selección"
                value={formatInteger(rows.length)}
                hint={
                  rows.length === allRows.length
                    ? 'sin filtros activos'
                    : `${formatNumber((100 * rows.length) / allRows.length, 1)} % del total`
                }
              />
              <MetricCard label="Cuenta media" value={`${formatNumber(averageBill)} USD`} hint="total_bill" />
              <MetricCard label="Propina media" value={`${formatNumber(averageTip)} USD`} hint="tip" />
              <MetricCard
                label="Personas por mesa"
                value={formatNumber(averageSize, 2)}
                hint={`propina = ${formatNumber(tipShare, 1)} % de la cuenta`}
              />
            </section>

            {sections}

            <footer className="panel rounded-2xl px-4 py-3 text-[11.5px] leading-relaxed text-[var(--app-ink-muted)]">
              <p>
                Dataset <code className="font-mono">tips</code> de seaborn ({DATASET_ROWS.length} mesas
                originales, 7 variables) más {userRows.length} fila{userRows.length === 1 ? '' : 's'} propia
                {userRows.length === 1 ? '' : 's'} guardada{userRows.length === 1 ? '' : 's'} en{' '}
                <code className="font-mono">localStorage</code>. Todos los estadísticos se recalculan en el
                navegador con las mismas definiciones de pandas (varianza muestral, asimetría y curtosis
                corregidas por sesgo, cuartiles por interpolación lineal).
              </p>
              <p className="mt-1.5">
                Equivalencia numérica verificada con <code className="font-mono">bun run check:stats</code>{' '}
                contra <code className="font-mono">python/out/reference_stats.json</code>. Informe completo
                del enunciado: <code className="font-mono">python/out/reporte.html</code>.
              </p>
            </footer>
          </div>
        </main>
      ) : (
        <main className="report-page mx-auto flex max-w-[880px] flex-col gap-5 px-4 py-5 lg:px-6">
          <div className="no-print flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--app-hairline)] bg-[var(--app-panel)] px-3 py-2">
            <p className="text-[11.5px] text-[var(--app-ink-muted)]">
              Este es el informe que se exporta. Los filtros activos quedan documentados en la portada.
            </p>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="ghost" onPress={() => setView('dashboard')} className="text-[12px]">
                Volver al tablero
              </Button>
              <Button size="sm" onPress={() => window.print()} className="text-[12px]">
                Guardar como PDF
              </Button>
            </div>
          </div>

          <ReportCover
            rows={rows}
            totalRows={allRows.length}
            userRowCount={userRows.length}
            filters={filters}
            generatedAt={generatedAt}
          />

          {sections}

          <footer className="no-print panel rounded-2xl px-4 py-3 text-[11px] leading-relaxed text-[var(--app-ink-muted)]">
            Informe generado desde el tablero de estadística descriptiva del dataset{' '}
            <code className="font-mono">tips</code> de seaborn. Estadísticos calculados en el navegador con
            las definiciones de pandas y verificados contra{' '}
            <code className="font-mono">python/out/reference_stats.json</code>.
          </footer>
        </main>
      )}
    </div>
  )
}
