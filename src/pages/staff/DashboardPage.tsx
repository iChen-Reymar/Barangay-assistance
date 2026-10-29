import { useEffect, useState } from 'react'
import { Users, Shield, AlertTriangle, Clock, CheckCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { AnalyticsCharts } from '../../components/admin/AnalyticsCharts'
import { DashboardNavbar } from '../../components/layout/DashboardNavbar'
import { StatCard } from '../../components/ui/StatCard'
import { Badge } from '../../components/ui/Badge'
import { useStaffDisplayUser } from '../../hooks/useStaffDisplayUser'
import type { StaffBeneficiary } from '../../data/staffMockData'
import {
  countPendingVerification,
  getPendingVerificationBeneficiaries,
  getStaffBeneficiaries,
  subscribeStaffBeneficiaryStorage,
} from '../../services/staffBeneficiaryStorage'
import { getGeneratedAssistanceList, subscribeGeneratedAssistanceList } from '../../services/aiProcessing'
import { getAuditLogs, subscribeAuditLogs } from '../../services/auditStorage'

export default function StaffDashboardPage() {
  const displayUser = useStaffDisplayUser()

  const [pendingItems, setPendingItems] = useState<StaffBeneficiary[]>(() =>
    getPendingVerificationBeneficiaries(),
  )
  const [pendingCount, setPendingCount] = useState(() => countPendingVerification())
  const [beneficiaries, setBeneficiaries] = useState<StaffBeneficiary[]>(() => getStaffBeneficiaries())
  const [generatedCount, setGeneratedCount] = useState(() => getGeneratedAssistanceList().length)
  const [activities, setActivities] = useState(() => getAuditLogs().slice(0, 5))

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

  return (
    <>
      <DashboardNavbar
        title="Barangay Staff Dashboard"
        searchPlaceholder="Search records, requests, files..."
        userName={displayUser.name}
        userInitials={displayUser.initials}
      />
      <main className="flex-1 overflow-y-auto p-4 sm:p-5 md:p-6">
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
                  <li key={item.id} className="px-5 py-4">
                    <p className="font-medium text-gray-900">{item.name}</p>
                    <p className="text-xs text-gray-500">{item.association}</p>
                    <p className="mt-0.5 text-[10px] font-semibold uppercase text-amber-600">
                      {item.verification}
                    </p>
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
