import { useEffect, useMemo, useState } from 'react'
import { DashboardNavbar } from '../../components/layout/DashboardNavbar'
import { Badge } from '../../components/ui/Badge'
import { useAuth } from '../../context/useAuth'
import { useAssociationDisplayUser } from '../../hooks/useAssociationDisplayUser'
import { getAssociationDetails } from '../../services/memberStorage'
import { getAssociationAssistanceItems, subscribeDecisionStorage } from '../../services/decisionStorage'
import { getGeneratedAssistanceList, subscribeGeneratedAssistanceList } from '../../services/aiProcessing'

export default function ApprovedRequestsPage() {
  const { profile } = useAuth()
  const displayUser = useAssociationDisplayUser()
  const associationName = profile?.associationName ?? getAssociationDetails().name
  const [requests, setRequests] = useState(() => getAssociationAssistanceItems(associationName))
  const [generated, setGenerated] = useState(() => getGeneratedAssistanceList())

  useEffect(() => {
    const refreshRequests = () => setRequests(getAssociationAssistanceItems(associationName))
    const refreshGenerated = () => setGenerated(getGeneratedAssistanceList())
    refreshRequests()
    refreshGenerated()
    const stopRequests = subscribeDecisionStorage(refreshRequests)
    const stopGenerated = subscribeGeneratedAssistanceList(refreshGenerated)
    return () => {
      stopRequests()
      stopGenerated()
    }
  }, [associationName])

  const approved = useMemo(() => requests.filter((item) => item.status === 'LIST GENERATED' || item.status === 'APPROVED'), [requests])

  return (
    <>
      <DashboardNavbar
        title="Generated Assistance Lists"
        searchPlaceholder="Search generated lists..."
        userName={displayUser.name}
        userInitials={displayUser.initials}
        notificationsPath="/association/notifications"
      />
      <main className="flex-1 overflow-y-auto p-4 sm:p-5 md:p-6">
        {approved.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white px-5 py-8 text-sm text-gray-500">
            No final prioritized lists have been generated yet.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {approved.map((item) => {
              const decision = item.decisions.find((entry) => entry.newStatus === 'APPROVED')
              const beneficiaryCount = generated.filter((row) => row.requestId === item.id).length
              return (
                <div key={item.id} className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
                  <p className="text-xs font-semibold uppercase text-gray-400">{item.id}</p>
                  <h2 className="mt-1 text-lg font-bold text-green-800">{item.program || item.requestType}</h2>
                  <dl className="mt-4 space-y-2 text-sm">
                    <div className="flex justify-between gap-3">
                       <dt className="text-gray-500">Generated Date</dt>
                      <dd className="text-right font-medium text-gray-900">
                         {decision ? new Date(decision.decidedAt).toLocaleDateString('en-PH') : generated.find((row) => row.requestId === item.id)?.generatedAt ? new Date(generated.find((row) => row.requestId === item.id)!.generatedAt).toLocaleDateString('en-PH') : '—'}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-3">
                       <dt className="text-gray-500">Finalized By</dt>
                       <dd className="text-right font-medium text-gray-900">{decision?.decidedBy || 'ML and eligibility rules'}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                       <dt className="text-gray-500">Prioritized households</dt>
                      <dd className="font-medium text-gray-900">{beneficiaryCount}</dd>
                    </div>
                  </dl>
                  {decision?.notes ? <p className="mt-4 text-sm text-gray-600">{decision.notes}</p> : null}
                   <div className="mt-4"><Badge variant="success">{item.status}</Badge></div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </>
  )
}
