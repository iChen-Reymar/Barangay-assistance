import { useEffect, useState } from 'react'
import { Users, Clock, CheckCircle, XCircle, FileText, GitBranch, Sparkles, Package, Bell, ClipboardCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import { DashboardNavbar } from '../../components/layout/DashboardNavbar'
import { StatCard } from '../../components/ui/StatCard'
import { Badge } from '../../components/ui/Badge'
import { NotificationPanel } from '../../components/ui/NotificationPanel'
import { associationStats, associationNotifications } from '../../data/associationMockData'
import { useAuth } from '../../context/AuthContext'
import { getInitials } from '../../utils/userDisplay'
import { getAssociationDetails } from '../../services/memberStorage'
import {
  getAssociationAssistanceItems,
  subscribeDecisionStorage,
} from '../../services/decisionStorage'
import type { ReviewableAssistanceItem } from '../../types/approval'
import type { RequestStatus } from '../../data/mockData'

function statusVariant(status: RequestStatus) {
  if (status === 'APPROVED') return 'success' as const
  if (status === 'REJECTED') return 'danger' as const
  if (status === 'UNDER REVIEW') return 'info' as const
  if (status === 'PENDING') return 'warning' as const
  return 'neutral' as const
}

function approvedOn(item: ReviewableAssistanceItem) {
  const decision = [...item.decisions].reverse().find((entry) => entry.newStatus === 'APPROVED')
  if (!decision) return item.date
  return new Date(decision.decidedAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function AssociationDashboardPage() {
  const { user, profile } = useAuth()
  const displayName = profile?.fullName ?? user?.fullName ?? 'Association Head'
  const initials = getInitials(displayName)
  const associationName = profile?.associationName ?? getAssociationDetails().name
  const [requests, setRequests] = useState<ReviewableAssistanceItem[]>(() =>
    getAssociationAssistanceItems(associationName),
  )

  useEffect(() => {
    const refresh = () => setRequests(getAssociationAssistanceItems(associationName))
    refresh()
    return subscribeDecisionStorage(refresh)
  }, [associationName])

  const pendingCount = requests.filter(
    (item) => item.status === 'PENDING' || item.status === 'UNDER REVIEW',
  ).length
  const approvedItems = requests.filter((item) => item.status === 'APPROVED')
  const rejectedCount = requests.filter((item) => item.status === 'REJECTED').length
  const recent = requests.slice(0, 4)

  return (
    <>
      <DashboardNavbar
        title="Association Head Dashboard"
        searchPlaceholder="Search members, requests, records..."
        userName={displayName}
        userInitials={initials}
        notificationsPath="/association/notifications"
      />
      <main className="flex-1 overflow-y-auto p-4 sm:p-5 md:p-6">
        <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { to: '/association/members', label: 'Manage Association Members', icon: Users },
            { to: '/association/assistance-request', label: 'Submit Assistance Request', icon: FileText },
            { to: '/association/request-status', label: 'Track Request Status', icon: GitBranch },
            { to: '/association/ai-recommendations', label: 'View AI Recommendations', icon: Sparkles },
            { to: '/association/aid-records', label: 'Submit Aid Records', icon: Package },
            { to: '/association/notifications', label: 'Notifications', icon: Bell },
            { to: '/association/approved-requests', label: 'View AI-Generated Recommendation', icon: ClipboardCheck },
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
        <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="Total Members" value={associationStats.totalMembers} icon={Users} />
          <StatCard label="Pending Requests" value={pendingCount} icon={Clock} />
          <StatCard label="AI Generated" value={approvedItems.length} icon={CheckCircle} />
          <StatCard label="Not Qualified" value={rejectedCount} icon={XCircle} />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 px-5 py-4">
              <h2 className="text-sm font-bold text-gray-900">Recent Requests</h2>
            </div>
            {recent.length === 0 ? (
              <p className="px-5 py-6 text-sm text-gray-500">No assistance requests yet.</p>
            ) : (
              <div className="divide-y divide-gray-100">
                {recent.map((req) => (
                  <div key={req.id} className="flex items-center justify-between gap-3 px-5 py-4">
                    <div>
                      <p className="font-medium text-gray-900">{req.requestType}</p>
                      <p className="text-xs text-gray-500">
                        {req.date}
                        {req.details?.memberCount ? ` · ${req.details.memberCount} members` : ''}
                      </p>
                    </div>
                    <Badge variant={statusVariant(req.status)}>{req.status}</Badge>
                  </div>
                ))}
              </div>
            )}
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
          {approvedItems.length === 0 ? (
            <p className="px-5 py-6 text-sm text-gray-500">
              Approved requests from barangay staff will appear here.
            </p>
          ) : (
            <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3">
              {approvedItems.map((item) => (
                <div key={item.id} className="rounded-lg border border-gray-200 p-4">
                  <p className="font-bold text-green-800">{item.requestType}</p>
                  <p className="mt-1 text-xs text-gray-500">Approved: {approvedOn(item)}</p>
                  <p className="text-sm text-gray-600">
                    {item.details?.memberCount ?? '—'} members
                  </p>
                  <div className="mt-2">
                    <Badge variant="success">APPROVED</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  )
}
