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
): ReportHistoryEntry | null {
  const mapping = staffReportMap[title]
  if (!mapping) return null

  return {
    id: crypto.randomUUID(),
    name: `${mapping.slug}_${formatExportDateStamp()}.${extensionForFormat(format)}`,
    generatedBy,
    date: formatAuditDate(new Date().toISOString()),
    format,
    reportType: mapping.reportType,
  }
}

export function buildStaffReportPreview(title: string, generatedBy: string): ReportPreview | null {
  const entry = createStaffReportEntry(title, generatedBy, 'PDF')
  if (!entry) return null
  return buildReportPreview(entry)
}

export function downloadStaffReportPdf(entry: ReportHistoryEntry): void {
  const preview = buildReportPreview(entry)
  const text = preview.sections
    .map((section) => `${section.heading}\n${section.lines.map((line) => `- ${line}`).join('\n')}`)
    .join('\n\n')

  const blob = new Blob([`\uFEFF${text}`], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = entry.name.replace(/\.pdf$/i, '.txt')
  link.click()
  URL.revokeObjectURL(url)
}

export function exportStaffReport(
  title: string,
  generatedBy: string,
  format: ReportFormat,
): ReportHistoryEntry | null {
  const entry = createStaffReportEntry(title, generatedBy, format)
  if (!entry) return null

  if (format === 'PDF') {
    downloadStaffReportPdf(entry)
  } else {
    downloadHistoryReport(entry)
  }

  return entry
}
