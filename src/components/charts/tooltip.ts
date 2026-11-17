/** Estilo compartido de los tooltips de Recharts, alineado con los tokens del tema. */
export const TOOLTIP_STYLE = {
  background: 'var(--app-panel)',
  border: '1px solid var(--app-hairline)',
  borderRadius: 10,
  fontSize: 12,
  color: 'var(--app-ink)',
  boxShadow: '0 8px 24px rgb(0 0 0 / 0.12)',
} as const

/**
 * Adaptador para el `formatter` de los tooltips de Recharts 3, cuyos tipos son muy
 * amplios: acá se normaliza el valor y el payload antes de formatear.
 */
export function tooltipFormatter(
  format: (value: number, payload: Record<string, unknown>) => [string, string],
) {
  return (value: unknown, _name: unknown, item: unknown): [string, string] => {
    const numeric = typeof value === 'number' ? value : Number(value)
    const payload =
      (item as { payload?: Record<string, unknown> } | undefined)?.payload ?? ({} as Record<string, unknown>)
    return format(Number.isFinite(numeric) ? numeric : 0, payload)
  }
}

export function payloadOf<T>(payload: Record<string, unknown>): Partial<T> {
  return payload as Partial<T>
}
