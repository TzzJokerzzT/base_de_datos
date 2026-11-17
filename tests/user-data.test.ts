/**
 * Pruebas de la lógica nueva: filas propias (validación + persistencia) y filtros con
 * límites dinámicos. El runner es `bun test`, sin dependencias extra.
 */

import { describe, expect, test } from 'bun:test'

import { DATASET_ROWS, type TipRow } from '../src/data/dataset'
import {
  activeFilterCount,
  applyFilters,
  clampFilters,
  computeBounds,
  describeFilters,
  emptyFilters,
} from '../src/lib/filters'
import {
  createUserRow,
  loadUserRows,
  mergeRows,
  saveUserRows,
  validateDraft,
  type RowDraft,
  type RowStorage,
} from '../src/lib/userRows'

const LEVELS = {
  sex: ['Female', 'Male'],
  smoker: ['No', 'Yes'],
  day: ['Fri', 'Sat', 'Sun', 'Thur'],
  time: ['Dinner', 'Lunch'],
}

function draft(overrides: Partial<RowDraft> = {}): RowDraft {
  return {
    total_bill: '20.5',
    tip: '3.25',
    size: '2',
    sex: 'Female',
    smoker: 'No',
    day: 'Sat',
    time: 'Dinner',
    ...overrides,
  }
}

function memoryStorage(initial: string | null = null): RowStorage {
  let value = initial
  return {
    getItem: () => value,
    setItem: (_key, next) => {
      value = next
    },
    removeItem: () => {
      value = null
    },
  }
}

describe('filtros con límites dinámicos', () => {
  test('sin filtros la selección es el dataset completo (comportamiento previo)', () => {
    expect(applyFilters(DATASET_ROWS, emptyFilters())).toHaveLength(DATASET_ROWS.length)
  })

  test('cada llamada a emptyFilters devuelve un estado independiente', () => {
    const first = emptyFilters()
    first.categorical.day.push('Sat')
    first.size.push(2)
    expect(emptyFilters().categorical.day).toEqual([])
    expect(emptyFilters().size).toEqual([])
  })

  test('un rango nulo significa «sin filtro» y un rango activo es inclusivo', () => {
    const all = applyFilters(DATASET_ROWS, emptyFilters())
    const bounded = applyFilters(DATASET_ROWS, {
      ...emptyFilters(),
      totalBill: [10, 20],
    })
    expect(bounded.length).toBeLessThan(all.length)
    expect(bounded.every((row) => row.total_bill >= 10 && row.total_bill <= 20)).toBe(true)
  })

  test('el contador solo cuenta criterios realmente activos', () => {
    expect(activeFilterCount(emptyFilters())).toBe(0)
    const filters = { ...emptyFilters(), tip: [1, 2] as [number, number] }
    filters.categorical.sex = ['Female']
    expect(activeFilterCount(filters)).toBe(2)
  })

  test('la descripción lista únicamente los filtros activos', () => {
    expect(describeFilters(emptyFilters())).toEqual([])
    expect(describeFilters({ ...emptyFilters(), tip: [1, 2] })).toEqual(['tip: 1.00–2.00'])
  })

  test('clampFilters ajusta un rango a los límites nuevos y respeta los nulos', () => {
    const bounds = computeBounds(DATASET_ROWS)
    const clamped = clampFilters(
      { ...emptyFilters(), totalBill: [0, 999] },
      { ...bounds, totalBill: [5, 40] },
    )
    expect(clamped.totalBill).toEqual([5, 40])
    expect(clampFilters(emptyFilters(), bounds).totalBill).toBeNull()
  })
})

describe('filas propias', () => {
  test('una fila válida se convierte en números y conserva las categorías', () => {
    const { errors, row } = validateDraft(draft(), LEVELS)
    expect(errors).toEqual({})
    expect(row).toEqual({
      total_bill: 20.5,
      tip: 3.25,
      size: 2,
      sex: 'Female',
      smoker: 'No',
      day: 'Sat',
      time: 'Dinner',
    })
  })

  test('rechaza importes negativos, texto no numérico, size inválido y niveles ajenos al dataset', () => {
    expect(validateDraft(draft({ total_bill: '-1' }), LEVELS).errors.total_bill).toBeDefined()
    expect(validateDraft(draft({ tip: 'abc' }), LEVELS).errors.tip).toBeDefined()
    expect(validateDraft(draft({ size: '0' }), LEVELS).errors.size).toBeDefined()
    expect(validateDraft(draft({ size: '1.5' }), LEVELS).errors.size).toBeDefined()
    expect(validateDraft(draft({ day: 'Monday' }), LEVELS).errors.day).toBeDefined()
    expect(validateDraft(draft({ total_bill: '' }), LEVELS).row).toBeUndefined()
  })

  test('persistencia: ida y vuelta por almacenamiento, tolerante a datos corruptos', () => {
    const storage = memoryStorage()
    const row: TipRow = { total_bill: 30, tip: 5, size: 4, sex: 'Male', smoker: 'Yes', day: 'Sun', time: 'Lunch' }
    const saved = [createUserRow(row), createUserRow(row)]
    expect(saveUserRows(saved, storage)).toBe(true)
    const loaded = loadUserRows(storage)
    expect(loaded).toHaveLength(2)
    expect(loaded[0]).toEqual(saved[0])
    expect(loaded[0]!.id).not.toBe(loaded[1]!.id)

    expect(loadUserRows(memoryStorage('{no es json'))).toEqual([])
    expect(loadUserRows(memoryStorage('{"rows":[{"total_bill":1}]}'))).toEqual([])
  })

  test('sin almacenamiento disponible la app sigue funcionando en memoria', () => {
    expect(loadUserRows(null)).toEqual([])
    expect(saveUserRows([], null)).toBe(false)
  })

  test('mergeRows agrega las propias después del dataset original sin alterarlo', () => {
    const own = [createUserRow({ total_bill: 50, tip: 9, size: 5, sex: 'Male', smoker: 'No', day: 'Sat', time: 'Dinner' })]
    const merged = mergeRows(DATASET_ROWS, own)
    expect(merged).toHaveLength(DATASET_ROWS.length + 1)
    expect(merged[0]).toEqual(DATASET_ROWS[0]!)
    expect(merged[DATASET_ROWS.length]!.total_bill).toBe(50)
  })

  test('los límites del conjunto combinado incorporan los valores propios', () => {
    const own = [createUserRow({ total_bill: 99, tip: 12, size: 7, sex: 'Male', smoker: 'No', day: 'Sat', time: 'Dinner' })]
    const bounds = computeBounds(mergeRows(DATASET_ROWS, own))
    expect(bounds.totalBill[1]).toBe(99)
    expect(bounds.sizes).toContain(7)
  })
})
