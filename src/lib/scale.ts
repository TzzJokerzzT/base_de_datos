/** Escalas y marcas «redondas» para los gráficos SVG propios. */

export interface TickScale {
  domain: [number, number]
  ticks: number[]
}

function niceStep(rough: number): number {
  if (rough <= 0 || !Number.isFinite(rough)) return 1
  const exponent = Math.floor(Math.log10(rough))
  const magnitude = 10 ** exponent
  const normalized = rough / magnitude
  const nice = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10
  return nice * magnitude
}

/** Dominio redondeado y marcas equiespaciadas, al estilo de un eje de matplotlib. */
export function niceScale(min: number, max: number, tickCount = 5): TickScale {
  if (!Number.isFinite(min) || !Number.isFinite(max)) return { domain: [0, 1], ticks: [0, 1] }
  if (min === max) {
    const padding = Math.abs(min) * 0.1 || 1
    return { domain: [min - padding, max + padding], ticks: [min - padding, min, max + padding] }
  }
  const step = niceStep((max - min) / Math.max(1, tickCount))
  const start = Math.floor(min / step) * step
  const end = Math.ceil(max / step) * step
  const ticks: number[] = []
  for (let value = start; value <= end + step / 2; value += step) {
    ticks.push(Number(value.toFixed(10)))
  }
  return { domain: [start, end], ticks }
}

export function linearScale(domain: [number, number], range: [number, number]) {
  const [domainMin, domainMax] = domain
  const [rangeMin, rangeMax] = range
  const span = domainMax - domainMin || 1
  return (value: number) => rangeMin + ((value - domainMin) / span) * (rangeMax - rangeMin)
}
