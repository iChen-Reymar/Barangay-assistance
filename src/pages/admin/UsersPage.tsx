import { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  Copy,
  KeyRound,
  Mail,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  UserRound,
  Users,
} from 'lucide-react'
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
  resetManagedUserPassword,
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
  const [temporaryPassword, setTemporaryPassword] = useState('')
  const [temporaryPasswordSaved, setTemporaryPasswordSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [resetError, setResetError] = useState('')
  const [authAdministration, setAuthAdministration] = useState(false)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all')
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
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
    })
  }

  async function saveEdit() {
    if (!editTarget) return
    setError('')
    setSaving(true)
    const result = await updateManagedUser(editTarget.id, {
      firstName: editForm.firstName,
      lastName: editForm.lastName,
      email: editForm.email,
    })
    setSaving(false)
    if (!result.success) {
      setError(result.error ?? 'Could not update the user.')
      return
    }
    refreshUsers()
    const fullName = `${editForm.firstName.trim()} ${editForm.lastName.trim()}`.trim()
    setMessage(`${fullName} was updated.`)
    audit(`Updated user ${fullName}.`, buildChanges([
      { key: 'name', label: 'Name', oldValue: editTarget.fullName, newValue: fullName },
      { key: 'email', label: 'Email', oldValue: editTarget.email, newValue: editForm.email.trim().toLowerCase() },
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
    setResetError('')
    setSaving(true)
    const target = resetTarget
    const result = await sendUserPasswordReset(target.email)
    setSaving(false)
    if (!result.success) {
      setResetError(result.error ?? 'Could not send the password reset email.')
      return
    }
    setMessage(`A password reset link was sent to ${target.email}.`)
    audit(`Sent a password reset link to ${target.fullName}.`, buildChanges([
      { key: 'passwordReset', label: 'Password reset', oldValue: 'Not requested', newValue: 'Email sent' },
    ]))
    setResetTarget(null)
  }

  function openPasswordReset(account: StoredUser) {
    setError('')
    setResetError('')
    setTemporaryPassword('')
    setTemporaryPasswordSaved(false)
    setResetTarget(account)
  }

  function closePasswordReset() {
    if (saving) return
    if (temporaryPassword && !temporaryPasswordSaved) {
      setResetError('Copy the temporary password or confirm that you saved it before closing.')
      return
    }
    setTemporaryPassword('')
    setTemporaryPasswordSaved(false)
    setResetError('')
    setResetTarget(null)
  }

  async function handleTemporaryPasswordReset() {
    if (!resetTarget) return
    setResetError('')
    setSaving(true)
    const target = resetTarget
    const result = await resetManagedUserPassword(target.id)
    setSaving(false)
    if (!result.success || !result.temporaryPassword) {
      setResetError(result.error ?? 'Could not issue a temporary password.')
      return
    }
    setTemporaryPassword(result.temporaryPassword)
    refreshUsers()
    setMessage(`A temporary password was issued for ${target.fullName}.`)
    audit(`Issued a temporary password to ${target.fullName}.`, buildChanges([
      { key: 'passwordReset', label: 'Temporary password', oldValue: 'Not issued', newValue: 'Issued; change required' },
    ]))
  }

  async function copyTemporaryPassword() {
    if (!temporaryPassword) return
    try {
      await navigator.clipboard.writeText(temporaryPassword)
      setTemporaryPasswordSaved(true)
      setMessage('Temporary password copied. Share it privately with the user.')
    } catch {
      setResetError('Could not copy automatically. Select and copy the temporary password manually.')
    }
  }

  function accountActions(account: StoredUser, mobile = false) {
    const isSelf = account.id === user?.id
    const canEmailReset = !recoveryEmailError(account.email)
    const resetDisabled = authAdministration ? isSelf : !canEmailReset
    const resetTitle = authAdministration
      ? isSelf ? 'Use Account Settings to change your own password' : 'Create a one-time temporary password'
      : canEmailReset ? 'Send a secure password reset email' : 'This username does not have a deliverable email address'

    return (
      <div className={`flex flex-wrap gap-2 ${mobile ? 'w-full' : ''}`}>
        <Button size="sm" variant="outline" className={mobile ? 'flex-1' : ''} onClick={() => openEdit(account)}>
          <Pencil className="h-3.5 w-3.5" />
          Edit
        </Button>
        <Button
          size="sm"
          variant="outline"
          className={mobile ? 'flex-1' : ''}
          disabled={resetDisabled}
          title={resetTitle}
          onClick={() => openPasswordReset(account)}
        >
          <KeyRound className="h-3.5 w-3.5" />
          {authAdministration ? 'Temporary password' : 'Reset password'}
        </Button>
        {authAdministration ? (
          <Button
            size="sm"
            variant="outline"
            className="border-red-200 text-red-600 hover:bg-red-50"
            disabled={isSelf}
            title={isSelf ? 'You cannot remove your own account' : `Remove ${account.fullName}`}
            aria-label={`Remove ${account.fullName}`}
            onClick={() => { setError(''); setRemoveTarget(account) }}
          >
            <Trash2 className="h-3.5 w-3.5" />
            {mobile ? 'Remove' : <span className="sr-only">Remove</span>}
          </Button>
        ) : null}
      </div>
    )
  }

  return (
    <>
      {!embedded ? <AdminHeader title="Manage Users" /> : null}
      <div className={embedded ? '' : 'flex-1 overflow-y-auto p-4 sm:p-5 md:p-6'}>
        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-50 text-primary">
              <Users className="h-5 w-5" />
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-bold text-gray-950">User accounts</h2>
                <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-600">
                  {allUsers.length}
                </span>
              </div>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-gray-500">
                {authAdministration
                  ? 'Manage account details, permissions, associations, and secure login recovery.'
                  : 'Manage profile details, permissions, and association access. Login credentials remain protected by Supabase Auth.'}
              </p>
            </div>
          </div>
          {authAdministration ? (
            <Button className="shrink-0" onClick={() => { setError(''); setFormOpen(true) }}>
              <Plus className="h-4 w-4" />
              Add user
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

        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <div className="flex flex-col gap-3 border-b border-gray-200 bg-gray-50/60 p-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-1 flex-col gap-2 sm:flex-row">
              <label className="relative block w-full sm:max-w-md">
                <span className="sr-only">Search users</span>
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search people, email, or association"
                  className={`${fieldClass} bg-white pl-9`}
                />
              </label>
              <select
                aria-label="Filter by permission"
                value={roleFilter}
                onChange={(event) => setRoleFilter(event.target.value as 'all' | UserRole)}
                className={`${fieldClass} bg-white sm:w-48`}
              >
                <option value="all">All permissions</option>
                {roleOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </div>
            <p className="text-xs text-gray-500">
              Showing <span className="font-semibold text-gray-700">{visibleUsers.length}</span> of {allUsers.length}
            </p>
          </div>

          <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[1050px] text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-white text-left text-xs font-semibold text-gray-500">
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
                  return (
                  <tr key={account.id} className={`border-b border-gray-100 last:border-b-0 ${isSelf ? 'bg-green-50/30' : 'hover:bg-gray-50/60'}`}>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500">
                          <UserRound className="h-4 w-4" />
                        </span>
                        <span>
                          <span className="block">{account.fullName}</span>
                          {isSelf ? <span className="text-xs font-normal text-primary">Signed-in account</span> : null}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600"><span className="break-all">{account.email}</span></td>
                    <td className="px-4 py-3">
                      <select
                        value={account.role}
                        disabled={isSelf}
                        onChange={(event) => handleRoleChange(account, event.target.value as UserRole)}
                        className="rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:bg-gray-50 disabled:text-gray-400"
                      >
                        {roleOptions.map((option) => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      {account.role === 'association' ? (
                        <span className="block max-w-xs text-gray-700">{associationFor(account, associations) || 'Not assigned'}</span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col items-start gap-1.5">
                        <Badge variant={statusVariant(account.status)}>{account.status.toUpperCase()}</Badge>
                        {account.mustChangePassword ? <Badge variant="warning">PASSWORD CHANGE DUE</Badge> : null}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {accountActions(account)}
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

          <div className="divide-y divide-gray-100 md:hidden">
            {visibleUsers.map((account) => {
              const isSelf = account.id === user?.id
              return (
                <article key={account.id} className={`space-y-4 p-4 ${isSelf ? 'bg-green-50/30' : ''}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500">
                        <UserRound className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <h3 className="truncate font-semibold text-gray-900">{account.fullName}</h3>
                        <p className="break-all text-xs text-gray-500">{account.email}</p>
                        {isSelf ? <p className="mt-0.5 text-xs font-medium text-primary">Signed-in account</p> : null}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge variant={statusVariant(account.status)}>{account.status.toUpperCase()}</Badge>
                      {account.mustChangePassword ? <Badge variant="warning">PASSWORD CHANGE DUE</Badge> : null}
                    </div>
                  </div>
                  <dl className="grid gap-3 rounded-lg bg-gray-50 p-3 text-sm sm:grid-cols-2">
                    <div>
                      <dt className="text-xs text-gray-500">Permission</dt>
                      <dd className="mt-1">
                        <select
                          value={account.role}
                          disabled={isSelf}
                          onChange={(event) => handleRoleChange(account, event.target.value as UserRole)}
                          className="w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm disabled:bg-gray-50 disabled:text-gray-400"
                        >
                          {roleOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                        </select>
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-gray-500">Association</dt>
                      <dd className="mt-1 text-gray-800">{associationFor(account, associations) || 'Not assigned'}</dd>
                    </div>
                  </dl>
                  {accountActions(account, true)}
                </article>
              )
            })}
            {visibleUsers.length === 0 ? (
              <p className="px-4 py-10 text-center text-sm text-gray-500">No users match the current filters.</p>
            ) : null}
          </div>
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
          <div className="flex gap-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-3 text-xs leading-5 text-gray-600">
            <KeyRound className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
            <span>Use the Temporary password action in the account list for secure login recovery.</span>
          </div>
        </form>
      </Modal>

      <Modal
        open={resetTarget !== null}
        onClose={closePasswordReset}
        title={authAdministration ? 'Create temporary password' : 'Send password reset'}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            {temporaryPassword ? (
              <Button disabled={!temporaryPasswordSaved} onClick={closePasswordReset}>
                Done
              </Button>
            ) : (
              <>
                <Button variant="outline" disabled={saving} onClick={closePasswordReset}>Cancel</Button>
              <Button disabled={saving} onClick={authAdministration ? handleTemporaryPasswordReset : handlePasswordReset}>
                  {authAdministration ? <KeyRound className="h-4 w-4" /> : <Mail className="h-4 w-4" />}
                  {saving ? 'Processing...' : authAdministration ? 'Generate temporary password' : 'Send reset link'}
              </Button>
              </>
            )}
          </div>
        }
      >
        {resetError ? (
          <div role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {resetError}
          </div>
        ) : null}
        {temporaryPassword ? (
          <div className="space-y-5">
            <div className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-4">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green-600 text-white">
                <CheckCircle2 className="h-5 w-5" />
              </span>
              <div>
                <h3 className="font-semibold text-green-950">Temporary password created</h3>
                <p className="mt-0.5 text-sm leading-5 text-green-800">
                  {resetTarget?.fullName} can now use it to sign in once and create a private password.
                </p>
              </div>
            </div>

            <div className="rounded-xl border-2 border-primary/20 bg-green-50/40 p-4">
              <p className="text-sm font-medium text-gray-700">Temporary password</p>
              <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center">
                <output className="block min-w-0 flex-1 select-all rounded-lg bg-white px-4 py-3 text-center font-mono text-2xl font-bold tracking-[0.18em] text-gray-950 ring-1 ring-gray-200">
                  {temporaryPassword}
                </output>
                <Button className="shrink-0" onClick={() => void copyTemporaryPassword()}>
                  <Copy className="h-4 w-4" />
                  {temporaryPasswordSaved ? 'Copied' : 'Copy password'}
                </Button>
              </div>
            </div>

            <div className="flex gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
              <div>
                <p className="font-semibold">This password is shown only once</p>
                <p className="mt-1 leading-5 text-amber-800">Give it privately to the user. Do not send it in a public group or store it in notes.</p>
              </div>
            </div>

            <ol className="space-y-2 rounded-lg border border-gray-200 p-4 text-sm text-gray-700">
              <li className="flex gap-3"><span className="font-semibold text-primary">1.</span><span>Share the temporary password privately.</span></li>
              <li className="flex gap-3"><span className="font-semibold text-primary">2.</span><span>The user signs in with their usual email or username.</span></li>
              <li className="flex gap-3"><span className="font-semibold text-primary">3.</span><span>The system requires a new permanent password before opening the dashboard.</span></li>
            </ol>

            <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-200 p-3 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={temporaryPasswordSaved}
                onChange={(event) => setTemporaryPasswordSaved(event.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <span>I copied or securely recorded this temporary password.</span>
            </label>
          </div>
        ) : resetTarget ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-primary ring-1 ring-gray-200">
                <UserRound className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="truncate font-semibold text-gray-950">{resetTarget.fullName}</p>
                <p className="truncate text-sm text-gray-500">{resetTarget.email}</p>
                <p className="mt-0.5 text-xs font-medium text-primary">{resetTarget.roleLabel}</p>
              </div>
            </div>

            {authAdministration ? (
              <>
                <div className="flex gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
                  <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                  <div>
                    <p className="font-semibold">Their current password will stop working</p>
                    <p className="mt-1 leading-5 text-amber-800">A unique temporary password will replace it immediately.</p>
                  </div>
                </div>
                <div className="flex gap-3 rounded-lg border border-green-100 bg-green-50/60 p-4 text-sm text-green-900">
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <p className="leading-5">The password is generated securely, shown only once, and must be replaced after sign-in.</p>
                </div>
              </>
            ) : (
              <div className="flex gap-3 rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
                <Mail className="mt-0.5 h-5 w-5 shrink-0" />
                <p className="leading-5">A secure reset link will be sent to {resetTarget.email}. Their current password remains active until they finish the reset.</p>
              </div>
            )}
          </div>
        ) : null}
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
