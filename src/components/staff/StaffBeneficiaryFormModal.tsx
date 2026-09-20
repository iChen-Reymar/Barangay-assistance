import { useEffect, useState, type FormEvent } from 'react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import {
  associations,
  type StaffBeneficiary,
  type VerificationStatus,
  type VulnerabilityLevel,
} from '../../data/staffMockData'

export type StaffBeneficiaryFormInput = {
  name: string
  association: string
  familySize: number
  monthlyIncome: number
  vulnerability: VulnerabilityLevel
  verification: VerificationStatus
}

interface StaffBeneficiaryFormModalProps {
  open: boolean
  onClose: () => void
  title: string
  initialValues?: StaffBeneficiary
  onSave: (input: StaffBeneficiaryFormInput) => void
}

const vulnerabilityOptions: VulnerabilityLevel[] = ['HIGH', 'MEDIUM', 'LOW']
const verificationOptions: VerificationStatus[] = ['VERIFIED', 'PENDING', 'UNVERIFIED']

const emptyForm: StaffBeneficiaryFormInput = {
  name: '',
  association: associations[0] ?? '',
  familySize: 1,
  monthlyIncome: 0,
  vulnerability: 'MEDIUM',
  verification: 'PENDING',
}

export function StaffBeneficiaryFormModal({
  open,
  onClose,
  title,
  initialValues,
  onSave,
}: StaffBeneficiaryFormModalProps) {
  const [form, setForm] = useState<StaffBeneficiaryFormInput>(emptyForm)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    if (initialValues) {
      setForm({
        name: initialValues.name,
        association: initialValues.association,
        familySize: initialValues.familySize,
        monthlyIncome: initialValues.monthlyIncome,
        vulnerability: initialValues.vulnerability,
        verification: initialValues.verification,
      })
    } else {
      setForm(emptyForm)
    }
    setError('')
  }, [open, initialValues])

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) {
      setError('Beneficiary name is required.')
      return
    }
    if (!form.association) {
      setError('Please select an association.')
      return
    }
    if (form.familySize < 1) {
      setError('Family size must be at least 1.')
      return
    }
    if (form.monthlyIncome < 0) {
      setError('Monthly income cannot be negative.')
      return
    }
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
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold uppercase text-gray-500">Association</label>
          <select
            required
            value={form.association}
            onChange={(e) => setForm((prev) => ({ ...prev, association: e.target.value }))}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="">Select association</option>
            {associations.map((name) => (
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
                min={0}
                value={form.monthlyIncome || ''}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, monthlyIncome: Number(e.target.value) || 0 }))
                }
                className="w-full rounded-lg border border-gray-200 py-2 pl-8 pr-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase text-gray-500">
              Vulnerability
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
              {vulnerabilityOptions.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>
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
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">Save Changes</Button>
        </div>
      </form>
    </Modal>
  )
}
