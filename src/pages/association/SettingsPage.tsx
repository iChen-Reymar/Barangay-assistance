import { DashboardNavbar } from '../../components/layout/DashboardNavbar'
import { UserProfileSection } from '../../components/profile/UserProfileSection'
import { useAuth } from '../../context/AuthContext'
import { getInitials } from '../../utils/userDisplay'

const settingsTabs = ['Profile', 'Notifications', 'Security', 'About']

export default function AssociationSettingsPage() {
  const { user, profile } = useAuth()

  if (!user || !profile) {
    return null
  }

  const initials = getInitials(profile.fullName)

  return (
    <>
      <DashboardNavbar
        title="Settings"
        searchPlaceholder="Search settings..."
        userName={profile.fullName}
        userInitials={initials}
        notificationsPath="/association/notifications"
      />
      <main className="flex-1 overflow-y-auto p-4 sm:p-5 md:p-6">
        <div className="flex flex-col gap-6 lg:flex-row">
          <nav className="flex shrink-0 flex-row gap-1 overflow-x-auto lg:w-48 lg:flex-col">
            {settingsTabs.map((tab, i) => (
              <button
                key={tab}
                type="button"
                className={`whitespace-nowrap rounded-lg px-4 py-2.5 text-left text-sm font-medium transition ${
                  i === 0 ? 'bg-green-50 text-primary' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>

          <div className="mx-auto w-full max-w-2xl">
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <UserProfileSection profile={profile} layout="centered" showRoleBadge />
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
