import { useState, type FormEvent } from 'react'
import { useResetWhenOpen } from '../../hooks/useResetWhenOpen'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import {
  eligibilityCriteriaOptions,
  programAgencies,
  programCategories,
  type AssistanceProgram,
  type ProgramCategory,
} from '../../data/programsMockData'

export type ProgramFormInput = Omit<AssistanceProgram, 'id' | 'dateCreated' | 'status'>

interface ProgramFormModalProps {
  open: boolean
  onClose: () => void
  title: string
  initialValues?: AssistanceProgram
  onSave: (input: ProgramFormInput) => void
}

const emptyForm: ProgramFormInput = {
  name: '',
  category: 'Food',
  sponsoringAgency: 'DSWD',
  description: '',
  eligibilityCriteria: '',
  maxBeneficiaries: undefined,
  budgetAllocation: undefined,
  startDate: '',
  endDate: '',
}

function dateInputValue(value?: string) {
  if (!value) return ''
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return ''
  const year = parsed.getFullYear()
  const month = String(parsed.getMonth() + 1).padStart(2, '0')
  const day = String(parsed.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function openDatePicker(event: React.MouseEvent<HTMLInputElement>) {
  event.currentTarget.showPicker?.()
}

export function ProgramFormModal({
  open,
  onClose,
  title,
  initialValues,
  onSave,
}: ProgramFormModalProps) {
  const [form, setForm] = useState<ProgramFormInput>(emptyForm)
  const [error, setError] = useState('')

  useResetWhenOpen(open, initialValues, () => {
    if (initialValues) {
      setForm({
        name: initialValues.name,
        category: initialValues.category,
        sponsoringAgency: initialValues.sponsoringAgency,
        description: initialValues.description,
        eligibilityCriteria: initialValues.eligibilityCriteria,
        maxBeneficiaries: initialValues.maxBeneficiaries,
        budgetAllocation: initialValues.budgetAllocation,
        startDate: dateInputValue(initialValues.startDate),
        endDate: dateInputValue(initialValues.endDate),
      })
    } else {
      setForm(emptyForm)
    }
    setError('')
  })

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) {
      setError('Program name is required.')
      return
    }
    if (!form.description.trim()) {
      setError('Program description is required.')
      return
    }
    if (!form.eligibilityCriteria.trim()) {
      setError('Eligibility criteria is required.')
      return
    }
    if (!form.startDate.trim()) {
      setError('Start date is required.')
      return
    }
    if (form.endDate && form.endDate < form.startDate) {
      setError('End date cannot be earlier than the start date.')
      return
    }
    onSave({
      ...form,
      name: form.name.trim(),
      description: form.description.trim(),
      eligibilityCriteria: form.eligibilityCriteria.trim(),
      endDate: form.endDate?.trim() || undefined,
      maxBeneficiaries: form.maxBeneficiaries || undefined,
      budgetAllocation: form.budgetAllocation || undefined,
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

        <div>
          <label className="mb-1 block text-xs font-semibold uppercase text-gray-500">
            Program Name
          </label>
          <input
            required
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase text-gray-500">
              Category
            </label>
            <select
              value={form.category}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, category: e.target.value as ProgramCategory }))
              }
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {programCategories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase text-gray-500">
              Sponsoring Agency
            </label>
            <select
              value={form.sponsoringAgency}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, sponsoringAgency: e.target.value }))
              }
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {programAgencies.map((agency) => (
                <option key={agency} value={agency}>
                  {agency}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold uppercase text-gray-500">
            Description
          </label>
          <textarea
            required
            rows={3}
            value={form.description}
            onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold uppercase text-gray-500">
            Eligibility Criteria
          </label>
          <select
            required
            value={form.eligibilityCriteria}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, eligibilityCriteria: e.target.value }))
            }
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="">Select eligibility criteria</option>
            {form.eligibilityCriteria && !eligibilityCriteriaOptions.includes(form.eligibilityCriteria as typeof eligibilityCriteriaOptions[number]) ? (
              <option value={form.eligibilityCriteria}>{form.eligibilityCriteria}</option>
            ) : null}
            {eligibilityCriteriaOptions.map((criteria) => (
              <option key={criteria} value={criteria}>{criteria}</option>
            ))}
          </select>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase text-gray-500">
              Max Beneficiaries
            </label>
            <input
              type="number"
              min={1}
              value={form.maxBeneficiaries ?? ''}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  maxBeneficiaries: e.target.value ? Number(e.target.value) : undefined,
                }))
              }
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase text-gray-500">
              Budget Allocation (₱)
            </label>
            <input
              type="number"
              min={0}
              step={1000}
              value={form.budgetAllocation ?? ''}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  budgetAllocation: e.target.value ? Number(e.target.value) : undefined,
                }))
              }
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase text-gray-500">
              Start Date
            </label>
            <input
              required
              type="date"
              value={form.startDate}
              onChange={(e) => setForm((prev) => ({ ...prev, startDate: e.target.value }))}
              onClick={openDatePicker}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase text-gray-500">
              End Date (optional)
            </label>
            <input
              type="date"
              value={form.endDate ?? ''}
              onChange={(e) => setForm((prev) => ({ ...prev, endDate: e.target.value }))}
              onClick={openDatePicker}
              min={form.startDate || undefined}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">{initialValues ? 'Save Changes' : 'Add Program'}</Button>
        </div>
      </form>
    </Modal>
  )
}
