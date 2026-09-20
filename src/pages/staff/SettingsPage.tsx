import { useState } from 'react'
import { DashboardNavbar } from '../../components/layout/DashboardNavbar'
import { PrivacyNoticePanel } from '../../components/settings/PrivacyNoticePanel'
import { UserProfileSection } from '../../components/profile/UserProfileSection'
import { useAuth } from '../../context/AuthContext'
import { getInitials } from '../../utils/userDisplay'

const settingsTabs = ['Profile', 'Privacy', 'Security', 'About'] as const

export default function StaffSettingsPage() {
  const [activeTab, setActiveTab] = useState<(typeof settingsTabs)[number]>('Profile')
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
            {settingsTabs.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`whitespace-nowrap rounded-lg px-4 py-2.5 text-left text-sm font-medium transition ${
                  activeTab === tab ? 'bg-green-50 text-primary' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>

          <div className="flex-1 space-y-6">
            {activeTab === 'Profile' && (
              <div className="grid gap-6 lg:grid-cols-2">
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
                      <dt className="text-[10px] font-semibold uppercase text-gray-400">Barangay Location</dt>
                      <dd className="mt-0.5 text-gray-900">Buru-un, Iligan City</dd>
                    </div>
                  </dl>
                </div>
              </div>
            )}
            {activeTab === 'Privacy' && <PrivacyNoticePanel />}
            {activeTab === 'Security' && (
              <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="mb-2 text-base font-bold text-gray-900">Security</h2>
                <p className="text-sm text-gray-600">
                  Use the profile panel to change your password. Contact the administrator if you
                  suspect unauthorized access to your account.
                </p>
              </div>
            )}
            {activeTab === 'About' && (
              <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="mb-2 text-base font-bold text-gray-900">About</h2>
                <p className="text-sm text-gray-600">
                  Barangay assistance matching portal for authorized staff users.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  )
}
