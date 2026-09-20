import { useMemo, useState } from 'react'
import { AdminHeader } from '../../components/admin/AdminHeader'
import { ApprovalDecisionModal } from '../../components/approval/ApprovalDecisionModal'
import { DecisionTimeline } from '../../components/approval/DecisionTimeline'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { TableActionsCell } from '../../components/ui/TableActionsCell'
import { Modal } from '../../components/ui/Modal'
import { DataTable, type Column } from '../../components/ui/DataTable'
import { useAuth } from '../../context/AuthContext'
import { formatDate, formatDepartment, getReviewedAccessRequests } from '../../services/authStorage'
import type { DecisionType } from '../../types/approval'
import type { StoredUser } from '../../types/auth'

export default function AccessRequestsPage() {
  const { pendingRequests, approveRequest, rejectRequest, allUsers, refreshUsers } = useAuth()
  const [decisionModal, setDecisionModal] = useState<{
    type: DecisionType
    user: StoredUser
  } | null>(null)
  const [historyUser, setHistoryUser] = useState<StoredUser | null>(null)

  const reviewedRequests = useMemo(() => getReviewedAccessRequests(), [allUsers])

  const columns: Column<StoredUser>[] = [
    {
      key: 'fullName',
      header: 'Name',
      primary: true,
      render: (r) => <span className="font-medium text-gray-900">{r.fullName}</span>,
    },
    { key: 'email', header: 'Email' },
    { key: 'roleLabel', header: 'Role Requested' },
    {
      key: 'associationName',
      header: 'Association',
      hideOnMobile: true,
      render: (r) => r.associationName ?? '—',
    },
    { key: 'position', header: 'Position', hideOnMobile: true },
    {
      key: 'department',
      header: 'Department',
      hideOnMobile: true,
      render: (r) => formatDepartment(r.department),
    },
    {
      key: 'createdAt',
      header: 'Requested',
      render: (r) => formatDate(r.createdAt),
    },
    {
      key: 'status',
      header: 'Status',
      render: () => <Badge variant="warning">PENDING</Badge>,
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (r) => (
        <TableActionsCell>
          <Button
            size="sm"
            className="shrink-0 !px-2 !py-1 text-xs"
            onClick={() => setDecisionModal({ type: 'approve', user: r })}
          >
            Approve
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="shrink-0 !px-2 !py-1 text-xs"
            onClick={() => setDecisionModal({ type: 'reject', user: r })}
          >
            Reject
          </Button>
        </TableActionsCell>
      ),
    },
  ]

  return (
    <>
      <AdminHeader title="Access Requests" searchPlaceholder="Search pending access requests..." />
      <main className="flex-1 overflow-y-auto p-4 sm:p-5 md:p-6">
        <div className="mb-6 rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-4 py-4 md:px-5">
            <h2 className="text-base font-bold text-gray-900">Pending Access Requests</h2>
          </div>
          <DataTable
            columns={columns}
            data={pendingRequests}
            keyExtractor={(r) => r.id}
            emptyMessage="No pending access requests."
          />
        </div>

        <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-4 py-4 md:px-5">
            <h2 className="text-base font-bold text-gray-900">Recent Access Decisions</h2>
            <p className="mt-1 text-sm text-gray-500">History with notes and timestamps.</p>
          </div>
          <div className="divide-y divide-gray-100">
            {reviewedRequests.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-gray-500 md:px-5">
                No reviewed access requests yet.
              </p>
            ) : (
              reviewedRequests.slice(0, 10).map((user) => (
                <div
                  key={user.id}
                  className="flex flex-col gap-3 p-4 md:flex-row md:items-start md:justify-between md:px-5"
                >
                  <div>
                    <p className="font-semibold text-gray-900">{user.fullName}</p>
                    <p className="text-sm text-gray-500">{user.email}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <Badge variant={user.status === 'approved' ? 'success' : 'danger'}>
                        {user.status === 'approved' ? 'APPROVED' : 'REJECTED'}
                      </Badge>
                      {user.reviewedAt && (
                        <span className="text-xs text-gray-400">{formatDate(user.reviewedAt)}</span>
                      )}
                    </div>
                    {user.reviewNotes && (
                      <p className="mt-2 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-sm text-gray-700">
                        {user.reviewNotes}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">
                      Reviewed by {user.reviewedBy ?? 'Administrator'}
                    </p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => setHistoryUser(user)}>
                    View Timeline
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      <ApprovalDecisionModal
        open={!!decisionModal}
        onClose={() => setDecisionModal(null)}
        decisionType={decisionModal?.type ?? 'approve'}
        itemTitle={decisionModal?.user.fullName ?? ''}
        itemSubtitle={
          decisionModal?.user.associationName
            ? `${decisionModal.user.email} · ${decisionModal.user.associationName}`
            : decisionModal?.user.email
        }
        currentStatus="PENDING"
        onSubmit={(notes) => {
          if (!decisionModal) return
          if (decisionModal.type === 'approve') {
            approveRequest(decisionModal.user.id, notes)
          } else {
            rejectRequest(decisionModal.user.id, notes)
          }
          refreshUsers()
        }}
      />

      <Modal
        open={!!historyUser}
        onClose={() => setHistoryUser(null)}
        title={historyUser ? `Decision Record — ${historyUser.fullName}` : 'Decision Record'}
      >
        {historyUser && (
          <DecisionTimeline
            decisions={
              historyUser.reviewedAt
                ? [
                    {
                      id: historyUser.id,
                      decision: historyUser.reviewDecision ?? 'approve',
                      notes: historyUser.reviewNotes ?? '',
                      decidedBy: historyUser.reviewedBy ?? 'Administrator',
                      decidedByEmail: historyUser.reviewedByEmail,
                      decidedAt: historyUser.reviewedAt,
                      previousStatus: 'PENDING',
                      newStatus: historyUser.status === 'approved' ? 'APPROVED' : 'REJECTED',
                    },
                  ]
                : []
            }
          />
        )}
      </Modal>
    </>
  )
}
