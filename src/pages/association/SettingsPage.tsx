import { useState } from 'react'
import { DashboardNavbar } from '../../components/layout/DashboardNavbar'
import { PrivacyNoticePanel } from '../../components/settings/PrivacyNoticePanel'
import { UserProfileSection } from '../../components/profile/UserProfileSection'
import { useAuth } from '../../context/AuthContext'
import { getInitials } from '../../utils/userDisplay'

const settingsTabs = ['Profile', 'Privacy', 'Security', 'About'] as const

export default function AssociationSettingsPage() {
  const [activeTab, setActiveTab] = useState<(typeof settingsTabs)[number]>('Profile')
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

          <div className="mx-auto w-full max-w-2xl space-y-6">
            {activeTab === 'Profile' && (
              <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                <UserProfileSection profile={profile} layout="centered" showRoleBadge />
              </div>
            )}
            {activeTab === 'Privacy' && <PrivacyNoticePanel />}
            {activeTab === 'Security' && (
              <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="mb-2 text-base font-bold text-gray-900">Security</h2>
                <p className="text-sm text-gray-600">
                  Change your password from the profile section. Member and association data is
                  protected under barangay privacy policy.
                </p>
              </div>
            )}
            {activeTab === 'About' && (
              <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="mb-2 text-base font-bold text-gray-900">About</h2>
                <p className="text-sm text-gray-600">
                  Association portal for managing members and submitting assistance requests.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  )
}
