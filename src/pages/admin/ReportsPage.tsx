import { useEffect, useState } from 'react'
import {
  Users,
  Shield,
  HandHeart,
  Cpu,
  CheckCircle,
  FileText,
} from 'lucide-react'
import { AdminHeader } from '../../components/admin/AdminHeader'
import { Pagination } from '../../components/admin/Pagination'
import { ReportExportMenu } from '../../components/admin/ReportExportMenu'
import { ReportHistoryViewModal } from '../../components/admin/ReportHistoryViewModal'
import { TableActionsCell } from '../../components/ui/TableActionsCell'
import {
  TABLE_DESKTOP_CLASS,
  TABLE_ROW_CLASS,
  tableBodyMinHeight,
} from '../../components/ui/tableLayout'
import { PAGE_SIZE_DEFAULT, usePagination } from '../../hooks/usePagination'
import { reportTemplates } from '../../data/mockData'
import type { ReportFormat, ReportHistoryEntry, ReportTemplate } from '../../data/mockData'
import { useAuth } from '../../context/useAuth'
import { logAuditEvent } from '../../services/auditStorage'
import {
  buildReportPreview,
  downloadHistoryReport,
  exportReportFromTemplate,
  getReportHistory,
  subscribeReportHistory,
  type ReportPreview,
} from '../../services/reportHistoryService'

const iconMap = {
  users: Users,
  shield: Shield,
  hand: HandHeart,
  cpu: Cpu,
  check: CheckCircle,
  file: FileText,
}

function formatBadgeClass(format: ReportFormat): string {
  if (format === 'PDF') return 'text-red-600'
  if (format === 'EXCEL') return 'text-green-600'
  return 'text-blue-600'
}

