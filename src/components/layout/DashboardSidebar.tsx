import type { LucideIcon } from 'lucide-react'
import { LogOut, X } from 'lucide-react'
import { NavLink, useNavigate } from 'react-router-dom'
import { BarangayLogo } from '../BarangayLogo'
import { useAuth } from '../../context/AuthContext'
import { useDashboardLayout } from './DashboardLayoutContext'

export interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  end?: boolean
}

interface DashboardSidebarProps {
  navItems: NavItem[]
  user: { initials: string; name: string; role: string }
  logoutPath?: string
  settingsPath?: string
}

export function DashboardSidebar({
  navItems,
  user,
  logoutPath = '/login',
  settingsPath,
}: DashboardSidebarProps) {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const { sidebarOpen, closeSidebar } = useDashboardLayout()

  function handleLogout() {
    logout()
    navigate(logoutPath)
  }

  return (
    <>
      {sidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={closeSidebar}
          aria-label="Close sidebar"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-screen w-64 flex-col bg-[#1a472a] text-white transition-transform duration-200 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="border-b border-white/10 px-4 py-5 text-center">
          <div className="flex items-center justify-between lg:justify-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center">
              <BarangayLogo className="h-16 w-16" alt="" />
            </div>
            <button
              type="button"
              onClick={closeSidebar}
              className="rounded-lg p-1 text-white/70 hover:bg-white/10 lg:hidden"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <h2 className="text-sm font-bold tracking-wide">BARANGAY ASSISTANCE</h2>
          <p className="mt-1 text-[10px] text-white/70">Barangay Buru-un, Iligan City</p>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={closeSidebar}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? 'bg-white/15 text-white'
                    : 'text-white/75 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-white/10 p-4">
          {settingsPath ? (
            <NavLink
              to={settingsPath}
              onClick={closeSidebar}
              className="mb-3 flex items-center gap-3 rounded-lg px-1 py-1 transition hover:bg-white/10"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-sm font-bold">
                {user.initials}
              </div>
              <div>
                <p className="text-sm font-semibold">{user.name}</p>
                <p className="text-[10px] text-white/60">{user.role}</p>
              </div>
            </NavLink>
          ) : (
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-sm font-bold">
                {user.initials}
              </div>
              <div>
                <p className="text-sm font-semibold">{user.name}</p>
                <p className="text-[10px] text-white/60">{user.role}</p>
              </div>
            </div>
          )}
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm text-white/70 transition hover:bg-white/10 hover:text-white"
          >
            <LogOut className="h-4 w-4" />
            Logout System
          </button>
        </div>
      </aside>
    </>
  )
}
