import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import type { AssociationMember, VulnerabilityLevel } from '../../data/associationMockData'

interface MemberViewModalProps {
  open: boolean
  onClose: () => void
  member: AssociationMember | null
  onEdit: (member: AssociationMember) => void
}

function vulnerabilityVariant(level: VulnerabilityLevel) {
  if (level === 'HIGH') return 'danger'
  if (level === 'MEDIUM') return 'warning'
  return 'success'
}

export function MemberViewModal({ open, onClose, member, onEdit }: MemberViewModalProps) {
  if (!member) return null

  const selected = member

  return (
    <Modal open={open} onClose={onClose} title="Member Details" size="lg">
      <div className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-gray-900">{selected.name}</h3>
            <p className="text-sm text-gray-500">
              Member since {selected.dateJoined}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant={selected.membershipStatus === 'ACTIVE' ? 'success' : 'neutral'}>
              {selected.membershipStatus}
            </Badge>
            <Badge variant={vulnerabilityVariant(selected.vulnerability)}>
              {selected.vulnerability}
            </Badge>
          </div>
        </div>

        <dl className="grid gap-4 rounded-lg border border-gray-100 bg-gray-50 p-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-[10px] font-semibold uppercase text-gray-400">Age</dt>
            <dd className="mt-0.5 text-gray-900">{selected.age}</dd>
          </div>
          <div>
            <dt className="text-[10px] font-semibold uppercase text-gray-400">Family Size</dt>
            <dd className="mt-0.5 text-gray-900">{selected.familySize}</dd>
          </div>
          <div>
            <dt className="text-[10px] font-semibold uppercase text-gray-400">Contact Number</dt>
            <dd className="mt-0.5 text-gray-900">{selected.contactNumber}</dd>
          </div>
          <div>
            <dt className="text-[10px] font-semibold uppercase text-gray-400">Assistance Status</dt>
            <dd className="mt-0.5">
              <Badge
                variant={
                  selected.assistanceStatus === 'RECEIVED'
                    ? 'success'
                    : selected.assistanceStatus === 'PENDING'
                      ? 'warning'
                      : 'neutral'
                }
              >
                {selected.assistanceStatus}
              </Badge>
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-[10px] font-semibold uppercase text-gray-400">Address</dt>
            <dd className="mt-0.5 text-gray-900">{selected.address}</dd>
          </div>
          <div>
            <dt className="text-[10px] font-semibold uppercase text-gray-400">Senior Citizen</dt>
            <dd className="mt-0.5 text-gray-900">{selected.isSenior ? 'Yes' : 'No'}</dd>
          </div>
          <div>
            <dt className="text-[10px] font-semibold uppercase text-gray-400">PWD</dt>
            <dd className="mt-0.5 text-gray-900">{selected.isPwd ? 'Yes' : 'No'}</dd>
          </div>
          {selected.notes && (
            <div className="sm:col-span-2">
              <dt className="text-[10px] font-semibold uppercase text-gray-400">Notes</dt>
              <dd className="mt-0.5 text-gray-900">{selected.notes}</dd>
            </div>
          )}
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
            Edit Member
          </Button>
        </div>
      </div>
    </Modal>
  )
}
