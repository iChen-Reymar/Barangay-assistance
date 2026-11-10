import { useEffect, useState } from 'react'
import { DashboardNavbar } from '../../components/layout/DashboardNavbar'
import { AiRecommendationBoards } from '../../components/recommendations/AiRecommendationBoards'
import { DecisionTimeline } from '../../components/approval/DecisionTimeline'
import { RequestDetailsModal } from '../../components/approval/RequestDetailsModal'
import { VulnerabilityBadge } from '../../components/admin/StatusBadge'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { useReviewActor } from '../../hooks/useReviewActor'
import {
  formatDecisionDate,
  getRecommendationItems,
  getItemById,
  subscribeDecisionStorage,
  verifyDocument,
  verifyQualification,
} from '../../services/decisionStorage'
import type { DocumentStatus, QualificationStatus, ReviewableAssistanceItem } from '../../types/approval'
import { useAuth } from '../../context/useAuth'
import { getInitials } from '../../utils/userDisplay'

export default function StaffRecommendationsPage() {
  const { user, profile } = useAuth()
  const actor = useReviewActor()
  const displayName = profile?.fullName ?? user?.fullName ?? 'Staff'
  const initials = getInitials(displayName)

  const [items, setItems] = useState<ReviewableAssistanceItem[]>(() => getRecommendationItems())
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [detailsItem, setDetailsItem] = useState<ReviewableAssistanceItem | null>(null)

  useEffect(() => subscribeDecisionStorage(() => setItems(getRecommendationItems())), [])

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

  return (
    <>
      <DashboardNavbar
        title="View AI-Generated Recommendation"
        searchPlaceholder="Search requests, associations, beneficiaries..."
        userName={displayName}
        userInitials={initials}
      />
      <main className="flex-1 overflow-y-auto p-4 sm:p-5 md:p-6">
        <h2 className="mb-4 text-base font-bold text-gray-900">AI recommendations for every association</h2>
        <AiRecommendationBoards compact emptyMessage="No assistance list has been generated yet." />
        {items.length > 0 ? (
          <>
            <h2 className="mb-4 mt-8 text-base font-bold text-gray-900">
              Requests to review ({items.length})
            </h2>
            <div className="space-y-4">
          {items.map((rec) => (
            <div key={rec.id} className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
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
                      rec.status === 'APPROVED' || rec.status === 'LIST GENERATED'
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
                <p className="text-xs font-semibold uppercase text-green-600">Recommended Support Program</p>
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
          </>
        ) : null}
      </main>

      <RequestDetailsModal
        open={!!detailsItem}
        onClose={() => setDetailsItem(null)}
        item={detailsItem}
        canVerify
        onVerifyDocument={handleVerifyDocument}
        onVerifyQualification={handleVerifyQualification}
      />

    </>
  )
}
