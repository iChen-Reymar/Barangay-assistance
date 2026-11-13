import { useEffect, useMemo, useState } from 'react'
import { Download } from 'lucide-react'
import { DashboardNavbar } from '../../components/layout/DashboardNavbar'
import { AssistanceRequestRowActions } from '../../components/approval/AssistanceRequestRowActions'
import { RequestDetailsModal } from '../../components/approval/RequestDetailsModal'
import { DataTable, type Column } from '../../components/ui/DataTable'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { SearchBar } from '../../components/ui/SearchBar'
import { Pagination } from '../../components/ui/Pagination'
import { PAGE_SIZE_DEFAULT, usePagination } from '../../hooks/usePagination'
import { useReviewActor } from '../../hooks/useReviewActor'
import {
  getAssistanceItems,
  getItemById,
  subscribeDecisionStorage,
  verifyDocument,
  verifyQualification,
} from '../../services/decisionStorage'
import type { DocumentStatus, QualificationStatus, ReviewableAssistanceItem } from '../../types/approval'
import type { RequestStatus } from '../../data/mockData'
import { useAuth } from '../../context/useAuth'
import { getInitials } from '../../utils/userDisplay'
import { downloadCsv } from '../../utils/csvExport'
import { getGeneratedAssistanceList, subscribeGeneratedAssistanceList } from '../../services/aiProcessing'

function statusVariant(status: RequestStatus) {
  if (status === 'APPROVED' || status === 'LIST GENERATED') return 'success'
  if (status === 'REJECTED') return 'danger'
  if (status === 'UNDER REVIEW') return 'info'
  return 'warning'
}

const statusTabs: Array<'All' | RequestStatus> = ['All', 'PENDING', 'UNDER REVIEW', 'LIST GENERATED', 'APPROVED', 'REJECTED']

export default function StaffAssistanceRequestsPage() {
  const { user, profile } = useAuth()
  const actor = useReviewActor()
  const displayName = profile?.fullName ?? user?.fullName ?? 'Staff'
  const initials = getInitials(displayName)

  const [items, setItems] = useState<ReviewableAssistanceItem[]>(() => getAssistanceItems())
  const [generatedRows, setGeneratedRows] = useState(() => getGeneratedAssistanceList())
  const [activeTab, setActiveTab] = useState<'All' | RequestStatus>('All')
  const [viewItem, setViewItem] = useState<ReviewableAssistanceItem | null>(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    const stopRequests = subscribeDecisionStorage(() => setItems(getAssistanceItems()))
    const stopGenerated = subscribeGeneratedAssistanceList(() => setGeneratedRows(getGeneratedAssistanceList()))
    return () => {
      stopRequests()
      stopGenerated()
    }
  }, [])

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    return items.filter((item) =>
      (activeTab === 'All' || item.status === activeTab) &&
      (!query || [item.id, item.association, item.requestType].some((value) => value.toLowerCase().includes(query))),
    )
  }, [items, activeTab, search])

  const pagination = usePagination(filtered, PAGE_SIZE_DEFAULT, activeTab)

  function refreshItems() {
    setItems(getAssistanceItems())
  }

  function handleVerifyDocument(documentId: string, status: DocumentStatus) {
    if (!viewItem) return
    verifyDocument(viewItem.id, documentId, status, { name: actor.name, email: actor.email })
    refreshItems()
    setViewItem(getItemById(viewItem.id))
  }

  function handleVerifyQualification(checkId: string, status: QualificationStatus, notes?: string) {
    if (!viewItem) return
    verifyQualification(viewItem.id, checkId, status, { name: actor.name, email: actor.email }, notes)
    refreshItems()
    setViewItem(getItemById(viewItem.id))
  }

  const columns: Column<ReviewableAssistanceItem>[] = [
    {
      key: 'id',
      header: 'Request ID',
      primary: true,
      render: (r) => <span className="font-medium text-gray-900">{r.id}</span>,
    },
    { key: 'association', header: 'Beneficiary Name' },
    { key: 'requestType', header: 'Assistance Type', mobileLabel: 'Type' },
    {
      key: 'score',
      header: 'V-Score',
      render: (r) => (
    <span className={r.score && r.score >= 80 ? 'font-semibold text-red-500' : 'text-gray-700'}>
          {r.score ?? '—'}
        </span>
      ),
    },
    { key: 'date', header: 'Date Requested', mobileLabel: 'Date' },
    {
      key: 'status',
      header: 'Status',
      render: (r) => <Badge variant={statusVariant(r.status)}>{r.status}</Badge>,
    },
    {
      key: 'actions',
      header: 'Actions',
      colWidth: '26%',
      render: (r) => (
        <AssistanceRequestRowActions
          item={r}
          onView={setViewItem}
        />
      ),
    },
  ]

  return (
    <>
      <DashboardNavbar
        title="Assistance Requests Portal"
        searchPlaceholder="Search records, requests, files..."
        userName={displayName}
        userInitials={initials}
      />
      <main className="flex-1 overflow-y-auto p-4 sm:p-5 md:p-6">
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-gray-200 px-4 py-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between md:px-5">
            <div className="flex flex-wrap gap-2">
              {statusTabs.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`rounded-lg px-3 py-2 text-xs font-medium sm:px-4 sm:text-sm ${
                    activeTab === tab ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {tab === 'All' ? `All (${items.length})` : tab}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3 border-b border-gray-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between md:px-5">
            <SearchBar placeholder="Search request IDs or association names..." value={search} onChange={setSearch} className="max-w-sm flex-1" />
            <Button
              variant="outline"
              className="w-full sm:w-auto"
              disabled={!filtered.length}
              onClick={() => downloadCsv('assistance_requests.csv', ['Request ID', 'Association', 'Program', 'Date', 'Status'], filtered.map((item) => [item.id, item.association, item.requestType, item.date, item.status]))}
            >
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          </div>

          <DataTable
            columns={columns}
            data={pagination.paginatedItems}
            keyExtractor={(r) => r.id}
            stableRowCount={PAGE_SIZE_DEFAULT}
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
        generatedRows={viewItem ? generatedRows.filter((row) => row.requestId === viewItem.id) : []}
        canVerify
        onVerifyDocument={handleVerifyDocument}
        onVerifyQualification={handleVerifyQualification}
      />
    </>
  )
}
