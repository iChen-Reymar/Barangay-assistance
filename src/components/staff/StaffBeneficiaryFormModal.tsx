import { useState, type FormEvent } from 'react'
import { useResetWhenOpen } from '../../hooks/useResetWhenOpen'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import {
  type StaffBeneficiary,
  type VerificationStatus,
  type VulnerabilityLevel,
} from '../../data/staffMockData'
import { getAssociations } from '../../services/associationStorage'

export type StaffBeneficiaryFormInput = {
  name: string
  association: string
  familySize: number
  monthlyIncome: number
  workingHouseholdMembers: number
  age: number
  employmentStatus: string
  housingCondition: string
  vulnerability: VulnerabilityLevel
  verification: VerificationStatus
}

interface StaffBeneficiaryFormModalProps {
  open: boolean
  onClose: () => void
  title: string
  initialValues?: StaffBeneficiary
  identityReadOnly?: boolean
  onSave: (input: StaffBeneficiaryFormInput) => void
}

const verificationOptions: VerificationStatus[] = ['VERIFIED', 'PENDING', 'UNVERIFIED']

const emptyForm: StaffBeneficiaryFormInput = {
  name: '',
  association: '',
  familySize: 1,
  monthlyIncome: 0,
  workingHouseholdMembers: 0,
  age: 0,
  employmentStatus: '',
  housingCondition: '',
  vulnerability: 'MEDIUM',
  verification: 'PENDING',
}

export function StaffBeneficiaryFormModal({
  open,
  onClose,
  title,
  initialValues,
  identityReadOnly = false,
  onSave,
}: StaffBeneficiaryFormModalProps) {
  const [form, setForm] = useState<StaffBeneficiaryFormInput>(emptyForm)
  const [error, setError] = useState('')

  useResetWhenOpen(open, initialValues, () => {
    if (initialValues) {
      setForm({
        name: initialValues.name,
        association: initialValues.association,
        familySize: initialValues.familySize,
        monthlyIncome: initialValues.monthlyIncome,
        workingHouseholdMembers: initialValues.workingHouseholdMembers ?? 0,
        age: initialValues.age ?? 0,
        employmentStatus: initialValues.employmentStatus ?? '',
        housingCondition: initialValues.housingCondition ?? '',
        vulnerability: initialValues.vulnerability,
        verification: initialValues.verification,
      })
    } else {
      setForm(emptyForm)
    }
    setError('')
  })

  function validate(requireComplete: boolean) {
    if (!form.name.trim()) {
      setError('Beneficiary name is required.')
      return false
    }
    if (!form.association) {
      setError('Please select an association.')
      return false
    }
    if (form.familySize < 1) {
      setError('Family size must be at least 1.')
      return false
    }
    if (form.monthlyIncome < 0) {
      setError('Monthly income cannot be negative.')
      return false
    }
    if (requireComplete && form.monthlyIncome <= 0) {
      setError('Monthly income must be greater than zero before verification.')
      return false
    }
    if (form.workingHouseholdMembers < 0 || form.workingHouseholdMembers > form.familySize) {
      setError('Working household members must be between 0 and the family size.')
      return false
    }
    if (requireComplete && form.age < 1) {
      setError('Age is required before verification.')
      return false
    }
    if (requireComplete && !form.employmentStatus.trim()) {
      setError('Employment status is required before verification.')
      return false
    }
    if (requireComplete && !form.housingCondition.trim()) {
      setError('Housing condition is required before verification.')
      return false
    }
    return true
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!validate(form.verification === 'VERIFIED')) return
    onSave(form)
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <div>
          <label className="mb-1 block text-xs font-semibold uppercase text-gray-500">Full Name</label>
          <input
            required
            readOnly={identityReadOnly}
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            className={`w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary ${identityReadOnly ? 'bg-gray-50' : ''}`}
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold uppercase text-gray-500">Association</label>
          <select
            required
            disabled={identityReadOnly}
            value={form.association}
            onChange={(e) => setForm((prev) => ({ ...prev, association: e.target.value }))}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="">Select association</option>
            {[...new Set([form.association, ...getAssociations().map((item) => item.name)].filter(Boolean))].map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase text-gray-500">Family Size</label>
            <input
              required
              type="number"
              min={1}
              value={form.familySize || ''}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, familySize: Number(e.target.value) || 0 }))
              }
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase text-gray-500">
              Monthly Income
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">₱</span>
              <input
                required
                type="number"
                min={0.01}
                value={form.monthlyIncome || ''}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, monthlyIncome: Number(e.target.value) || 0 }))
                }
                className="w-full rounded-lg border border-gray-200 py-2 pl-8 pr-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold uppercase text-gray-500">Working Household Members</label>
          <input
            required
            type="number"
            min={0}
            max={form.familySize}
            value={form.workingHouseholdMembers}
            onChange={(e) => setForm((prev) => ({ ...prev, workingHouseholdMembers: Number(e.target.value) || 0 }))}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <p className="mt-1 text-xs text-gray-500">Used to calculate income per working household member.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
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
            <label className="mb-1 block text-xs font-semibold uppercase text-gray-500">Employment Status</label>
            <select
              required
              value={form.employmentStatus}
              onChange={(e) => setForm((prev) => ({ ...prev, employmentStatus: e.target.value }))}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">Select status</option>
              <option>Employed</option>
              <option>Self-Employed</option>
              <option>Seasonal Worker</option>
              <option>Unemployed</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase text-gray-500">Housing Condition</label>
            <select
              required
              value={form.housingCondition}
              onChange={(e) => setForm((prev) => ({ ...prev, housingCondition: e.target.value }))}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">Select condition</option>
              <option>Concrete</option>
              <option>Light Materials</option>
              <option>Temporary</option>
              <option>Makeshift / Salvaged</option>
            </select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase text-gray-500">
              Vulnerability
            </label>
            <input
              readOnly
              value={form.vulnerability}
              className="w-full cursor-default rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700"
              aria-readonly="true"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase text-gray-500">
              Verification Status
            </label>
            <select
              value={form.verification}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  verification: e.target.value as VerificationStatus,
                }))
              }
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {verificationOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          {form.verification !== 'VERIFIED' && (
            <Button
              type="button"
              onClick={() => {
                if (!validate(true)) return
                const verified = { ...form, verification: 'VERIFIED' as VerificationStatus }
                onSave(verified)
                onClose()
              }}
            >
              Verify Assessment
            </Button>
          )}
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">Save Changes</Button>
        </div>
      </form>
    </Modal>
  )
}
