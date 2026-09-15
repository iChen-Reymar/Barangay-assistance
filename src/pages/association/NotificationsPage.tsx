import { DashboardNavbar } from '../../components/layout/DashboardNavbar'
import { NotificationPanel } from '../../components/ui/NotificationPanel'
import { associationNotifications } from '../../data/associationMockData'
import { associationUser } from '../../components/association/navConfig'

export default function NotificationsPage() {
  return (
    <>
      <DashboardNavbar
        title="Notifications"
        searchPlaceholder="Search notifications..."
        userName={associationUser.name}
        userInitials={associationUser.initials}
      />
      <main className="flex-1 overflow-y-auto p-4 sm:p-5 md:p-6">
        <NotificationPanel notifications={associationNotifications} />
      </main>
    </>
  )
}
