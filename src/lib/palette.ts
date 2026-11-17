/** Paleta Set2, la misma que usan las figuras de seaborn en el proyecto Python. */
export const SET2 = [
  '#66c2a5',
  '#fc8d62',
  '#8da0cb',
  '#e78ac3',
  '#a6d854',
  '#ffd92f',
  '#e5c494',
  '#b3b3b3',
] as const

/** Azul acero del histograma del enunciado (`color="steelblue"`). */
export const STEELBLUE = '#4682b4'

export function colorForLevel(level: string, levels: readonly string[]): string {
  const index = Math.max(0, levels.indexOf(level))
  return SET2[index % SET2.length] ?? STEELBLUE
}

/** Escala secuencial (azul → blanco → rojo) para la matriz de correlaciones. */
export function correlationColor(value: number): string {
  if (Number.isNaN(value)) return 'var(--app-hairline)'
  const clamped = Math.max(-1, Math.min(1, value))
  const magnitude = Math.abs(clamped)
  const alpha = 0.08 + 0.72 * magnitude
  const hue = clamped >= 0 ? '265' : '25'
  const chroma = clamped >= 0 ? '0.17' : '0.16'
  return `oklch(0.62 ${chroma} ${hue} / ${alpha.toFixed(3)})`
}
