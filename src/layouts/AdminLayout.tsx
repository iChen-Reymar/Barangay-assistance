import { useEffect } from 'react'
import DashboardLayout from '../components/layout/DashboardLayout'
import { useAuth } from '../context/useAuth'
import { navItems } from '../components/admin/navConfig'
import { getInitials } from '../utils/userDisplay'
import { authenticatedFetch } from '../services/authenticatedFetch'

const CLAIMS_BACKFILL_KEY = 'barangay_auth_claims_backfill_requested'
let claimsBackfillStarted = false

export default function AdminLayout() {
  const { user, profile } = useAuth()

  const sidebarUser = {
    initials: getInitials(profile?.fullName ?? user?.fullName ?? 'Admin'),
    name: profile?.fullName ?? user?.fullName ?? 'Admin',
    role: profile?.roleLabel ?? user?.roleLabel ?? 'Authorized User',
  }

  useEffect(() => {
    if (claimsBackfillStarted || sessionStorage.getItem(CLAIMS_BACKFILL_KEY)) return
    claimsBackfillStarted = true
    void authenticatedFetch('/api/users/backfill-auth-claims', { method: 'POST' })
      .then((response) => {
        if (response.ok) sessionStorage.setItem(CLAIMS_BACKFILL_KEY, 'true')
        else claimsBackfillStarted = false
      })
      .catch(() => {
        claimsBackfillStarted = false
      })
  }, [])

  return (
    <DashboardLayout
      navItems={navItems}
      user={sidebarUser}
      logoutPath="/login"
      settingsPath="/admin/settings"
    />
  )
}
