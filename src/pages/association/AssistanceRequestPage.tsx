import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle } from 'lucide-react'
import { DashboardNavbar } from '../../components/layout/DashboardNavbar'
import { Button } from '../../components/ui/Button'
import { getActivePrograms, subscribeProgramStorage } from '../../services/programStorage'
import { submitAssociationAssistanceRequest } from '../../services/decisionStorage'
import { getAssociationDetails } from '../../services/memberStorage'
import type { AssistanceProgram } from '../../data/programsMockData'
import { useAuth } from '../../context/AuthContext'
import { getInitials } from '../../utils/userDisplay'
import { buildChanges, logAuditEvent } from '../../services/auditStorage'

export default function AssistanceRequestPage() {
  const { user, profile } = useAuth()
  const displayName = profile?.fullName ?? user?.fullName ?? 'Association Head'
  const initials = getInitials(displayName)
  const associationName = profile?.associationName ?? getAssociationDetails().name

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
    const submittedRequest = submitAssociationAssistanceRequest({
      association: associationName,
      program,
      memberCount: Number(memberCount),
      purpose,
      requestedAssistance,
      supportingInfo,
      submittedBy: displayName,
      contactNumber: profile?.contactNumber,
      email: profile?.email ?? user?.email,
    })
    logAuditEvent({
      user: displayName,
      userEmail: profile?.email ?? user?.email,
      action: 'Assistance Request',
      actionColor: 'blue',
      description: `${associationName} submitted ${program} for barangay staff review.`,
      entityType: 'assistance_request',
      entityId: submittedRequest.id,
      changes: buildChanges([
        { key: 'status', label: 'Status', oldValue: '—', newValue: 'PENDING' },
        { key: 'program', label: 'Program', oldValue: '—', newValue: program },
      ]),
    })
    setSubmitted(true)
    setProgram('')
    setMemberCount('')
    setPurpose('')
    setRequestedAssistance('')
    setSupportingInfo('')
  }

  return (
    <>
      <DashboardNavbar
        title="Submit Assistance Request"
        searchPlaceholder="Search programs..."
        userName={displayName}
        userInitials={initials}
        notificationsPath="/association/notifications"
      />
      <main className="flex-1 overflow-y-auto p-4 sm:p-5 md:p-6">
        <div className="mx-auto max-w-2xl rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          {submitted ? (
            <div className="py-8 text-center">
              <CheckCircle className="mx-auto mb-4 h-12 w-12 text-green-600" />
              <h2 className="text-lg font-bold text-gray-900">Your request has been submitted successfully.</h2>
              <p className="mt-2 text-sm text-gray-500">
                Barangay staff can now review this request. Track it under Request Status.
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <Link
                  to="/association/request-status"
                  className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark"
                >
                  View Request Status
                </Link>
                <Button variant="outline" onClick={() => setSubmitted(false)}>
                  Submit Another Request
                </Button>
              </div>
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
