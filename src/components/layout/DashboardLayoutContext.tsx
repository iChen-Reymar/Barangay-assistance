import { createContext, useContext, useState, type ReactNode } from 'react'

interface DashboardLayoutContextValue {
  sidebarOpen: boolean
  openSidebar: () => void
  closeSidebar: () => void
  toggleSidebar: () => void
  settingsPath?: string
}

const DashboardLayoutContext = createContext<DashboardLayoutContextValue | null>(null)

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

export function useDashboardLayout() {
  const ctx = useContext(DashboardLayoutContext)
  if (!ctx) {
    throw new Error('useDashboardLayout must be used within DashboardLayoutProvider')
  }
  return ctx
}
