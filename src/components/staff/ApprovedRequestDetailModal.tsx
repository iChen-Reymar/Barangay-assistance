import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'

export interface StaffApprovedRequest {
  id: string
  beneficiary: string
  association: string
  program: string
  approvedDate: string
  approvedBy: string
  beneficiaries: number
  status: string
  distributionDate: string
}

interface ApprovedRequestDetailModalProps {
  open: boolean
  onClose: () => void
  request: StaffApprovedRequest | null
  onDownload: () => void
}

function statusVariant(status: string) {
  if (status === 'RELEASED') return 'success'
  if (status === 'SCHEDULED') return 'info'
  if (status === 'PENDING COLLECTION') return 'warning'
  return 'neutral'
}

export function ApprovedRequestDetailModal({
  open,
  onClose,
  request,
  onDownload,
}: ApprovedRequestDetailModalProps) {
  if (!request) return null

  return (
    <Modal open={open} onClose={onClose} title="Approved Request Details" size="lg">
      <div className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase text-gray-400">Request ID</p>
            <p className="text-lg font-bold text-gray-900">{request.id}</p>
          </div>
          <Badge variant={statusVariant(request.status)}>{request.status}</Badge>
        </div>

        <dl className="grid gap-4 rounded-lg border border-gray-100 bg-gray-50 p-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-[10px] font-semibold uppercase text-gray-400">Beneficiary</dt>
            <dd className="mt-0.5 font-medium text-gray-900">{request.beneficiary}</dd>
          </div>
          <div>
            <dt className="text-[10px] font-semibold uppercase text-gray-400">Association</dt>
            <dd className="mt-0.5 text-gray-900">{request.association}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-[10px] font-semibold uppercase text-gray-400">Program</dt>
            <dd className="mt-0.5 text-gray-900">{request.program}</dd>
          </div>
          <div>
            <dt className="text-[10px] font-semibold uppercase text-gray-400">Approved Date</dt>
            <dd className="mt-0.5 text-gray-900">{request.approvedDate}</dd>
          </div>
          <div>
            <dt className="text-[10px] font-semibold uppercase text-gray-400">Approved By</dt>
            <dd className="mt-0.5 text-gray-900">{request.approvedBy}</dd>
          </div>
          <div>
            <dt className="text-[10px] font-semibold uppercase text-gray-400">Beneficiaries Served</dt>
            <dd className="mt-0.5 text-gray-900">{request.beneficiaries}</dd>
          </div>
          <div>
            <dt className="text-[10px] font-semibold uppercase text-gray-400">Distribution Date</dt>
            <dd className="mt-0.5 text-gray-900">{request.distributionDate}</dd>
          </div>
        </dl>

        <div className="rounded-lg border border-green-100 bg-green-50 p-4 text-sm text-green-900">
          This request has been approved. Use the disbursement status above to coordinate release or
          collection with the association contact.
        </div>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button type="button" onClick={onDownload}>
            Download Record
          </Button>
        </div>
      </div>
    </Modal>
  )
}
