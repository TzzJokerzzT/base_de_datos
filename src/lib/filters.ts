/** Estado y aplicación de los filtros globales de la interfaz. */

import {
  CATEGORICAL_COLUMNS,
  DATASET_ROWS,
  type CategoricalColumn,
  type TipRow,
} from '../data/dataset'

export type Range = [number, number]

export interface Filters {
  /** Niveles activos por variable cualitativa; un array vacío significa «todos». */
  categorical: Record<CategoricalColumn, string[]>
  /** Tamaños de mesa activos; un array vacío significa «todos». */
  size: number[]
  /** Rango activo de cuenta; `null` significa «sin filtro» (no depende de los datos). */
  totalBill: Range | null
  /** Rango activo de propina; `null` significa «sin filtro». */
  tip: Range | null
}

export interface FilterBounds {
  totalBill: Range
  tip: Range
  sizes: number[]
  levels: Record<CategoricalColumn, string[]>
}

function extremes(values: number[]): Range {
  if (values.length === 0) return [0, 0]
  return [Math.min(...values), Math.max(...values)]
}

/** Límites reales de un conjunto de filas: los sliders se mueven al agregar datos propios. */
export function computeBounds(rows: readonly TipRow[] = DATASET_ROWS): FilterBounds {
  const levels = CATEGORICAL_COLUMNS.reduce(
    (accumulator, column) => {
      accumulator[column] = [...new Set(rows.map((row) => row[column]))].sort((a, b) =>
        a.localeCompare(b, 'es'),
      )
      return accumulator
    },
    {} as Record<CategoricalColumn, string[]>,
  )
  return {
    totalBill: extremes(rows.map((row) => row.total_bill)),
    tip: extremes(rows.map((row) => row.tip)),
    sizes: [...new Set(rows.map((row) => row.size))].sort((a, b) => a - b),
    levels,
  }
}

/** Estado inicial: ningún filtro aplicado. Devuelve un objeto nuevo en cada llamada. */
export function emptyFilters(): Filters {
  return {
    categorical: { sex: [], smoker: [], day: [], time: [] },
    size: [],
    totalBill: null,
    tip: null,
  }
}

export function applyFilters(rows: readonly TipRow[], filters: Filters): TipRow[] {
  return rows.filter((row) => {
    for (const column of CATEGORICAL_COLUMNS) {
      const active = filters.categorical[column]
      if (active.length > 0 && !active.includes(row[column])) return false
    }
    if (filters.size.length > 0 && !filters.size.includes(row.size)) return false
    if (filters.totalBill) {
      const [min, max] = filters.totalBill
      if (row.total_bill < min || row.total_bill > max) return false
    }
    if (filters.tip) {
      const [min, max] = filters.tip
      if (row.tip < min || row.tip > max) return false
    }
    return true
  })
}

/** Cantidad de criterios activos, para el resumen del panel de filtros. */
export function activeFilterCount(filters: Filters): number {
  let count = 0
  for (const column of CATEGORICAL_COLUMNS) {
    if (filters.categorical[column].length > 0) count += 1
  }
  if (filters.size.length > 0) count += 1
  if (filters.totalBill !== null) count += 1
  if (filters.tip !== null) count += 1
  return count
}

export function toggleLevel(
  filters: Filters,
  column: CategoricalColumn,
  level: string,
): Filters {
  const active = filters.categorical[column]
  const next = active.includes(level)
    ? active.filter((value) => value !== level)
    : [...active, level]
  return { ...filters, categorical: { ...filters.categorical, [column]: next } }
}

export function toggleSize(filters: Filters, size: number): Filters {
  const next = filters.size.includes(size)
    ? filters.size.filter((value) => value !== size)
    : [...filters.size, size].sort((a, b) => a - b)
  return { ...filters, size: next }
}

/** Ajusta un rango activo a los límites vigentes; `null` (sin filtro) se conserva. */
function clampRange(range: Range | null, bounds: Range): Range | null {
  if (range === null) return null
  const min = Math.min(Math.max(range[0], bounds[0]), bounds[1])
  const max = Math.max(Math.min(range[1], bounds[1]), min)
  return [min, max]
}

/**
 * Corrige los rangos activos cuando los límites cambian (por ejemplo al agregar filas
 * propias). Sin esto, un slider podría quedar fuera de su propio rango.
 */
export function clampFilters(filters: Filters, bounds: FilterBounds): Filters {
  return {
    ...filters,
    totalBill: clampRange(filters.totalBill, bounds.totalBill),
    tip: clampRange(filters.tip, bounds.tip),
  }
}

/** Resumen legible de los filtros activos, para la barra superior y el informe. */
export function describeFilters(filters: Filters): string[] {
  const parts: string[] = []
  for (const column of CATEGORICAL_COLUMNS) {
    const active = filters.categorical[column]
    if (active.length > 0) parts.push(`${column}: ${active.join(', ')}`)
  }
  if (filters.size.length > 0) parts.push(`size: ${filters.size.join(', ')}`)
  if (filters.totalBill) {
    parts.push(
      `total_bill: ${filters.totalBill[0].toFixed(2)}–${filters.totalBill[1].toFixed(2)}`,
    )
  }
  if (filters.tip) {
    parts.push(`tip: ${filters.tip[0].toFixed(2)}–${filters.tip[1].toFixed(2)}`)
  }
  return parts
}
