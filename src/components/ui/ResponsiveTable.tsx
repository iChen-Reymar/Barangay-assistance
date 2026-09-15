import type { ReactNode } from 'react'

export interface ResponsiveColumn<T> {
  key: string
  header: string
  render?: (row: T) => ReactNode
  className?: string
  mobileLabel?: string
  hideOnMobile?: boolean
  primary?: boolean
}

interface ResponsiveTableProps<T> {
  columns: ResponsiveColumn<T>[]
  data: T[]
  keyExtractor: (row: T) => string
  emptyMessage?: string
}

export function ResponsiveTable<T>({
  columns,
  data,
  keyExtractor,
  emptyMessage = 'No records found.',
}: ResponsiveTableProps<T>) {
  const mobileColumns = columns.filter((col) => !col.hideOnMobile)
  const primaryColumn = columns.find((col) => col.primary) ?? columns[0]
  const actionColumn = columns.find((col) => col.key === 'actions')

  function renderCell(row: T, col: ResponsiveColumn<T>) {
    if (col.render) return col.render(row)
    return String((row as Record<string, unknown>)[col.key] ?? '')
  }

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

      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-sm">
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
            {data.map((row) => (
              <tr key={keyExtractor(row)} className="border-b border-gray-50 hover:bg-gray-50">
                {columns.map((col) => (
                  <td key={col.key} className={`px-4 py-3 ${col.className ?? ''}`}>
                    {renderCell(row, col)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
