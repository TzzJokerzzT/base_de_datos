/**
 * Espejo en TypeScript de los estadísticos que calcula pandas en el proyecto Python.
 *
 * Criterios (idénticos a pandas/scipy):
 * - varianza y desvío estándar muestrales (ddof = 1);
 * - asimetría de Fisher-Pearson corregida por sesgo (`Series.skew`);
 * - curtosis en exceso corregida por sesgo (`Series.kurt`, la normal vale 0);
 * - cuartiles por interpolación lineal (`Series.quantile`).
 *
 * La equivalencia numérica se verifica con `bun run check:stats`, que compara contra
 * `python/out/reference_stats.json` (generado con pandas).
 */

import {
  CATEGORICAL_COLUMNS,
  NUMERIC_COLUMNS,
  SCATTER_PAIRS,
  type CategoricalColumn,
  type NumericColumn,
  type TipRow,
} from '../data/dataset'

export type NumericSeries = Record<NumericColumn, number>

export interface DispersionRow {
  variable: NumericColumn
  range: number
  variance: number
  std: number
  cv: number
  skew: number
  kurt: number
}

export interface Quartiles {
  min: number
  q1: number
  median: number
  q3: number
  max: number
  iqr: number
  lowerFence: number
  upperFence: number
  whiskerLow: number
  whiskerHigh: number
  outliers: number[]
  mean: number
  count: number
}

export interface HistogramBin {
  index: number
  start: number
  end: number
  count: number
}

export interface FrequencyRow {
  level: string
  count: number
  percent: number
}

export interface ContingencyTable {
  rowLevels: string[]
  columnLevels: string[]
  counts: number[][]
  rowTotals: number[]
  columnTotals: number[]
  total: number
  /** Porcentaje de cada celda sobre el total de casos. */
  totalPercents: number[][]
  /** Porcentaje de cada celda sobre el total de su fila. */
  rowPercents: number[][]
}

export interface GroupQuartiles extends Quartiles {
  label: string
}

const EPSILON = 1e-12

export function total(values: readonly number[]): number {
  return values.reduce((accumulator, value) => accumulator + value, 0)
}

export function meanOf(values: readonly number[]): number {
  return values.length === 0 ? Number.NaN : total(values) / values.length
}

export function medianOf(values: readonly number[]): number {
  if (values.length === 0) return Number.NaN
  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle]
}

/** Todos los valores con la frecuencia máxima, ordenados como `pandas.Series.mode`. */
export function modesOf(values: readonly number[]): number[] {
  if (values.length === 0) return []
  const counts = new Map<number, number>()
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1)
  const highest = Math.max(...counts.values())
  return [...counts.entries()]
    .filter(([, count]) => count === highest)
    .map(([value]) => value)
    .sort((a, b) => a - b)
}

export function sampleVariance(values: readonly number[]): number {
  const n = values.length
  if (n < 2) return Number.NaN
  const mean = meanOf(values)
  const squared = values.reduce((accumulator, value) => accumulator + (value - mean) ** 2, 0)
  return squared / (n - 1)
}

export function sampleStd(values: readonly number[]): number {
  return Math.sqrt(sampleVariance(values))
}

/** `pandas.Series.skew()`: momento tercero estandarizado con corrección por sesgo. */
export function skewness(values: readonly number[]): number {
  const n = values.length
  if (n < 3) return Number.NaN
  const mean = meanOf(values)
  const std = sampleStd(values)
  if (std < EPSILON) return Number.NaN
  const cubed = values.reduce((accumulator, value) => accumulator + ((value - mean) / std) ** 3, 0)
  return (n / ((n - 1) * (n - 2))) * cubed
}

/** `pandas.Series.kurt()`: curtosis en exceso (la normal vale 0), corregida por sesgo. */
export function excessKurtosis(values: readonly number[]): number {
  const n = values.length
  if (n < 4) return Number.NaN
  const mean = meanOf(values)
  const std = sampleStd(values)
  if (std < EPSILON) return Number.NaN
  const fourth = values.reduce((accumulator, value) => accumulator + ((value - mean) / std) ** 4, 0)
  const left = (n * (n + 1)) / ((n - 1) * (n - 2) * (n - 3))
  const right = (3 * (n - 1) ** 2) / ((n - 2) * (n - 3))
  return left * fourth - right
}

export function coefficientOfVariation(values: readonly number[]): number {
  const mean = meanOf(values)
  if (!Number.isFinite(mean) || Math.abs(mean) < EPSILON) return Number.NaN
  return (100 * sampleStd(values)) / mean
}

