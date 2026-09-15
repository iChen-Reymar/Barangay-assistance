import { Bell, Menu } from 'lucide-react'
import { Link } from 'react-router-dom'
import { SearchBar } from '../ui/SearchBar'
import { useDashboardLayout } from './DashboardLayoutContext'

interface DashboardNavbarProps {
  title: string
  searchPlaceholder?: string
  userName: string
  userInitials: string
  notificationsPath?: string
  notificationCount?: number
}

export function DashboardNavbar({
  title,
  searchPlaceholder = 'Search...',
  userName,
  userInitials,
  notificationsPath,
  notificationCount = 0,
}: DashboardNavbarProps) {
  const { toggleSidebar, settingsPath } = useDashboardLayout()

  return (
    <header className="sticky top-0 z-10 border-b border-gray-200 bg-white">
      <div className="flex items-center gap-2 px-3 py-3 sm:gap-3 sm:px-4 sm:py-4 md:px-6">
        <button
          type="button"
          onClick={toggleSidebar}
          className="shrink-0 rounded-lg p-2 text-gray-600 hover:bg-gray-100 lg:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <h1 className="min-w-0 flex-1 truncate text-sm font-bold text-gray-900 sm:text-base md:text-lg">
          {title}
        </h1>

        <div className="hidden max-w-md flex-1 md:block">
          <SearchBar placeholder={searchPlaceholder} />
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2 md:gap-3">
          {notificationsPath && (
            <Link
              to={notificationsPath}
              className="relative rounded-lg p-2 text-gray-500 hover:bg-gray-100"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" />
              {notificationCount > 0 && (
                <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                  {notificationCount > 9 ? '9+' : notificationCount}
                </span>
              )}
            </Link>
          )}
          {settingsPath ? (
            <Link
              to={settingsPath}
              className="flex items-center gap-2 rounded-lg border border-gray-200 px-2 py-1.5 transition hover:bg-gray-50 md:px-3"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                {userInitials}
              </div>
              <span className="hidden max-w-[8rem] truncate text-sm font-medium text-gray-700 sm:inline md:max-w-none">
                {userName}
              </span>
            </Link>
          ) : (
            <div className="flex items-center gap-2 rounded-lg border border-gray-200 px-2 py-1.5 md:px-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                {userInitials}
              </div>
              <span className="hidden max-w-[8rem] truncate text-sm font-medium text-gray-700 sm:inline md:max-w-none">
                {userName}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-gray-100 px-3 pb-3 md:hidden">
        <SearchBar placeholder={searchPlaceholder} />
      </div>
    </header>
  )
}
