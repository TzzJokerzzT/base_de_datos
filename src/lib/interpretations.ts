/**
 * Interpretaciones en español calculadas a partir de los datos visibles.
 * Reproducen las del proyecto Python (`analisis_tips/interpretation.py`) para que el
 * texto siga teniendo sentido cuando el usuario filtra el dataset.
 */

import {
  CATEGORICAL_COLUMNS,
  NUMERIC_COLUMNS,
  type CategoricalColumn,
  type NumericColumn,
  type TipRow,
} from '../data/dataset'
import { formatNumber } from './format'
import {
  contingencyTable,
  type DispersionRow,
  type FrequencyRow,
  quartilesOf,
  valuesOf,
} from './stats'

const NO_DATA = 'No hay observaciones con los filtros actuales, así que no se puede interpretar.'

function skewLabel(value: number): string {
  if (Number.isNaN(value)) return 'sin datos suficientes'
  if (Math.abs(value) < 0.5) return 'bastante simétrica'
  return value > 0
    ? 'asimétrica positiva (cola hacia la derecha)'
    : 'asimétrica negativa (cola hacia la izquierda)'
}

function kurtLabel(value: number): string {
  if (Number.isNaN(value)) return 'sin datos suficientes'
  if (Math.abs(value) < 0.5) return 'curtosis parecida a la normal (mesocúrtica)'
  return value > 0
    ? 'leptocúrtica (colas pesadas y centro alto)'
    : 'platicúrtica (colas livianas y centro bajo)'
}

export function overviewText(rows: readonly TipRow[]): string {
  if (rows.length === 0) return NO_DATA
  return (
    `La selección tiene ${rows.length} observaciones (mesas) y 7 variables. ` +
    'total_bill y tip son cuantitativas continuas (dinero) y size es cuantitativa discreta ' +
    '(número de personas); sex, smoker, day y time son cualitativas nominales. ' +
    'El dataset no trae datos faltantes: por eso los totales de las tablas de frecuencias coinciden ' +
    'con la cantidad de filas.'
  )
}

export function centralTendencyText(rows: readonly TipRow[]): string {
  if (rows.length === 0) return NO_DATA
  const bill = valuesOf(rows, 'total_bill')
  const tip = valuesOf(rows, 'tip')
  const size = valuesOf(rows, 'size')
  const mean = (values: number[]) => values.reduce((a, b) => a + b, 0) / values.length
  const median = (values: number[]) => {
    const sorted = [...values].sort((a, b) => a - b)
    const middle = Math.floor(sorted.length / 2)
    return sorted.length % 2 === 0
      ? (sorted[middle - 1] + sorted[middle]) / 2
      : sorted[middle]
  }
  const billMean = mean(bill)
  const billMedian = median(bill)
  const tipMean = mean(tip)
  const tipMedian = median(tip)
  const sizes = [...new Set(size)].map((level) => ({
    level,
    count: size.filter((value) => value === level).length,
  }))
  sizes.sort((a, b) => b.count - a.count)
  const sizeMode = sizes[0]

  const describe = (label: string, variableMean: number, variableMedian: number): string => {
    if (variableMean > variableMedian) {
      return (
        `${label}: media ${formatNumber(variableMean)} por encima de la mediana ${formatNumber(variableMedian)}, ` +
        'o sea cola hacia la derecha'
      )
    }
    if (variableMean < variableMedian) {
      return (
        `${label}: media ${formatNumber(variableMean)} por debajo de la mediana ${formatNumber(variableMedian)}, ` +
        'o sea cola hacia la izquierda'
      )
    }
    return `${label}: media y mediana coinciden en ${formatNumber(variableMean)}, o sea una distribución simétrica`
  }

  return (
    `${describe('total_bill', billMean, billMedian)}. ${describe('tip', tipMean, tipMedian)}. ` +
    'Cuando la media se separa de la mediana, la mediana representa mejor a la mesa típica porque no la ' +
    'arrastran los valores extremos. ' +
    (sizeMode
      ? `La moda de size es ${sizeMode.level} personas: ${sizeMode.count} mesas ` +
        `(${formatNumber((100 * sizeMode.count) / rows.length, 1)} % de la selección).`
      : '')
  )
}

