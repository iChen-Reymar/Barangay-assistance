import { Users, Shield, AlertTriangle, Clock, CheckCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { AnalyticsCharts } from '../../components/admin/AnalyticsCharts'
import { DashboardNavbar } from '../../components/layout/DashboardNavbar'
import { StatCard } from '../../components/ui/StatCard'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import {
  staffStats,
  recentBeneficiaries,
  pendingVerification,
  priorityCases,
  recentActivities,
} from '../../data/staffMockData'
import { staffUser } from '../../components/staff/navConfig'

export default function StaffDashboardPage() {
  return (
    <>
      <DashboardNavbar
        title="Staff Dashboard"
        searchPlaceholder="Search records, requests, files..."
        userName={staffUser.name}
        userInitials={staffUser.initials}
      />
      <main className="flex-1 overflow-y-auto p-4 sm:p-5 md:p-6">
        <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-5">
          <StatCard label="Total Beneficiaries" value={staffStats.totalBeneficiaries} icon={Users} />
          <StatCard label="Assessed Beneficiaries" value={staffStats.assessedBeneficiaries} icon={Shield} />
          <StatCard label="High Vulnerability" value={staffStats.highVulnerability} icon={AlertTriangle} />
          <StatCard label="Pending Verification" value={staffStats.pendingVerification} icon={Clock} />
          <StatCard label="Approved Assistance" value={staffStats.approvedAssistance} icon={CheckCircle} />
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
                    <th className="px-4 py-3">Date Added</th>
                  </tr>
                </thead>
                <tbody>
                  {recentBeneficiaries.map((row) => (
                    <tr key={row.name} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{row.name}</td>
                      <td className="px-4 py-3 text-gray-600">{row.association}</td>
                      <td className="px-4 py-3 text-gray-500">{row.dateAdded}</td>
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
            <ul className="divide-y divide-gray-100">
              {pendingVerification.map((item) => (
                <li key={item.name} className="flex items-center justify-between px-5 py-4">
                  <div>
                    <p className="font-medium text-gray-900">{item.name}</p>
                    <p className="text-xs text-gray-500">{item.association}</p>
                  </div>
                  <Button size="sm">Verify</Button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 px-5 py-4">
              <h2 className="text-sm font-bold text-gray-900">Priority Cases</h2>
            </div>
            <ul className="divide-y divide-gray-100">
              {priorityCases.map((item) => (
                <li key={item.name} className="flex items-center justify-between px-5 py-4">
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
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-sm font-bold text-gray-900">Recent Assistance Activities</h2>
            <ul className="space-y-4">
              {recentActivities.map((item) => (
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
