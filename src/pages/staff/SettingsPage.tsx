import { DashboardNavbar } from '../../components/layout/DashboardNavbar'
import { UserProfileSection } from '../../components/profile/UserProfileSection'
import { useAuth } from '../../context/AuthContext'
import { getInitials } from '../../utils/userDisplay'

const settingsTabs = ['Profile', 'Notifications', 'Security', 'About']

export default function StaffSettingsPage() {
  const { user, profile } = useAuth()

  if (!user || !profile) {
    return null
  }

  const initials = getInitials(profile.fullName)

  return (
    <>
      <DashboardNavbar
        title="System Settings & Configuration"
        searchPlaceholder="Search settings, user accounts..."
        userName={profile.fullName}
        userInitials={initials}
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

          <div className="grid flex-1 gap-6 lg:grid-cols-2">
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <UserProfileSection profile={profile} />
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-base font-bold text-gray-900">System Information</h2>
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-[10px] font-semibold uppercase text-gray-400">System Name</dt>
                  <dd className="mt-0.5 text-gray-900">AI-Enhanced Barangay Assistance Matching System</dd>
                </div>
                <div>
                  <dt className="text-[10px] font-semibold uppercase text-gray-400">Version</dt>
                  <dd className="mt-0.5 text-gray-900">1.2.0</dd>
                </div>
                <div>
                  <dt className="text-[10px] font-semibold uppercase text-gray-400">Barangay Location</dt>
                  <dd className="mt-0.5 text-gray-900">Buru-un, Iligan City</dd>
                </div>
              </dl>

              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <span className="h-2 w-2 rounded-full bg-green-500" />
                  <span className="text-gray-700">Database Status: Connected</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="h-2 w-2 rounded-full bg-green-500" />
                  <span className="text-gray-700">AI Module Status: Active</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
