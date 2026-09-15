import { useEffect, useState, type FormEvent } from 'react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import type {
  AssociationMember,
  AssistanceStatus,
  MemberStatus,
  VulnerabilityLevel,
} from '../../data/associationMockData'

export type MemberFormInput = Omit<AssociationMember, 'id' | 'assistanceStatus'>

interface MemberFormModalProps {
  open: boolean
  onClose: () => void
  title: string
  initialValues?: AssociationMember
  onSave: (input: MemberFormInput) => void
}

const emptyForm: MemberFormInput = {
  name: '',
  age: 18,
  contactNumber: '',
  address: '',
  dateJoined: '',
  familySize: 1,
  isPwd: false,
  isSenior: false,
  membershipStatus: 'ACTIVE',
  vulnerability: 'MEDIUM',
  notes: '',
}

function formatDate(date: Date) {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function MemberFormModal({
  open,
  onClose,
  title,
  initialValues,
  onSave,
}: MemberFormModalProps) {
  const [form, setForm] = useState<MemberFormInput>(emptyForm)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    if (initialValues) {
      setForm({
        name: initialValues.name,
        age: initialValues.age,
        contactNumber: initialValues.contactNumber,
        address: initialValues.address,
        dateJoined: initialValues.dateJoined,
        familySize: initialValues.familySize,
        isPwd: initialValues.isPwd,
        isSenior: initialValues.isSenior,
        membershipStatus: initialValues.membershipStatus,
        vulnerability: initialValues.vulnerability,
        notes: initialValues.notes ?? '',
      })
    } else {
      setForm({ ...emptyForm, dateJoined: formatDate(new Date()) })
    }
    setError('')
  }, [open, initialValues])

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) {
      setError('Member name is required.')
      return
    }
    if (!form.contactNumber.trim()) {
      setError('Contact number is required.')
      return
    }
    if (!form.address.trim()) {
      setError('Address is required.')
      return
    }
    if (form.age < 1) {
      setError('Age must be at least 1.')
      return
    }
    onSave({
      ...form,
      name: form.name.trim(),
      contactNumber: form.contactNumber.trim(),
      address: form.address.trim(),
      notes: form.notes?.trim() || undefined,
    })
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title={title} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-semibold uppercase text-gray-500">
              Full Name
            </label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase text-gray-500">Age</label>
            <input
              required
              type="number"
              min={1}
              value={form.age || ''}
              onChange={(e) => setForm((prev) => ({ ...prev, age: Number(e.target.value) || 0 }))}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase text-gray-500">
              Family Size
            </label>
            <input
              required
              type="number"
              min={1}
              value={form.familySize || ''}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, familySize: Number(e.target.value) || 1 }))
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
              onChange={(e) => setForm((prev) => ({ ...prev, contactNumber: e.target.value }))}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase text-gray-500">
              Date Joined
            </label>
            <input
              required
              value={form.dateJoined}
              onChange={(e) => setForm((prev) => ({ ...prev, dateJoined: e.target.value }))}
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
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase text-gray-500">
              Membership Status
            </label>
            <select
              value={form.membershipStatus}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, membershipStatus: e.target.value as MemberStatus }))
              }
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase text-gray-500">
              Vulnerability Level
            </label>
            <select
              value={form.vulnerability}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  vulnerability: e.target.value as VulnerabilityLevel,
                }))
              }
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={form.isSenior}
              onChange={(e) => setForm((prev) => ({ ...prev, isSenior: e.target.checked }))}
              className="rounded border-gray-300 text-primary focus:ring-primary"
            />
            Senior Citizen
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={form.isPwd}
              onChange={(e) => setForm((prev) => ({ ...prev, isPwd: e.target.checked }))}
              className="rounded border-gray-300 text-primary focus:ring-primary"
            />
            Person with Disability (PWD)
          </label>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold uppercase text-gray-500">Notes</label>
          <textarea
            rows={2}
            value={form.notes ?? ''}
            onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="Optional notes about this member..."
          />
        </div>

        {initialValues && (
          <p className="text-xs text-gray-400">
            Assistance status ({initialValues.assistanceStatus as AssistanceStatus}) is managed
            through the assistance workflow and cannot be edited here.
          </p>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">{initialValues ? 'Save Changes' : 'Add Member'}</Button>
        </div>
      </form>
    </Modal>
  )
}
