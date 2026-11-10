import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { DashboardLayoutProvider } from './DashboardLayoutContext'
import { DashboardSidebar, type NavItem } from './DashboardSidebar'
import { pullFromDatabase } from '../../services/databaseSync'
import { SyncStatusIndicator } from './SyncStatusIndicator'

interface DashboardLayoutProps {
  navItems: NavItem[]
  user: { initials: string; name: string; role: string }
  logoutPath?: string
  settingsPath?: string
}

export default function DashboardLayout({ navItems, user, logoutPath, settingsPath }: DashboardLayoutProps) {
  useEffect(() => {
    let active = true
    let refreshing = false
    const refresh = async () => {
      if (!active || refreshing) return
      refreshing = true
      try {
        await pullFromDatabase()
      } finally {
        refreshing = false
      }
    }
    const onFocus = () => void refresh()
    const onVisibility = () => {
      if (document.visibilityState === 'visible') void refresh()
    }
    void refresh()
    const interval = window.setInterval(() => void refresh(), 15000)
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      active = false
      window.clearInterval(interval)
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  return (
    <DashboardLayoutProvider settingsPath={settingsPath}>
      <div className="h-screen overflow-hidden bg-gray-50">
        <DashboardSidebar
          navItems={navItems}
          user={user}
          logoutPath={logoutPath}
          settingsPath={settingsPath}
        />
        <div className="flex h-screen min-w-0 flex-col overflow-hidden lg:ml-64">
          <Outlet />
        </div>
        <SyncStatusIndicator />
      </div>
    </DashboardLayoutProvider>
  )
}
