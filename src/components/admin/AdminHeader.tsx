import { DashboardNavbar } from '../layout/DashboardNavbar'
import { useAuth } from '../../context/AuthContext'
import { getInitials } from '../../utils/userDisplay'

interface AdminHeaderProps {
  title: string
  searchPlaceholder?: string
}

export function AdminHeader({
  title,
  searchPlaceholder = 'Search requests, associations, beneficiaries...',
}: AdminHeaderProps) {
  const { profile, user, pendingRequests } = useAuth()

  const displayName = profile?.fullName ?? user?.fullName ?? 'Admin'
  const initials = getInitials(displayName)
  const hasAccessRequests = pendingRequests.length > 0

  return (
    <DashboardNavbar
      title={title}
      searchPlaceholder={searchPlaceholder}
      userName={displayName}
      userInitials={initials}
      notificationsPath={hasAccessRequests ? '/admin/access-requests' : undefined}
      notificationCount={pendingRequests.length}
    />
  )
}
