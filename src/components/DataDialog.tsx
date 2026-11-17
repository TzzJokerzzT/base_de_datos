import { Button, Modal } from '@heroui/react'
import { useState } from 'react'

import { CATEGORICAL_COLUMNS, type CategoricalColumn, type TipRow } from '../data/dataset'
import { formatNumber } from '../lib/format'
import type { FilterBounds } from '../lib/filters'
import {
  validateDraft,
  type RowDraft,
  type RowErrors,
  type UserRow,
} from '../lib/userRows'

interface DataDialogProps {
  /** Límites y niveles vigentes del conjunto analizado. */
  bounds: FilterBounds
  /** Filas totales del conjunto (dataset original + propias). */
  totalRows: number
  rows: UserRow[]
  onAdd: (row: TipRow) => void
  onDelete: (id: string) => void
  onClear: () => void
}

const FIELD_LABELS: Record<keyof RowDraft, string> = {
  total_bill: 'Cuenta total (USD)',
  tip: 'Propina (USD)',
  size: 'Personas en la mesa',
  sex: 'Sexo del pagador',
  smoker: 'Fuma',
  day: 'Día de la semana',
  time: 'Momento del servicio',
}

const NUMERIC_FIELDS = ['total_bill', 'tip', 'size'] as const

const inputClass =
  'h-9 w-full rounded-lg border border-[var(--app-hairline)] bg-[var(--app-canvas)] px-2.5 text-[13px] text-[var(--app-ink)] outline-none transition-colors focus:border-[var(--app-accent)]'

function emptyDraft(levels: Record<CategoricalColumn, string[]>): RowDraft {
  return {
    total_bill: '',
    tip: '',
    size: '2',
    sex: levels.sex[0] ?? '',
    smoker: levels.smoker[0] ?? '',
    day: levels.day[0] ?? '',
    time: levels.time[0] ?? '',
  }
}

/**
 * Diálogo para cargar mesas propias: formulario validado, listado de lo guardado
 * en `localStorage` y borrado individual o total.
 */
