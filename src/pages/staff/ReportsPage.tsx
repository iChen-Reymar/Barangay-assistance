import { useEffect, useState } from 'react'
import { FileText } from 'lucide-react'
import { DashboardNavbar } from '../../components/layout/DashboardNavbar'
import { ReportExportMenu } from '../../components/admin/ReportExportMenu'
import { ReportHistoryViewModal } from '../../components/admin/ReportHistoryViewModal'
import { staffReports } from '../../data/staffMockData'
import type { ReportFormat } from '../../data/mockData'
import { useAuth } from '../../context/useAuth'
import { useStaffDisplayUser } from '../../hooks/useStaffDisplayUser'
import { logAuditEvent } from '../../services/auditStorage'
import {
  buildStaffReportPreview,
  exportStaffReport,
} from '../../services/staffReportService'
import type { ReportPreview } from '../../services/reportHistoryService'

export default function StaffReportsPage() {
  const { user, profile } = useAuth()
  const displayUser = useStaffDisplayUser()
  const generatedBy = displayUser.name
  const [viewPreview, setViewPreview] = useState<ReportPreview | null>(null)
  const [viewTitle, setViewTitle] = useState<string | null>(null)
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
    const preview = buildStaffReportPreview(title, generatedBy, user?.id)
    if (!preview) return
    setViewTitle(title)
    setViewPreview(preview)
  }

  function handleExport(title: string, format: ReportFormat) {
<<<<<<< HEAD
    const entry = exportStaffReport(title, generatedBy, format)
=======
    const entry = exportStaffReport(title, generatedBy, format, user?.id)
>>>>>>> 8db0b93 (Init)
    if (!entry) return
    setStatusMessage(`Exported ${entry.name}.`)
    logExport(title, format, entry.name)
  }

  function handleDownloadFromModal(format: ReportFormat) {
    if (!viewTitle) return
    handleExport(viewTitle, format)
  }

  return (
    <>
      <DashboardNavbar
        title="Export Reports"
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
              <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                <button
                  type="button"
                  onClick={() => handleView(report.title)}
                  className="rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white hover:bg-primary-dark sm:py-1.5"
                >
                  View Report
                </button>
                <ReportExportMenu onExport={(format) => handleExport(report.title, format)} />
              </div>
            </div>
          ))}
        </div>
      </main>

      <ReportHistoryViewModal
        open={viewPreview !== null}
        onClose={() => {
          setViewPreview(null)
          setViewTitle(null)
        }}
        preview={viewPreview}
        onDownload={handleDownloadFromModal}
      />
    </>
  )
}
