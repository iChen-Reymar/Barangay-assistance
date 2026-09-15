import { useEffect, useState, type FormEvent } from 'react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import {
  associations,
  computeVulnerability,
  formatElderlyPwd,
  housingTypes,
  type Beneficiary,
  type HousingType,
} from '../../data/mockData'

export type BeneficiaryFormInput = {
  name: string
  association: string
  familySize: number
  monthlyIncome: number
  elderlyCount: number
  pwdCount: number
  housing: HousingType
}

interface BeneficiaryFormModalProps {
  open: boolean
  onClose: () => void
  title: string
  initialValues?: Beneficiary
  onSave: (input: BeneficiaryFormInput) => void
}

const emptyForm: BeneficiaryFormInput = {
  name: '',
  association: '',
  familySize: 1,
  monthlyIncome: 0,
  elderlyCount: 0,
  pwdCount: 0,
  housing: 'Concrete',
}

function parseCount(value: string) {
  const match = value.match(/\((\d+)\)/)
  return match ? Number(match[1]) : 0
}

export function BeneficiaryFormModal({
  open,
  onClose,
  title,
  initialValues,
  onSave,
}: BeneficiaryFormModalProps) {
  const [form, setForm] = useState<BeneficiaryFormInput>(emptyForm)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    if (initialValues) {
      setForm({
        name: initialValues.name,
        association: initialValues.association,
        familySize: initialValues.familySize,
        monthlyIncome: initialValues.monthlyIncome,
        elderlyCount: parseCount(initialValues.elderly),
        pwdCount: parseCount(initialValues.pwd),
        housing: initialValues.housing,
      })
    } else {
      setForm({
        ...emptyForm,
        association: associations[0]?.name ?? '',
      })
    }
    setError('')
  }, [open, initialValues])

  const previewVulnerability = computeVulnerability({
    monthlyIncome: form.monthlyIncome,
    elderlyCount: form.elderlyCount,
    pwdCount: form.pwdCount,
    housing: form.housing,
    familySize: form.familySize,
  })

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
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

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
            {associations.map((assoc) => (
              <option key={assoc.id} value={assoc.name}>
                {assoc.name}
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
              Elderly Members (60+)
            </label>
            <input
              type="number"
              min={0}
              value={form.elderlyCount}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, elderlyCount: Number(e.target.value) || 0 }))
              }
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <p className="mt-1 text-xs text-gray-500">Display: {formatElderlyPwd(form.elderlyCount)}</p>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase text-gray-500">
              PWD Members
            </label>
            <input
              type="number"
              min={0}
              value={form.pwdCount}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, pwdCount: Number(e.target.value) || 0 }))
              }
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <p className="mt-1 text-xs text-gray-500">Display: {formatElderlyPwd(form.pwdCount)}</p>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold uppercase text-gray-500">
            Housing Condition
          </label>
          <select
            value={form.housing}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, housing: e.target.value as HousingType }))
            }
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            {housingTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        <div className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3 text-sm">
          <span className="text-gray-500">Computed vulnerability: </span>
          <span className="font-semibold text-gray-900">{previewVulnerability}</span>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">{initialValues ? 'Save Changes' : 'Add Beneficiary'}</Button>
        </div>
      </form>
    </Modal>
  )
}
