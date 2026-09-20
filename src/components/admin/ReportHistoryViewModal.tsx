import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import type { ReportPreview } from '../../services/reportHistoryService'

interface ReportHistoryViewModalProps {
  open: boolean
  onClose: () => void
  preview: ReportPreview | null
  onDownload: () => void
}

export function ReportHistoryViewModal({
  open,
  onClose,
  preview,
  onDownload,
}: ReportHistoryViewModalProps) {
  if (!preview) return null

  return (
    <Modal open={open} onClose={onClose} title="Report Preview" size="lg">
      <div className="space-y-5">
        <div className="rounded-lg border border-gray-100 bg-gray-50 p-4 text-sm">
          <p className="font-semibold text-gray-900">{preview.entry.name}</p>
          <p className="mt-1 text-gray-600">
            {preview.entry.generatedBy} · {preview.entry.date} · {preview.entry.format}
          </p>
        </div>

        {preview.sections.map((section) => (
          <section key={section.heading}>
            <h3 className="text-xs font-bold uppercase tracking-wide text-gray-500">
              {section.heading}
            </h3>
            <ul className="mt-2 max-h-48 space-y-1 overflow-y-auto rounded-lg border border-gray-100 bg-white p-3 text-sm text-gray-700">
              {section.lines.map((line, index) => (
                <li key={`${section.heading}-${index}`} className="border-b border-gray-50 pb-1 last:border-0">
                  {line}
                </li>
              ))}
            </ul>
          </section>
        ))}

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
