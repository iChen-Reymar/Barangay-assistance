import { useState, type ReactNode } from 'react'
import {
  DashboardLayoutContext,
  type DashboardLayoutContextValue,
} from './dashboardLayoutValue'

export function DashboardLayoutProvider({
  children,
  settingsPath,
}: {
  children: ReactNode
  settingsPath?: string
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const value: DashboardLayoutContextValue = {
    sidebarOpen,
    openSidebar: () => setSidebarOpen(true),
    closeSidebar: () => setSidebarOpen(false),
    toggleSidebar: () => setSidebarOpen((prev) => !prev),
    settingsPath,
  }

  return (
    <DashboardLayoutContext.Provider value={value}>{children}</DashboardLayoutContext.Provider>
  )
}
