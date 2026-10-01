import { Building2, Users, Clock, CheckCircle, AlertTriangle } from 'lucide-react'
import { AdminHeader } from '../../components/admin/AdminHeader'
import { StatCard } from '../../components/admin/StatCard'
import { AnalyticsCharts } from '../../components/admin/AnalyticsCharts'
import { DonutChart } from '../../components/admin/DonutChart'
import { VulnerabilityBadge, StatusBadge, MatchBadge, ScoreDisplay } from '../../components/admin/StatusBadge'
import {
  dashboardStats,
  vulnerabilityDistribution,
  recentAssistanceRequests,
  aiRecommendations,
  recentActivity,
} from '../../data/mockData'

export default function DashboardPage() {
  return (
    <>
      <AdminHeader title="Barangay Assistance Matching Dashboard" />
      <main className="flex-1 overflow-y-auto p-4 sm:p-5 md:p-6">
        <div className="mb-4 grid grid-cols-2 gap-3 sm:mb-6 sm:gap-4 lg:grid-cols-5">
          <StatCard label="Total Associations" value={dashboardStats.totalAssociations} icon={Building2} />
          <StatCard label="Total Beneficiaries" value={dashboardStats.totalBeneficiaries} icon={Users} />
          <StatCard label="Pending Requests" value={dashboardStats.pendingRequests} icon={Clock} />
          <StatCard label="Approved Assistance" value={dashboardStats.approvedAssistance} icon={CheckCircle} />
          <StatCard label="High Vulnerability" value={dashboardStats.highVulnerability} icon={AlertTriangle} />
        </div>

        <div className="mb-4 sm:mb-6">
          <AnalyticsCharts />
        </div>

        <div className="mb-4 grid gap-4 sm:mb-6 sm:gap-6 lg:grid-cols-2">
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
            <h2 className="mb-4 text-sm font-bold text-gray-900">Vulnerability Distribution</h2>
            <DonutChart
              high={vulnerabilityDistribution.high.count}
              medium={vulnerabilityDistribution.medium.count}
              low={vulnerabilityDistribution.low.count}
              total={vulnerabilityDistribution.total}
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
                  {recentAssistanceRequests.map((row) => (
                    <tr key={row.association + row.date} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{row.association}</td>
                      <td className="px-4 py-3 text-gray-600">{row.requestType}</td>
                      <td className="px-4 py-3"><VulnerabilityBadge level={row.vulnerability} /></td>
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
                  {aiRecommendations.map((row) => (
                    <tr key={row.association} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{row.association}</td>
                      <td className="px-4 py-3"><ScoreDisplay score={row.score} /></td>
                      <td className="px-4 py-3 text-gray-600">{row.program}</td>
                      <td className="px-4 py-3"><MatchBadge status={row.matchStatus} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
            <h2 className="mb-4 text-sm font-bold text-gray-900">Recent Activity Log</h2>
            <ul className="space-y-4">
              {recentActivity.map((item) => (
                <li key={item.text} className="flex gap-3">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                  <div>
                    <p className="text-sm text-gray-700">{item.text}</p>
                    <p className="text-xs text-gray-400">{item.time}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </main>
    </>
  )
}
