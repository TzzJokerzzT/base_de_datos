import { useEffect, useRef, useState } from 'react'

/**
 * Ancho real del contenedor, para dibujar SVG con coordenadas en píxeles.
 * Sin esto, un viewBox fijo se escala y el texto queda ilegible en columnas angostas.
 */
export function useElementWidth<T extends HTMLElement>(fallback = 640) {
  const ref = useRef<T | null>(null)
  const [width, setWidth] = useState(fallback)

  useEffect(() => {
    const element = ref.current
    if (!element) return
    const update = (next: number) => setWidth(Math.max(240, Math.round(next)))
    update(element.getBoundingClientRect().width)
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (entry) update(entry.contentRect.width)
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  return [ref, width] as const
}
