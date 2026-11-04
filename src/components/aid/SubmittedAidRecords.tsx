import { useEffect, useMemo, useState } from 'react'
import { DataTable, type Column } from '../ui/DataTable'
import { Badge } from '../ui/Badge'
import { Filter } from '../ui/Filter'
import { Pagination } from '../ui/Pagination'
import { PAGE_SIZE_DEFAULT, usePagination } from '../../hooks/usePagination'
import { getAidRecords, subscribeAidRecords, type AidRecord } from '../../services/aidRecordStorage'

function formatReceivedDate(value: string) {
  const parsed = new Date(`${value}T00:00:00`)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function SubmittedAidRecords() {
  const [records, setRecords] = useState<AidRecord[]>(() => getAidRecords())
  const [association, setAssociation] = useState('All')

  useEffect(() => subscribeAidRecords(() => setRecords(getAidRecords())), [])

  const associationOptions = useMemo(() => {
    const names = [...new Set(records.map((row) => row.associationName.trim()).filter(Boolean))]
    names.sort((left, right) => left.localeCompare(right))
    return ['All', ...names]
  }, [records])

  const filtered = useMemo(() => {
    if (association === 'All') return records
    const key = association.trim().toLowerCase()
    return records.filter((row) => row.associationName.trim().toLowerCase() === key)
  }, [records, association])

  const pagination = usePagination(filtered, PAGE_SIZE_DEFAULT, association, 'records')

  const columns: Column<AidRecord>[] = [
    { key: 'association', header: 'Association', render: (row) => row.associationName },
    { key: 'member', header: 'Member', render: (row) => <span className="font-medium text-gray-900">{row.memberName}</span> },
    { key: 'program', header: 'Program', render: (row) => row.program },
    { key: 'dateReceived', header: 'Date Received', render: (row) => formatReceivedDate(row.dateReceived) },
    { key: 'quantity', header: 'Quantity / Amount', render: (row) => row.quantity },
    {
      key: 'comments',
      header: 'Comments',
      render: (row) => (
        <span className="block max-w-xs whitespace-normal text-gray-700">{row.comments?.trim() || '—'}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <Badge variant={row.status === 'RECEIVED' ? 'success' : 'warning'}>{row.status}</Badge>
      ),
    },
    { key: 'submittedBy', header: 'Submitted By', render: (row) => row.submittedBy || '—' },
  ]

  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-5 py-4">
        <p className="text-sm text-gray-500">Aid records submitted by association heads.</p>
        <Filter
          label="Association"
          options={associationOptions}
          value={associationOptions.includes(association) ? association : 'All'}
          onChange={setAssociation}
        />
      </div>
      <DataTable
        columns={columns}
        data={pagination.paginatedItems}
        keyExtractor={(row) => row.id}
        stableRowCount={PAGE_SIZE_DEFAULT}
        emptyMessage="No aid records have been submitted yet."
      />
      <Pagination
        showing={pagination.showing}
        currentPage={pagination.currentPage}
        totalPages={pagination.totalPages}
        onPageChange={pagination.setCurrentPage}
      />
    </div>
  )
}
