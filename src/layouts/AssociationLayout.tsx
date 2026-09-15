import DashboardLayout from '../components/layout/DashboardLayout'
import { associationNavItems } from '../components/association/navConfig'
import { useAuth } from '../context/AuthContext'
import { getInitials } from '../utils/userDisplay'

export default function AssociationLayout() {
  const { user, profile } = useAuth()

  const sidebarUser = {
    initials: getInitials(profile?.fullName ?? user?.fullName ?? 'Member'),
    name: profile?.fullName ?? user?.fullName ?? 'Member',
    role: profile?.roleLabel ?? user?.roleLabel ?? 'Association Head',
  }

  return (
    <DashboardLayout
      navItems={associationNavItems}
      user={sidebarUser}
      logoutPath="/login"
      settingsPath="/association/settings"
    />
  )
}
