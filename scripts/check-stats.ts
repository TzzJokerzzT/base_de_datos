/**
 * Verifica que los estadísticos del frontend coincidan con los que calcula pandas.
 *
 * Uso: bun run scripts/check-stats.ts [ruta/reference_stats.json]
 * Sale con código 0 si todo coincide dentro de la tolerancia.
 */

import { readFileSync } from 'node:fs'

import {
  CATEGORICAL_COLUMNS,
  CONTINGENCY_PAIRS,
  DATASET_ROWS,
  NUMERIC_COLUMNS,
} from '../src/data/dataset'
import {
  centralTendency,
  contingencyTable,
  dispersionShape,
  frequencyTable,
  pearsonMatrix,
} from '../src/lib/stats'

const TOLERANCE = 1e-9

interface NumericStats {
  mean: number
  median: number
  mode: number[]
  min: number
  max: number
  range: number
  variance: number
  std: number
  cv: number
  skew: number
  kurt: number
}

interface ReferenceStats {
  n: number
  numeric: Record<string, NumericStats>
  correlation: Record<string, Record<string, number>>
  categorical: Record<string, { counts: Record<string, number>; percent: Record<string, number> }>
  crosstab: Record<
    string,
    { index: string[]; columns: string[]; counts: number[][]; rowTotals: number[] }
  >
}

const referencePath = process.argv[2] ?? new URL('../../python/out/reference_stats.json', import.meta.url)
const reference = JSON.parse(readFileSync(referencePath, 'utf8')) as ReferenceStats

let failures = 0
let checks = 0

function compare(label: string, actual: number, expected: number): void {
  checks += 1
  const difference = Math.abs(actual - expected)
  const scale = Math.max(1, Math.abs(expected))
  if (!Number.isFinite(actual) || difference / scale > TOLERANCE) {
    failures += 1
    console.error(`  ✗ ${label}: frontend=${actual} pandas=${expected}`)
  }
}

function compareArrays(label: string, actual: number[], expected: number[]): void {
  checks += 1
  const sameLength = actual.length === expected.length
  const sameValues =
    sameLength && actual.every((value, index) => Math.abs(value - expected[index]!) <= TOLERANCE)
  if (!sameValues) {
    failures += 1
    console.error(
      `  ✗ ${label}: frontend=[${actual}] pandas=[${expected}] (largo ${actual.length} vs ${expected.length})`,
    )
  }
}

// 1. Observaciones -----------------------------------------------------------
compare('n', DATASET_ROWS.length, reference.n)

// 2. Tendencia central, dispersión y forma -----------------------------------
const central = centralTendency(DATASET_ROWS)
const dispersion = dispersionShape(DATASET_ROWS)
for (const column of NUMERIC_COLUMNS) {
  const expected = reference.numeric[column]
  if (!expected) {
    failures += 1
    console.error(`  ✗ falta la referencia de ${column}`)
    continue
  }
  compare(`${column}.mean`, central.mean[column], expected.mean)
  compare(`${column}.median`, central.median[column], expected.median)
  compareArrays(`${column}.mode`, central.mode[column], expected.mode)
  const stats = dispersion.find((row) => row.variable === column)!
  compare(`${column}.range`, stats.range, expected.range)
  compare(`${column}.variance`, stats.variance, expected.variance)
  compare(`${column}.std`, stats.std, expected.std)
  compare(`${column}.cv`, stats.cv, expected.cv)
  compare(`${column}.skew`, stats.skew, expected.skew)
  compare(`${column}.kurt`, stats.kurt, expected.kurt)
  compare(`${column}.min`, Math.min(...DATASET_ROWS.map((row) => row[column])), expected.min)
  compare(`${column}.max`, Math.max(...DATASET_ROWS.map((row) => row[column])), expected.max)
}

// 3. Correlaciones -----------------------------------------------------------
const matrix = pearsonMatrix(DATASET_ROWS)
for (const [rowIndex, rowColumn] of NUMERIC_COLUMNS.entries()) {
  for (const [columnIndex, column] of NUMERIC_COLUMNS.entries()) {
    compare(
      `corr(${rowColumn}, ${column})`,
      matrix[rowIndex]![columnIndex]!,
      reference.correlation[rowColumn]![column]!,
    )
  }
}

// 4. Frecuencias de las cualitativas ----------------------------------------
for (const column of CATEGORICAL_COLUMNS) {
  const expected = reference.categorical[column]
  const table = frequencyTable(DATASET_ROWS, column)
  compare(`${column}.levels`, table.length, Object.keys(expected!.counts).length)
  for (const row of table) {
    compare(
      `${column}[${row.level}].count`,
      row.count,
      expected!.counts[row.level] ?? Number.NaN,
    )
    compare(
      `${column}[${row.level}].percent`,
      row.percent,
      expected!.percent[row.level] ?? Number.NaN,
    )
  }
}

// 5. Tablas de contingencia --------------------------------------------------
for (const [rowColumn, columnColumn] of CONTINGENCY_PAIRS) {
  const expected = reference.crosstab[`${rowColumn}|${columnColumn}`]
  const table = contingencyTable(DATASET_ROWS, rowColumn, columnColumn)
  compareArrays(`crosstab(${rowColumn},${columnColumn}) total`, [table.total], [reference.n])
  compareArrays(`crosstab(${rowColumn},${columnColumn}) rowTotals`, table.rowTotals, expected!.rowTotals)
  for (const [rowIndex, level] of expected!.index.entries()) {
    for (const [columnIndex, columnLevel] of expected!.columns.entries()) {
      compare(
        `crosstab(${rowColumn},${columnColumn})[${level},${columnLevel}]`,
        table.counts[table.rowLevels.indexOf(level)]?.[table.columnLevels.indexOf(columnLevel)] ??
          Number.NaN,
        expected!.counts[rowIndex]![columnIndex]!,
      )
    }
  }
}

// 6. Resultado ---------------------------------------------------------------
if (failures > 0) {
  console.error(`\n✗ ${failures} de ${checks} comprobaciones fallaron.`)
  process.exit(1)
}
console.log(`✓ ${checks} comprobaciones OK: los estadísticos del frontend coinciden con pandas.`)
