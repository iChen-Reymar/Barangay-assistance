import { useEffect, useState } from 'react'
import { Users, Shield, AlertTriangle, Clock, CheckCircle, ListOrdered, ClipboardCheck, PieChart, FileDown } from 'lucide-react'
import { Link } from 'react-router-dom'
import { AnalyticsCharts } from '../../components/admin/AnalyticsCharts'
import { DashboardNavbar } from '../../components/layout/DashboardNavbar'
import { StatCard } from '../../components/ui/StatCard'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { useStaffDisplayUser } from '../../hooks/useStaffDisplayUser'
import { useAuth } from '../../context/AuthContext'
import { buildChanges, logAuditEvent } from '../../services/auditStorage'
import type { StaffBeneficiary } from '../../data/staffMockData'
import {
  countPendingVerification,
  getPendingVerificationBeneficiaries,
  getStaffBeneficiaries,
  subscribeStaffBeneficiaryStorage,
  verifyStaffBeneficiary,
} from '../../services/staffBeneficiaryStorage'
import { getGeneratedAssistanceList, subscribeGeneratedAssistanceList } from '../../services/aiProcessing'
import { getAuditLogs, subscribeAuditLogs } from '../../services/auditStorage'

export default function StaffDashboardPage() {
  const displayUser = useStaffDisplayUser()
  const { user, profile } = useAuth()
  const actorName = profile?.fullName ?? user?.fullName ?? displayUser.name
  const actorEmail = profile?.email ?? user?.email

  const [pendingItems, setPendingItems] = useState<StaffBeneficiary[]>(() =>
    getPendingVerificationBeneficiaries(),
  )
  const [pendingCount, setPendingCount] = useState(() => countPendingVerification())
  const [beneficiaries, setBeneficiaries] = useState<StaffBeneficiary[]>(() => getStaffBeneficiaries())
  const [generatedCount, setGeneratedCount] = useState(() => getGeneratedAssistanceList().length)
  const [activities, setActivities] = useState(() => getAuditLogs().slice(0, 5))
  const [statusMessage, setStatusMessage] = useState('')
  const [verifyingId, setVerifyingId] = useState<string | null>(null)

  function refreshPending() {
    setPendingItems(getPendingVerificationBeneficiaries())
    setPendingCount(countPendingVerification())
    setBeneficiaries(getStaffBeneficiaries())
  }

  useEffect(() => {
    const stopBeneficiaries = subscribeStaffBeneficiaryStorage(refreshPending)
    const stopGenerated = subscribeGeneratedAssistanceList(() =>
      setGeneratedCount(getGeneratedAssistanceList().length),
    )
    const stopAudit = subscribeAuditLogs(() => setActivities(getAuditLogs().slice(0, 5)))
    return () => {
      stopBeneficiaries()
      stopGenerated()
      stopAudit()
    }
  }, [])

  useEffect(() => {
    if (!statusMessage) return
    const timer = window.setTimeout(() => setStatusMessage(''), 4000)
    return () => window.clearTimeout(timer)
  }, [statusMessage])

  function handleVerify(beneficiary: StaffBeneficiary) {
    if (beneficiary.verification === 'VERIFIED') return

    setVerifyingId(beneficiary.id)
    const previous = beneficiary.verification
    const updated = verifyStaffBeneficiary(beneficiary.id)
    setVerifyingId(null)

    if (!updated) return

    logAuditEvent({
      user: actorName,
      userEmail: actorEmail,
      action: 'Beneficiary Update',
      actionColor: 'green',
      description: `Verified beneficiary record for ${beneficiary.name}.`,
      entityType: 'beneficiary',
      entityId: beneficiary.id,
      changes: buildChanges([
        {
          key: 'verification',
          label: 'Verification',
          oldValue: previous,
          newValue: 'VERIFIED',
        },
      ]),
    })

    setStatusMessage(`${beneficiary.name} is now verified.`)
    refreshPending()
  }

  return (
    <>
      <DashboardNavbar
        title="Barangay Staff Dashboard"
        searchPlaceholder="Search records, requests, files..."
        userName={displayUser.name}
        userInitials={displayUser.initials}
      />
      <main className="flex-1 overflow-y-auto p-4 sm:p-5 md:p-6">
        {statusMessage ? (
          <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            {statusMessage}
          </div>
        ) : null}

        <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { to: '/staff/beneficiaries', label: 'Input Beneficiaries Data', icon: Users },
            { to: '/staff/vulnerability-assessment', label: 'Classify Beneficiaries', icon: Shield },
            { to: '/staff/priority-list', label: 'Generate Assistance Lists', icon: ListOrdered },
            { to: '/staff/reports', label: 'Export Reports', icon: FileDown },
            { to: '/staff/recommendations', label: 'View AI-Generated Recommendation', icon: CheckCircle },
            { to: '/staff/status-reports', label: 'View Status Reports', icon: PieChart },
            { to: '/staff/verify-qualification', label: 'Verify Qualification', icon: ClipboardCheck },
          ].map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-900 shadow-sm hover:border-primary hover:text-primary"
            >
              <item.icon className="h-4 w-4 shrink-0 text-primary" />
              {item.label}
            </Link>
          ))}
        </div>

        <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-5">
          <StatCard label="Total Beneficiaries" value={beneficiaries.length} icon={Users} />
          <StatCard label="Assessed Beneficiaries" value={beneficiaries.filter((row) => row.vulnerability).length} icon={Shield} />
          <StatCard label="High Vulnerability" value={beneficiaries.filter((row) => row.vulnerability === 'HIGH').length} icon={AlertTriangle} />
          <StatCard label="Pending Verification" value={pendingCount} icon={Clock} />
          <StatCard label="Approved Assistance" value={generatedCount} icon={CheckCircle} />
        </div>

        <div className="mb-6">
          <AnalyticsCharts />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 px-5 py-4">
              <h2 className="text-sm font-bold text-gray-900">Recent Beneficiaries</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Association</th>
                    <th className="px-4 py-3">Verification</th>
                  </tr>
                </thead>
                <tbody>
                  {beneficiaries.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-4 py-6 text-center text-sm text-gray-500">No beneficiaries yet.</td>
                    </tr>
                  ) : beneficiaries.slice(0, 5).map((row) => (
                    <tr key={row.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{row.name}</td>
                      <td className="px-4 py-3 text-gray-600">{row.association}</td>
                      <td className="px-4 py-3 text-gray-500">{row.verification}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 px-5 py-4">
              <h2 className="text-sm font-bold text-gray-900">Pending Verification</h2>
            </div>
            {pendingItems.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-gray-500">
                All beneficiary records are verified.
              </p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {pendingItems.map((item) => (
                  <li key={item.id} className="flex items-center justify-between gap-3 px-5 py-4">
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900">{item.name}</p>
                      <p className="text-xs text-gray-500">{item.association}</p>
                      <p className="mt-0.5 text-[10px] font-semibold uppercase text-amber-600">
                        {item.verification}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      disabled={verifyingId === item.id}
                      onClick={() => handleVerify(item)}
                    >
                      {verifyingId === item.id ? 'Verifying…' : 'Verify'}
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 px-5 py-4">
              <h2 className="text-sm font-bold text-gray-900">Priority Cases</h2>
            </div>
            {beneficiaries.filter((row) => row.vulnerability === 'HIGH').length === 0 ? (
              <p className="px-5 py-6 text-sm text-gray-500">No high-risk cases yet.</p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {beneficiaries.filter((row) => row.vulnerability === 'HIGH').slice(0, 5).map((item) => (
                  <li key={item.id} className="flex items-center justify-between px-5 py-4">
                    <div>
                      <p className="font-medium text-gray-900">{item.name}</p>
                      <p className="text-xs text-gray-500">{item.association}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="danger">HIGH RISK</Badge>
                      <Link to="/staff/beneficiaries" className="text-sm font-semibold text-primary hover:underline">
                        View Details
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-sm font-bold text-gray-900">Recent Assistance Activities</h2>
            {activities.length === 0 ? (
              <p className="text-sm text-gray-500">No activity yet.</p>
            ) : (
              <ul className="space-y-4">
                {activities.map((item) => (
                  <li key={item.id} className="flex gap-3">
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                    <div>
                      <p className="text-sm text-gray-700">{item.description}</p>
                      <p className="text-xs text-gray-400">{item.date}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </main>
    </>
  )
}
