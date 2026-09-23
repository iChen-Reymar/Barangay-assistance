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

  return (
    <DashboardNavbar
      title={title}
      searchPlaceholder={searchPlaceholder}
      userName={displayName}
      userInitials={initials}
      notificationsPath="/admin/access-requests"
      notificationCount={pendingRequests.length}
    />
  )
}
