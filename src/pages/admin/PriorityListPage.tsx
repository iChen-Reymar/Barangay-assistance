import { useEffect, useMemo, useState } from 'react'
import { FileDown, Pencil, Eye } from 'lucide-react'
import { AdminHeader } from '../../components/admin/AdminHeader'
import { PriorityListFormModal } from '../../components/admin/PriorityListFormModal'
import { PriorityListViewModal } from '../../components/admin/PriorityListViewModal'
import { VulnerabilityBadge, StatusBadge, ScoreDisplay } from '../../components/admin/StatusBadge'
import { Pagination } from '../../components/admin/Pagination'
import type { PriorityListEntry, VulnerabilityLevel } from '../../data/mockData'
import { useReviewActor } from '../../hooks/useReviewActor'
import { buildChanges, logAuditEvent } from '../../services/auditStorage'
import {
  getPriorityList,
  subscribePriorityStorage,
  updatePriorityEntry,
  type PriorityListUpdateInput,
} from '../../services/priorityStorage'
import { TABLE_DESKTOP_CLASS, TABLE_ROW_CLASS, tableBodyMinHeight } from '../../components/ui/tableLayout'
import { TableActionsCell } from '../../components/ui/TableActionsCell'
import { PAGE_SIZE_DEFAULT, usePagination } from '../../hooks/usePagination'
import { downloadCsv, formatExportDateStamp } from '../../utils/csvExport'

type ClassificationFilter = 'all' | VulnerabilityLevel
type SortOption = 'highest' | 'lowest' | 'recent'
type PreviousAidFilter = 'all' | 'None' | 'Yes'

