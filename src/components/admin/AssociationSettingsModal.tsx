import { useEffect, useState, type FormEvent } from 'react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import type { Association, AssociationStatus } from '../../data/mockData'

interface AssociationSettingsModalProps {
  open: boolean
  onClose: () => void
  association: Association | null
  onSave: (id: string, status: AssociationStatus) => void
}

export function AssociationSettingsModal({
  open,
  onClose,
  association,
  onSave,
}: AssociationSettingsModalProps) {
  const [status, setStatus] = useState<AssociationStatus>('ACTIVE')

  useEffect(() => {
    if (!open || !association) return
    setStatus(association.status)
  }, [open, association])

  if (!association) return null

  const selected = association

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    onSave(selected.id, status)
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="Association Settings">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3">
          <p className="text-sm font-semibold text-gray-900">{selected.name}</p>
          <p className="text-xs text-gray-500">{selected.type}</p>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold uppercase text-gray-500">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as AssociationStatus)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
          <p className="mt-1 text-xs text-gray-500">
            Inactive associations will not appear in new assistance request assignments.
          </p>
        </div>

        <dl className="grid gap-3 rounded-lg border border-gray-100 bg-gray-50 p-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-[10px] font-semibold uppercase text-gray-400">Contact Person</dt>
            <dd className="mt-0.5 text-gray-900">{selected.contactPerson}</dd>
          </div>
          <div>
            <dt className="text-[10px] font-semibold uppercase text-gray-400">Contact Number</dt>
            <dd className="mt-0.5 text-gray-900">{selected.contactNumber}</dd>
          </div>
          <div>
            <dt className="text-[10px] font-semibold uppercase text-gray-400">Total Members</dt>
            <dd className="mt-0.5 text-gray-900">{selected.members}</dd>
          </div>
          <div>
            <dt className="text-[10px] font-semibold uppercase text-gray-400">Date Registered</dt>
            <dd className="mt-0.5 text-gray-900">{selected.dateRegistered}</dd>
          </div>
        </dl>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">Save Settings</Button>
        </div>
      </form>
    </Modal>
  )
}
