import type { ReactNode } from 'react'

interface ChartFrameProps {
  title?: string
  subtitle?: string
  legend?: { label: string; color: string }[]
  /** Alto del área de dibujo en píxeles. */
  height?: number
  children: ReactNode
  footnote?: string
}

/** Contenedor común de los gráficos: título, leyenda y alto estable. */
export function ChartFrame({
  title,
  subtitle,
  legend,
  height = 240,
  children,
  footnote,
}: ChartFrameProps) {
  return (
    <figure className="m-0 flex min-w-0 flex-col">
      {title || legend ? (
        <figcaption className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <div>
            {title ? (
              <span className="text-[13px] font-semibold text-[var(--app-ink)]">{title}</span>
            ) : null}
            {subtitle ? (
              <span className="ml-2 text-[12px] text-[var(--app-ink-muted)]">{subtitle}</span>
            ) : null}
          </div>
          {legend && legend.length > 0 ? (
            <ul className="flex flex-wrap items-center gap-3">
              {legend.map((item) => (
                <li key={item.label} className="flex items-center gap-1.5 text-[11.5px] text-[var(--app-ink-muted)]">
                  <span
                    aria-hidden="true"
                    className="size-2.5 rounded-[3px]"
                    style={{ backgroundColor: item.color }}
                  />
                  {item.label}
                </li>
              ))}
            </ul>
          ) : null}
        </figcaption>
      ) : null}
      <div style={{ height }} className="min-w-0 w-full">
        {children}
      </div>
      {footnote ? (
        <p className="mt-2 text-[11.5px] leading-relaxed text-[var(--app-ink-muted)]">{footnote}</p>
      ) : null}
    </figure>
  )
}
