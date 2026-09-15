import { Users, Clock, CheckCircle, XCircle } from 'lucide-react'
import { DashboardNavbar } from '../../components/layout/DashboardNavbar'
import { StatCard } from '../../components/ui/StatCard'
import { Badge } from '../../components/ui/Badge'
import { ProcessFlowBanner } from '../../components/ui/ProcessFlowBanner'
import { NotificationPanel } from '../../components/ui/NotificationPanel'
import {
  associationStats,
  recentRequests,
  associationNotifications,
  approvedAssistance,
} from '../../data/associationMockData'
import { associationUser } from '../../components/association/navConfig'

export default function AssociationDashboardPage() {
  return (
    <>
      <DashboardNavbar
        title="Association Dashboard"
        searchPlaceholder="Search members, requests, records..."
        userName={associationUser.name}
        userInitials={associationUser.initials}
        notificationsPath="/association/notifications"
      />
      <main className="flex-1 overflow-y-auto p-4 sm:p-5 md:p-6">
        <ProcessFlowBanner />

        <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="Total Members" value={associationStats.totalMembers} icon={Users} />
          <StatCard label="Pending Requests" value={associationStats.pendingRequests} icon={Clock} />
          <StatCard label="Approved Requests" value={associationStats.approvedRequests} icon={CheckCircle} />
          <StatCard label="Rejected Requests" value={associationStats.rejectedRequests} icon={XCircle} />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 px-5 py-4">
              <h2 className="text-sm font-bold text-gray-900">Recent Requests</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {recentRequests.map((req) => (
                <div key={req.id} className="flex items-center justify-between px-5 py-4">
                  <div>
                    <p className="font-medium text-gray-900">{req.program}</p>
                    <p className="text-xs text-gray-500">{req.date} · {req.members} members</p>
                  </div>
                  <Badge
                    variant={
                      req.status === 'APPROVED'
                        ? 'success'
                        : req.status === 'UNDER REVIEW'
                          ? 'info'
                          : 'neutral'
                    }
                  >
                    {req.status}
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-sm font-bold text-gray-900">Latest Notifications</h2>
            <NotificationPanel notifications={associationNotifications.slice(0, 4)} compact />
          </div>
        </div>

        <div className="mt-6 rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-5 py-4">
            <h2 className="text-sm font-bold text-gray-900">Approved Assistance</h2>
          </div>
          <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3">
            {approvedAssistance.map((item) => (
              <div key={item.id} className="rounded-lg border border-gray-200 p-4">
                <p className="font-bold text-green-800">{item.program}</p>
                <p className="mt-1 text-xs text-gray-500">Approved: {item.approvedDate}</p>
                <p className="text-sm text-gray-600">{item.beneficiaries} beneficiaries</p>
                <div className="mt-2 flex items-center justify-between">
                  <Badge variant="success">{item.status}</Badge>
                  <span className="text-xs text-gray-400">{item.distributionDate}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </>
  )
}
