import { useContext } from 'react'
import { DashboardLayoutContext } from './dashboardLayoutValue'

export function useDashboardLayout() {
  const ctx = useContext(DashboardLayoutContext)
  if (!ctx) {
    throw new Error('useDashboardLayout must be used within DashboardLayoutProvider')
  }
  return ctx
}
