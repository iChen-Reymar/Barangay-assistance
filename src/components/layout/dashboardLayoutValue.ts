import { createContext } from 'react'

/**
 * Context for the dashboard shell - sidebar state and the settings link.
 *
 * Held in its own module so the provider component and the consuming hook can
 * live in separate files. React Fast Refresh can only preserve edits when a
 * file exports components alone, so mixing a provider and a hook in one module
 * means editing either one throws away the other's state.
 */
export interface DashboardLayoutContextValue {
  sidebarOpen: boolean
  openSidebar: () => void
  closeSidebar: () => void
  toggleSidebar: () => void
  settingsPath?: string
}

export const DashboardLayoutContext = createContext<DashboardLayoutContextValue | null>(null)
