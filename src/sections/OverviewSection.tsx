import { Table } from '@heroui/react'
import { NUMERIC_COLUMNS, COLUMN_CLASSIFICATION, COLUMN_META, COLUMN_LABELS, type TipRow } from '../data/dataset'
import { MetricCard } from '../components/MetricCard'
import { SectionCard } from '../components/SectionCard'
import { StatTable } from '../components/StatTable'
import { formatInteger, formatNumber } from '../lib/format'
import { overviewText } from '../lib/interpretations'
import { meanOf, valuesOf } from '../lib/stats'

const PREVIEW_ROWS = 8

export function OverviewSection({ rows, totalRows }: { rows: TipRow[]; totalRows: number }) {
  const missing = rows.reduce(
    (accumulator, row) =>
      accumulator + Object.values(row).filter((value) => value === null || value === undefined).length,
    0,
  )
  const observations = rows.length
  const variables = COLUMN_META.length
  const averageBill = meanOf(valuesOf(rows, 'total_bill'))

  return (
    <SectionCard
      id="exploracion"
      number={1}
      title="Carga y exploración de datos"
      description="Determine el número de observaciones y variables. Clasifique las variables y señale si hay datos faltantes."
      interpretation={overviewText(rows)}
    >
      <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Observaciones"
          value={formatInteger(observations)}
          hint={observations === totalRows ? 'conjunto completo' : `de ${totalRows} en el conjunto`}
        />
        <MetricCard label="Variables" value={formatInteger(variables)} hint="3 cuantitativas · 4 cualitativas" />
        <MetricCard
          label="Datos faltantes"
          value={formatInteger(missing)}
          hint="el formulario exige todos los campos"
        />
        <MetricCard
          label="Cuenta promedio"
          value={`${formatNumber(averageBill)} USD`}
          hint={NUMERIC_COLUMNS.map((column) => COLUMN_LABELS[column]).length > 0 ? 'media de total_bill' : ''}
        />
      </div>

      <StatTable
        rowHeaderKey="variable"
        columns={[
          { key: 'variable', label: 'Variable' },
          { key: 'dtype', label: 'Tipo de dato' },
          { key: 'clasificacion', label: 'Clasificación' },
          { key: 'descripcion', label: 'Descripción' },
        ]}
        rows={COLUMN_META.map((column) => ({
          variable: column.name,
          dtype: column.dtype,
          clasificacion: COLUMN_CLASSIFICATION[column.name],
          descripcion: column.label,
        }))}
      />

      <div>
        <h3 className="mb-2 text-[12px] font-semibold uppercase tracking-wider text-[var(--app-ink-muted)]">
          Primeros {PREVIEW_ROWS} registros
        </h3>
        <Table>
          <Table.ScrollContainer>
            <Table.Content aria-label="Primeros registros del dataset tips" className="min-w-[640px]">
              <Table.Header>
                {COLUMN_META.map((column, index) => (
                  <Table.Column key={column.name} isRowHeader={index === 0}>
                    {column.name}
                  </Table.Column>
                ))}
              </Table.Header>
              <Table.Body>
                {rows.slice(0, PREVIEW_ROWS).map((row, rowIndex) => (
                  <Table.Row key={`preview-${rowIndex}`}>
                    {COLUMN_META.map((column, columnIndex) => {
                      const value = row[column.name]
                      return (
                        <Table.Cell key={column.name}>
                          <span className={columnIndex === 0 ? 'numeric text-[var(--app-ink)]' : 'numeric'}>
                            {typeof value === 'number' ? formatNumber(value, column.name === 'size' ? 0 : 2) : String(value)}
                          </span>
                        </Table.Cell>
                      )
                    })}
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Content>
          </Table.ScrollContainer>
        </Table>
      </div>
    </SectionCard>
  )
}
