import { useEffect, useState } from 'react'
import { Check } from 'lucide-react'
import { Link } from 'react-router-dom'
import { DashboardNavbar } from '../../components/layout/DashboardNavbar'
import { Badge } from '../../components/ui/Badge'
import { useAuth } from '../../context/useAuth'
import { getGeneratedAssistanceList, subscribeGeneratedAssistanceList } from '../../services/aiProcessing'
import { getAssociationDetails } from '../../services/memberStorage'
import {
  getAssociationAssistanceItems,
  subscribeDecisionStorage,
} from '../../services/decisionStorage'
import type { ReviewableAssistanceItem } from '../../types/approval'
import type { RequestStatus } from '../../data/mockData'
import { useAssociationDisplayUser } from '../../hooks/useAssociationDisplayUser'

function timelineFor(status: RequestStatus, generated: boolean) {
  if (status === 'REJECTED') {
    return {
      steps: ['Submitted', 'Staff Validation', ...(generated ? ['AI List Generated'] : []), 'Rejected'],
      currentStep: 'Rejected',
      completedSteps: generated ? 4 : 3,
      badge: 'REJECTED',
    }
  }
  if (status === 'APPROVED') {
    return {
      steps: ['Submitted', 'Staff Validation', ...(generated ? ['AI List Generated'] : []), 'Approved'],
      currentStep: 'Approved',
      completedSteps: generated ? 4 : 3,
      badge: 'APPROVED',
    }
  }
  if (status === 'LIST GENERATED' || generated) {
    return {
      steps: ['Submitted', 'Staff Validation', 'Final List Generated'],
      currentStep: 'Final List Generated',
      completedSteps: 3,
      badge: 'LIST GENERATED',
    }
  }
  if (status === 'UNDER REVIEW') return {
    steps: ['Submitted', 'Staff Validation', 'Final List Generated'],
    currentStep: 'Staff Validation',
    completedSteps: 1,
    badge: 'UNDER REVIEW',
  }
  return {
    steps: ['Submitted', 'Staff Validation', 'Final List Generated'],
    currentStep: 'Submitted',
    completedSteps: 1,
    badge: 'PENDING',
  }
}

function badgeVariant(status: RequestStatus) {
  if (status === 'APPROVED' || status === 'LIST GENERATED') return 'success' as const
  if (status === 'REJECTED') return 'danger' as const
  if (status === 'UNDER REVIEW') return 'info' as const
  return 'warning' as const
}

export default function RequestStatusPage() {
  const { profile } = useAuth()
  const displayUser = useAssociationDisplayUser()
  const associationName = profile?.associationName ?? getAssociationDetails().name

  const [requests, setRequests] = useState<ReviewableAssistanceItem[]>(() =>
    getAssociationAssistanceItems(associationName),
  )
  const [generatedRows, setGeneratedRows] = useState(() => getGeneratedAssistanceList())

  useEffect(() => {
    const refreshLocal = () => {
      setGeneratedRows(getGeneratedAssistanceList())
      setRequests(getAssociationAssistanceItems(associationName))
    }
    refreshLocal()
    const stopDecisions = subscribeDecisionStorage(refreshLocal)
    const stopGenerated = subscribeGeneratedAssistanceList(refreshLocal)
    return () => {
      stopDecisions()
      stopGenerated()
    }
  }, [associationName])

  return (
    <>
      <DashboardNavbar
        title="Track Request Status"
        searchPlaceholder="Search requests..."
        userName={displayUser.name}
        userInitials={displayUser.initials}
        notificationsPath="/association/notifications"
      />
      <main className="flex-1 overflow-y-auto p-4 sm:p-5 md:p-6">
        {requests.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white px-5 py-8 text-sm text-gray-500">
            No assistance requests yet. Submit one and barangay staff will see it for review.
          </div>
        ) : (
          <div className="space-y-6">
            {requests.map((request) => {
              const generatedCount = generatedRows.filter((row) => row.requestId === request.id).length
              const timeline = timelineFor(request.status, generatedCount > 0)
              const finalDecision = request.decisions.find((decision) =>
                decision.newStatus === 'APPROVED' || decision.newStatus === 'REJECTED',
              )
              return (
                <div key={request.id} className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
                  <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">{request.requestType}</h2>
                      <p className="text-sm text-gray-500">Submitted: {request.date}</p>
                      {generatedCount > 0 ? (
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs font-medium text-green-700">
                           <span>{generatedCount} household{generatedCount === 1 ? '' : 's'} in the final prioritized list</span>
                          <Link to="/association/ai-recommendations" className="underline hover:text-green-900">
                             View final list
                          </Link>
                        </div>
                      ) : null}
                    </div>
                    <Badge variant={badgeVariant(request.status)}>{timeline.badge}</Badge>
                  </div>

                  {finalDecision ? (
                    <div className={`mb-6 rounded-lg border px-4 py-3 text-sm ${request.status === 'REJECTED' ? 'border-red-100 bg-red-50 text-red-800' : 'border-green-100 bg-green-50 text-green-800'}`}>
                      <p className="font-semibold">Final decision by {finalDecision.decidedBy}</p>
                      <p className="mt-1">{finalDecision.notes || 'No additional decision notes were provided.'}</p>
                    </div>
                  ) : null}

                  <div className="relative ml-4 border-l-2 border-gray-200 pl-6">
                    {timeline.steps.map((step, index) => {
                      const isCompleted = index < timeline.completedSteps
                      const isCurrent = step === timeline.currentStep
                      const isRejected = step === 'Rejected'

                      return (
                        <div key={step} className="relative pb-6 last:pb-0">
                          <span
                            className={`absolute -left-8 flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                              isCompleted
                                ? isRejected
                                  ? 'bg-red-100 text-red-600'
                                  : 'bg-green-100 text-green-700'
                                : isCurrent
                                  ? 'bg-primary text-white ring-4 ring-green-100'
                                  : 'bg-gray-100 text-gray-400'
                            }`}
                          >
                            {isCompleted ? <Check className="h-3.5 w-3.5" /> : index + 1}
                          </span>
                          <p
                            className={`text-sm ${
                              isCurrent ? 'font-bold text-primary' : isCompleted ? 'text-gray-800' : 'text-gray-400'
                            }`}
                          >
                            {step}
                          </p>
                          {isCurrent && (
                            <p className="mt-1 text-xs text-gray-500">Current step</p>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </>
  )
}
