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
import { useAuth } from '../../context/AuthContext'
import { logAuditEvent } from '../../services/auditStorage'
import {
  buildReportPreview,
  downloadHistoryReport,
  exportReportFromTemplate,
  generateReportFromTemplate,
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

  function handleGenerate(template: ReportTemplate) {
    const entry = generateReportFromTemplate(template, generatedBy)
    setViewPreview(buildReportPreview(entry))
    setStatusMessage(`Generated ${entry.name} and added it to Report History.`)
    logReportAction(`Generated ${template.title} (${entry.name}).`)
  }

  function handleExport(template: ReportTemplate, format: ReportFormat) {
    const entry = exportReportFromTemplate(template, generatedBy, format)
    setStatusMessage(`Exported ${entry.name} and saved it to Report History.`)
    logReportAction(`Exported ${template.title} as ${format} (${entry.name}).`)
  }

  function handleView(entry: ReportHistoryEntry) {
    setViewPreview(buildReportPreview(entry))
  }

  function handleDownload(entry: ReportHistoryEntry) {
    downloadHistoryReport(entry)
    setStatusMessage(`Downloaded ${entry.name.replace(/\.(pdf|xlsx)$/i, '.csv')}.`)
  }

  function handleDownloadFromModal() {
    if (!viewPreview) return
    downloadHistoryReport(viewPreview.entry)
    setStatusMessage(`Downloaded ${viewPreview.entry.name.replace(/\.(pdf|xlsx)$/i, '.csv')}.`)
  }

  return (
    <>
      <AdminHeader title="System Reports Panel" />
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
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handleGenerate(report)}
                      className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Generate Report
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
                        <td className="max-w-0 truncate px-4 py-3 align-middle font-medium text-gray-900">
                          {row.name}
                        </td>
                        <td className="max-w-0 truncate px-4 py-3 align-middle text-gray-600">
                          {row.generatedBy}
                        </td>
                        <td className="max-w-0 truncate px-4 py-3 align-middle text-gray-500">
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
        onClose={() => setViewPreview(null)}
        preview={viewPreview}
        onDownload={handleDownloadFromModal}
      />
    </>
  )
}
