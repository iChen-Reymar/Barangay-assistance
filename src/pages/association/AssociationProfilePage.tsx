import { useEffect, useState, type FormEvent } from 'react'
import { Building2, Pencil, Save, X } from 'lucide-react'
import { DashboardNavbar } from '../../components/layout/DashboardNavbar'
import { ActiveBadge } from '../../components/admin/StatusBadge'
import { Button } from '../../components/ui/Button'
import { associationTypes } from '../../data/mockData'
import type { AssociationDetails } from '../../data/associationMockData'
import {
  getAssociationDetails,
  saveAssociationDetails,
  subscribeMemberStorage,
} from '../../services/memberStorage'
import { useAuth } from '../../context/AuthContext'
import { getInitials } from '../../utils/userDisplay'

export default function AssociationProfilePage() {
  const { user, profile } = useAuth()
  const displayName = profile?.fullName ?? user?.fullName ?? 'Association Head'
  const initials = getInitials(displayName)

  const [details, setDetails] = useState<AssociationDetails>(() => getAssociationDetails())
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<AssociationDetails>(() => getAssociationDetails())
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setDetails(getAssociationDetails())
    return subscribeMemberStorage(() => setDetails(getAssociationDetails()))
  }, [])

  function startEdit() {
    setForm(details)
    setEditing(true)
    setError('')
    setSaved(false)
  }

  function cancelEdit() {
    setForm(details)
    setEditing(false)
    setError('')
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!form.contactPerson.trim() || !form.contactNumber.trim() || !form.email.trim()) {
      setError('Contact person, number, and email are required.')
      return
    }
    const updated = saveAssociationDetails({
      ...form,
      contactPerson: form.contactPerson.trim(),
      contactNumber: form.contactNumber.trim(),
      email: form.email.trim(),
      address: form.address.trim(),
      description: form.description.trim(),
    })
    setDetails(updated)
    setEditing(false)
    setSaved(true)
  }

  return (
    <>
      <DashboardNavbar
        title="My Association"
        searchPlaceholder="Search association details..."
        userName={displayName}
        userInitials={initials}
        notificationsPath="/association/notifications"
      />
      <main className="flex-1 overflow-y-auto p-4 sm:p-5 md:p-6">
        <div className="mx-auto max-w-3xl">
          {saved && !editing && (
            <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
              Association profile updated successfully.
            </div>
          )}

          <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="font-bold text-gray-900">{details.name}</h2>
                  <p className="text-xs text-gray-500">{details.registrationNumber}</p>
                </div>
              </div>
              {!editing ? (
                <Button variant="outline" size="sm" onClick={startEdit}>
                  <Pencil className="h-4 w-4" />
                  Edit Profile
                </Button>
              ) : (
                <Button variant="outline" size="sm" onClick={cancelEdit}>
                  <X className="h-4 w-4" />
                  Cancel
                </Button>
              )}
            </div>

            {!editing ? (
              <div className="space-y-4 p-5">
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-600">
                    {details.type}
                  </span>
                  <ActiveBadge status={details.status} />
                </div>

                <p className="text-sm text-gray-600">{details.description}</p>

                <dl className="grid gap-4 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-[10px] font-semibold uppercase text-gray-400">
                      Contact Person
                    </dt>
                    <dd className="mt-0.5 text-gray-900">{details.contactPerson}</dd>
                  </div>
                  <div>
                    <dt className="text-[10px] font-semibold uppercase text-gray-400">
                      Contact Number
                    </dt>
                    <dd className="mt-0.5 text-gray-900">{details.contactNumber}</dd>
                  </div>
                  <div>
                    <dt className="text-[10px] font-semibold uppercase text-gray-400">Email</dt>
                    <dd className="mt-0.5 text-gray-900">{details.email}</dd>
                  </div>
                  <div>
                    <dt className="text-[10px] font-semibold uppercase text-gray-400">
                      Total Members
                    </dt>
                    <dd className="mt-0.5 text-gray-900">{details.totalMembers}</dd>
                  </div>
                  <div>
                    <dt className="text-[10px] font-semibold uppercase text-gray-400">
                      Date Registered
                    </dt>
                    <dd className="mt-0.5 text-gray-900">{details.dateRegistered}</dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="text-[10px] font-semibold uppercase text-gray-400">Address</dt>
                    <dd className="mt-0.5 text-gray-900">{details.address}</dd>
                  </div>
                </dl>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 p-5">
                {error && (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {error}
                  </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-xs font-semibold uppercase text-gray-500">
                      Association Name
                    </label>
                    <input
                      value={form.name}
                      disabled
                      className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase text-gray-500">
                      Type
                    </label>
                    <select
                      value={form.type}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          type: e.target.value as AssociationDetails['type'],
                        }))
                      }
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      {associationTypes.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase text-gray-500">
                      Total Members
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={form.totalMembers}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          totalMembers: Number(e.target.value) || 1,
                        }))
                      }
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase text-gray-500">
                      Contact Person
                    </label>
                    <input
                      required
                      value={form.contactPerson}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, contactPerson: e.target.value }))
                      }
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase text-gray-500">
                      Contact Number
                    </label>
                    <input
                      required
                      type="tel"
                      value={form.contactNumber}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, contactNumber: e.target.value }))
                      }
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-xs font-semibold uppercase text-gray-500">
                      Email
                    </label>
                    <input
                      required
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-xs font-semibold uppercase text-gray-500">
                      Address
                    </label>
                    <input
                      required
                      value={form.address}
                      onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-xs font-semibold uppercase text-gray-500">
                      Description
                    </label>
                    <textarea
                      rows={3}
                      value={form.description}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, description: e.target.value }))
                      }
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button type="submit">
                    <Save className="h-4 w-4" />
                    Save Changes
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      </main>
    </>
  )
}
