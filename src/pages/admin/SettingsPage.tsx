import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AdminHeader } from '../../components/admin/AdminHeader'
import { UserProfileSection } from '../../components/profile/UserProfileSection'
import { useAuth } from '../../context/AuthContext'
import { formatDate } from '../../services/authStorage'

const settingsTabs = [
  'Profile',
  'User Management',
  'System Settings',
  'Notifications',
  'Security',
  'About',
]

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('Profile')
  const { user, profile, allUsers } = useAuth()
  const approvedUsers = allUsers.filter((u) => u.status === 'approved')

  if (!user || !profile) {
    return null
  }

  return (
    <>
      <AdminHeader title="System Settings & Configuration" searchPlaceholder="Search settings, user accounts..." />
      <main className="flex-1 overflow-y-auto p-4 sm:p-5 md:p-6">
        <div className="flex flex-col gap-6 lg:flex-row">
          <nav className="flex shrink-0 flex-row gap-1 overflow-x-auto lg:w-48 lg:flex-col">
            {settingsTabs.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`whitespace-nowrap rounded-lg px-4 py-2.5 text-left text-sm font-medium transition ${
                  activeTab === tab
                    ? 'bg-green-50 text-primary'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>

          <div className="flex-1 space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                <UserProfileSection profile={profile} />
              </div>

              <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-base font-bold text-gray-900">System Information</h2>
                <dl className="space-y-3 text-sm">
                  {[
                    ['System Name', 'AI-Enhanced Barangay Assistance Matching System'],
                    ['Version', '1.2.0'],
                    ['Barangay Location', 'Buru-un, Iligan City'],
                    ['Last System Update', 'August 5, 2026'],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <dt className="text-[10px] font-semibold uppercase text-gray-400">{label}</dt>
                      <dd className="mt-0.5 text-gray-900">{value}</dd>
                    </div>
                  ))}
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

                <div className="mt-6">
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="text-gray-600">Total Storage Used</span>
                    <span className="font-medium text-gray-900">2.4 GB / 10 GB</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-gray-200">
                    <div className="h-full w-[24%] rounded-full bg-primary" />
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-5 py-4">
                <h2 className="text-base font-bold text-gray-900">Registered System Users</h2>
                <Link
                  to="/admin/access-requests"
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark"
                >
                  Manage Access Requests
                </Link>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
                      <th className="px-4 py-3">Name</th>
                      <th className="px-4 py-3">Role</th>
                      <th className="px-4 py-3">Email</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {approvedUsers.map((account) => (
                      <tr key={account.id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">{account.fullName}</td>
                        <td className="px-4 py-3 text-gray-600">{account.roleLabel}</td>
                        <td className="px-4 py-3 text-gray-600">{account.email}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-semibold text-green-700">
                            ACTIVE
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-500">
                          {account.approvedAt ? formatDate(account.approvedAt) : formatDate(account.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
