import { Outlet } from 'react-router-dom'
import { DashboardLayoutProvider } from './DashboardLayoutContext'
import { DashboardSidebar, type NavItem } from './DashboardSidebar'

interface DashboardLayoutProps {
  navItems: NavItem[]
  user: { initials: string; name: string; role: string }
  logoutPath?: string
  settingsPath?: string
}

export default function DashboardLayout({ navItems, user, logoutPath, settingsPath }: DashboardLayoutProps) {
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
      </div>
    </DashboardLayoutProvider>
  )
}
