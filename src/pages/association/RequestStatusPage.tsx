import { Check } from 'lucide-react'
import { DashboardNavbar } from '../../components/layout/DashboardNavbar'
import { Badge } from '../../components/ui/Badge'
import { requestStatuses } from '../../data/associationMockData'
import { associationUser } from '../../components/association/navConfig'

export default function RequestStatusPage() {
  return (
    <>
      <DashboardNavbar
        title="Request Status"
        searchPlaceholder="Search requests..."
        userName={associationUser.name}
        userInitials={associationUser.initials}
        notificationsPath="/association/notifications"
      />
      <main className="flex-1 overflow-y-auto p-4 sm:p-5 md:p-6">
        <div className="space-y-6">
          {requestStatuses.map((request) => (
            <div key={request.id} className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
              <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{request.program}</h2>
                  <p className="text-sm text-gray-500">Submitted: {request.submittedDate}</p>
                </div>
                <Badge
                  variant={
                    request.finalStatus === 'Rejected'
                      ? 'danger'
                      : request.finalStatus === 'Approved'
                        ? 'success'
                        : 'info'
                  }
                >
                  {request.currentStep}
                </Badge>
              </div>

              <div className="relative ml-4 border-l-2 border-gray-200 pl-6">
                {request.steps.map((step, index) => {
                  const isCompleted = index < request.completedSteps
                  const isCurrent = step === request.currentStep
                  const isRejected = step === 'Rejected'

                  return (
                    <div key={step} className="relative pb-6 last:pb-0">
                      <span
                        className={`absolute -left-7.75 flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
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
          ))}
        </div>
      </main>
    </>
  )
}
