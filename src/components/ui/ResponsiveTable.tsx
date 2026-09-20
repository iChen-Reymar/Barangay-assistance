import type { ReactNode } from 'react'
import {
  TABLE_DESKTOP_CLASS,
  TABLE_ROW_CLASS,
  cellTruncateClass,
  resolveColumnWidth,
  tableBodyMinHeight,
} from './tableLayout'

export interface ResponsiveColumn<T> {
  key: string
  header: string
  render?: (row: T) => ReactNode
  className?: string
  colWidth?: string
  mobileLabel?: string
  hideOnMobile?: boolean
  primary?: boolean
}

interface ResponsiveTableProps<T> {
  columns: ResponsiveColumn<T>[]
  data: T[]
  keyExtractor: (row: T) => string
  emptyMessage?: string
  stableRowCount?: number
}

export function ResponsiveTable<T>({
  columns,
  data,
  keyExtractor,
  emptyMessage = 'No records found.',
  stableRowCount,
}: ResponsiveTableProps<T>) {
  const mobileColumns = columns.filter((col) => !col.hideOnMobile)
  const primaryColumn = columns.find((col) => col.primary) ?? columns[0]
  const actionColumn = columns.find((col) => col.key === 'actions')

  function renderCell(row: T, col: ResponsiveColumn<T>) {
    if (col.render) return col.render(row)
    return String((row as Record<string, unknown>)[col.key] ?? '')
  }

  const desktopRows =
    stableRowCount && data.length > 0
      ? Array.from({ length: stableRowCount }, (_, index) => data[index] ?? null)
      : data.map((row) => row)

  if (data.length === 0) {
    return (
      <div className="px-4 py-8 text-center text-sm text-gray-500 md:px-5">{emptyMessage}</div>
    )
  }

  return (
    <>
      <div className="divide-y divide-gray-100 md:hidden">
        {data.map((row) => (
          <article key={keyExtractor(row)} className="space-y-3 p-4">
            {primaryColumn && (
              <div className="text-sm font-semibold text-gray-900">
                {renderCell(row, primaryColumn)}
              </div>
            )}
            <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
              {mobileColumns
                .filter((col) => col.key !== primaryColumn?.key && col.key !== 'actions')
                .map((col) => (
                  <div key={col.key} className={col.key === 'description' ? 'col-span-2' : ''}>
                    <dt className="text-[10px] font-semibold uppercase text-gray-400">
                      {col.mobileLabel ?? col.header}
                    </dt>
                    <dd className="mt-0.5 text-gray-700">{renderCell(row, col)}</dd>
                  </div>
                ))}
            </dl>
            {actionColumn && (
              <div className="flex flex-wrap gap-2 border-t border-gray-100 pt-3">
                {renderCell(row, actionColumn)}
              </div>
            )}
          </article>
        ))}
      </div>

      <div
        className="hidden overflow-x-auto md:block"
        style={stableRowCount ? { minHeight: tableBodyMinHeight(stableRowCount) } : undefined}
      >
        <table className={TABLE_DESKTOP_CLASS}>
          <colgroup>
            {columns.map((col) => (
              <col
                key={col.key}
                style={{ width: resolveColumnWidth(col.key, col.colWidth) }}
              />
            ))}
          </colgroup>
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
              {columns.map((col) => (
                <th key={col.key} className={`px-4 py-3 ${col.className ?? ''}`}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {desktopRows.map((row, index) =>
              row ? (
                <tr key={keyExtractor(row)} className={`${TABLE_ROW_CLASS} border-b border-gray-50 hover:bg-gray-50`}>
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`px-4 py-3 align-middle ${cellTruncateClass(col.key)} ${col.className ?? ''} ${
                        col.key === 'actions' ? 'whitespace-nowrap' : ''
                      }`}
                    >
                      {renderCell(row, col)}
                    </td>
                  ))}
                </tr>
              ) : (
                <tr key={`placeholder-${index}`} className={`${TABLE_ROW_CLASS} border-b border-gray-50`} aria-hidden>
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3">
                      &nbsp;
                    </td>
                  ))}
                </tr>
              ),
            )}
          </tbody>
        </table>
      </div>
    </>
  )
}
