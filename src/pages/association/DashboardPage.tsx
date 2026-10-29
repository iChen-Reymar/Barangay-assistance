import { useEffect, useState } from 'react'
import { Users, Clock, CheckCircle, XCircle } from 'lucide-react'
import { DashboardNavbar } from '../../components/layout/DashboardNavbar'
import { StatCard } from '../../components/ui/StatCard'
import { Badge } from '../../components/ui/Badge'
import { NotificationPanel } from '../../components/ui/NotificationPanel'
import { useAuth } from '../../context/useAuth'
import {
  getAssociationNotifications,
  resolveAssociationViewer,
  subscribeAssociationNotifications,
} from '../../services/associationNotificationStorage'
import { getAssociationDetails, getAssociationMembers, subscribeMemberStorage } from '../../services/memberStorage'
import {
  getAssociationAssistanceItems,
  subscribeDecisionStorage,
} from '../../services/decisionStorage'
import type { ReviewableAssistanceItem } from '../../types/approval'
import type { RequestStatus } from '../../data/mockData'
import { useAssociationDisplayUser } from '../../hooks/useAssociationDisplayUser'

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
  const { profile, user } = useAuth()
  const displayUser = useAssociationDisplayUser()
  const viewer = resolveAssociationViewer({
    id: profile?.id ?? user?.id,
    associationName: profile?.associationName,
  })
  const associationName = viewer.associationName || (profile?.associationName ?? getAssociationDetails().name)
  const [notifications, setNotifications] = useState(() =>
    getAssociationNotifications(associationName, viewer.userId).slice(0, 4),
  )
  const [requests, setRequests] = useState<ReviewableAssistanceItem[]>(() =>
    getAssociationAssistanceItems(associationName),
  )
  const [memberCount, setMemberCount] = useState(() =>
    getAssociationMembers(associationName).length,
  )

  useEffect(() => {
    const refresh = () => setRequests(getAssociationAssistanceItems(associationName))
    refresh()
    const stopRequests = subscribeDecisionStorage(refresh)
    const stopMembers = subscribeMemberStorage(() =>
      setMemberCount(getAssociationMembers(associationName).length),
    )
    const refreshNotifications = () =>
      setNotifications(getAssociationNotifications(associationName, viewer.userId).slice(0, 4))
    refreshNotifications()
    const stopNotifications = subscribeAssociationNotifications(refreshNotifications)
    return () => {
      stopRequests()
      stopMembers()
      stopNotifications()
    }
  }, [associationName, viewer.userId])

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
        userName={displayUser.name}
        userInitials={displayUser.initials}
        notificationsPath="/association/notifications"
      />
      <main className="flex-1 overflow-y-auto p-4 sm:p-5 md:p-6">
        <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="Total Members" value={memberCount} icon={Users} />
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
                        {req.details?.memberCount ? ` Â· ${req.details.memberCount} members` : ''}
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
            <NotificationPanel notifications={notifications} compact />
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
                    {item.details?.memberCount ?? 'â€”'} members
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