export function DataDialog({ bounds, totalRows, rows, onAdd, onDelete, onClear }: DataDialogProps) {
  const [draft, setDraft] = useState<RowDraft>(() => emptyDraft(bounds.levels))
  const [errors, setErrors] = useState<RowErrors>({})
  const [feedback, setFeedback] = useState('')
  const [confirmingClear, setConfirmingClear] = useState(false)

  const update = (field: keyof RowDraft) => (value: string) => {
    setDraft((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
    setFeedback('')
  }

  const submit = () => {
    const result = validateDraft(draft, bounds.levels)
    setErrors(result.errors)
    if (!result.row) {
      setFeedback('')
      return
    }
    onAdd(result.row)
    // Se conservan las categorías para cargar varias mesas seguidas con el mismo perfil.
    setDraft({ ...emptyDraft(bounds.levels), sex: draft.sex, smoker: draft.smoker, day: draft.day, time: draft.time })
    setFeedback('Mesa agregada y guardada en este navegador.')
  }

  return (
    <Modal>
      <Button size="sm" variant="secondary" className="text-[12.5px]">
        Agregar datos
      </Button>
      <Modal.Backdrop>
        <Modal.Container size="lg" scroll="inside">
          <Modal.Dialog>
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Heading className="text-[15px]">Agregar mesas propias</Modal.Heading>
            </Modal.Header>
            <Modal.Body className="flex flex-col gap-4">
              <p className="text-[12.5px] leading-relaxed text-[var(--app-ink-muted)]">
                Las filas se guardan en <code className="font-mono">localStorage</code> y se suman al
                dataset: todas las tablas, gráficos e interpretaciones se recalculan con ellas. Los
                niveles cualitativos son los del dataset, para mantener comparables las categorías.
              </p>

              <div className="grid gap-3 sm:grid-cols-3">
                {NUMERIC_FIELDS.map((field) => (
                  <label key={field} className="flex flex-col gap-1">
                    <span className="text-[12px] font-medium text-[var(--app-ink)]">
                      {FIELD_LABELS[field]}
                    </span>
                    <input
                      className={inputClass}
                      type="number"
                      inputMode="decimal"
                      min={0}
                      step={field === 'size' ? 1 : 0.01}
                      value={draft[field]}
                      onChange={(event) => update(field)(event.target.value)}
                      aria-invalid={errors[field] ? true : undefined}
                    />
                    {errors[field] ? (
                      <span className="text-[11.5px] text-red-600 dark:text-red-400">{errors[field]}</span>
                    ) : null}
                  </label>
                ))}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {CATEGORICAL_COLUMNS.map((column) => (
                  <label key={column} className="flex flex-col gap-1">
                    <span className="text-[12px] font-medium text-[var(--app-ink)]">
                      {FIELD_LABELS[column]}
                    </span>
                    <select
                      className={inputClass}
                      value={draft[column]}
                      onChange={(event) => update(column)(event.target.value)}
                    >
                      {bounds.levels[column].map((level) => (
                        <option key={level} value={level}>
                          {level}
                        </option>
                      ))}
                    </select>
                    {errors[column] ? (
                      <span className="text-[11.5px] text-red-600 dark:text-red-400">{errors[column]}</span>
                    ) : null}
                  </label>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button size="sm" onPress={submit}>
                  Agregar mesa
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onPress={() => {
                    setDraft(emptyDraft(bounds.levels))
                    setErrors({})
                    setFeedback('')
                  }}
                >
                  Limpiar formulario
                </Button>
                {feedback ? (
                  <span className="text-[11.5px] text-[var(--app-ink-muted)]">{feedback}</span>
                ) : null}
              </div>

              <div className="border-t border-[var(--app-hairline)] pt-3">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-[12px] font-semibold uppercase tracking-wider text-[var(--app-ink)]">
                    Mesas propias ({rows.length})
                  </h3>
                  {confirmingClear ? (
                    <span className="flex items-center gap-2">
                      <span className="text-[11.5px] text-[var(--app-ink-muted)]">¿Borrar todas?</span>
                      <Button
                        size="sm"
                        variant="danger"
                        onPress={() => {
                          onClear()
                          setConfirmingClear(false)
                        }}
                      >
                        Confirmar
                      </Button>
                      <Button size="sm" variant="ghost" onPress={() => setConfirmingClear(false)}>
                        Cancelar
                      </Button>
                    </span>
                  ) : (
                    <Button
                      size="sm"
                      variant="ghost"
                      isDisabled={rows.length === 0}
                      onPress={() => setConfirmingClear(true)}
                    >
                      Borrar todas
                    </Button>
                  )}
                </div>

                {rows.length === 0 ? (
                  <p className="text-[12px] text-[var(--app-ink-muted)]">
                    Todavía no agregaste mesas: el análisis usa las {totalRows} filas del dataset.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-[12px]">
                      <thead>
                        <tr className="border-b border-[var(--app-hairline)] text-[10.5px] uppercase tracking-wider text-[var(--app-ink-muted)]">
                          <th className="px-1.5 py-1.5 text-left font-semibold">Cuenta</th>
                          <th className="px-1.5 py-1.5 text-right font-semibold">Propina</th>
                          <th className="px-1.5 py-1.5 text-right font-semibold">Personas</th>
                          <th className="px-1.5 py-1.5 text-left font-semibold">Sexo</th>
                          <th className="px-1.5 py-1.5 text-left font-semibold">Fuma</th>
                          <th className="px-1.5 py-1.5 text-left font-semibold">Día</th>
                          <th className="px-1.5 py-1.5 text-left font-semibold">Momento</th>
                          <th className="px-1.5 py-1.5 text-right font-semibold" />
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((row) => (
                          <tr key={row.id} className="border-b border-[var(--app-hairline)]/60 last:border-0">
                            <td className="numeric px-1.5 py-1.5 text-left">{formatNumber(row.total_bill)}</td>
                            <td className="numeric px-1.5 py-1.5 text-right">{formatNumber(row.tip)}</td>
                            <td className="numeric px-1.5 py-1.5 text-right">{row.size}</td>
                            <td className="px-1.5 py-1.5">{row.sex}</td>
                            <td className="px-1.5 py-1.5">{row.smoker}</td>
                            <td className="px-1.5 py-1.5">{row.day}</td>
                            <td className="px-1.5 py-1.5">{row.time}</td>
                            <td className="px-1.5 py-1.5 text-right">
                              <Button
                                size="sm"
                                variant="ghost"
                                aria-label={`Eliminar la mesa de ${formatNumber(row.total_bill)} USD`}
                                onPress={() => onDelete(row.id)}
                                className="h-6 min-w-0 px-1.5 text-[11px]"
                              >
                                Quitar
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </Modal.Body>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  )
}
