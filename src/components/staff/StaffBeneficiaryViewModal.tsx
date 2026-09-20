import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import type { StaffBeneficiary } from '../../data/staffMockData'

interface StaffBeneficiaryViewModalProps {
  open: boolean
  onClose: () => void
  beneficiary: StaffBeneficiary | null
  onEdit: (beneficiary: StaffBeneficiary) => void
}

function formatCurrency(amount: number) {
  return `₱ ${amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`
}

function vulnerabilityVariant(level: StaffBeneficiary['vulnerability']) {
  if (level === 'HIGH') return 'danger'
  if (level === 'MEDIUM') return 'warning'
  return 'success'
}

function verificationVariant(status: StaffBeneficiary['verification']) {
  if (status === 'VERIFIED') return 'success'
  if (status === 'PENDING') return 'neutral'
  return 'danger'
}

export function StaffBeneficiaryViewModal({
  open,
  onClose,
  beneficiary,
  onEdit,
}: StaffBeneficiaryViewModalProps) {
  if (!beneficiary) return null

  return (
    <Modal open={open} onClose={onClose} title="Beneficiary Details" size="lg">
      <div className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-gray-900">{beneficiary.name}</h3>
            <p className="text-sm text-gray-500">{beneficiary.association}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant={vulnerabilityVariant(beneficiary.vulnerability)}>
              {beneficiary.vulnerability}
            </Badge>
            <Badge variant={verificationVariant(beneficiary.verification)}>
              {beneficiary.verification}
            </Badge>
          </div>
        </div>

        <dl className="grid gap-4 rounded-lg border border-gray-100 bg-gray-50 p-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-[10px] font-semibold uppercase text-gray-400">Record ID</dt>
            <dd className="mt-0.5 font-medium text-gray-900">{beneficiary.id}</dd>
          </div>
          <div>
            <dt className="text-[10px] font-semibold uppercase text-gray-400">Family Size</dt>
            <dd className="mt-0.5 text-gray-900">{beneficiary.familySize}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-[10px] font-semibold uppercase text-gray-400">Monthly Income</dt>
            <dd className="mt-0.5 text-gray-900">{formatCurrency(beneficiary.monthlyIncome)}</dd>
          </div>
        </dl>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button
            type="button"
            onClick={() => {
              onEdit(beneficiary)
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
