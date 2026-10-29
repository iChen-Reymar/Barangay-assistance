import { useEffect, useState } from 'react'
import { DashboardNavbar } from '../../components/layout/DashboardNavbar'
import { NotificationPanel } from '../../components/ui/NotificationPanel'
import { useAuth } from '../../context/useAuth'
import { useAssociationDisplayUser } from '../../hooks/useAssociationDisplayUser'
import {
  getAssociationNotifications,
  markAssociationNotificationsRead,
  resolveAssociationViewer,
  subscribeAssociationNotifications,
  type AssociationNotification,
} from '../../services/associationNotificationStorage'

export default function NotificationsPage() {
  const { profile, user } = useAuth()
  const displayUser = useAssociationDisplayUser()
  const viewer = resolveAssociationViewer({
    id: profile?.id ?? user?.id,
    associationName: profile?.associationName,
  })
  const associationName = viewer.associationName
  const [notifications, setNotifications] = useState<AssociationNotification[]>(() =>
    getAssociationNotifications(associationName, viewer.userId),
  )

  useEffect(() => {
    markAssociationNotificationsRead(associationName, viewer.userId)
    const refresh = () => setNotifications(getAssociationNotifications(associationName, viewer.userId))
    refresh()
    return subscribeAssociationNotifications(refresh)
  }, [associationName, viewer.userId])

  return (
    <>
      <DashboardNavbar
        title="Notifications"
        searchPlaceholder="Search notifications..."
        userName={displayUser.name}
        userInitials={displayUser.initials}
        notificationsPath="/association/notifications"
      />
      <main className="flex-1 overflow-y-auto p-4 sm:p-5 md:p-6">
        <NotificationPanel notifications={notifications} />
      </main>
    </>
  )
}