export function pearsonCorrelation(xs: readonly number[], ys: readonly number[]): number {
  const n = Math.min(xs.length, ys.length)
  if (n < 2) return Number.NaN
  const meanX = meanOf(xs)
  const meanY = meanOf(ys)
  let covariance = 0
  let sumSquaresX = 0
  let sumSquaresY = 0
  for (let index = 0; index < n; index += 1) {
    const dx = (xs[index] ?? 0) - meanX
    const dy = (ys[index] ?? 0) - meanY
    covariance += dx * dy
    sumSquaresX += dx * dx
    sumSquaresY += dy * dy
  }
  const denominator = Math.sqrt(sumSquaresX * sumSquaresY)
  if (denominator < EPSILON) return Number.NaN
  return covariance / denominator
}

/** Cuantiles por interpolación lineal, igual que `numpy.quantile` (el default de pandas). */
export function quantileOf(values: readonly number[], probability: number): number {
  if (values.length === 0) return Number.NaN
  const sorted = [...values].sort((a, b) => a - b)
  const position = (sorted.length - 1) * probability
  const base = Math.floor(position)
  const rest = position - base
  const lower = sorted[base] ?? Number.NaN
  const upper = sorted[base + 1]
  return upper === undefined ? lower : lower + rest * (upper - lower)
}

export function quartilesOf(values: readonly number[]): Quartiles {
  if (values.length === 0) {
    return {
      min: Number.NaN,
      q1: Number.NaN,
      median: Number.NaN,
      q3: Number.NaN,
      max: Number.NaN,
      iqr: Number.NaN,
      lowerFence: Number.NaN,
      upperFence: Number.NaN,
      whiskerLow: Number.NaN,
      whiskerHigh: Number.NaN,
      outliers: [],
      mean: Number.NaN,
      count: 0,
    }
  }
  const sorted = [...values].sort((a, b) => a - b)
  const q1 = quantileOf(sorted, 0.25)
  const q3 = quantileOf(sorted, 0.75)
  const iqr = q3 - q1
  const lowerFence = q1 - 1.5 * iqr
  const upperFence = q3 + 1.5 * iqr
  const inside = sorted.filter((value) => value >= lowerFence && value <= upperFence)
  return {
    min: sorted[0],
    q1,
    median: quantileOf(sorted, 0.5),
    q3,
    max: sorted[sorted.length - 1],
    iqr,
    lowerFence,
    upperFence,
    whiskerLow: inside.length > 0 ? inside[0] : sorted[0],
    whiskerHigh: inside.length > 0 ? inside[inside.length - 1] : sorted[sorted.length - 1],
    outliers: sorted.filter((value) => value < lowerFence || value > upperFence),
    mean: meanOf(sorted),
    count: sorted.length,
  }
}

/** Conteo por intervalos de igual ancho, como `numpy.histogram(values, bins)`. */
export function histogramOf(values: readonly number[], binCount = 12): HistogramBin[] {
  if (values.length === 0 || binCount <= 0) return []
  const min = Math.min(...values)
  const max = Math.max(...values)
  const width = (max - min) / binCount
  if (width < EPSILON) {
    return [{ index: 0, start: min, end: max, count: values.length }]
  }
  const bins: HistogramBin[] = Array.from({ length: binCount }, (_, index) => ({
    index,
    start: min + index * width,
    end: min + (index + 1) * width,
    count: 0,
  }))
  for (const value of values) {
    const raw = Math.floor((value - min) / width)
    const index = Math.min(binCount - 1, Math.max(0, raw))
    bins[index].count += 1
  }
  return bins
}

export function valuesOf(rows: readonly TipRow[], column: NumericColumn): number[] {
  return rows.map((row) => row[column])
}

export function numericSeries(
  rows: readonly TipRow[],
  compute: (values: number[]) => number,
): NumericSeries {
  return NUMERIC_COLUMNS.reduce((series, column) => {
    series[column] = compute(valuesOf(rows, column))
    return series
  }, {} as NumericSeries)
}

export function centralTendency(rows: readonly TipRow[]): {
  mean: NumericSeries
  median: NumericSeries
  mode: Record<NumericColumn, number[]>
} {
  return {
    mean: numericSeries(rows, meanOf),
    median: numericSeries(rows, medianOf),
    mode: NUMERIC_COLUMNS.reduce(
      (modes, column) => {
        modes[column] = modesOf(valuesOf(rows, column))
        return modes
      },
      {} as Record<NumericColumn, number[]>,
    ),
  }
}

