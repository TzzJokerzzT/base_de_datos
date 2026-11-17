/** Formato numérico uniforme: punto decimal y sin separador de miles, como pandas. */
export function formatNumber(value: number | undefined, digits = 2): string {
  if (value === undefined || Number.isNaN(value) || !Number.isFinite(value)) return '—'
  return value.toFixed(digits)
}

export function formatInteger(value: number | undefined): string {
  if (value === undefined || Number.isNaN(value) || !Number.isFinite(value)) return '—'
  return String(Math.round(value))
}

export function formatPercent(value: number | undefined, digits = 1): string {
  if (value === undefined || Number.isNaN(value) || !Number.isFinite(value)) return '—'
  return `${value.toFixed(digits)} %`
}

export function formatRange(min: number, max: number, digits = 1): string {
  return `${min.toFixed(digits)} – ${max.toFixed(digits)}`
}

export function formatSigned(value: number, digits = 2): string {
  if (Number.isNaN(value) || !Number.isFinite(value)) return '—'
  const sign = value > 0 ? '+' : ''
  return `${sign}${value.toFixed(digits)}`
}
