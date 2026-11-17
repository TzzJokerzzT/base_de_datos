interface MetricCardProps {
  label: string
  value: string
  hint?: string
}

/** Indicador compacto del resumen superior. */
export function MetricCard({ label, value, hint }: MetricCardProps) {
  return (
    <div className="panel rounded-xl px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--app-ink-muted)]">
        {label}
      </p>
      <p className="numeric mt-1 text-xl font-semibold leading-none text-[var(--app-ink)]">{value}</p>
      {hint ? <p className="mt-1.5 text-[11.5px] text-[var(--app-ink-muted)]">{hint}</p> : null}
    </div>
  )
}
