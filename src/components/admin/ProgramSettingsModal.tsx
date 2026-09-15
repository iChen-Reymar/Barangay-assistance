import { useEffect, useState, type FormEvent } from 'react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import type { AssistanceProgram, ProgramStatus } from '../../data/programsMockData'

interface ProgramSettingsModalProps {
  open: boolean
  onClose: () => void
  program: AssistanceProgram | null
  onSave: (id: string, status: ProgramStatus) => void
}

function formatCurrency(amount?: number) {
  if (amount === undefined) return '—'
  return `₱ ${amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`
}

export function ProgramSettingsModal({
  open,
  onClose,
  program,
  onSave,
}: ProgramSettingsModalProps) {
  const [status, setStatus] = useState<ProgramStatus>('ACTIVE')

  useEffect(() => {
    if (!open || !program) return
    setStatus(program.status)
  }, [open, program])

  if (!program) return null

  const selected = program

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    onSave(selected.id, status)
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="Program Settings">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3">
          <p className="text-sm font-semibold text-gray-900">{selected.name}</p>
          <p className="text-xs text-gray-500">
            {selected.category} · {selected.sponsoringAgency}
          </p>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold uppercase text-gray-500">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as ProgramStatus)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="CLOSED">Closed</option>
          </select>
          <p className="mt-1 text-xs text-gray-500">
            Only active programs appear in association assistance request forms.
          </p>
        </div>

        <dl className="grid gap-3 rounded-lg border border-gray-100 bg-gray-50 p-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-[10px] font-semibold uppercase text-gray-400">Budget</dt>
            <dd className="mt-0.5 text-gray-900">{formatCurrency(selected.budgetAllocation)}</dd>
          </div>
          <div>
            <dt className="text-[10px] font-semibold uppercase text-gray-400">Max Beneficiaries</dt>
            <dd className="mt-0.5 text-gray-900">{selected.maxBeneficiaries ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-[10px] font-semibold uppercase text-gray-400">Start Date</dt>
            <dd className="mt-0.5 text-gray-900">{selected.startDate}</dd>
          </div>
          <div>
            <dt className="text-[10px] font-semibold uppercase text-gray-400">End Date</dt>
            <dd className="mt-0.5 text-gray-900">{selected.endDate ?? 'Open-ended'}</dd>
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
