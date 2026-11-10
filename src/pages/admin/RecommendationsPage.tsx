import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AdminHeader } from '../../components/admin/AdminHeader'
import { AiRecommendationBoards } from '../../components/recommendations/AiRecommendationBoards'
import { DecisionTimeline } from '../../components/approval/DecisionTimeline'
import { RequestDetailsModal } from '../../components/approval/RequestDetailsModal'
import { VulnerabilityBadge } from '../../components/admin/StatusBadge'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import {
  formatDecisionDate,
  getRecommendationItems,
  getReviewableItems,
  subscribeDecisionStorage,
} from '../../services/decisionStorage'
import type { ReviewableAssistanceItem } from '../../types/approval'

function loadRecommendationItems(approvedOnly: boolean) {
  if (approvedOnly) {
    return getReviewableItems().filter((item) => item.status === 'LIST GENERATED' || item.status === 'APPROVED')
  }
  return getRecommendationItems()
}

export default function RecommendationsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const approvedOnly = searchParams.get('status') === 'approved'
  const [items, setItems] = useState<ReviewableAssistanceItem[]>(() =>
    loadRecommendationItems(approvedOnly),
  )
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [detailsItem, setDetailsItem] = useState<ReviewableAssistanceItem | null>(null)

  // Switching the filter re-reads the list before paint instead of in an
  // effect, which would render once holding the previous filter's rows and
  // again with the new ones.
  const [previousApprovedOnly, setPreviousApprovedOnly] = useState(approvedOnly)
  if (previousApprovedOnly !== approvedOnly) {
    setPreviousApprovedOnly(approvedOnly)
    setItems(loadRecommendationItems(approvedOnly))
  }

  useEffect(
    () => subscribeDecisionStorage(() => setItems(loadRecommendationItems(approvedOnly))),
    [approvedOnly],
  )

  return (
    <>
      <AdminHeader
        title="View AI-Generated Recommendation"
      />
      <main className="flex-1 overflow-y-auto p-4 sm:p-5 md:p-6">
        <h2 className="mb-4 text-base font-bold text-gray-900">AI recommendations for every association</h2>
        <AiRecommendationBoards compact emptyMessage="No assistance list has been generated yet." />
        {items.length > 0 || approvedOnly ? (
        <>
        <div className="mb-4 mt-8 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-bold text-gray-900">
            {approvedOnly
              ? `AI-Generated Results (${items.length})`
              : `AI-Generated Recommendations (${items.length})`}
          </h2>
          <div className="flex rounded-lg border border-gray-200 bg-white p-1 text-sm">
            <button
              type="button"
              onClick={() => setSearchParams({})}
              className={`rounded-md px-3 py-1.5 font-medium ${approvedOnly ? 'text-gray-600' : 'bg-primary text-white'}`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setSearchParams({ status: 'approved' })}
              className={`rounded-md px-3 py-1.5 font-medium ${approvedOnly ? 'bg-primary text-white' : 'text-gray-600'}`}
            >
              Final Lists
            </button>
          </div>
        </div>
        {items.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white px-5 py-8 text-sm text-gray-500">
            {approvedOnly
              ? 'No AI-generated results yet.'
              : 'No recommendations to review.'}
          </div>
        ) : null}

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
      />
    </>
  )
}
