import { useEffect, useState } from 'react'
import { FileText, Download } from 'lucide-react'
import { DashboardNavbar } from '../../components/layout/DashboardNavbar'
import { ReportHistoryViewModal } from '../../components/admin/ReportHistoryViewModal'
import { Button } from '../../components/ui/Button'
import { staffReports } from '../../data/staffMockData'
import { useAuth } from '../../context/AuthContext'
import { useStaffDisplayUser } from '../../hooks/useStaffDisplayUser'
import { logAuditEvent } from '../../services/auditStorage'
import {
  buildStaffReportPreview,
  downloadStaffReportPdf,
  exportStaffReport,
} from '../../services/staffReportService'
import { downloadHistoryReport, type ReportPreview } from '../../services/reportHistoryService'

export default function StaffReportsPage() {
  const { user, profile } = useAuth()
  const displayUser = useStaffDisplayUser()
  const generatedBy = displayUser.name
  const [viewPreview, setViewPreview] = useState<ReportPreview | null>(null)
  const [statusMessage, setStatusMessage] = useState('')

  useEffect(() => {
    if (!statusMessage) return
    const timer = window.setTimeout(() => setStatusMessage(''), 4000)
    return () => window.clearTimeout(timer)
  }, [statusMessage])

  function logExport(title: string, format: string, fileName: string) {
    logAuditEvent({
      user: generatedBy,
      userEmail: profile?.email ?? user?.email,
      action: 'Report Generated',
      actionColor: 'blue',
      description: `Staff exported ${title} as ${format} (${fileName}).`,
      entityType: 'report',
      changes: [],
    })
  }

  function handleView(title: string) {
    const preview = buildStaffReportPreview(title, generatedBy)
    if (!preview) return
    setViewPreview(preview)
  }

  function handleExportPdf(title: string) {
    const entry = exportStaffReport(title, generatedBy, 'PDF')
    if (!entry) return
    setStatusMessage(`Exported ${entry.name.replace(/\.pdf$/i, '.txt')}.`)
    logExport(title, 'PDF', entry.name)
  }

  function handleExportCsv(title: string) {
    const entry = exportStaffReport(title, generatedBy, 'CSV')
    if (!entry) return
    setStatusMessage(`Exported ${entry.name.replace(/\.pdf$/i, '.csv')}.`)
    logExport(title, 'CSV', entry.name)
  }

  function handleDownloadFromModal() {
    if (!viewPreview) return
    if (viewPreview.entry.format === 'PDF') {
      downloadStaffReportPdf(viewPreview.entry)
    } else {
      downloadHistoryReport(viewPreview.entry)
    }
    setStatusMessage(`Downloaded report for ${viewPreview.entry.name}.`)
  }

  return (
    <>
      <DashboardNavbar
        title="System Reports Panel"
        searchPlaceholder="Search records, requests, files..."
        userName={displayUser.name}
        userInitials={displayUser.initials}
      />
      <main className="flex-1 overflow-y-auto p-4 sm:p-5 md:p-6">
        {statusMessage ? (
          <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            {statusMessage}
          </div>
        ) : null}

        <div className="mb-4">
          <h2 className="text-base font-bold text-gray-900">Available Reports</h2>
          <p className="mt-1 text-sm text-gray-500">
            Generate and export localized reports for barangay operations.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {staffReports.map((report) => (
            <div key={report.title} className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-green-50">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-bold text-gray-900">{report.title}</h3>
              <p className="mt-1 text-sm text-gray-500">{report.description}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => handleView(report.title)}>
                  View
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleExportPdf(report.title)}>
                  <Download className="h-3 w-3" />
                  Export PDF
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleExportCsv(report.title)}>
                  <Download className="h-3 w-3" />
                  Export CSV
                </Button>
              </div>
            </div>
          ))}
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