export function dispersionText(rows: readonly TipRow[], table: DispersionRow[]): string {
  if (rows.length === 0) return NO_DATA
  const byCv = [...table].sort((a, b) => b.cv - a.cv)
  const most = byCv[0]
  const least = byCv[byCv.length - 1]
  const skewText = table
    .map((row) => `${row.variable}: ${formatNumber(row.skew)}`)
    .join(', ')
  const kurtText = table.map((row) => `${row.variable}: ${formatNumber(row.kurt)}`).join(', ')
  return (
    'El coeficiente de variación compara la dispersión sin importar las unidades: ' +
    `${most.variable} es la más dispersa (${formatNumber(most.cv)} %) y ${least.variable} la más homogénea ` +
    `(${formatNumber(least.cv)} %). La asimetría (${skewText}) confirma la cola derecha que anticipaba la ` +
    `diferencia entre media y mediana, y la curtosis en exceso (${kurtText}) indica cuánto peso tienen los ` +
    'valores extremos: cuanto más por encima de 0, más colas pesadas.'
  )
}

export function distributionsText(rows: readonly TipRow[], table: DispersionRow[]): string {
  if (rows.length === 0) return NO_DATA
  const parts = NUMERIC_COLUMNS.map((column) => {
    const quartiles = quartilesOf(valuesOf(rows, column))
    const row = table.find((item) => item.variable === column)
    return (
      `${column}: rango ${formatNumber((quartiles.max ?? 0) - (quartiles.min ?? 0))}, ` +
      `${skewLabel(row?.skew ?? Number.NaN)}, ${kurtLabel(row?.kurt ?? Number.NaN)} y ` +
      `${quartiles.outliers.length} atípicos (criterio 1.5 × RIC)`
    )
  })
  return (
    'Las tres variables se concentran en los valores bajos y se estiran hacia la derecha: ' +
    parts.join('; ') +
    '. En los diagramas de caja esos casos aparecen como puntos sueltos por encima del bigote superior; ' +
    'son mesas grandes o cuentas excepcionales, no errores de carga.'
  )
}

export function categoryBoxesText(rows: readonly TipRow[]): string {
  if (rows.length === 0) return NO_DATA
  const byDay = new Map<string, number[]>()
  const byTime = new Map<string, number[]>()
  for (const row of rows) {
    byDay.set(row.day, [...(byDay.get(row.day) ?? []), row.total_bill])
    byTime.set(row.time, [...(byTime.get(row.time) ?? []), row.tip])
  }
  const medians = (groups: Map<string, number[]>) =>
    [...groups.entries()]
      .map(([label, values]) => ({ label, value: quartilesOf(values).median }))
      .sort((a, b) => b.value - a.value)
  const dayMedians = medians(byDay)
  const timeMedians = medians(byTime)
  const highestDay = dayMedians[0]
  const lowestDay = dayMedians[dayMedians.length - 1]
  const bestTime = timeMedians[0]

  return (
    `Por día, la mediana de la cuenta es más alta el ${highestDay?.label} ` +
    `(${formatNumber(highestDay?.value)} USD) y más baja el ${lowestDay?.label} ` +
    `(${formatNumber(lowestDay?.value)} USD). Por momento del servicio, la mediana de la propina es mayor ` +
    `en ${bestTime?.label} (${formatNumber(bestTime?.value)} USD), aunque los turnos se solapan. ` +
    'En todos los grupos aparecen atípicos por encima del bigote: conviene leerlos junto con la tabla de ' +
    'frecuencias antes de sacar conclusiones.'
  )
}

