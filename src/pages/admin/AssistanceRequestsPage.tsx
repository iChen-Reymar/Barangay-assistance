import { useEffect, useMemo, useState } from 'react'
import { AdminHeader } from '../../components/admin/AdminHeader'
import { ApprovalDecisionModal } from '../../components/approval/ApprovalDecisionModal'
import { AssistanceRequestRowActions } from '../../components/approval/AssistanceRequestRowActions'
import { RequestDetailsModal } from '../../components/approval/RequestDetailsModal'
import { VulnerabilityBadge, StatusBadge } from '../../components/admin/StatusBadge'
import { Pagination } from '../../components/admin/Pagination'
import { ResponsiveToolbar } from '../../components/layout/ResponsiveToolbar'
import { ResponsiveTable } from '../../components/ui/ResponsiveTable'
import { PAGE_SIZE_DEFAULT, usePagination } from '../../hooks/usePagination'
import { useReviewActor } from '../../hooks/useReviewActor'
import { buildChanges, logAuditEvent } from '../../services/auditStorage'
import {
  getAssistanceItems,
  getItemById,
  submitAssistanceDecision,
  subscribeDecisionStorage,
  verifyDocument,
  verifyQualification,
} from '../../services/decisionStorage'
import type { DecisionType, DocumentStatus, QualificationStatus, ReviewableAssistanceItem } from '../../types/approval'
import type { RequestStatus } from '../../data/mockData'

export default function AssistanceRequestsPage() {
  const actor = useReviewActor()
  const [items, setItems] = useState<ReviewableAssistanceItem[]>(() => getAssistanceItems())
  const [statusFilter, setStatusFilter] = useState<'All' | RequestStatus>('All')
  const [decisionModal, setDecisionModal] = useState<{
    type: DecisionType
    item: ReviewableAssistanceItem
  } | null>(null)
  const [viewItem, setViewItem] = useState<ReviewableAssistanceItem | null>(null)

  useEffect(() => {
    setItems(getAssistanceItems())
    return subscribeDecisionStorage(() => setItems(getAssistanceItems()))
  }, [])

  const filtered = useMemo(() => {
    if (statusFilter === 'All') return items
    return items.filter((item) => item.status === statusFilter)
  }, [items, statusFilter])

  const pagination = usePagination(filtered, PAGE_SIZE_DEFAULT, statusFilter)

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

  function handleDecision(notes: string, overrideStatus?: RequestStatus) {
    if (!decisionModal) return
    const result = submitAssistanceDecision(decisionModal.item.id, {
      decision: decisionModal.type,
      notes,
      reviewedBy: actor.name,
      reviewedByEmail: actor.email,
      overrideStatus,
    })
    if (result) {
      logAuditEvent({
        user: actor.name,
        userEmail: actor.email,
        action: 'Approval',
        actionColor: decisionModal.type === 'reject' ? 'red' : 'green',
        description: `${decisionModal.type} assistance request for ${result.association}.`,
        entityType: 'assistance_request',
        entityId: result.id,
        changes: buildChanges([
          { key: 'status', label: 'Status', oldValue: decisionModal.item.status, newValue: result.status },
          { key: 'notes', label: 'Notes', oldValue: '—', newValue: notes || '—' },
        ]),
      })
    }
  }

  return (
    <>
      <AdminHeader title="Assistance Requests Management" />
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
              <option value="APPROVED">Approved</option>
              <option value="UNDER REVIEW">Under Review</option>
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
                key: 'actions',
                header: 'Actions',
                colWidth: '26%',
                render: (row) => (
                  <AssistanceRequestRowActions
                    item={row}
                    onView={setViewItem}
                    onApprove={(item) => setDecisionModal({ type: 'approve', item })}
                    onReject={(item) => setDecisionModal({ type: 'reject', item })}
                    onOverride={(item) => setDecisionModal({ type: 'override', item })}
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

      <ApprovalDecisionModal
        open={!!decisionModal}
        onClose={() => setDecisionModal(null)}
        decisionType={decisionModal?.type ?? 'approve'}
        itemTitle={decisionModal?.item.association ?? ''}
        itemSubtitle={decisionModal?.item.requestType}
        currentStatus={decisionModal?.item.status}
        allowOverrideStatus={decisionModal?.type === 'override'}
        onSubmit={handleDecision}
      />

      <RequestDetailsModal
        open={!!viewItem}
        onClose={() => setViewItem(null)}
        item={viewItem}
        canVerify
        onVerifyDocument={handleVerifyDocument}
        onVerifyQualification={handleVerifyQualification}
      />
    </>
  )
}
