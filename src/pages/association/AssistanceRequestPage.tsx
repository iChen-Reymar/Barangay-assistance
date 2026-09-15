import { useEffect, useState } from 'react'
import { CheckCircle } from 'lucide-react'
import { DashboardNavbar } from '../../components/layout/DashboardNavbar'
import { Button } from '../../components/ui/Button'
import { ProcessFlowBanner } from '../../components/ui/ProcessFlowBanner'
import { getActivePrograms, subscribeProgramStorage } from '../../services/programStorage'
import type { AssistanceProgram } from '../../data/programsMockData'
import { associationUser } from '../../components/association/navConfig'

export default function AssistanceRequestPage() {
  const [programs, setPrograms] = useState<AssistanceProgram[]>(() => getActivePrograms())
  const [submitted, setSubmitted] = useState(false)
  const [program, setProgram] = useState('')

  useEffect(() => {
    setPrograms(getActivePrograms())
    return subscribeProgramStorage(() => setPrograms(getActivePrograms()))
  }, [])
  const [memberCount, setMemberCount] = useState('')
  const [purpose, setPurpose] = useState('')
  const [requestedAssistance, setRequestedAssistance] = useState('')
  const [supportingInfo, setSupportingInfo] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitted(true)
  }

  return (
    <>
      <DashboardNavbar
        title="Submit Assistance Request"
        searchPlaceholder="Search programs..."
        userName={associationUser.name}
        userInitials={associationUser.initials}
        notificationsPath="/association/notifications"
      />
      <main className="flex-1 overflow-y-auto p-4 sm:p-5 md:p-6">
        <ProcessFlowBanner />

        <div className="mx-auto max-w-2xl rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          {submitted ? (
            <div className="py-8 text-center">
              <CheckCircle className="mx-auto mb-4 h-12 w-12 text-green-600" />
              <h2 className="text-lg font-bold text-gray-900">Your request has been submitted successfully.</h2>
              <p className="mt-2 text-sm text-gray-500">
                Your request will proceed through vulnerability assessment, AI recommendation, and official review before approval.
              </p>
              <Button className="mt-6" variant="outline" onClick={() => setSubmitted(false)}>
                Submit Another Request
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-gray-500">Select Program</label>
                <select
                  required
                  value={program}
                  onChange={(e) => setProgram(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">Choose a program...</option>
                  {programs.map((p) => (
                    <option key={p.id} value={p.name}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-gray-500">Number of Members</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={memberCount}
                  onChange={(e) => setMemberCount(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="e.g. 25"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-gray-500">Purpose / Reason</label>
                <textarea
                  required
                  rows={3}
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="Describe the purpose and reason for this request..."
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-gray-500">Requested Assistance</label>
                <input
                  required
                  value={requestedAssistance}
                  onChange={(e) => setRequestedAssistance(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="e.g. 25 food packs, 50 bags fertilizer"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-gray-500">Supporting Information</label>
                <textarea
                  rows={3}
                  value={supportingInfo}
                  onChange={(e) => setSupportingInfo(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="Additional documents or context supporting this request..."
                />
              </div>

              <Button type="submit" className="w-full">Submit Request</Button>
            </form>
          )}
        </div>
      </main>
    </>
  )
}
