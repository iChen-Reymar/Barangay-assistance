import DashboardLayout from '../components/layout/DashboardLayout'
import { useAuth } from '../context/AuthContext'
import { navItems } from '../components/admin/navConfig'
import { getInitials } from '../utils/userDisplay'

export default function AdminLayout() {
  const { user, profile } = useAuth()

  const sidebarUser = {
    initials: getInitials(profile?.fullName ?? user?.fullName ?? 'Admin'),
    name: profile?.fullName ?? user?.fullName ?? 'Admin',
    role: profile?.roleLabel ?? user?.roleLabel ?? 'Authorized User',
  }

  return (
    <DashboardLayout
      navItems={navItems}
      user={sidebarUser}
      logoutPath="/login"
      settingsPath="/admin/settings"
    />
  )
}
