import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { ActiveBadge } from './StatusBadge'
import { beneficiaries } from '../../data/mockData'
import type { Association } from '../../data/mockData'

interface AssociationViewModalProps {
  open: boolean
  onClose: () => void
  association: Association | null
  onEdit: (association: Association) => void
  onSettings: (association: Association) => void
}

export function AssociationViewModal({
  open,
  onClose,
  association,
  onEdit,
  onSettings,
}: AssociationViewModalProps) {
  if (!association) return null

  const selected = association
  const linkedBeneficiaries = beneficiaries.filter((row) => row.association === selected.name)

  return (
    <Modal open={open} onClose={onClose} title="Association Details" size="lg">
      <div className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-gray-900">{selected.name}</h3>
            <p className="text-sm text-gray-500">{selected.type} Association</p>
          </div>
          <ActiveBadge status={selected.status} />
        </div>

        <dl className="grid gap-4 rounded-lg border border-gray-100 bg-gray-50 p-4 text-sm sm:grid-cols-2">
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
          <div>
            <dt className="text-[10px] font-semibold uppercase text-gray-400">Linked Beneficiaries</dt>
            <dd className="mt-0.5 text-gray-900">{linkedBeneficiaries.length}</dd>
          </div>
          <div>
            <dt className="text-[10px] font-semibold uppercase text-gray-400">Association ID</dt>
            <dd className="mt-0.5 font-mono text-xs text-gray-600">{selected.id}</dd>
          </div>
        </dl>

        {linkedBeneficiaries.length > 0 && (
          <div>
            <h4 className="mb-2 text-xs font-semibold uppercase text-gray-400">
              Registered Beneficiaries
            </h4>
            <ul className="divide-y divide-gray-100 rounded-lg border border-gray-100">
              {linkedBeneficiaries.slice(0, 5).map((row) => (
                <li key={row.id} className="flex items-center justify-between px-3 py-2 text-sm">
                  <span className="font-medium text-gray-900">{row.name}</span>
                  <span className="text-xs text-gray-500">{row.vulnerability} vulnerability</span>
                </li>
              ))}
            </ul>
            {linkedBeneficiaries.length > 5 && (
              <p className="mt-2 text-xs text-gray-400">
                + {linkedBeneficiaries.length - 5} more beneficiaries
              </p>
            )}
          </div>
        )}

        <div className="flex flex-wrap justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              onSettings(selected)
              onClose()
            }}
          >
            Settings
          </Button>
          <Button
            type="button"
            onClick={() => {
              onEdit(selected)
              onClose()
            }}
          >
            Edit Association
          </Button>
        </div>
      </div>
    </Modal>
  )
}
