import { Button, Chip, Slider } from '@heroui/react'
import { CATEGORICAL_COLUMNS, type CategoricalColumn } from '../data/dataset'
import {
  activeFilterCount,
  describeFilters,
  emptyFilters,
  toggleLevel,
  toggleSize,
  type FilterBounds,
  type Filters,
  type Range,
} from '../lib/filters'
import { formatNumber } from '../lib/format'

interface FilterPanelProps {
  filters: Filters
  onChange: (filters: Filters) => void
  /** Límites y niveles vigentes del conjunto (incluye las filas propias). */
  bounds: FilterBounds
  visibleRows: number
  totalRows: number
}

const CATEGORICAL_TITLES: Record<CategoricalColumn, string> = {
  sex: 'Sexo del pagador',
  smoker: 'Fuma',
  day: 'Día de la semana',
  time: 'Momento del servicio',
}

function RangeSlider({
  label,
  range,
  bounds,
  step,
  onChange,
}: {
  label: string
  range: Range
  bounds: Range
  step: number
  onChange: (range: Range) => void
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <span className="text-[12px] font-medium text-[var(--app-ink)]">{label}</span>
        <span className="numeric text-[11.5px] text-[var(--app-ink-muted)]">
          {formatNumber(range[0], 2)} – {formatNumber(range[1], 2)}
        </span>
      </div>
      <Slider
        aria-label={`Rango de ${label}`}
        minValue={bounds[0]}
        maxValue={bounds[1]}
        step={step}
        value={range}
        onChange={(value) => {
          if (Array.isArray(value) && value.length === 2) {
            const next: Range = [Number(value[0]), Number(value[1])]
            onChange(next)
          }
        }}
        className="w-full"
      >
        <Slider.Track>
          {({ state }: { state: { values: number[] } }) => (
            <>
              <Slider.Fill />
              {state.values.map((_, index) => (
                <Slider.Thumb key={index} index={index} />
              ))}
            </>
          )}
        </Slider.Track>
      </Slider>
    </div>
  )
}

/** Panel lateral con todos los filtros globales. */
export function FilterPanel({ filters, onChange, bounds, visibleRows, totalRows }: FilterPanelProps) {
  const activeCount = activeFilterCount(filters)
  const share = totalRows === 0 ? 0 : (100 * visibleRows) / totalRows

  const changeRange = (key: 'totalBill' | 'tip') => (range: Range) => {
    const full = bounds[key]
    // Volver al rango completo equivale a desactivar el filtro.
    const isFull = range[0] === full[0] && range[1] === full[1]
    onChange({ ...filters, [key]: isFull ? null : range })
  }

  return (
    <aside className="panel flex flex-col gap-5 rounded-2xl p-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-[13px] font-semibold uppercase tracking-wider text-[var(--app-ink)]">
            Filtros
          </h2>
          <p className="mt-0.5 text-[11.5px] text-[var(--app-ink-muted)]">
            Todo el tablero se recalcula al instante
          </p>
        </div>
        {activeCount > 0 ? (
          <Chip color="accent" size="sm" variant="soft">
            {activeCount} activo{activeCount === 1 ? '' : 's'}
          </Chip>
        ) : null}
      </div>

      <div className="rounded-xl bg-[var(--app-accent-soft)]/50 px-3 py-2.5">
        <p className="numeric text-[13px] font-semibold text-[var(--app-ink)]">
          {visibleRows} de {totalRows} mesas
        </p>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--app-hairline)]">
          <div
            className="h-full rounded-full bg-[var(--app-accent)] transition-[width] duration-300"
            style={{ width: `${Math.max(1, share).toFixed(1)}%` }}
          />
        </div>
        <p className="mt-1.5 text-[11px] text-[var(--app-ink-muted)]">
          {formatNumber(share, 1)} % de las observaciones del dataset
        </p>
      </div>

      {CATEGORICAL_COLUMNS.map((column) => (
        <fieldset key={column} className="border-0 p-0">
          <legend className="mb-1.5 text-[12px] font-medium text-[var(--app-ink)]">
            {CATEGORICAL_TITLES[column]}
          </legend>
          <div className="flex flex-wrap gap-1.5">
            {bounds.levels[column].map((level) => {
              const active = filters.categorical[column].includes(level)
              return (
                <Button
                  key={level}
                  size="sm"
                  variant={active ? 'primary' : 'outline'}
                  aria-pressed={active}
                  onPress={() => onChange(toggleLevel(filters, column, level))}
                  className="h-7 min-w-0 px-2.5 text-[12px]"
                >
                  {level}
                </Button>
              )
            })}
          </div>
        </fieldset>
      ))}

      <fieldset className="border-0 p-0">
        <legend className="mb-1.5 text-[12px] font-medium text-[var(--app-ink)]">
          Personas por mesa
        </legend>
        <div className="flex flex-wrap gap-1.5">
          {bounds.sizes.map((size) => {
            const active = filters.size.includes(size)
            return (
              <Button
                key={size}
                size="sm"
                variant={active ? 'primary' : 'outline'}
                aria-pressed={active}
                onPress={() => onChange(toggleSize(filters, size))}
                className="h-7 min-w-9 px-2 text-[12px]"
              >
                {size}
              </Button>
            )
          })}
        </div>
      </fieldset>

      <RangeSlider
        label="Cuenta total (USD)"
        range={filters.totalBill ?? bounds.totalBill}
        bounds={bounds.totalBill}
        step={0.5}
        onChange={changeRange('totalBill')}
      />
      <RangeSlider
        label="Propina (USD)"
        range={filters.tip ?? bounds.tip}
        bounds={bounds.tip}
        step={0.25}
        onChange={changeRange('tip')}
      />

      <div className="flex items-center justify-between gap-2 border-t border-[var(--app-hairline)] pt-3">
        <Button
          size="sm"
          variant="ghost"
          isDisabled={activeCount === 0}
          onPress={() => onChange(emptyFilters())}
          className="text-[12px]"
        >
          Restablecer
        </Button>
        <span className="text-[11px] text-[var(--app-ink-muted)]">Datos en el navegador</span>
      </div>

      {activeCount > 0 ? (
        <p className="text-[11px] leading-relaxed text-[var(--app-ink-muted)]">
          Activos: {describeFilters(filters).join(' · ')}
        </p>
      ) : null}
    </aside>
  )
}
