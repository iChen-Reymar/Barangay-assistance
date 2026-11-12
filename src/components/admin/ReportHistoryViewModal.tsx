import { useState } from 'react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import type { ReportFormat } from '../../data/mockData'
import type { ReportPreview } from '../../services/reportHistoryService'

interface ReportHistoryViewModalProps {
  open: boolean
  onClose: () => void
  preview: ReportPreview | null
  onDownload: (format: ReportFormat, reportSectionId?: string) => void
}

const PREVIEW_LIMIT = 8

function cellText(value: string | number | undefined) {
  const text = String(value ?? '').trim()
  return text || '—'
}

export function ReportHistoryViewModal({
  open,
  onClose,
  preview,
  onDownload,
}: ReportHistoryViewModalProps) {
  const [sheetIndex, setSheetIndex] = useState(0)

  if (!preview) return null

  const selectedSheetIndex = Math.min(sheetIndex, Math.max(preview.sheets.length - 1, 0))
  const sheet = preview.sheets[selectedSheetIndex]
  const shown = sheet ? sheet.rows.slice(0, PREVIEW_LIMIT) : []
  const hiddenCount = sheet ? Math.max(sheet.rows.length - shown.length, 0) : 0
  const selectsGeneratedRequest = preview.entry.reportType === 'ai_scoring'
  const selectedReportSectionId = selectsGeneratedRequest ? sheet?.id : undefined

  return (
    <Modal open={open} onClose={onClose} title={preview.title} size="xl">
      <div className="space-y-4">
        <div className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3 text-sm text-gray-600">
          <p>
            {selectsGeneratedRequest && sheet
              ? `${preview.summary[0]} · ${sheet.rows.length} record${sheet.rows.length === 1 ? '' : 's'} for the selected request`
              : preview.summary.join(' · ')}
          </p>
          <p className="mt-1">
            Review the rows below, then download {selectsGeneratedRequest ? 'the selected request report' : 'the full report'}.
          </p>
        </div>

        {preview.sheets.length > 1 ? (
          <label className="block max-w-md">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
              {preview.entry.reportType === 'beneficiary'
                ? 'Association'
                : preview.entry.reportType === 'ai_scoring'
                  ? 'Generated request'
                  : 'Report section'}
            </span>
            <select
              value={selectedSheetIndex}
              onChange={(event) => setSheetIndex(Number(event.target.value))}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm font-medium text-gray-800 shadow-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            >
              {preview.sheets.map((item, index) => (
                <option key={item.name} value={index}>
                  {item.name} ({item.rows.length})
                </option>
              ))}
            </select>
          </label>
        ) : sheet ? (
          <h3 className="text-sm font-semibold text-gray-900">
            {sheet.name} ({sheet.rows.length})
          </h3>
        ) : null}

        {sheet && sheet.rows.length === 0 ? (
          <p className="rounded-lg border border-dashed border-gray-200 px-4 py-8 text-center text-sm text-gray-500">
            No records yet.
          </p>
        ) : null}

        {sheet && shown.length > 0 ? (
          <>
            <div className="hidden overflow-x-auto rounded-lg border border-gray-200 md:block">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-gray-50 text-xs font-semibold uppercase text-gray-500">
                  <tr>
                    {sheet.headers.map((header) => (
                      <th key={header} className="whitespace-nowrap px-3 py-2">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {shown.map((row, rowIndex) => (
                    <tr key={rowIndex} className="border-t border-gray-100 align-top">
                      {sheet.headers.map((header, columnIndex) => (
                        <td key={header} className="max-w-[16rem] px-3 py-2 break-words text-gray-700">
                          {cellText(row[columnIndex])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-3 md:hidden">
              {shown.map((row, rowIndex) => (
                <article key={rowIndex} className="rounded-lg border border-gray-200 p-3">
                  {sheet.headers.map((header, columnIndex) => (
                    <div key={header} className="grid grid-cols-[7.5rem_minmax(0,1fr)] gap-2 border-b border-gray-50 py-1.5 last:border-0">
                      <span className="text-xs font-semibold uppercase text-gray-500">{header}</span>
                      <span className="text-sm break-words text-gray-800">{cellText(row[columnIndex])}</span>
                    </div>
                  ))}
                </article>
              ))}
            </div>

            <p className="text-xs text-gray-500">
              Showing {shown.length} of {sheet.rows.length} records.
              {hiddenCount > 0 ? ` The downloaded file includes the other ${hiddenCount}.` : ''}
            </p>
          </>
        ) : null}

        <div className="flex flex-col gap-2 border-t border-gray-100 pt-4 sm:flex-row sm:flex-wrap sm:justify-end">
          <Button type="button" variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button type="button" onClick={() => onDownload('PDF', selectedReportSectionId)}>
            Download PDF
          </Button>
          <Button type="button" variant="outline" onClick={() => onDownload('EXCEL', selectedReportSectionId)}>
            Download Excel
          </Button>
          <Button type="button" variant="outline" onClick={() => onDownload('CSV', selectedReportSectionId)}>
            Download CSV
          </Button>
        </div>
      </div>
    </Modal>
  )
}
