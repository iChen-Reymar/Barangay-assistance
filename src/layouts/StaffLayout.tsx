import DashboardLayout from '../components/layout/DashboardLayout'
import { staffNavItems } from '../components/staff/navConfig'
import { useAuth } from '../context/AuthContext'
import { getInitials } from '../utils/userDisplay'

export default function StaffLayout() {
  const { user, profile } = useAuth()

  const sidebarUser = {
    initials: getInitials(profile?.fullName ?? user?.fullName ?? 'Staff'),
    name: profile?.fullName ?? user?.fullName ?? 'Staff',
    role: profile?.roleLabel ?? user?.roleLabel ?? 'Barangay Staff',
  }

  return (
    <DashboardLayout
      navItems={staffNavItems}
      user={sidebarUser}
      logoutPath="/login"
      settingsPath="/staff/settings"
    />
  )
}
