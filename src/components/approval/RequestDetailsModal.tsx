import { Modal } from '../ui/Modal'
import { RequestDetailsPanel } from './RequestDetailsPanel'
import type {
  DocumentStatus,
  QualificationStatus,
  ReviewableAssistanceItem,
} from '../../types/approval'

interface RequestDetailsModalProps {
  open: boolean
  onClose: () => void
  item: ReviewableAssistanceItem | null
  canVerify?: boolean
  onVerifyDocument?: (documentId: string, status: DocumentStatus) => void
  onVerifyQualification?: (checkId: string, status: QualificationStatus, notes?: string) => void
}

export function RequestDetailsModal({
  open,
  onClose,
  item,
  canVerify = false,
  onVerifyDocument,
  onVerifyQualification,
}: RequestDetailsModalProps) {
  if (!item) return null

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Request Review"
      size="lg"
    >
      <RequestDetailsPanel
        item={item}
        canVerify={canVerify}
        onVerifyDocument={onVerifyDocument}
        onVerifyQualification={onVerifyQualification}
      />
    </Modal>
  )
}
