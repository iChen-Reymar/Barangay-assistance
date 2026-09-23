import { useState } from 'react'
import { Plus } from 'lucide-react'
import { AdminHeader } from '../../components/admin/AdminHeader'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { useAuth } from '../../context/AuthContext'
import { buildChanges, logAuditEvent } from '../../services/auditStorage'
import {
  createManagedUser,
  removeUser,
  updateUserRole,
} from '../../services/authStorage'
import type { StoredUser, UserRole } from '../../types/auth'

const roleOptions: { value: UserRole; label: string }[] = [
  { value: 'admin', label: 'Administrator' },
  { value: 'staff', label: 'Barangay Staff' },
  { value: 'association', label: 'Association Head' },
]

const fieldClass =
  'w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary'

function statusVariant(status: StoredUser['status']) {
  if (status === 'approved') return 'success' as const
  if (status === 'rejected') return 'danger' as const
  return 'warning' as const
}

export default function UsersPage() {
  const { user, profile, allUsers, refreshUsers } = useAuth()
  const actorName = profile?.fullName ?? user?.fullName ?? 'Administrator'
  const actorEmail = profile?.email ?? user?.email
  const [formOpen, setFormOpen] = useState(false)
  const [removeTarget, setRemoveTarget] = useState<StoredUser | null>(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    contactNumber: '',
    role: 'staff' as UserRole,
    associationName: '',
  })

  function audit(description: string, changes: ReturnType<typeof buildChanges>) {
    logAuditEvent({
      user: actorName,
      userEmail: actorEmail,
      action: 'User Management',
      actionColor: 'teal',
      description,
      entityType: 'user',
      changes,
    })
  }

  function handleRoleChange(account: StoredUser, role: UserRole) {
    setError('')
    if (role === account.role) return
    const result = updateUserRole(account.id, role)
    if (!result.success) {
      setError(result.error ?? 'Could not change permissions.')
      return
    }
    refreshUsers()
    const nextLabel = roleOptions.find((option) => option.value === role)?.label ?? role
    setMessage(`${account.fullName} is now ${nextLabel}.`)
    audit(`Changed permissions for ${account.fullName}.`, buildChanges([
      { key: 'role', label: 'Role', oldValue: account.roleLabel, newValue: nextLabel },
    ]))
  }

  function handleCreate(event: React.FormEvent) {
    event.preventDefault()
    setError('')
    const result = createManagedUser(form)
    if (!result.success) {
      setError(result.error ?? 'Could not add the user.')
      return
    }
    refreshUsers()
    audit(`Added user ${form.firstName.trim()} ${form.lastName.trim()}.`, buildChanges([
      { key: 'email', label: 'Email', oldValue: '—', newValue: form.email.trim() },
      { key: 'role', label: 'Role', oldValue: '—', newValue: roleOptions.find((option) => option.value === form.role)?.label ?? form.role },
    ]))
    setMessage(`${form.firstName.trim()} ${form.lastName.trim()} can now sign in.`)
    setFormOpen(false)
    setForm({
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      contactNumber: '',
      role: 'staff',
      associationName: '',
    })
  }

  function handleRemove() {
    if (!removeTarget || !user) return
    setError('')
    const result = removeUser(removeTarget.id, user.id)
    if (!result.success) {
      setError(result.error ?? 'Could not remove the user.')
      setRemoveTarget(null)
      return
    }
    refreshUsers()
    audit(`Removed user ${removeTarget.fullName}.`, buildChanges([
      { key: 'status', label: 'Account', oldValue: removeTarget.status, newValue: 'Removed' },
    ]))
    setMessage(`${removeTarget.fullName} was removed.`)
    setRemoveTarget(null)
  }

  return (
    <>
      <AdminHeader title="Manage Users" />
      <main className="flex-1 overflow-y-auto p-4 sm:p-5 md:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className="max-w-2xl text-sm text-gray-500">
            Add people, remove access, or change whether an account is an administrator, barangay staff, or association head.
          </p>
          <Button onClick={() => { setError(''); setFormOpen(true) }}>
            <Plus className="h-4 w-4" />
            Add User
          </Button>
        </div>

        {message ? (
          <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            {message}
          </div>
        ) : null}
        {error ? (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Permission</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {allUsers.map((account) => {
                const isSelf = account.id === user?.id
                return (
                  <tr key={account.id} className="border-b border-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {account.fullName}
                      {isSelf ? <span className="ml-2 text-xs font-normal text-gray-400">You</span> : null}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{account.email}</td>
                    <td className="px-4 py-3">
                      <select
                        value={account.role}
                        disabled={isSelf}
                        onChange={(event) => handleRoleChange(account, event.target.value as UserRole)}
                        className="rounded-lg border border-gray-200 px-2 py-1.5 text-sm disabled:bg-gray-50 disabled:text-gray-400"
                      >
                        {roleOptions.map((option) => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={statusVariant(account.status)}>{account.status.toUpperCase()}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isSelf}
                        onClick={() => { setError(''); setRemoveTarget(account) }}
                      >
                        Remove
                      </Button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </main>

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title="Add User"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button type="submit" form="add-user-form">Save User</Button>
          </div>
        }
      >
        <form id="add-user-form" onSubmit={handleCreate} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1 block text-xs font-semibold uppercase text-gray-500">First name</span>
              <input required value={form.firstName} onChange={(event) => setForm({ ...form, firstName: event.target.value })} className={fieldClass} />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-xs font-semibold uppercase text-gray-500">Last name</span>
              <input required value={form.lastName} onChange={(event) => setForm({ ...form, lastName: event.target.value })} className={fieldClass} />
            </label>
          </div>
          <label className="block text-sm">
            <span className="mb-1 block text-xs font-semibold uppercase text-gray-500">Email</span>
            <input required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className={fieldClass} />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-xs font-semibold uppercase text-gray-500">Password</span>
            <input required type="password" minLength={6} value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} className={fieldClass} />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-xs font-semibold uppercase text-gray-500">Contact number</span>
            <input required value={form.contactNumber} onChange={(event) => setForm({ ...form, contactNumber: event.target.value })} className={fieldClass} />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-xs font-semibold uppercase text-gray-500">Permission</span>
            <select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value as UserRole })} className={fieldClass}>
              {roleOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
          {form.role === 'association' ? (
            <label className="block text-sm">
              <span className="mb-1 block text-xs font-semibold uppercase text-gray-500">Association</span>
              <input required value={form.associationName} onChange={(event) => setForm({ ...form, associationName: event.target.value })} className={fieldClass} />
            </label>
          ) : null}
        </form>
      </Modal>

      <Modal
        open={removeTarget !== null}
        onClose={() => setRemoveTarget(null)}
        title="Remove User"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setRemoveTarget(null)}>Cancel</Button>
            <Button variant="danger" onClick={handleRemove}>Remove</Button>
          </div>
        }
      >
        <p className="text-sm text-gray-600">
          {removeTarget
            ? `${removeTarget.fullName} will no longer be able to sign in.`
            : ''}
        </p>
      </Modal>
    </>
  )
}