export default function ReportsPage() {
  const { user, profile } = useAuth()
  const generatedBy = profile?.fullName ?? user?.fullName ?? 'Administrator'

  const [history, setHistory] = useState<ReportHistoryEntry[]>(() => getReportHistory())
  const [viewPreview, setViewPreview] = useState<ReportPreview | null>(null)
  const [viewTemplate, setViewTemplate] = useState<ReportTemplate | null>(null)
  const [statusMessage, setStatusMessage] = useState('')

  useEffect(() => {
    return subscribeReportHistory(() => setHistory(getReportHistory()))
  }, [])

  const historyPagination = usePagination(
    history,
    PAGE_SIZE_DEFAULT,
    `${history.length}-${history[0]?.id ?? ''}`,
    'entries',
  )

  const historyTableRows = Array.from({ length: PAGE_SIZE_DEFAULT }, (_, index) => {
    return historyPagination.paginatedItems[index] ?? null
  })

  const historyColWidths = ['28%', '18%', '22%', '10%', '22%']

  useEffect(() => {
    if (!statusMessage) return
    const timer = window.setTimeout(() => setStatusMessage(''), 4000)
    return () => window.clearTimeout(timer)
  }, [statusMessage])

  function logReportAction(description: string) {
    logAuditEvent({
      user: generatedBy,
      userEmail: profile?.email ?? user?.email,
      action: 'Report Generated',
      actionColor: 'blue',
      description,
      entityType: 'report',
      changes: [],
    })
  }

  function handleViewTemplate(template: ReportTemplate) {
    setViewTemplate(template)
    setViewPreview(buildReportPreview({
      id: `preview-${template.slug}`,
      name: template.title,
      generatedBy,
      date: new Date().toLocaleString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' }),
      format: 'PDF',
      reportType: template.reportType,
    }))
  }

  function handleExport(template: ReportTemplate, format: ReportFormat) {
    const entry = exportReportFromTemplate(template, generatedBy, format, user?.id)
    setStatusMessage(`Exported ${entry.name} and saved it to Report History.`)
    logReportAction(`Exported ${template.title} as ${format} (${entry.name}).`)
  }

  function handleView(entry: ReportHistoryEntry) {
    setViewTemplate(null)
    setViewPreview(buildReportPreview(entry))
  }

  function handleDownload(entry: ReportHistoryEntry) {
    downloadHistoryReport(entry)
    setStatusMessage(`Downloaded ${entry.name}.`)
  }

  function handleDownloadFromModal(format: ReportFormat) {
    if (viewTemplate) {
      handleExport(viewTemplate, format)
      return
    }
    if (!viewPreview) return
    const extension = format === 'PDF' ? 'pdf' : format === 'EXCEL' ? 'xlsx' : 'csv'
    const name = viewPreview.entry.name.replace(/\.(pdf|xlsx|csv)$/i, `.${extension}`)
    downloadHistoryReport({ ...viewPreview.entry, format, name })
    setStatusMessage(`Downloaded ${name}.`)
  }

  return (
    <>
      <AdminHeader title="Export Reports" />
      <main className="flex-1 overflow-y-auto p-4 sm:p-5 md:p-6">
        {statusMessage ? (
          <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            {statusMessage}
          </div>
        ) : null}

        <div className="mb-8">
          <h2 className="text-base font-bold text-gray-900">Available Assistance Reports</h2>
          <p className="mt-1 text-sm text-gray-500">
            Select and configure templates to generate localized reports.
          </p>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {reportTemplates.map((report) => {
              const Icon = iconMap[report.icon as keyof typeof iconMap]
              return (
                <div
                  key={report.title}
                  className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm"
                >
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-green-50">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-bold text-gray-900">{report.title}</h3>
                  <p className="mt-1 text-sm text-gray-500">{report.description}</p>
                  <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                    <button
                      type="button"
                      onClick={() => handleViewTemplate(report)}
                      className="rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white hover:bg-primary-dark sm:py-1.5"
                    >
                      View Report
                    </button>
                    <ReportExportMenu onExport={(format) => handleExport(report, format)} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-5 py-4">
            <h2 className="text-base font-bold text-gray-900">Report History</h2>
          </div>
          <div
            className="overflow-x-auto"
            style={
              history.length > 0
                ? { minHeight: tableBodyMinHeight(PAGE_SIZE_DEFAULT) }
                : undefined
            }
          >
            <table className={TABLE_DESKTOP_CLASS}>
              <colgroup>
                {historyColWidths.map((width, index) => (
                  <col key={index} style={{ width }} />
                ))}
              </colgroup>
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
                  <th className="px-4 py-3">Report Name</th>
                  <th className="px-4 py-3">Generated By</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Format</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {history.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                      No reports generated yet.
                    </td>
                  </tr>
                ) : (
                  historyTableRows.map((row, index) =>
                    row ? (
                      <tr key={row.id} className={`${TABLE_ROW_CLASS} border-b border-gray-50 hover:bg-gray-50`}>
                        <td className="whitespace-normal break-words px-4 py-3 align-middle font-medium text-gray-900">
                          {row.name}
                        </td>
                        <td className="whitespace-normal break-words px-4 py-3 align-middle text-gray-600">
                          {row.generatedBy}
                        </td>
                        <td className="whitespace-normal break-words px-4 py-3 align-middle text-gray-500">
                          {row.date}
                        </td>
                        <td className="px-4 py-3 align-middle">
                          <span className={`font-semibold ${formatBadgeClass(row.format)}`}>
                            {row.format}
                          </span>
                        </td>
                        <td className="px-4 py-3 align-middle">
                          <TableActionsCell>
                            <button
                              type="button"
                              onClick={() => handleView(row)}
                              className="shrink-0 text-sm font-semibold text-primary hover:underline"
                            >
                              View
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDownload(row)}
                              className="shrink-0 text-sm font-semibold text-primary hover:underline"
                            >
                              Download
                            </button>
                          </TableActionsCell>
                        </td>
                      </tr>
                    ) : (
                      <tr
                        key={`history-placeholder-${index}`}
                        className={`${TABLE_ROW_CLASS} border-b border-gray-50`}
                        aria-hidden
                      >
                        <td colSpan={5} className="px-4 py-3">
                          &nbsp;
                        </td>
                      </tr>
                    ),
                  )
                )}
              </tbody>
            </table>
          </div>
          {history.length > 0 ? (
            <Pagination
              showing={historyPagination.showing}
              currentPage={historyPagination.currentPage}
              totalPages={historyPagination.totalPages}
              onPageChange={historyPagination.setCurrentPage}
            />
          ) : null}
        </div>
      </main>

      <ReportHistoryViewModal
        open={viewPreview !== null}
        onClose={() => {
          setViewPreview(null)
          setViewTemplate(null)
        }}
        preview={viewPreview}
        onDownload={handleDownloadFromModal}
      />
    </>
  )
}