export function correlationText(rows: readonly TipRow[], matrix: number[][]): string {
  if (rows.length < 2) return NO_DATA
  const pairs: [NumericColumn, NumericColumn][] = [
    ['total_bill', 'tip'],
    ['total_bill', 'size'],
    ['tip', 'size'],
  ]
  const parts = pairs.map(([a, b]) => {
    const value = matrix[NUMERIC_COLUMNS.indexOf(a)]?.[NUMERIC_COLUMNS.indexOf(b)] ?? Number.NaN
    const strength =
      Math.abs(value) < 0.3 ? 'débil' : Math.abs(value) < 0.7 ? 'moderada' : 'fuerte'
    const sign = value >= 0 ? 'positiva' : 'negativa'
    return `${a} y ${b}: r = ${formatNumber(value, 3)} (${sign}, ${strength})`
  })
  return (
    `Las correlaciones de Pearson de esta selección son: ${parts.join('; ')}. ` +
    'La nube de puntos acompaña esos valores: la relación entre cuenta y propina es casi lineal, aunque la ' +
    'propina crece menos que proporcionalmente. Una correlación alta no implica causalidad: solo indica que ' +
    'las dos variables se mueven juntas.'
  )
}

export function categoricalText(rows: readonly TipRow[], tables: Record<CategoricalColumn, FrequencyRow[]>): string {
  if (rows.length === 0) return NO_DATA
  const parts = CATEGORICAL_COLUMNS.map((column) => {
    const leader = tables[column][0]
    if (!leader) return `${column}: sin datos`
    return `${column}: «${leader.level}» con ${leader.count} casos (${formatNumber(leader.percent, 1)} %)`
  })
  return (
    `La categoría más frecuente de cada variable es ${parts.join('; ')}. ` +
    'Las barras permiten comparar frecuencias porque comparten una escala común; el gráfico circular sirve ' +
    'para leer la composición de un vistazo cuando hay pocas categorías, pero comparar sectores parecidos ' +
    'es más difícil. Con tres o cuatro niveles, las barras son la mejor elección.'
  )
}

export function contingencyText(
  rows: readonly TipRow[],
  rowColumn: CategoricalColumn,
  columnColumn: CategoricalColumn,
): string {
  if (rows.length === 0) return NO_DATA
  const table = contingencyTable(rows, rowColumn, columnColumn)
  let best = { row: 0, column: 0, count: -1 }
  table.counts.forEach((values, rowIndex) => {
    values.forEach((count, columnIndex) => {
      if (count > best.count) best = { row: rowIndex, column: columnIndex, count }
    })
  })
  const rowLevel = table.rowLevels[best.row] ?? ''
  const columnLevel = table.columnLevels[best.column] ?? ''
  const share = table.rowPercents[best.row]?.[best.column] ?? Number.NaN
  const rowTotals = table.rowLevels.map((level, index) => ({ level, total: table.rowTotals[index] ?? 0 }))
  rowTotals.sort((a, b) => b.total - a.total)
  const profiles = table.rowPercents.filter((values) => values.length > 0)
  const largestGap = profiles.reduce((gap, values) => {
    const spread = Math.max(...values) - Math.min(...values)
    return Math.max(gap, spread)
  }, 0)
  // Menos de un punto porcentual de diferencia entre perfiles se lee como independencia.
  const associated = profiles.some((values, index) =>
    profiles.some(
      (other, otherIndex) =>
        otherIndex !== index &&
        other.length === values.length &&
        values.some((value, columnIndex) => Math.abs(value - (other[columnIndex] ?? value)) >= 1),
    ),
  )

  return (
    `El cruce ${rowColumn} × ${columnColumn} reúne ${table.total} casos. La celda más pesada es ` +
    `${rowColumn}=${rowLevel} con ${columnColumn}=${columnLevel}: ${best.count} casos, el ` +
    `${formatNumber(share, 1)} % de ese nivel de ${rowColumn}. El nivel con más casos es ` +
    `${rowTotals[0]?.level} (${rowTotals[0]?.total}). ` +
    (associated
      ? `Los porcentajes por fila difieren hasta ${formatNumber(largestGap, 1)} puntos: hay asociación descriptiva entre ${rowColumn} y ${columnColumn}.`
      : `Los porcentajes por fila difieren apenas ${formatNumber(largestGap, 1)} puntos: no se observa asociación entre ${rowColumn} y ${columnColumn}.`) +
    ' Es una lectura descriptiva, sin pretensión causal.'
  )
}
