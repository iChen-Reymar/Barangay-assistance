import { DashboardNavbar } from '../../components/layout/DashboardNavbar'
import { NotificationPanel } from '../../components/ui/NotificationPanel'
import { associationNotifications } from '../../data/associationMockData'
import { useAssociationDisplayUser } from '../../hooks/useAssociationDisplayUser'

export default function NotificationsPage() {
  const displayUser = useAssociationDisplayUser()

  return (
    <>
      <DashboardNavbar
        title="Notifications"
        searchPlaceholder="Search notifications..."
        userName={displayUser.name}
        userInitials={displayUser.initials}
      />
      <main className="flex-1 overflow-y-auto p-4 sm:p-5 md:p-6">
        <NotificationPanel notifications={associationNotifications} />
      </main>
    </>
  )
}
