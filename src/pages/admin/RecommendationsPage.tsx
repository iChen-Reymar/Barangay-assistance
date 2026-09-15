import { useEffect, useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { AdminHeader } from '../../components/admin/AdminHeader'
import { ApprovalDecisionModal } from '../../components/approval/ApprovalDecisionModal'
import { DecisionTimeline } from '../../components/approval/DecisionTimeline'
import { RequestDetailsModal } from '../../components/approval/RequestDetailsModal'
import { VulnerabilityBadge } from '../../components/admin/StatusBadge'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { useReviewActor } from '../../hooks/useReviewActor'
import { buildChanges, logAuditEvent } from '../../services/auditStorage'
import {
  formatDecisionDate,
  getRecommendationItems,
  getItemById,
  submitAssistanceDecision,
  subscribeDecisionStorage,
  verifyDocument,
  verifyQualification,
} from '../../services/decisionStorage'
import type { DecisionType, DocumentStatus, QualificationStatus, ReviewableAssistanceItem } from '../../types/approval'

export default function RecommendationsPage() {
  const actor = useReviewActor()
  const [items, setItems] = useState<ReviewableAssistanceItem[]>(() => getRecommendationItems())
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [detailsItem, setDetailsItem] = useState<ReviewableAssistanceItem | null>(null)
  const [decisionModal, setDecisionModal] = useState<{
    type: DecisionType
    item: ReviewableAssistanceItem
  } | null>(null)

  useEffect(() => {
    setItems(getRecommendationItems())
    return subscribeDecisionStorage(() => setItems(getRecommendationItems()))
  }, [])

  const pending = items.filter((item) => item.status === 'PENDING' || item.status === 'UNDER REVIEW')

  function refreshItems() {
    setItems(getRecommendationItems())
  }

  function handleVerifyDocument(documentId: string, status: DocumentStatus) {
    if (!detailsItem) return
    verifyDocument(detailsItem.id, documentId, status, { name: actor.name, email: actor.email })
    refreshItems()
    setDetailsItem(getItemById(detailsItem.id))
  }

  function handleVerifyQualification(checkId: string, status: QualificationStatus, notes?: string) {
    if (!detailsItem) return
    verifyQualification(detailsItem.id, checkId, status, { name: actor.name, email: actor.email }, notes)
    refreshItems()
    setDetailsItem(getItemById(detailsItem.id))
  }

  function handleDecision(notes: string, overrideStatus?: ReviewableAssistanceItem['status']) {
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
        description: `${decisionModal.type} decision for ${result.association}.`,
        entityType: 'assistance_request',
        entityId: result.id,
        changes: buildChanges([
          { key: 'decision', label: 'Decision', oldValue: decisionModal.item.status, newValue: result.status },
          { key: 'notes', label: 'Notes', oldValue: '—', newValue: notes || '—' },
          { key: 'timestamp', label: 'Timestamp', oldValue: '—', newValue: new Date().toISOString() },
        ]),
      })
    }
  }

  return (
    <>
      <AdminHeader title="Assistance Decision & Approvals Console" />
      <main className="flex-1 overflow-y-auto p-4 sm:p-5 md:p-6">
        <div className="mb-6 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <p className="text-sm text-amber-800">
            Approve, reject, or override AI recommendations with required notes. Every action is
            timestamped and logged.
          </p>
        </div>

        <h2 className="mb-4 text-base font-bold text-gray-900">
          Pending AI Recommendations ({pending.length} require review)
        </h2>

        <div className="space-y-4">
          {items.map((rec) => (
            <div key={rec.id} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-bold text-gray-900">{rec.association}</h3>
                  <p className="text-xs text-gray-400">{rec.date}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {rec.score !== undefined && (
                    <span className="text-sm font-semibold text-orange-500">Score: {rec.score}</span>
                  )}
                  <VulnerabilityBadge level={rec.vulnerability as 'HIGH' | 'MEDIUM' | 'LOW'} />
                  <Badge
                    variant={
                      rec.status === 'APPROVED'
                        ? 'success'
                        : rec.status === 'REJECTED'
                          ? 'danger'
                          : rec.status === 'UNDER REVIEW'
                            ? 'info'
                            : 'warning'
                    }
                  >
                    {rec.status}
                  </Badge>
                </div>
              </div>

              <div className="mt-4">
                <p className="text-xs font-semibold uppercase text-green-600">Recommended Program</p>
                <p className="mt-1 font-bold text-green-800">{rec.program}</p>
                <p className="mt-1 text-sm text-gray-600">{rec.description}</p>
              </div>

              {rec.previousAssistance && (
                <p className="mt-3 text-xs text-gray-400">
                  Previous Assistance: {rec.previousAssistance}
                </p>
              )}

              {rec.decisions.length > 0 && (
                <div className="mt-4 rounded-lg border border-gray-100 bg-gray-50 p-3">
                  <DecisionTimeline decisions={rec.decisions} compact />
                </div>
              )}

              <div className="mt-4 flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => setDetailsItem(rec)}>
                  View Full Details
                </Button>
                {(rec.status === 'PENDING' || rec.status === 'UNDER REVIEW') && (
                  <>
                    <Button size="sm" onClick={() => setDecisionModal({ type: 'approve', item: rec })}>
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setDecisionModal({ type: 'reject', item: rec })}
                    >
                      Reject
                    </Button>
                  </>
                )}
                {rec.decisions.length > 0 && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setDecisionModal({ type: 'override', item: rec })}
                  >
                    Override
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setExpandedId(expandedId === rec.id ? null : rec.id)}
                >
                  {expandedId === rec.id ? 'Hide History' : 'View History'}
                </Button>
              </div>

              {expandedId === rec.id && (
                <div className="mt-4 border-t border-gray-100 pt-4">
                  <h4 className="mb-3 text-sm font-bold text-gray-900">Decision History</h4>
                  <DecisionTimeline decisions={rec.decisions} />
                  {rec.decisions[0] && (
                    <p className="mt-3 text-xs text-gray-400">
                      Last updated {formatDecisionDate(rec.decisions[0].decidedAt)}
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </main>

      <RequestDetailsModal
        open={!!detailsItem}
        onClose={() => setDetailsItem(null)}
        item={detailsItem}
        canVerify
        onVerifyDocument={handleVerifyDocument}
        onVerifyQualification={handleVerifyQualification}
      />

      <ApprovalDecisionModal
        open={!!decisionModal}
        onClose={() => setDecisionModal(null)}
        decisionType={decisionModal?.type ?? 'approve'}
        itemTitle={decisionModal?.item.association ?? ''}
        itemSubtitle={decisionModal?.item.program}
        currentStatus={decisionModal?.item.status}
        allowOverrideStatus={decisionModal?.type === 'override'}
        onSubmit={handleDecision}
      />
    </>
  )
}
