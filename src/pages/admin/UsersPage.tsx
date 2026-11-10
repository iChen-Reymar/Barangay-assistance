import { useEffect, useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import { AdminHeader } from '../../components/admin/AdminHeader'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { useAuth } from '../../context/useAuth'
import type { Association } from '../../data/mockData'
import { getAssociations, subscribeAssociationStorage } from '../../services/associationStorage'
import { buildChanges, logAuditEvent } from '../../services/auditStorage'
import {
  createManagedUser,
  removeUser,
  sendUserPasswordReset,
  updateManagedUser,
  updateUserRole,
} from '../../services/authStorage'
import type { StoredUser, UserRole } from '../../types/auth'
import { recoveryEmailError } from '../../services/passwordRecovery'

const roleOptions: { value: UserRole; label: string }[] = [
  { value: 'admin', label: 'Administrator' },
  { value: 'staff', label: 'Barangay Staff' },
  { value: 'association', label: 'Association Head' },
]

const fieldClass =
  'w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary'

function associationFor(account: StoredUser, associations: Association[]) {
  if (account.role !== 'association') return ''
  const named = account.associationName?.trim()
  if (named) return named
  return associations.find((row) => row.headUserId === account.id)?.name?.trim() ?? ''
}

function statusVariant(status: StoredUser['status']) {
  if (status === 'approved') return 'success' as const
  if (status === 'rejected') return 'danger' as const
  return 'warning' as const
}

export default function UsersPage({ embedded = false }: { embedded?: boolean }) {
  const { user, profile, allUsers, refreshUsers } = useAuth()
  const actorName = profile?.fullName ?? user?.fullName ?? 'Administrator'
  const actorEmail = profile?.email ?? user?.email
  const [associations, setAssociations] = useState<Association[]>(() => getAssociations())
  const [formOpen, setFormOpen] = useState(false)
  const [removeTarget, setRemoveTarget] = useState<StoredUser | null>(null)
  const [editTarget, setEditTarget] = useState<StoredUser | null>(null)
  const [resetTarget, setResetTarget] = useState<StoredUser | null>(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [authAdministration, setAuthAdministration] = useState(false)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all')
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
  })
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    contactNumber: '',
    role: 'staff' as UserRole,
    associationName: '',
  })

  useEffect(() => subscribeAssociationStorage(() => setAssociations(getAssociations())), [])
  useEffect(() => {
    void fetch('/api/health')
      .then((response) => response.json())
      .then((body: { authAdministration?: boolean }) => setAuthAdministration(Boolean(body.authAdministration)))
      .catch(() => setAuthAdministration(false))
  }, [])

  const visibleUsers = useMemo(() => {
    const term = search.trim().toLowerCase()
    return allUsers.filter((account) => {
      if (roleFilter !== 'all' && account.role !== roleFilter) return false
      if (!term) return true
      return [account.fullName, account.email, account.associationName, account.roleLabel]
        .some((value) => String(value || '').toLowerCase().includes(term))
    })
  }, [allUsers, roleFilter, search])

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

  async function handleRoleChange(account: StoredUser, role: UserRole) {
    setError('')
    if (role === account.role) return
    const result = await updateUserRole(account.id, role)
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

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault()
    setError('')
    setSaving(true)
    const result = await createManagedUser(form)
    setSaving(false)
    if (!result.success) {
      setError(result.error ?? 'Could not add the user.')
      return
    }
    refreshUsers()
    audit(`Added user ${form.firstName.trim()} ${form.lastName.trim()}.`, buildChanges([
      { key: 'email', label: 'Email', oldValue: 'â€”', newValue: form.email.trim() },
      { key: 'role', label: 'Role', oldValue: 'â€”', newValue: roleOptions.find((option) => option.value === form.role)?.label ?? form.role },
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

  function openEdit(account: StoredUser) {
    setError('')
    setEditTarget(account)
    setEditForm({
      firstName: account.firstName,
      lastName: account.lastName,
      email: account.email,
      password: '',
    })
  }

  async function saveEdit(password = editForm.password.trim()) {
    if (!editTarget) return
    setError('')
    if (password && password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    setSaving(true)
    const result = await updateManagedUser(editTarget.id, {
      firstName: editForm.firstName,
      lastName: editForm.lastName,
      email: editForm.email,
      password,
    })
    setSaving(false)
    if (!result.success) {
      setError(result.error ?? 'Could not update the user.')
      return
    }
    refreshUsers()
    const fullName = `${editForm.firstName.trim()} ${editForm.lastName.trim()}`.trim()
    const passwordNote = password ? ' The password was changed.' : ''
    setMessage(`${fullName} was updated.${passwordNote}`)
    audit(`Updated user ${fullName}.`, buildChanges([
      { key: 'name', label: 'Name', oldValue: editTarget.fullName, newValue: fullName },
      { key: 'email', label: 'Email', oldValue: editTarget.email, newValue: editForm.email.trim().toLowerCase() },
      ...(password ? [{ key: 'password', label: 'Password', oldValue: 'Hidden', newValue: 'Changed' }] : []),
    ]))
    setEditTarget(null)
  }

  async function handleRemove() {
    if (!removeTarget || !user) return
    setError('')
    setSaving(true)
    const result = await removeUser(removeTarget.id, user.id)
    setSaving(false)
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

  async function handlePasswordReset() {
    if (!resetTarget) return
    setError('')
    setSaving(true)
    const target = resetTarget
    const result = await sendUserPasswordReset(target.email)
    setSaving(false)
    if (!result.success) {
      setError(result.error ?? 'Could not send the password reset email.')
      setResetTarget(null)
      return
    }
    setMessage(`A password reset link was sent to ${target.email}.`)
    audit(`Sent a password reset link to ${target.fullName}.`, buildChanges([
      { key: 'passwordReset', label: 'Password reset', oldValue: 'Not requested', newValue: 'Email sent' },
    ]))
    setResetTarget(null)
  }

  return (
    <>
      {!embedded ? <AdminHeader title="Manage Users" /> : null}
      <div className={embedded ? '' : 'flex-1 overflow-y-auto p-4 sm:p-5 md:p-6'}>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className="max-w-2xl text-sm text-gray-500">
            {authAdministration
              ? 'Add people, update account details, or change whether someone is an administrator, barangay staff, or association head.'
              : 'Update profile names, permissions, and association access. Login credentials remain protected by Supabase Auth.'}
          </p>
          {authAdministration ? (
            <Button onClick={() => { setError(''); setFormOpen(true) }}>
              <Plus className="h-4 w-4" />
              Add User
            </Button>
          ) : (
            <p className="rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-700">
              New users register through Request Access, then appear in the Access requests tab.
            </p>
          )}
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

        <div className="mb-3 flex flex-col gap-2 sm:flex-row">
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search name, email, role, or association"
            className={`${fieldClass} sm:max-w-md`}
          />
          <select
            value={roleFilter}
            onChange={(event) => setRoleFilter(event.target.value as 'all' | UserRole)}
            className={`${fieldClass} sm:w-48`}
          >
            <option value="all">All permissions</option>
            {roleOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </div>

        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Permission</th>
                <th className="px-4 py-3">Association</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleUsers.map((account) => {
                const isSelf = account.id === user?.id
                const canEmailReset = !recoveryEmailError(account.email)
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
                      {account.role === 'association' ? (
                        <span className="text-gray-700">{associationFor(account, associations) || 'Not assigned'}</span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={statusVariant(account.status)}>{account.status.toUpperCase()}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" variant="outline" onClick={() => openEdit(account)}>
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={!canEmailReset}
                          title={canEmailReset ? 'Send a secure password reset email' : 'This username does not have a deliverable email address'}
                          onClick={() => { setError(''); setResetTarget(account) }}
                        >
                          Reset password
                        </Button>
                        {authAdministration ? (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={isSelf}
                            onClick={() => { setError(''); setRemoveTarget(account) }}
                          >
                            Remove
                          </Button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                )
              })}
              {visibleUsers.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-sm text-gray-500">No users match the current filters.</td></tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title="Add User"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button type="submit" form="add-user-form" disabled={saving}>Save User</Button>
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
            <input required type="password" minLength={8} value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} className={fieldClass} />
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
              <select
                required
                value={form.associationName}
                onChange={(event) => setForm({ ...form, associationName: event.target.value })}
                className={fieldClass}
              >
                <option value="">Select an association</option>
                {associations.map((association) => (
                  <option key={association.id} value={association.name}>{association.name}</option>
                ))}
              </select>
            </label>
          ) : null}
        </form>
      </Modal>

      <Modal
        open={editTarget !== null}
        onClose={() => { if (!saving) setEditTarget(null) }}
        title="Edit User"
        footer={
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="outline" disabled={saving} onClick={() => setEditTarget(null)}>Cancel</Button>
            <Button type="submit" form="edit-user-form" disabled={saving}>Save</Button>
          </div>
        }
      >
        <form id="edit-user-form" onSubmit={(event) => { event.preventDefault(); void saveEdit() }} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1 block text-xs font-semibold uppercase text-gray-500">First name</span>
              <input required value={editForm.firstName} onChange={(event) => setEditForm({ ...editForm, firstName: event.target.value })} className={fieldClass} />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-xs font-semibold uppercase text-gray-500">Last name</span>
              <input value={editForm.lastName} onChange={(event) => setEditForm({ ...editForm, lastName: event.target.value })} className={fieldClass} />
            </label>
          </div>
          <label className="block text-sm">
            <span className="mb-1 block text-xs font-semibold uppercase text-gray-500">Email</span>
            <input required disabled={!authAdministration} type="email" value={editForm.email} onChange={(event) => setEditForm({ ...editForm, email: event.target.value })} className={`${fieldClass} disabled:bg-gray-50 disabled:text-gray-500`} />
            {!authAdministration ? <span className="mt-1 block text-xs text-gray-500">Login email changes require optional Supabase Auth administration.</span> : null}
          </label>
          {authAdministration ? (
            <label className="block text-sm">
              <span className="mb-1 block text-xs font-semibold uppercase text-gray-500">New password</span>
              <input
                type="password"
                value={editForm.password}
                onChange={(event) => setEditForm({ ...editForm, password: event.target.value })}
                placeholder="Leave blank to keep the current password"
                className={fieldClass}
              />
              <span className="mt-1 block text-xs text-gray-500">
                Use at least 8 characters. Passwords are managed by Supabase Auth and are never stored in browser data.
              </span>
            </label>
          ) : (
            <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-3 text-xs leading-5 text-gray-600">
              Passwords cannot be changed by another account in publishable-key mode. The user can change their own password from account settings.
            </div>
          )}
        </form>
      </Modal>

      <Modal
        open={resetTarget !== null}
        onClose={() => { if (!saving) setResetTarget(null) }}
        title="Send Password Reset"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" disabled={saving} onClick={() => setResetTarget(null)}>Cancel</Button>
            <Button disabled={saving} onClick={handlePasswordReset}>{saving ? 'Sending...' : 'Send reset link'}</Button>
          </div>
        }
      >
        <p className="text-sm leading-6 text-gray-600">
          {resetTarget
            ? `Supabase will email ${resetTarget.email} a secure link to choose a new password. Their current password will remain active until they complete the reset.`
            : ''}
        </p>
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
