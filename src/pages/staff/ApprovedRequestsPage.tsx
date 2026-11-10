import { useEffect, useMemo, useState } from 'react'
import { Download, Eye } from 'lucide-react'
import { DashboardNavbar } from '../../components/layout/DashboardNavbar'
import { ApprovedRequestDetailModal, type StaffApprovedRequest } from '../../components/staff/ApprovedRequestDetailModal'
import { DataTable, type Column } from '../../components/ui/DataTable'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Filter } from '../../components/ui/Filter'
import { SearchBar } from '../../components/ui/SearchBar'
import { Pagination } from '../../components/ui/Pagination'
import { PAGE_SIZE_DEFAULT, usePagination } from '../../hooks/usePagination'
import { TableActionsCell } from '../../components/ui/TableActionsCell'
import { useStaffDisplayUser } from '../../hooks/useStaffDisplayUser'
import { downloadAllApprovedRequests, downloadApprovedRequest } from '../../services/approvedRequestExport'
import { getAssistanceItems, subscribeDecisionStorage } from '../../services/decisionStorage'
import { getGeneratedAssistanceList, subscribeGeneratedAssistanceList } from '../../services/aiProcessing'

function statusVariant() {
  return 'success' as const
}

export default function StaffApprovedRequestsPage() {
  const displayUser = useStaffDisplayUser()
  const [viewRequest, setViewRequest] = useState<StaffApprovedRequest | null>(null)
  const [requests, setRequests] = useState(() => getAssistanceItems())
  const [generated, setGenerated] = useState(() => getGeneratedAssistanceList())
  const [search, setSearch] = useState('')
  const [program, setProgram] = useState('All Programs')

  useEffect(() => {
    const refreshRequests = () => setRequests(getAssistanceItems())
    const refreshGenerated = () => setGenerated(getGeneratedAssistanceList())
    const stopRequests = subscribeDecisionStorage(refreshRequests)
    const stopGenerated = subscribeGeneratedAssistanceList(refreshGenerated)
    return () => { stopRequests(); stopGenerated() }
  }, [])

  const approved = useMemo<StaffApprovedRequest[]>(() => requests
    .filter((item) => item.status === 'LIST GENERATED' || item.status === 'APPROVED')
    .map((item) => {
      const decision = item.decisions.find((entry) => entry.newStatus === 'APPROVED')
      return {
        id: item.id,
        beneficiary: item.details?.submittedBy || item.association,
        association: item.association,
        program: item.program || item.requestType,
         approvedDate: decision ? new Date(decision.decidedAt).toLocaleDateString('en-PH') : generated.find((row) => row.requestId === item.id)?.generatedAt ? new Date(generated.find((row) => row.requestId === item.id)!.generatedAt).toLocaleDateString('en-PH') : '—',
         approvedBy: decision?.decidedBy || 'ML and eligibility rules',
        beneficiaries: generated.filter((row) => row.requestId === item.id).length,
         status: item.status,
        distributionDate: 'Not scheduled',
      }
    }), [generated, requests])

  const programOptions = ['All Programs', ...new Set(approved.map((item) => item.program))]
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    return approved.filter((item) =>
      (program === 'All Programs' || item.program === program) &&
      (!query || [item.id, item.beneficiary, item.association, item.program].some((value) => value.toLowerCase().includes(query))),
    )
  }, [approved, program, search])
  const pagination = usePagination(filtered, PAGE_SIZE_DEFAULT, `${search}-${program}`, 'approved records')

  const columns: Column<StaffApprovedRequest>[] = [
    { key: 'id', header: 'Request ID', render: (r) => <span className="font-medium text-gray-900">{r.id}</span> },
    { key: 'beneficiary', header: 'Submitted By' },
    { key: 'association', header: 'Association' },
    { key: 'program', header: 'Program' },
    { key: 'approvedDate', header: 'Generated Date' },
    { key: 'approvedBy', header: 'Finalized By' },
    { key: 'beneficiaries', header: 'Prioritized' },
    { key: 'status', header: 'Status', render: (r) => <Badge variant={statusVariant()}>{r.status}</Badge> },
    {
      key: 'actions', header: 'Actions', colWidth: '10%', render: (r) => (
        <TableActionsCell>
          <button type="button" onClick={() => setViewRequest(r)} className="shrink-0 rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-primary" aria-label={`View ${r.id}`}><Eye className="h-4 w-4" /></button>
          <button type="button" onClick={() => downloadApprovedRequest(r)} className="shrink-0 rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-primary" aria-label={`Download ${r.id}`}><Download className="h-4 w-4" /></button>
        </TableActionsCell>
      ),
    },
  ]

  return (
    <>
      <DashboardNavbar title="View Generated Lists" searchPlaceholder="Search generated lists..." userName={displayUser.name} userInitials={displayUser.initials} />
      <main className="flex-1 overflow-y-auto p-4 sm:p-5 md:p-6">
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-5 py-4">
            <div className="flex flex-wrap gap-3">
               <SearchBar placeholder="Search generated lists..." value={search} onChange={setSearch} className="w-64" />
              <Filter label="Program" options={programOptions} value={program} onChange={setProgram} />
            </div>
            <Button variant="outline" disabled={!filtered.length} onClick={() => downloadAllApprovedRequests(filtered)}><Download className="h-4 w-4" />Export</Button>
          </div>
          <DataTable columns={columns} data={pagination.paginatedItems} keyExtractor={(r) => r.id} stableRowCount={PAGE_SIZE_DEFAULT} emptyMessage="No final prioritized lists found." />
          <Pagination showing={pagination.showing} currentPage={pagination.currentPage} totalPages={pagination.totalPages} onPageChange={pagination.setCurrentPage} />
        </div>
      </main>
      <ApprovedRequestDetailModal open={viewRequest !== null} onClose={() => setViewRequest(null)} request={viewRequest} onDownload={() => { if (viewRequest) downloadApprovedRequest(viewRequest) }} />
    </>
  )
}
