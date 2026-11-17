import { Card } from '@heroui/react'
import type { ReactNode } from 'react'

interface SectionCardProps {
  id: string
  number: number
  title: string
  description: string
  /** Texto interpretativo que acompaña a la sección. */
  interpretation?: string
  /** Contenido extra a la derecha del encabezado (chips de estado). */
  aside?: ReactNode
  children: ReactNode
}

/**
 * Tarjeta de sección: un paso del enunciado con su título, la consigna y la interpretación.
 */
export function SectionCard({
  id,
  number,
  title,
  description,
  interpretation,
  aside,
  children,
}: SectionCardProps) {
  return (
    <Card
      id={id}
      className="report-section scroll-mt-24 gap-0 border border-[var(--app-hairline)] bg-[var(--app-panel)] shadow-none"
    >
      <Card.Header className="gap-1.5 px-5 pt-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span
              aria-hidden="true"
              className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg bg-[var(--app-accent-soft)] text-[13px] font-semibold text-[var(--app-accent)]"
            >
              {number}
            </span>
            <div>
              <Card.Title className="text-base font-semibold text-[var(--app-ink)]">{title}</Card.Title>
              <Card.Description className="mt-1 max-w-2xl text-[13px] leading-relaxed text-[var(--app-ink-muted)]">
                {description}
              </Card.Description>
            </div>
          </div>
          {aside}
        </div>
      </Card.Header>
      <Card.Content className="gap-5 px-5 pb-5 pt-4">{children}</Card.Content>
      {interpretation ? (
        <div className="mx-5 mb-5 rounded-r-lg border-l-[3px] border-[var(--app-accent)] bg-[var(--app-accent-soft)]/60 px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--app-accent)]">
            Interpretación
          </p>
          <p className="mt-1 text-[13.5px] leading-relaxed text-[var(--app-ink)]">{interpretation}</p>
        </div>
      ) : null}
    </Card>
  )
}
