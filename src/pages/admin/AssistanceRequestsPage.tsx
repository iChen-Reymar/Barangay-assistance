import { useEffect, useMemo, useState } from 'react'
import { AdminHeader } from '../../components/admin/AdminHeader'
import { AssistanceRequestRowActions } from '../../components/approval/AssistanceRequestRowActions'
import { RequestDetailsModal } from '../../components/approval/RequestDetailsModal'
import { VulnerabilityBadge, StatusBadge } from '../../components/admin/StatusBadge'
import { Pagination } from '../../components/admin/Pagination'
import { ResponsiveToolbar } from '../../components/layout/ResponsiveToolbar'
import { ResponsiveTable } from '../../components/ui/ResponsiveTable'
import { PAGE_SIZE_DEFAULT, usePagination } from '../../hooks/usePagination'
import {
  getAssistanceItems,
  subscribeDecisionStorage,
} from '../../services/decisionStorage'
import type { ReviewableAssistanceItem } from '../../types/approval'
import type { RequestStatus } from '../../data/mockData'
import { getGeneratedAssistanceList, subscribeGeneratedAssistanceList } from '../../services/aiProcessing'

export default function AssistanceRequestsPage() {
  const [items, setItems] = useState<ReviewableAssistanceItem[]>(() => getAssistanceItems())
  const [generated, setGenerated] = useState(() => getGeneratedAssistanceList())
  const [statusFilter, setStatusFilter] = useState<'All' | RequestStatus>('All')
  const [viewItem, setViewItem] = useState<ReviewableAssistanceItem | null>(null)

  useEffect(() => subscribeDecisionStorage(() => setItems(getAssistanceItems())), [])
  useEffect(() => subscribeGeneratedAssistanceList(() => setGenerated(getGeneratedAssistanceList())), [])

  const filtered = useMemo(() => {
    if (statusFilter === 'All') return items
    return items.filter((item) => item.status === statusFilter)
  }, [items, statusFilter])

  const pagination = usePagination(filtered, PAGE_SIZE_DEFAULT, statusFilter)

  return (
    <>
      <AdminHeader title="Assistance Requests Monitoring" />
      <main className="flex-1 overflow-y-auto p-4 sm:p-5 md:p-6">
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
          <ResponsiveToolbar>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'All' | RequestStatus)}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 sm:w-auto"
            >
              <option value="All">Status: All</option>
              <option value="PENDING">Pending</option>
              <option value="UNDER REVIEW">Under Review</option>
              <option value="LIST GENERATED">List Generated</option>
              <option value="APPROVED">Legacy Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
            <p className="text-sm text-gray-500">{filtered.length} request(s)</p>
          </ResponsiveToolbar>

          <ResponsiveTable
            data={pagination.paginatedItems}
            keyExtractor={(row) => row.id}
            emptyMessage="No assistance requests match your filter."
            stableRowCount={PAGE_SIZE_DEFAULT}
            columns={[
              {
                key: 'association',
                header: 'Association / Beneficiary',
                primary: true,
                render: (row) => <span className="font-medium text-gray-900">{row.association}</span>,
              },
              { key: 'requestType', header: 'Request Type', mobileLabel: 'Type' },
              {
                key: 'vulnerability',
                header: 'Vulnerability',
                render: (row) => (
                  <VulnerabilityBadge level={row.vulnerability as 'HIGH' | 'MEDIUM' | 'LOW'} />
                ),
              },
              { key: 'date', header: 'Date' },
              {
                key: 'status',
                header: 'Status',
                render: (row) => <StatusBadge status={row.status} />,
              },
              {
                key: 'generated',
                header: 'Final List',
                render: (row) => {
                  const count = generated.filter((entry) => entry.requestId === row.id).length
                  return <span className={count ? 'font-medium text-green-700' : 'text-amber-700'}>{count ? `${count} generated` : 'Not generated'}</span>
                },
              },
              {
                key: 'actions',
                header: 'Actions',
                colWidth: '26%',
                render: (row) => (
                  <AssistanceRequestRowActions
                    item={row}
                    onView={setViewItem}
                  />
                ),
              },
            ]}
          />

          <Pagination
            showing={pagination.showing}
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            onPageChange={pagination.setCurrentPage}
          />
        </div>
      </main>

      <RequestDetailsModal
        open={!!viewItem}
        onClose={() => setViewItem(null)}
        item={viewItem}
      />
    </>
  )
}
