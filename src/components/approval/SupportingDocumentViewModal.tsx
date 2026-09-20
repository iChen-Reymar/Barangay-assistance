import { FileArchive, FileSpreadsheet, FileText, ImageIcon } from 'lucide-react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { formatDecisionDate } from '../../services/decisionStorage'
import type { DocumentPreview } from '../../services/supportingDocumentService'

interface SupportingDocumentViewModalProps {
  open: boolean
  onClose: () => void
  preview: DocumentPreview | null
  onDownload: () => void
}

function PreviewIcon({ kind }: { kind: DocumentPreview['kind'] }) {
  if (kind === 'image') return <ImageIcon className="h-8 w-8 text-gray-400" />
  if (kind === 'spreadsheet') return <FileSpreadsheet className="h-8 w-8 text-gray-400" />
  if (kind === 'archive') return <FileArchive className="h-8 w-8 text-gray-400" />
  return <FileText className="h-8 w-8 text-gray-400" />
}

export function SupportingDocumentViewModal({
  open,
  onClose,
  preview,
  onDownload,
}: SupportingDocumentViewModalProps) {
  if (!preview) return null

  const { document: doc } = preview

  return (
    <Modal open={open} onClose={onClose} title="Document Preview" size="lg">
      <div className="space-y-4">
        <div className="flex items-start gap-4 rounded-lg border border-gray-100 bg-gray-50 p-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-white border border-gray-200">
            <PreviewIcon kind={preview.kind} />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-gray-900">{doc.name}</p>
            <p className="mt-1 text-sm text-gray-600">
              {doc.type} · {doc.fileSize}
            </p>
            <p className="mt-1 text-xs text-gray-500">
              Uploaded {formatDecisionDate(doc.uploadedAt)}
            </p>
          </div>
        </div>

        {preview.kind === 'image' ? (
          <div className="flex aspect-video items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-100 text-sm text-gray-500">
            Image preview (demo) — {doc.name}
          </div>
        ) : null}

        <div className="max-h-72 overflow-y-auto rounded-lg border border-gray-100 bg-white p-4 font-mono text-xs text-gray-700 whitespace-pre-wrap">
          {preview.lines.join('\n')}
        </div>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button type="button" onClick={onDownload}>
            Download
          </Button>
        </div>
      </div>
    </Modal>
  )
}
