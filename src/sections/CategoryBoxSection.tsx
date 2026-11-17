import type { CategoricalColumn, NumericColumn, TipRow } from '../data/dataset'
import { ChartFrame } from '../components/ChartFrame'
import { SectionCard } from '../components/SectionCard'
import { BoxPlotChart } from '../components/charts/BoxPlotChart'
import { categoryBoxesText } from '../lib/interpretations'
import { SET2 } from '../lib/palette'
import { groupedQuartiles } from '../lib/stats'

interface BoxBlock {
  key: string
  title: string
  subtitle: string
  category: CategoricalColumn
  column: NumericColumn
}

const BLOCKS: BoxBlock[] = [
  {
    key: 'total-bill-day',
    title: 'Cuenta total por día',
    subtitle: 'total_bill × day',
    category: 'day',
    column: 'total_bill',
  },
  {
    key: 'tip-time',
    title: 'Propina por momento del servicio',
    subtitle: 'tip × time',
    category: 'time',
    column: 'tip',
  },
]

export function CategoryBoxSection({ rows }: { rows: TipRow[] }) {
  return (
    <SectionCard
      id="cajas-categoria"
      number={5}
      title="Diagramas de caja por categorías"
      description="Compare medianas, variabilidad y posibles valores atípicos entre días y entre momentos del servicio."
      interpretation={categoryBoxesText(rows)}
    >
      <div className="grid gap-5 lg:grid-cols-2">
        {BLOCKS.map((block) => {
          const groups = groupedQuartiles(rows, block.category, block.column).map((group, index) => ({
            label: group.label,
            stats: group,
            color: SET2[index % SET2.length],
          }))
          return (
            <ChartFrame
              key={block.key}
              title={block.title}
              subtitle={block.subtitle}
              height={250}
              footnote={
                block.column === 'total_bill'
                  ? 'Cajas por día: la caja abarca el 50 % central de las cuentas y la línea central es la mediana.'
                  : 'Cajas por turno: la caja abarca el 50 % central de las propinas y la línea central es la mediana.'
              }
            >
              <BoxPlotChart groups={groups} valueLabel={block.column} />
            </ChartFrame>
          )
        })}
      </div>
    </SectionCard>
  )
}
