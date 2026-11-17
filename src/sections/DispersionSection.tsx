import type { TipRow } from '../data/dataset'
import { ChartFrame } from '../components/ChartFrame'
import { SectionCard } from '../components/SectionCard'
import { StatTable } from '../components/StatTable'
import { HBarChart } from '../components/charts/HBarChart'
import { formatNumber } from '../lib/format'
import { dispersionText } from '../lib/interpretations'
import { SET2 } from '../lib/palette'
import { dispersionShape } from '../lib/stats'

export function DispersionSection({ rows }: { rows: TipRow[] }) {
  const table = dispersionShape(rows)
  const mostDispersed = [...table].sort((a, b) => b.cv - a.cv)[0]

  return (
    <SectionCard
      id="dispersion"
      number={3}
      title="Dispersión y forma"
      description="Compare la dispersión relativa mediante el CV. Comente asimetría y curtosis en exceso. Tenga en cuenta las distintas unidades."
      interpretation={dispersionText(rows, table)}
    >
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <StatTable
          rowHeaderKey="variable"
          highlightKey={mostDispersed?.variable}
          columns={[
            { key: 'variable', label: 'Variable' },
            { key: 'range', label: 'Rango', align: 'right' },
            { key: 'variance', label: 'Varianza', align: 'right' },
            { key: 'std', label: 'Desv. est.', align: 'right' },
            { key: 'cv', label: 'CV', align: 'right', unit: '%' },
            { key: 'skew', label: 'Asimetría', align: 'right' },
            { key: 'kurt', label: 'Curtosis exc.', align: 'right' },
          ]}
          rows={table.map((row) => ({
            variable: row.variable,
            range: formatNumber(row.range),
            variance: formatNumber(row.variance),
            std: formatNumber(row.std),
            cv: formatNumber(row.cv),
            skew: formatNumber(row.skew),
            kurt: formatNumber(row.kurt),
          }))}
        />
        <ChartFrame
          title="Dispersión relativa"
          subtitle="CV %"
          height={190}
          footnote="El CV es adimensional: permite comparar la variabilidad de variables con distintas unidades."
        >
          <HBarChart
            data={table.map((row, index) => ({
              label: row.variable,
              value: row.cv,
              color: SET2[index % SET2.length],
              detail: `σ = ${formatNumber(row.std)}`,
            }))}
            unit="%"
            digits={1}
            yWidth={78}
          />
        </ChartFrame>
      </div>
    </SectionCard>
  )
}
