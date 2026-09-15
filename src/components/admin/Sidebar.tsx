import { LogOut } from 'lucide-react'
import { NavLink, useNavigate } from 'react-router-dom'
import { BarangayLogo } from '../BarangayLogo'
import { navItems } from './navConfig'

export function Sidebar() {
  const navigate = useNavigate()

  return (
    <aside className="flex w-64 shrink-0 flex-col bg-[#1a472a] text-white">
      <div className="border-b border-white/10 px-4 py-5 text-center">
        <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center">
          <BarangayLogo className="h-16 w-16" alt="" />
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
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-sm font-bold">
            A
          </div>
          <div>
            <p className="text-sm font-semibold">Admin</p>
            <p className="text-[10px] text-white/60">Authorized User</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => navigate('/login')}
          className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm text-white/70 transition hover:bg-white/10 hover:text-white"
        >
          <LogOut className="h-4 w-4" />
          Logout System
        </button>
      </div>
    </aside>
  )
}
