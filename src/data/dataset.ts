import tipsJson from './tips.json'

/** Variables cuantitativas del dataset. */
export type NumericColumn = 'total_bill' | 'tip' | 'size'
/** Variables cualitativas del dataset. */
export type CategoricalColumn = 'sex' | 'smoker' | 'day' | 'time'
export type ColumnName = NumericColumn | CategoricalColumn

/** Una fila del dataset `tips` tal como la exporta el proyecto Python. */
export interface TipRow {
  total_bill: number
  tip: number
  sex: string
  smoker: string
  day: string
  time: string
  size: number
}

export interface ColumnMeta {
  name: ColumnName
  dtype: string
  kind: 'quantitative' | 'categorical'
  label: string
}

interface TipsDataset {
  dataset: string
  source: string
  shape: [number, number]
  columns: ColumnMeta[]
  rows: TipRow[]
}

const dataset = tipsJson as TipsDataset

export const DATASET_NAME = dataset.dataset
export const DATASET_SOURCE = dataset.source
export const COLUMN_META = dataset.columns
export const DATASET_ROWS: readonly TipRow[] = dataset.rows

export const NUMERIC_COLUMNS: NumericColumn[] = ['total_bill', 'tip', 'size']
export const CATEGORICAL_COLUMNS: CategoricalColumn[] = ['sex', 'smoker', 'day', 'time']

/** Parejas de dispersión del enunciado. */
export const SCATTER_PAIRS: [NumericColumn, NumericColumn][] = [
  ['total_bill', 'tip'],
  ['total_bill', 'size'],
  ['tip', 'size'],
]

/** Cruces de variables cualitativas del enunciado. */
export const CONTINGENCY_PAIRS: [CategoricalColumn, CategoricalColumn][] = [
  ['day', 'time'],
  ['sex', 'smoker'],
]

export const COLUMN_LABELS: Record<ColumnName, string> = COLUMN_META.reduce(
  (labels, column) => ({ ...labels, [column.name]: column.label }),
  {} as Record<ColumnName, string>,
)

export const COLUMN_CLASSIFICATION: Record<ColumnName, string> = {
  total_bill: 'Cuantitativa continua',
  tip: 'Cuantitativa continua',
  size: 'Cuantitativa discreta',
  sex: 'Cualitativa nominal',
  smoker: 'Cualitativa nominal',
  day: 'Cualitativa nominal',
  time: 'Cualitativa nominal',
}

/** Niveles de cada variable cualitativa, ordenados alfabéticamente. */
export const CATEGORY_LEVELS: Record<CategoricalColumn, string[]> = CATEGORICAL_COLUMNS.reduce(
  (levels, column) => {
    const values = new Set(DATASET_ROWS.map((row) => row[column]))
    return { ...levels, [column]: [...values].sort((a, b) => a.localeCompare(b, 'es')) }
  },
  {} as Record<CategoricalColumn, string[]>,
)

// El JSON lo genera `python -m analisis_tips export`: si el esquema cambia, falla acá y no en la UI.
const columnNames = new Set(COLUMN_META.map((column) => column.name))
const missingColumns = [...NUMERIC_COLUMNS, ...CATEGORICAL_COLUMNS].filter(
  (column) => !columnNames.has(column),
)
if (missingColumns.length > 0) {
  throw new Error(
    `El dataset exportado no tiene las columnas esperadas: ${missingColumns.join(', ')}. ` +
      'Regeneralo con `python -m analisis_tips export`.',
  )
}
if (DATASET_ROWS.length !== dataset.shape[0]) {
  throw new Error(
    `El dataset declara ${dataset.shape[0]} filas pero contiene ${DATASET_ROWS.length}.`,
  )
}
