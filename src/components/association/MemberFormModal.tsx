import { useState, type FormEvent } from 'react'
import { useResetWhenOpen } from '../../hooks/useResetWhenOpen'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import type {
  AssociationMember,
  AssistanceStatus,
  MemberStatus,
} from '../../data/associationMockData'
import { memberPositions, splitMemberPosition } from '../../data/memberPositions'

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
  monthlyIncome: 0,
  workingHouseholdMembers: 0,
  employmentStatus: '',
  housingCondition: '',
  isPwd: false,
  isSenior: false,
  membershipStatus: 'ACTIVE',
  vulnerability: 'MEDIUM',
  position: 'MEMBER',
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

  useResetWhenOpen(open, initialValues, () => {
    if (initialValues) {
      const roster = splitMemberPosition(initialValues)
      setForm({
        name: initialValues.name,
        age: initialValues.age,
        contactNumber: initialValues.contactNumber,
        address: initialValues.address,
        dateJoined: initialValues.dateJoined,
        familySize: initialValues.familySize,
        monthlyIncome: initialValues.monthlyIncome ?? 0,
        workingHouseholdMembers: initialValues.workingHouseholdMembers ?? 0,
        employmentStatus: initialValues.employmentStatus ?? '',
        housingCondition: initialValues.housingCondition ?? '',
        isPwd: initialValues.isPwd,
        isSenior: initialValues.isSenior,
        membershipStatus: initialValues.membershipStatus,
        vulnerability: initialValues.vulnerability,
        vulnerabilityScore: initialValues.vulnerabilityScore,
        vulnerabilitySource: initialValues.vulnerabilitySource,
        vulnerabilityAssessedAt: initialValues.vulnerabilityAssessedAt,
        position: roster.position,
        notes: roster.notes ?? '',
        barangayCertificate: initialValues.barangayCertificate,
        governmentId: initialValues.governmentId,
      })
    } else {
      setForm({ ...emptyForm, dateJoined: formatDate(new Date()) })
    }
    setError('')
  })

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
    if ((form.monthlyIncome ?? 0) <= 0) {
      setError('Monthly income must be greater than zero for AI scoring.')
      return
    }
    if ((form.workingHouseholdMembers ?? 0) < 0 || (form.workingHouseholdMembers ?? 0) > form.familySize) {
      setError('Working household members must be between 0 and the family size.')
      return
    }
    if (!form.employmentStatus?.trim()) {
      setError('Employment status is required for AI scoring.')
      return
    }
    if (!form.housingCondition?.trim()) {
      setError('Housing condition is required for AI scoring.')
      return
    }
    onSave({
      ...form,
      name: form.name.trim(),
      contactNumber: form.contactNumber.trim(),
      address: form.address.trim(),
      position: form.position || 'MEMBER',
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
            <label className="mb-1 block text-xs font-semibold uppercase text-gray-500">Position</label>
            <select
              required
              value={form.position || 'MEMBER'}
              onChange={(e) => setForm((prev) => ({ ...prev, position: e.target.value }))}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {memberPositions.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </select>
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

        <section className="rounded-xl border border-gray-200 bg-gray-50 p-4">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-gray-900">Household profile for AI scoring</h3>
            <p className="mt-1 text-xs leading-5 text-gray-500">
              Staff verifies these details before the AI generates the member's vulnerability score and priority rank.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-600">Family size</label>
              <input required type="number" min={1} value={form.familySize || ''} onChange={(e) => setForm((prev) => ({ ...prev, familySize: Number(e.target.value) || 1 }))} className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-600">Monthly income</label>
              <input required type="number" min={0.01} step="0.01" value={form.monthlyIncome || ''} onChange={(e) => setForm((prev) => ({ ...prev, monthlyIncome: Number(e.target.value) || 0 }))} className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-600">Working members</label>
              <input required type="number" min={0} max={form.familySize} value={form.workingHouseholdMembers ?? 0} onChange={(e) => setForm((prev) => ({ ...prev, workingHouseholdMembers: Number(e.target.value) || 0 }))} className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-600">Age</label>
              <input required type="number" min={1} value={form.age || ''} onChange={(e) => setForm((prev) => ({ ...prev, age: Number(e.target.value) || 0 }))} className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-600">Employment</label>
              <select required value={form.employmentStatus ?? ''} onChange={(e) => setForm((prev) => ({ ...prev, employmentStatus: e.target.value }))} className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary">
                <option value="">Select status</option>
                <option>Employed</option><option>Self-Employed</option><option>Seasonal Worker</option><option>Unemployed</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-600">Housing condition</label>
              <select required value={form.housingCondition ?? ''} onChange={(e) => setForm((prev) => ({ ...prev, housingCondition: e.target.value }))} className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary">
                <option value="">Select condition</option>
                <option>Concrete</option><option>Light Materials</option><option>Renter</option><option>Makeshift / Salvaged</option>
              </select>
            </div>
          </div>
        </section>

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
          <div className="rounded-lg border border-dashed border-primary/30 bg-primary/5 px-3 py-2">
            <p className="text-xs font-semibold text-primary">AI vulnerability</p>
            <p className="mt-0.5 text-sm text-gray-700">
              {initialValues?.vulnerabilitySource === 'ml'
                ? `${initialValues.vulnerability} · ${initialValues.vulnerabilityScore ?? '—'}/100`
                : 'Awaiting Staff verification and AI generation'}
            </p>
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
