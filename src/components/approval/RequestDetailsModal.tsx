import { Modal } from '../ui/Modal'
import { RequestDetailsPanel } from './RequestDetailsPanel'
import type {
  DocumentStatus,
  QualificationStatus,
  ReviewableAssistanceItem,
} from '../../types/approval'
import type { GeneratedAssistanceRow } from '../../services/aiProcessing'

interface RequestDetailsModalProps {
  open: boolean
  onClose: () => void
  item: ReviewableAssistanceItem | null
  generatedRows?: GeneratedAssistanceRow[]
  canVerify?: boolean
  onVerifyDocument?: (documentId: string, status: DocumentStatus) => void
  onVerifyQualification?: (checkId: string, status: QualificationStatus, notes?: string) => void
}

export function RequestDetailsModal({
  open,
  onClose,
  item,
  generatedRows,
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
        generatedRows={generatedRows}
        canVerify={canVerify}
        onVerifyDocument={onVerifyDocument}
        onVerifyQualification={onVerifyQualification}
      />
    </Modal>
  )
}
