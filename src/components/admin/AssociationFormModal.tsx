import { useEffect, useState, type FormEvent } from 'react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { associationTypes, type Association, type AssociationType } from '../../data/mockData'

export type AssociationFormInput = Omit<Association, 'id' | 'dateRegistered' | 'status'>

interface AssociationFormModalProps {
  open: boolean
  onClose: () => void
  title: string
  initialValues?: Association
  onSave: (input: AssociationFormInput) => void
}

const emptyForm: AssociationFormInput = {
  name: '',
  type: 'Agricultural',
  members: 0,
  contactPerson: '',
  contactNumber: '',
}

export function AssociationFormModal({
  open,
  onClose,
  title,
  initialValues,
  onSave,
}: AssociationFormModalProps) {
  const [form, setForm] = useState<AssociationFormInput>(emptyForm)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    if (initialValues) {
      setForm({
        name: initialValues.name,
        type: initialValues.type,
        members: initialValues.members,
        contactPerson: initialValues.contactPerson,
        contactNumber: initialValues.contactNumber,
      })
    } else {
      setForm(emptyForm)
    }
    setError('')
  }, [open, initialValues])

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) {
      setError('Association name is required.')
      return
    }
    if (!form.contactPerson.trim()) {
      setError('Contact person is required.')
      return
    }
    if (!form.contactNumber.trim()) {
      setError('Contact number is required.')
      return
    }
    if (form.members < 1) {
      setError('Total members must be at least 1.')
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
          <label className="mb-1 block text-xs font-semibold uppercase text-gray-500">
            Association Name
          </label>
          <input
            required
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold uppercase text-gray-500">Type</label>
          <select
            value={form.type}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, type: e.target.value as AssociationType }))
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
            required
            type="number"
            min={1}
            value={form.members || ''}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, members: Number(e.target.value) || 0 }))
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
            onChange={(e) => setForm((prev) => ({ ...prev, contactPerson: e.target.value }))}
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

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">{initialValues ? 'Save Changes' : 'Add Association'}</Button>
        </div>
      </form>
    </Modal>
  )
}
