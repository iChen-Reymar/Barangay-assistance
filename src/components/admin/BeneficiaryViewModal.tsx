import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { VulnerabilityBadge, ActiveBadge } from './StatusBadge'
import type { Beneficiary } from '../../data/mockData'

interface BeneficiaryViewModalProps {
  open: boolean
  onClose: () => void
  beneficiary: Beneficiary | null
  onEdit: (beneficiary: Beneficiary) => void
}

function formatCurrency(amount: number) {
  return `₱ ${amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`
}

export function BeneficiaryViewModal({
  open,
  onClose,
  beneficiary,
  onEdit,
}: BeneficiaryViewModalProps) {
  if (!beneficiary) return null

  const selected = beneficiary

  return (
    <Modal open={open} onClose={onClose} title="Beneficiary Details">
      <div className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-gray-900">{selected.name}</h3>
            <p className="text-sm text-gray-500">{selected.association}</p>
          </div>
          <div className="flex gap-2">
            <VulnerabilityBadge level={selected.vulnerability} />
            <ActiveBadge status={selected.status} />
          </div>
        </div>

        <dl className="grid gap-4 rounded-lg border border-gray-100 bg-gray-50 p-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-[10px] font-semibold uppercase text-gray-400">Family Size</dt>
            <dd className="mt-0.5 text-gray-900">{selected.familySize}</dd>
          </div>
          <div>
            <dt className="text-[10px] font-semibold uppercase text-gray-400">Monthly Income</dt>
            <dd className="mt-0.5 text-gray-900">{formatCurrency(selected.monthlyIncome)}</dd>
          </div>
          <div>
            <dt className="text-[10px] font-semibold uppercase text-gray-400">Elderly</dt>
            <dd className="mt-0.5 text-gray-900">{selected.elderly}</dd>
          </div>
          <div>
            <dt className="text-[10px] font-semibold uppercase text-gray-400">PWD</dt>
            <dd className="mt-0.5 text-gray-900">{selected.pwd}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-[10px] font-semibold uppercase text-gray-400">Housing</dt>
            <dd className="mt-0.5 text-gray-900">{selected.housing}</dd>
          </div>
        </dl>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button
            type="button"
            onClick={() => {
              onEdit(selected)
              onClose()
            }}
          >
            Edit Beneficiary
          </Button>
        </div>
      </div>
    </Modal>
  )
}