export default function PriorityListPage() {
  const actor = useReviewActor()
  const [rows, setRows] = useState<PriorityListEntry[]>(() => getPriorityList())
  const [classification, setClassification] = useState<ClassificationFilter>('all')
  const [sort, setSort] = useState<SortOption>('highest')
  const [previousAid, setPreviousAid] = useState<PreviousAidFilter>('all')
  const [viewEntry, setViewEntry] = useState<PriorityListEntry | null>(null)
  const [editEntry, setEditEntry] = useState<PriorityListEntry | null>(null)

  useEffect(() => {
    return subscribePriorityStorage(() => {
      setRows(getPriorityList())
    })
  }, [])

  const filteredRows = useMemo(() => {
    let list = [...rows]

    if (classification !== 'all') {
      list = list.filter((row) => row.classification === classification)
    }
    if (previousAid !== 'all') {
      list = list.filter((row) => row.previousAid === previousAid)
    }

    if (sort === 'highest') {
      list.sort((a, b) => b.score - a.score)
    } else if (sort === 'lowest') {
      list.sort((a, b) => a.score - b.score)
    } else {
      list.sort((a, b) => a.rank - b.rank)
    }

    return list
  }, [rows, classification, sort, previousAid])

  const pagination = usePagination(
    filteredRows,
    PAGE_SIZE_DEFAULT,
    `${classification}-${sort}-${previousAid}`,
    'records',
  )

  function handleExport() {
    if (filteredRows.length === 0) return

    const headers = [
      'Rank',
      'Association',
      'Vulnerability Score',
      'Classification',
      'Recommended Assistance',
      'Previous Aid',
      'Status',
    ]

    const csvRows = filteredRows.map((row) => [
      row.rank,
      row.association,
      row.score,
      row.classification,
      row.recommended,
      row.previousAid,
      row.status,
    ])

    const filename = `priority-list-${formatExportDateStamp()}.csv`
    downloadCsv(filename, headers, csvRows)

    logAuditEvent({
      user: actor.name,
      userEmail: actor.email,
      action: 'Report Generated',
      actionColor: 'blue',
      description: `Exported priority list (${filteredRows.length} record${filteredRows.length === 1 ? '' : 's'}).`,
      entityType: 'report',
      changes: [],
    })
  }

  function handleSave(id: string, input: PriorityListUpdateInput) {
    const before = rows.find((row) => row.id === id)
    const updated = updatePriorityEntry(id, input)
    if (!updated || !before) return

    logAuditEvent({
      user: actor.name,
      userEmail: actor.email,
      action: 'Priority Update',
      actionColor: 'orange',
      description: `Updated priority list entry for ${updated.association}.`,
      entityType: 'association',
      entityId: updated.id,
      changes: buildChanges([
        { key: 'score', label: 'Vulnerability Score', oldValue: before.score, newValue: updated.score },
        {
          key: 'classification',
          label: 'Classification',
          oldValue: before.classification,
          newValue: updated.classification,
        },
        { key: 'status', label: 'Status', oldValue: before.status, newValue: updated.status },
        {
          key: 'recommended',
          label: 'Recommended Assistance',
          oldValue: before.recommended,
          newValue: updated.recommended,
        },
      ]),
    })
  }

  function openView(id: string) {
    const entry = rows.find((row) => row.id === id) ?? null
    setViewEntry(entry)
  }

  function openEdit(id: string) {
    const entry = rows.find((row) => row.id === id) ?? null
    setEditEntry(entry)
  }

  const priorityColWidths = ['5%', '19%', '12%', '11%', '18%', '9%', '10%', '16%']
  const priorityTableRows = Array.from({ length: PAGE_SIZE_DEFAULT }, (_, index) => {
    return pagination.paginatedItems[index] ?? null
  })

  return (
    <>
      <AdminHeader title="Priority List" />
      <main className="flex-1 overflow-y-auto p-4 sm:p-5 md:p-6">
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-5 py-4">
            <div className="flex flex-wrap gap-3">
              <select
                value={classification}
                onChange={(e) => setClassification(e.target.value as ClassificationFilter)}
                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700"
              >
                <option value="all">All Classifications</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortOption)}
                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700"
              >
                <option value="highest">Sort: Highest Score</option>
                <option value="lowest">Sort: Lowest Score</option>
                <option value="recent">Sort: Recent</option>
              </select>
              <select
                value={previousAid}
                onChange={(e) => setPreviousAid(e.target.value as PreviousAidFilter)}
                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700"
              >
                <option value="all">Previous Aid: All</option>
                <option value="None">None</option>
                <option value="Yes">Yes</option>
              </select>
            </div>
            <button
              type="button"
              onClick={handleExport}
              disabled={filteredRows.length === 0}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FileDown className="h-4 w-4" />
              Export Priority List
            </button>
          </div>

          <div
            className="overflow-x-auto"
            style={{ minHeight: tableBodyMinHeight(PAGE_SIZE_DEFAULT) }}
          >
            <table className={TABLE_DESKTOP_CLASS}>
              <colgroup>
                {priorityColWidths.map((width, index) => (
                  <col key={index} style={{ width }} />
                ))}
              </colgroup>
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
                  <th className="px-4 py-3">Rank</th>
                  <th className="px-4 py-3">Association</th>
                  <th className="px-4 py-3">Vulnerability Score</th>
                  <th className="px-4 py-3">Classification</th>
                  <th className="px-4 py-3">Recommended Assistance</th>
                  <th className="px-4 py-3">Previous Aid</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pagination.paginatedItems.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                      No priority records match your filters.
                    </td>
                  </tr>
                ) : (
                  priorityTableRows.map((row, index) =>
                    row ? (
                      <tr key={row.id} className={`${TABLE_ROW_CLASS} border-b border-gray-50 hover:bg-gray-50`}>
                        <td className="px-4 py-3 align-middle font-bold text-gray-900">{row.rank}</td>
                        <td className="max-w-0 truncate px-4 py-3 align-middle font-medium text-gray-900">
                          {row.association}
                        </td>
                        <td className="px-4 py-3 align-middle">
                          <ScoreDisplay score={row.score} />
                        </td>
                        <td className="px-4 py-3 align-middle">
                          <VulnerabilityBadge level={row.classification} />
                        </td>
                        <td className="max-w-0 truncate px-4 py-3 align-middle text-gray-600">
                          {row.recommended}
                        </td>
                        <td className="px-4 py-3 align-middle text-gray-500">{row.previousAid}</td>
                        <td className="px-4 py-3 align-middle">
                          <StatusBadge status={row.status} />
                        </td>
                        <td className="px-4 py-3 align-middle">
                          <TableActionsCell>
                            <button
                              type="button"
                              onClick={() => openEdit(row.id)}
                              className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-primary"
                              aria-label={`Edit ${row.association}`}
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => openView(row.id)}
                              className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-primary"
                              aria-label={`View ${row.association}`}
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                          </TableActionsCell>
                        </td>
                      </tr>
                    ) : (
                      <tr key={`priority-placeholder-${index}`} className={`${TABLE_ROW_CLASS} border-b border-gray-50`} aria-hidden>
                        <td colSpan={8} className="px-4 py-3">
                          &nbsp;
                        </td>
                      </tr>
                    ),
                  )
                )}
              </tbody>
            </table>
          </div>

          <Pagination
            showing={pagination.showing}
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            onPageChange={pagination.setCurrentPage}
          />
        </div>
      </main>

      <PriorityListViewModal
        open={!!viewEntry}
        onClose={() => setViewEntry(null)}
        entry={viewEntry}
        onEdit={(entry) => setEditEntry(entry)}
      />

      <PriorityListFormModal
        open={!!editEntry}
        onClose={() => setEditEntry(null)}
        entry={editEntry}
        onSave={handleSave}
      />
    </>
  )
}
