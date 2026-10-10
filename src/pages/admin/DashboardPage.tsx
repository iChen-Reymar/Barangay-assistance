import { useEffect, useState } from 'react'
import { Building2, Users, Clock, CheckCircle, AlertTriangle, ScrollText, FileDown, UserCog, ClipboardCheck, ClipboardList } from 'lucide-react'
import { Link } from 'react-router-dom'
import { AdminHeader } from '../../components/admin/AdminHeader'
import { StatCard } from '../../components/admin/StatCard'
import { AnalyticsCharts } from '../../components/admin/AnalyticsCharts'
import { DonutChart } from '../../components/admin/DonutChart'
import { VulnerabilityBadge, StatusBadge, MatchBadge, ScoreDisplay } from '../../components/admin/StatusBadge'
import type { MatchStatus, VulnerabilityLevel } from '../../data/mockData'
import { getAuditLogs, subscribeAuditLogs } from '../../services/auditStorage'
import { getAssociations, subscribeAssociationStorage } from '../../services/associationStorage'
import { getAssistanceItems, subscribeDecisionStorage } from '../../services/decisionStorage'
import { getGeneratedAssistanceList, subscribeGeneratedAssistanceList } from '../../services/aiProcessing'
import { getStaffBeneficiaries, subscribeStaffBeneficiaryStorage } from '../../services/staffBeneficiaryStorage'

function asLevel(value: string): VulnerabilityLevel {
  if (value === 'HIGH' || value === 'MEDIUM' || value === 'LOW') return value
  return 'LOW'
}

function matchStatus(score: number): MatchStatus {
  if (score >= 80) return 'HIGH MATCH'
  if (score >= 60) return 'MEDIUM MATCH'
  return 'MODERATE MATCH'
}

export default function DashboardPage() {
  const [tick, setTick] = useState(0)
  useEffect(() => {
    const refresh = () => setTick((value) => value + 1)
    const stops = [
      subscribeAssociationStorage(refresh),
      subscribeStaffBeneficiaryStorage(refresh),
      subscribeDecisionStorage(refresh),
      subscribeGeneratedAssistanceList(refresh),
      subscribeAuditLogs(refresh),
    ]
    return () => stops.forEach((stop) => stop())
  }, [])

  void tick
  const associations = getAssociations()
  const beneficiaries = getStaffBeneficiaries()
  const requests = getAssistanceItems()
  const generated = getGeneratedAssistanceList()
  const activity = getAuditLogs().slice(0, 5)
  const high = beneficiaries.filter((row) => row.vulnerability === 'HIGH').length
  const medium = beneficiaries.filter((row) => row.vulnerability === 'MEDIUM').length
  const low = beneficiaries.filter((row) => row.vulnerability === 'LOW').length

  return (
    <>
      <AdminHeader title="Barangay Captain Dashboard" />
      <main className="flex-1 overflow-y-auto p-4 sm:p-5 md:p-6">
        <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {[
            { to: '/admin/audit-logs', label: 'View Audit Logs', icon: ScrollText },
            { to: '/admin/reports', label: 'Export Reports', icon: FileDown },
            { to: '/admin/users', label: 'Manage Users', icon: UserCog },
            { to: '/admin/associations', label: 'Manage Association', icon: Building2 },
            { to: '/admin/recommendations', label: 'View AI-Generated Recommendation', icon: ClipboardCheck },
            { to: '/admin/programs', label: 'Manage Assistance Lists', icon: ClipboardList },
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

        <div className="mb-4 grid grid-cols-2 gap-3 sm:mb-6 sm:gap-4 lg:grid-cols-5">
          <StatCard label="Total Associations" value={associations.length} icon={Building2} />
          <StatCard label="Total Beneficiaries" value={beneficiaries.length} icon={Users} />
          <StatCard label="Pending Requests" value={requests.filter((row) => row.status === 'PENDING' || row.status === 'UNDER REVIEW').length} icon={Clock} />
          <StatCard label="Approved Assistance" value={generated.length} icon={CheckCircle} />
          <StatCard label="High Vulnerability" value={high} icon={AlertTriangle} />
        </div>

        <div className="mb-4 sm:mb-6">
          <AnalyticsCharts />
        </div>

        <div className="mb-4 grid gap-4 sm:mb-6 sm:gap-6 lg:grid-cols-2">
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
            <h2 className="mb-4 text-sm font-bold text-gray-900">Vulnerability Distribution</h2>
            <DonutChart
              high={high}
              medium={medium}
              low={low}
              total={beneficiaries.length}
            />
          </div>

          <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 px-5 py-4">
              <h2 className="text-sm font-bold text-gray-900">Recent Assistance Requests</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
                    <th className="px-4 py-3">Association</th>
                    <th className="px-4 py-3">Request Type</th>
                    <th className="px-4 py-3">Vulnerability</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-6 text-center text-sm text-gray-500">No assistance requests yet.</td>
                    </tr>
                  ) : requests.slice(0, 5).map((row) => (
                    <tr key={row.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{row.association}</td>
                      <td className="px-4 py-3 text-gray-600">{row.requestType}</td>
                      <td className="px-4 py-3"><VulnerabilityBadge level={asLevel(row.vulnerability)} /></td>
                      <td className="px-4 py-3 text-gray-500">{row.date}</td>
                      <td className="px-4 py-3"><StatusBadge status={row.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 px-5 py-4">
              <h2 className="text-sm font-bold text-gray-900">Recent AI Recommendations</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
                    <th className="px-4 py-3">Association</th>
                    <th className="px-4 py-3">AI Score</th>
                    <th className="px-4 py-3">Recommended Program</th>
                    <th className="px-4 py-3">Match Status</th>
                  </tr>
                </thead>
                <tbody>
                  {generated.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-6 text-center text-sm text-gray-500">No AI-generated results yet.</td>
                    </tr>
                  ) : generated.slice(0, 5).map((row) => (
                    <tr key={`${row.rank}-${row.name}`} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{row.name}</td>
                      <td className="px-4 py-3"><ScoreDisplay score={row.score} /></td>
                      <td className="px-4 py-3 text-gray-600">{row.program}</td>
                      <td className="px-4 py-3"><MatchBadge status={matchStatus(row.score)} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
            <h2 className="mb-4 text-sm font-bold text-gray-900">Recent Activity Log</h2>
            {activity.length === 0 ? (
              <p className="text-sm text-gray-500">No activity yet.</p>
            ) : (
              <ul className="space-y-4">
                {activity.map((item) => (
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
