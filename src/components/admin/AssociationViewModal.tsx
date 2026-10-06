import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { ActiveBadge, StatusBadge } from './StatusBadge'
import { beneficiaries } from '../../data/mockData'
import type { Association } from '../../data/mockData'
import { getAssociationDetails, getAssociationMembers } from '../../services/memberStorage'
import { getAssistanceItems } from '../../services/decisionStorage'

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
  const associationName = selected.name.trim().toLowerCase()
  const linkedBeneficiaries = beneficiaries.filter(
    (row) => row.association.trim().toLowerCase() === associationName,
  )
  const linkedRequests = getAssistanceItems().filter(
    (row) => row.association.trim().toLowerCase() === associationName,
  )
  const memberProfile = getAssociationDetails()
  const linkedMembers =
    memberProfile.name.trim().toLowerCase() === associationName ? getAssociationMembers() : []

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
            <dt className="text-[10px] font-semibold uppercase text-gray-400">Association Head</dt>
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
            <dt className="text-[10px] font-semibold uppercase text-gray-400">Assistance Requests</dt>
            <dd className="mt-0.5 text-gray-900">{linkedRequests.length}</dd>
          </div>
          <div>
            <dt className="text-[10px] font-semibold uppercase text-gray-400">Member Records</dt>
            <dd className="mt-0.5 text-gray-900">{linkedMembers.length}</dd>
          </div>
          <div>
            <dt className="text-[10px] font-semibold uppercase text-gray-400">Association ID</dt>
            <dd className="mt-0.5 font-mono text-xs text-gray-600">{selected.id}</dd>
          </div>
        </dl>

        <div>
          <h4 className="mb-2 text-xs font-semibold uppercase text-gray-400">Relevant Records</h4>
          <div className="space-y-3">
            <RecordList
              title="Beneficiaries"
              empty="No beneficiary records are linked to this association."
              items={linkedBeneficiaries.slice(0, 5).map((row) => ({
                id: row.id,
                label: row.name,
                detail: `${row.vulnerability} vulnerability`,
              }))}
              extra={linkedBeneficiaries.length > 5 ? linkedBeneficiaries.length - 5 : 0}
            />
            <div>
              <p className="mb-1 text-xs font-semibold text-gray-500">Assistance requests</p>
              {linkedRequests.length === 0 ? (
                <p className="rounded-lg border border-dashed border-gray-200 px-3 py-2 text-sm text-gray-500">
                  No assistance requests are linked to this association.
                </p>
              ) : (
                <ul className="divide-y divide-gray-100 rounded-lg border border-gray-100">
                  {linkedRequests.slice(0, 5).map((row) => (
                    <li key={row.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                      <span className="font-medium text-gray-900">{row.requestType}</span>
                      <StatusBadge status={row.status} />
                    </li>
                  ))}
                </ul>
              )}
              {linkedRequests.length > 5 && (
                <p className="mt-2 text-xs text-gray-400">+ {linkedRequests.length - 5} more requests</p>
              )}
            </div>
            <RecordList
              title="Members"
              empty="No member records are linked to this association."
              items={linkedMembers.slice(0, 5).map((row) => ({
                id: row.id,
                label: row.name,
                detail: row.membershipStatus,
              }))}
              extra={linkedMembers.length > 5 ? linkedMembers.length - 5 : 0}
            />
          </div>
        </div>

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

function RecordList({
  title,
  empty,
  items,
  extra,
}: {
  title: string
  empty: string
  items: { id: string; label: string; detail: string }[]
  extra: number
}) {
  return (
    <div>
      <p className="mb-1 text-xs font-semibold text-gray-500">{title}</p>
      {items.length === 0 ? (
        <p className="rounded-lg border border-dashed border-gray-200 px-3 py-2 text-sm text-gray-500">{empty}</p>
      ) : (
        <ul className="divide-y divide-gray-100 rounded-lg border border-gray-100">
          {items.map((row) => (
            <li key={row.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
              <span className="font-medium text-gray-900">{row.label}</span>
              <span className="text-xs text-gray-500">{row.detail}</span>
            </li>
          ))}
        </ul>
      )}
      {extra > 0 && <p className="mt-2 text-xs text-gray-400">+ {extra} more</p>}
    </div>
  )
}
