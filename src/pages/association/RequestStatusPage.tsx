import { useEffect, useState } from 'react'
import { Check } from 'lucide-react'
import { DashboardNavbar } from '../../components/layout/DashboardNavbar'
import { Badge } from '../../components/ui/Badge'
import { useAuth } from '../../context/AuthContext'
import { getInitials } from '../../utils/userDisplay'
import { getAssociationDetails } from '../../services/memberStorage'
import {
  getAssociationAssistanceItems,
  subscribeDecisionStorage,
} from '../../services/decisionStorage'
import type { ReviewableAssistanceItem } from '../../types/approval'
import type { RequestStatus } from '../../data/mockData'

const reviewSteps = ['Submitted', 'Under Review', 'Approved'] as const

function timelineFor(status: RequestStatus) {
  if (status === 'REJECTED') {
    return {
      steps: ['Submitted', 'Under Review', 'Rejected'],
      currentStep: 'Rejected',
      completedSteps: 3,
      badge: 'REJECTED',
    }
  }
  if (status === 'APPROVED') {
    return {
      steps: [...reviewSteps],
      currentStep: 'Approved',
      completedSteps: reviewSteps.length,
      badge: 'APPROVED',
    }
  }
  if (status === 'UNDER REVIEW') {
    return {
      steps: [...reviewSteps],
      currentStep: 'Under Review',
      completedSteps: 2,
      badge: 'UNDER REVIEW',
    }
  }
  return {
    steps: [...reviewSteps],
    currentStep: 'Submitted',
    completedSteps: 1,
    badge: 'PENDING',
  }
}

function badgeVariant(status: RequestStatus) {
  if (status === 'APPROVED') return 'success' as const
  if (status === 'REJECTED') return 'danger' as const
  if (status === 'UNDER REVIEW') return 'info' as const
  return 'warning' as const
}

export default function RequestStatusPage() {
  const { user, profile } = useAuth()
  const displayName = profile?.fullName ?? user?.fullName ?? 'Association Head'
  const initials = getInitials(displayName)
  const associationName = profile?.associationName ?? getAssociationDetails().name

  const [requests, setRequests] = useState<ReviewableAssistanceItem[]>(() =>
    getAssociationAssistanceItems(associationName),
  )

  useEffect(() => {
    const refresh = () => setRequests(getAssociationAssistanceItems(associationName))
    refresh()
    return subscribeDecisionStorage(refresh)
  }, [associationName])

  return (
    <>
      <DashboardNavbar
        title="Request Status"
        searchPlaceholder="Search requests..."
        userName={displayName}
        userInitials={initials}
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
              const timeline = timelineFor(request.status)
              return (
                <div key={request.id} className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
                  <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">{request.requestType}</h2>
                      <p className="text-sm text-gray-500">Submitted: {request.date}</p>
                    </div>
                    <Badge variant={badgeVariant(request.status)}>{timeline.badge}</Badge>
                  </div>

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
