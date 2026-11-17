/**
 * Filas que el usuario agrega desde el tablero, persistidas en `localStorage`.
 *
 * El dataset de seaborn sigue siendo la base; estas filas se suman y todos los estadísticos,
 * filtros y gráficos se recalculan sobre el conjunto combinado. Cualquier problema de
 * almacenamiento (modo privado, cuota llena, JSON corrupto) se degrada a «sin filas propias»:
 * la app nunca se rompe por la persistencia.
 */

import {
  CATEGORICAL_COLUMNS,
  type CategoricalColumn,
  type TipRow,
} from '../data/dataset'

export const USER_ROWS_STORAGE_KEY = 'tips:user-rows:v1'

/** Fila propia: los siete campos del dataset más identidad y fecha de carga. */
export interface UserRow extends TipRow {
  id: string
  createdAt: string
}

/** Valores tal como llegan del formulario (todo texto). */
export interface RowDraft {
  total_bill: string
  tip: string
  size: string
  sex: string
  smoker: string
  day: string
  time: string
}

export type RowErrors = Partial<Record<keyof RowDraft, string>>

/** Subconjunto de `Storage` que basta para probar la persistencia sin navegador. */
export interface RowStorage {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

const MAX_AMOUNT = 100_000
const MAX_SIZE = 50

function parseAmount(raw: string): number | null {
  const normalized = raw.trim().replace(',', '.')
  if (normalized === '') return null
  const value = Number(normalized)
  if (!Number.isFinite(value) || value < 0 || value > MAX_AMOUNT) return null
  return Math.round(value * 100) / 100
}

function parseSize(raw: string): number | null {
  const normalized = raw.trim()
  if (normalized === '') return null
  const value = Number(normalized)
  if (!Number.isInteger(value) || value < 1 || value > MAX_SIZE) return null
  return value
}

/**
 * Valida un borrador del formulario contra los niveles vigentes del dataset.
 * Devuelve los errores por campo y, solo si no hay ninguno, la fila lista para guardar.
 */
export function validateDraft(
  draft: RowDraft,
  levels: Record<CategoricalColumn, string[]>,
): { errors: RowErrors; row?: TipRow } {
  const errors: RowErrors = {}

  const totalBill = parseAmount(draft.total_bill)
  if (totalBill === null) {
    errors.total_bill = 'Ingresá un número mayor o igual a 0.'
  }
  const tip = parseAmount(draft.tip)
  if (tip === null) {
    errors.tip = 'Ingresá un número mayor o igual a 0.'
  }
  const size = parseSize(draft.size)
  if (size === null) {
    errors.size = `Ingresá un entero entre 1 y ${MAX_SIZE}.`
  }
  for (const column of CATEGORICAL_COLUMNS) {
    if (!levels[column].includes(draft[column])) {
      errors[column] = 'Elegí uno de los niveles del dataset.'
    }
  }

  if (Object.keys(errors).length > 0 || totalBill === null || tip === null || size === null) {
    return { errors }
  }
  return {
    errors,
    row: {
      total_bill: totalBill,
      tip,
      size,
      sex: draft.sex,
      smoker: draft.smoker,
      day: draft.day,
      time: draft.time,
    },
  }
}

function newId(): string {
  const cryptoRef = globalThis.crypto
  if (cryptoRef && typeof cryptoRef.randomUUID === 'function') return cryptoRef.randomUUID()
  return `row-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

/** Envuelve una fila validada con identidad propia y fecha de carga. */
export function createUserRow(row: TipRow): UserRow {
  return { ...row, id: newId(), createdAt: new Date().toISOString() }
}

function isAmount(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0
}

function isTipRow(value: unknown): value is TipRow {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Record<string, unknown>
  if (!isAmount(candidate.total_bill) || !isAmount(candidate.tip)) return false
  if (
    typeof candidate.size !== 'number' ||
    !Number.isInteger(candidate.size) ||
    candidate.size < 1
  ) {
    return false
  }
  return CATEGORICAL_COLUMNS.every(
    (column) => typeof candidate[column] === 'string' && (candidate[column] as string) !== '',
  )
}

function isUserRow(value: unknown): value is UserRow {
  if (!isTipRow(value)) return false
  const candidate = value as unknown as Record<string, unknown>
  return typeof candidate.id === 'string' && candidate.id !== ''
}

/** `localStorage` del navegador, o `null` durante SSR, pruebas o modo privado. */
export function defaultStorage(): RowStorage | null {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null
    return window.localStorage
  } catch {
    return null
  }
}

/** Lee las filas propias guardadas; descarta entradas inválidas y JSON corrupto. */
export function loadUserRows(storage: RowStorage | null = defaultStorage()): UserRow[] {
  if (!storage) return []
  try {
    const raw = storage.getItem(USER_ROWS_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    const list = Array.isArray(parsed)
      ? parsed
      : (parsed as { rows?: unknown } | null)?.rows
    if (!Array.isArray(list)) return []
    return list.filter(isUserRow)
  } catch {
    return []
  }
}

/** Guarda las filas propias. Devuelve `false` si el almacenamiento no está disponible. */
export function saveUserRows(
  rows: readonly UserRow[],
  storage: RowStorage | null = defaultStorage(),
): boolean {
  if (!storage) return false
  try {
    storage.setItem(USER_ROWS_STORAGE_KEY, JSON.stringify({ version: 1, rows }))
    return true
  } catch {
    return false
  }
}

/** Dataset original seguido de las filas propias: el orden que usan tablas y gráficos. */
export function mergeRows(base: readonly TipRow[], own: readonly TipRow[]): TipRow[] {
  return [...base, ...own]
}
