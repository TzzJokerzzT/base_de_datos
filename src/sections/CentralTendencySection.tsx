import { NUMERIC_COLUMNS, COLUMN_LABELS, type TipRow } from '../data/dataset'
import { SectionCard } from '../components/SectionCard'
import { StatTable } from '../components/StatTable'
import { formatNumber, formatSigned } from '../lib/format'
import { centralTendencyText } from '../lib/interpretations'
import { centralTendency } from '../lib/stats'

export function CentralTendencySection({ rows }: { rows: TipRow[] }) {
  const { mean, median, mode } = centralTendency(rows)

  return (
    <SectionCard
      id="tendencia-central"
      number={2}
      title="Tendencia central de las variables cuantitativas"
      description="Compare la media y la mediana de la cuenta total y la propina. Interprete la moda del número de personas."
      interpretation={centralTendencyText(rows)}
    >
      <StatTable
        rowHeaderKey="variable"
        columns={[
          { key: 'variable', label: 'Variable' },
          { key: 'mean', label: 'Media', align: 'right' },
          { key: 'median', label: 'Mediana', align: 'right' },
          { key: 'mode', label: 'Moda', align: 'right' },
          { key: 'spread', label: 'Media − mediana', align: 'right' },
        ]}
        rows={NUMERIC_COLUMNS.map((column) => ({
          variable: column,
          mean: formatNumber(mean[column]),
          median: formatNumber(median[column]),
          mode: mode[column].length === 0 ? '—' : mode[column].map((value) => formatNumber(value, column === 'size' ? 0 : 2)).join(', '),
          spread: formatSigned(mean[column] - median[column]),
        }))}
        caption={`Unidades distintas: ${COLUMN_LABELS.total_bill}, ${COLUMN_LABELS.tip} y ${COLUMN_LABELS.size}. La columna «Media − mediana» positiva indica cola hacia la derecha.`}
      />
    </SectionCard>
  )
}