export function dispersionShape(rows: readonly TipRow[]): DispersionRow[] {
  return NUMERIC_COLUMNS.map((column) => {
    const values = valuesOf(rows, column)
    return {
      variable: column,
      range: values.length === 0 ? Number.NaN : Math.max(...values) - Math.min(...values),
      variance: sampleVariance(values),
      std: sampleStd(values),
      cv: coefficientOfVariation(values),
      skew: skewness(values),
      kurt: excessKurtosis(values),
    }
  })
}

export function pearsonMatrix(rows: readonly TipRow[]): number[][] {
  return NUMERIC_COLUMNS.map((rowColumn) =>
    NUMERIC_COLUMNS.map((column) =>
      rowColumn === column
        ? rows.length > 1
          ? 1
          : Number.NaN
        : pearsonCorrelation(valuesOf(rows, rowColumn), valuesOf(rows, column)),
    ),
  )
}

export function pairCorrelations(
  matrix: number[][],
): { pair: [NumericColumn, NumericColumn]; value: number }[] {
  return SCATTER_PAIRS.map((pair) => ({
    pair,
    value: matrix[NUMERIC_COLUMNS.indexOf(pair[0])]?.[NUMERIC_COLUMNS.indexOf(pair[1])] ?? Number.NaN,
  }))
}

export function frequencyTable(
  rows: readonly TipRow[],
  column: CategoricalColumn,
): FrequencyRow[] {
  const counts = new Map<string, number>()
  for (const row of rows) {
    const level = row[column]
    counts.set(level, (counts.get(level) ?? 0) + 1)
  }
  const totalRows = rows.length
  return [...counts.entries()]
    .map(([level, count]) => ({
      level,
      count,
      percent: totalRows === 0 ? Number.NaN : (100 * count) / totalRows,
    }))
    .sort((a, b) => b.count - a.count || a.level.localeCompare(b.level, 'es'))
}

export function frequencyTables(
  rows: readonly TipRow[],
): Record<CategoricalColumn, FrequencyRow[]> {
  return CATEGORICAL_COLUMNS.reduce(
    (tables, column) => {
      tables[column] = frequencyTable(rows, column)
      return tables
    },
    {} as Record<CategoricalColumn, FrequencyRow[]>,
  )
}

export function contingencyTable(
  rows: readonly TipRow[],
  rowColumn: CategoricalColumn,
  columnColumn: CategoricalColumn,
): ContingencyTable {
  const rowLevels = [...new Set(rows.map((row) => row[rowColumn]))].sort((a, b) =>
    a.localeCompare(b, 'es'),
  )
  const columnLevels = [...new Set(rows.map((row) => row[columnColumn]))].sort((a, b) =>
    a.localeCompare(b, 'es'),
  )
  const counts = rowLevels.map(() => columnLevels.map(() => 0))
  for (const row of rows) {
    const rowIndex = rowLevels.indexOf(row[rowColumn])
    const columnIndex = columnLevels.indexOf(row[columnColumn])
    if (rowIndex >= 0 && columnIndex >= 0) counts[rowIndex][columnIndex] += 1
  }
  const rowTotals = counts.map((values) => total(values))
  const columnTotals = columnLevels.map((_, columnIndex) =>
    total(counts.map((values) => values[columnIndex] ?? 0)),
  )
  const grandTotal = total(rowTotals)
  const totalPercents = counts.map((values) =>
    values.map((count) => (grandTotal === 0 ? Number.NaN : (100 * count) / grandTotal)),
  )
  const rowPercents = counts.map((values, rowIndex) => {
    const rowTotal = rowTotals[rowIndex] ?? 0
    return values.map((count) => (rowTotal === 0 ? Number.NaN : (100 * count) / rowTotal))
  })
  return {
    rowLevels,
    columnLevels,
    counts,
    rowTotals,
    columnTotals,
    total: grandTotal,
    totalPercents,
    rowPercents,
  }
}

/** Cuartiles por nivel de una variable cualitativa, para las cajas agrupadas. */
export function groupedQuartiles(
  rows: readonly TipRow[],
  category: CategoricalColumn,
  column: NumericColumn,
): GroupQuartiles[] {
  const groups = new Map<string, number[]>()
  for (const row of rows) {
    const level = row[category]
    const values = groups.get(level) ?? []
    values.push(row[column])
    groups.set(level, values)
  }
  return [...groups.entries()]
    .sort((a, b) => a[0].localeCompare(b[0], 'es'))
    .map(([label, values]) => ({ label, ...quartilesOf(values) }))
}
