import type { ReportFormat, ReportHistoryEntry, ReportHistoryType } from '../data/mockData'
import { formatAuditDate } from './auditStorage'
import {
  buildReportPreview,
  downloadHistoryReport,
  type ReportPreview,
} from './reportHistoryService'
import { formatExportDateStamp } from '../utils/csvExport'

const staffReportMap: Record<string, { slug: string; reportType: ReportHistoryType }> = {
  'Beneficiary Report': { slug: 'staff_beneficiary', reportType: 'beneficiary' },
  'Vulnerability Report': { slug: 'staff_vulnerability', reportType: 'vulnerability' },
  'Assistance Report': { slug: 'staff_assistance', reportType: 'assistance' },
  'Program Status Report': { slug: 'staff_program_status', reportType: 'approved' },
}

function extensionForFormat(format: ReportFormat): string {
  if (format === 'PDF') return 'pdf'
  if (format === 'EXCEL') return 'xlsx'
  return 'csv'
}

export function createStaffReportEntry(
  title: string,
  generatedBy: string,
  format: ReportFormat,
  userId?: string,
): ReportHistoryEntry | null {
  const mapping = staffReportMap[title]
  if (!mapping) return null

  return {
    id: crypto.randomUUID(),
    name: `${mapping.slug}_${formatExportDateStamp()}.${extensionForFormat(format)}`,
    generatedBy,
    userId: userId || undefined,
    date: formatAuditDate(new Date().toISOString()),
    format,
    reportType: mapping.reportType,
  }
}

export function buildStaffReportPreview(
  title: string,
  generatedBy: string,
  userId?: string,
): ReportPreview | null {
  const entry = createStaffReportEntry(title, generatedBy, 'PDF', userId)
  if (!entry) return null
  return buildReportPreview(entry)
}

export function downloadStaffReportPdf(entry: ReportHistoryEntry): void {
  downloadHistoryReport({ ...entry, format: 'PDF', name: entry.name.replace(/\.(csv|xlsx|txt)$/i, '.pdf') })
}

export function exportStaffReport(
  title: string,
  generatedBy: string,
  format: ReportFormat,
  userId?: string,
): ReportHistoryEntry | null {
  const entry = createStaffReportEntry(title, generatedBy, format, userId)
  if (!entry) return null
  downloadHistoryReport(entry)
  return entry
}
