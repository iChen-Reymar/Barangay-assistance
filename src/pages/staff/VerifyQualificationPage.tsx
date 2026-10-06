import { useEffect, useState } from 'react'
import { DashboardNavbar } from '../../components/layout/DashboardNavbar'
import { RequestDetailsModal } from '../../components/approval/RequestDetailsModal'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { useReviewActor } from '../../hooks/useReviewActor'
import { useStaffDisplayUser } from '../../hooks/useStaffDisplayUser'
import {
  getAssistanceItems,
  getItemById,
  subscribeDecisionStorage,
  verifyDocument,
  verifyQualification,
} from '../../services/decisionStorage'
import type { DocumentStatus, QualificationStatus, ReviewableAssistanceItem } from '../../types/approval'

function qualificationSummary(item: ReviewableAssistanceItem) {
  const checks = item.qualifications ?? []
  const passed = checks.filter((check) => check.status === 'passed').length
  const pending = checks.filter((check) => check.status === 'pending').length
  return { passed, pending, total: checks.length }
}

export default function StaffVerifyQualificationPage() {
  const displayUser = useStaffDisplayUser()
  const actor = useReviewActor()
  const [items, setItems] = useState<ReviewableAssistanceItem[]>(() => getAssistanceItems())
  const [viewItem, setViewItem] = useState<ReviewableAssistanceItem | null>(null)

  useEffect(() => {
    setItems(getAssistanceItems())
    return subscribeDecisionStorage(() => setItems(getAssistanceItems()))
  }, [])

  function refreshView(itemId: string) {
    setItems(getAssistanceItems())
    setViewItem(getItemById(itemId))
  }

  function handleVerifyDocument(documentId: string, status: DocumentStatus) {
    if (!viewItem) return
    verifyDocument(viewItem.id, documentId, status, { name: actor.name, email: actor.email })
    refreshView(viewItem.id)
  }

  function handleVerifyQualification(checkId: string, status: QualificationStatus, notes?: string) {
    if (!viewItem) return
    verifyQualification(viewItem.id, checkId, status, { name: actor.name, email: actor.email }, notes)
    refreshView(viewItem.id)
  }

  return (
    <>
      <DashboardNavbar
        title="Verify Qualification"
        searchPlaceholder="Search beneficiaries and requests..."
        userName={displayUser.name}
        userInitials={displayUser.initials}
      />
      <main className="flex-1 overflow-y-auto p-4 sm:p-5 md:p-6">
        <p className="mb-4 text-sm text-gray-500">
          Confirm eligibility requirements before a request moves further in processing.
        </p>
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
                <th className="px-4 py-3">Beneficiary / Association</th>
                <th className="px-4 py-3">Assistance</th>
                <th className="px-4 py-3">Qualifications</th>
                <th className="px-4 py-3">Request Status</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    No requests are waiting for qualification review.
                  </td>
                </tr>
              ) : (
                items.map((item) => {
                  const summary = qualificationSummary(item)
                  return (
                    <tr key={item.id} className="border-b border-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{item.association}</td>
                      <td className="px-4 py-3 text-gray-600">{item.requestType}</td>
                      <td className="px-4 py-3">
                        <Badge variant={summary.pending > 0 ? 'warning' : 'success'}>
                          {`${summary.passed}/${summary.total} passed`}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{item.status}</td>
                      <td className="px-4 py-3">
                        <Button size="sm" variant="outline" onClick={() => setViewItem(item)}>
                          Verify
                        </Button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </main>

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
