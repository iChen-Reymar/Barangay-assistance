import { useEffect, useState, type FormEvent } from 'react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { associationTypes, type Association, type AssociationType } from '../../data/mockData'
import { getAssociationHeadUsers } from '../../services/authStorage'
import type { StoredUser } from '../../types/auth'

export type AssociationFormInput = Omit<Association, 'id' | 'dateRegistered' | 'status'>

interface AssociationFormModalProps {
  open: boolean
  onClose: () => void
  title: string
  initialValues?: Association
  takenHeads?: { userId: string; associationName: string }[]
  existingNames?: string[]
  onSave: (input: AssociationFormInput, headUserId?: string) => void
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
  takenHeads = [],
  existingNames = [],
  onSave,
}: AssociationFormModalProps) {
  const [form, setForm] = useState<AssociationFormInput>(emptyForm)
  const [heads, setHeads] = useState<StoredUser[]>([])
  const [headUserId, setHeadUserId] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    const users = getAssociationHeadUsers()
    setHeads(users)
    const matched = initialValues
      ? users.find((user) => user.id === initialValues.headUserId) ??
        users.find(
          (user) => user.fullName.trim().toLowerCase() === initialValues.contactPerson.trim().toLowerCase(),
        )
      : undefined
    setHeadUserId(matched?.id ?? '')
    if (initialValues) {
      setForm({
        name: initialValues.name,
        type: initialValues.type,
        members: initialValues.members,
        contactPerson: matched?.fullName ?? initialValues.contactPerson,
        contactNumber: matched?.contactNumber ?? initialValues.contactNumber,
      })
    } else {
      setForm(emptyForm)
    }
    setError('')
  }, [open, initialValues])

  function selectHead(userId: string) {
    setHeadUserId(userId)
    const user = heads.find((entry) => entry.id === userId)
    if (!user) {
      if (initialValues) {
        setForm((prev) => ({
          ...prev,
          contactPerson: initialValues.contactPerson,
          contactNumber: initialValues.contactNumber,
        }))
      }
      return
    }
    setForm((prev) => ({
      ...prev,
      contactPerson: user.fullName,
      contactNumber: user.contactNumber,
    }))
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const name = form.name.trim()
    if (!name) {
      setError('Association name is required.')
      return
    }
    if (existingNames.some((entry) => entry.trim().toLowerCase() === name.toLowerCase())) {
      setError('An association with this name already exists.')
      return
    }
    if (!initialValues && !headUserId) {
      setError('Assign an association head.')
      return
    }
    if (headUserId && takenHeads.some((head) => head.userId === headUserId)) {
      setError('That user already heads another association.')
      return
    }
    if (!form.contactPerson.trim() || !form.contactNumber.trim()) {
      setError('Association head and contact number are required.')
      return
    }
    onSave(
      {
        ...form,
        name,
        contactPerson: form.contactPerson.trim(),
        contactNumber: form.contactNumber.trim(),
      },
      headUserId || undefined,
    )
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
          <label htmlFor="association-head" className="mb-1 block text-xs font-semibold uppercase text-gray-500">
            Association Head
          </label>
          <select
            id="association-head"
            required={!initialValues}
            value={headUserId}
            onChange={(e) => selectHead(e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="">{initialValues ? 'Keep current head' : 'Select a user'}</option>
            {heads
              .filter((user) => !takenHeads.some((head) => head.userId === user.id))
              .map((user) => (
                <option key={user.id} value={user.id}>
                  {user.fullName}
                </option>
              ))}
          </select>
          {heads.length === 0 && (
            <p className="mt-1 text-xs text-gray-500">
              Add an Association Head account first, then assign that user here.
            </p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold uppercase text-gray-500">
            Contact Number
          </label>
          <input
            required
            type="tel"
            readOnly
            value={form.contactNumber}
            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700"
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
