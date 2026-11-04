import type { ReportHistoryEntry, ReportHistoryType } from '../data/mockData'
import { getGeneratedAssistanceList } from './aiProcessing'
import { getAuditLogs } from './auditStorage'
import { getAssistanceItems } from './decisionStorage'
import { getAidRecords } from './aidRecordStorage'
import { getAssociationMembers } from './memberStorage'
import { getPrograms } from './programStorage'
import { getPrivacySettings, maskEmail, maskIp, maskPhone } from './privacyStorage'
import type { WorkbookSheet } from '../utils/xlsxExport'

export type ReportSheet = {
  name: string
  headers: string[]
  rows: (string | number)[][]
}

export type ReportDataset = {
  title: string
  summary: string[]
  sheets: ReportSheet[]
}

function yesNo(value: boolean): string {
  return value ? 'Yes' : 'No'
}

function phone(value: string): string {
  const settings = getPrivacySettings()
  if (!value.trim()) return ''
  return settings.maskContactInExports ? maskPhone(value) : value
}

function sortedMembers() {
  return getAssociationMembers().slice().sort((left, right) => {
    const association = (left.associationName ?? '').localeCompare(right.associationName ?? '')
    return association || left.name.localeCompare(right.name)
  })
}

function emptySheet(name: string, headers: string[]): ReportSheet {
  return { name, headers, rows: [] }
}

function beneficiarySheet(): ReportSheet {
  const members = sortedMembers()
  return {
    name: 'Beneficiaries',
    headers: [
      'Name',
      'Association',
      'Age',
      'Family Size',
      'Address',
      'Contact Number',
      'Senior',
      'PWD',
      'Vulnerability',
      'Membership',
      'Assistance',
      'Verified',
    ],
    rows: members.map((member) => [
      member.name,
      member.associationName ?? '',
      member.age,
      member.familySize,
      member.address,
      phone(member.contactNumber),
      yesNo(member.isSenior),
      yesNo(member.isPwd),
      member.vulnerability,
      member.membershipStatus,
      member.assistanceStatus,
      member.staffVerified ? 'Verified' : 'Unverified',
    ]),
  }
}

function vulnerabilitySheet(): ReportSheet {
  const scored = getGeneratedAssistanceList().slice().sort((left, right) => left.rank - right.rank)
  if (scored.length > 0) {
    return {
      name: 'Vulnerability',
      headers: ['Rank', 'Name', 'Association', 'Score', 'Classification', 'Program', 'Verification'],
      rows: scored.map((row) => [
        row.rank,
        row.name,
        row.association,
        row.score,
        row.classification,
        row.program,
        row.verification,
      ]),
    }
  }
  const rank = { HIGH: 0, MEDIUM: 1, LOW: 2 }
  const members = sortedMembers().sort(
    (left, right) => rank[left.vulnerability] - rank[right.vulnerability] || left.name.localeCompare(right.name),
  )
  return {
    name: 'Vulnerability',
    headers: ['Name', 'Association', 'Vulnerability', 'Family Size', 'Age', 'Senior', 'PWD'],
    rows: members.map((member) => [
      member.name,
      member.associationName ?? '',
      member.vulnerability,
      member.familySize,
      member.age,
      yesNo(member.isSenior),
      yesNo(member.isPwd),
    ]),
  }
}

function requestRows(approvedOnly: boolean): (string | number)[][] {
  return getAssistanceItems()
    .filter((item) => (approvedOnly ? item.status === 'APPROVED' : true))
    .map((item) => {
      const decision = item.decisions[0]
      return [
        item.association,
        item.requestType,
        item.program ?? '',
        item.status,
        item.date,
        item.details?.memberCount ?? '',
        item.vulnerability,
        item.details?.purpose ?? item.description ?? '',
        decision?.decidedBy ?? '',
        decision?.notes ?? '',
      ]
    })
}

function requestSheet(name: string, approvedOnly: boolean): ReportSheet {
  return {
    name,
    headers: [
      'Association',
      'Request',
      'Program',
      'Status',
      'Date',
      'Members',
      'Vulnerability',
      'Purpose',
      'Decided By',
      'Notes',
    ],
    rows: requestRows(approvedOnly),
  }
}

function aidReceivedSheet(): ReportSheet {
  return {
    name: 'Aid Received',
    headers: ['Association', 'Member', 'Program', 'Date Received', 'Quantity', 'Comments', 'Status', 'Submitted By'],
    rows: getAidRecords().map((row) => [
      row.associationName,
      row.memberName,
      row.program,
      row.dateReceived,
      row.quantity,
      row.comments ?? '',
      row.status,
      row.submittedBy ?? '',
    ]),
  }
}

function programSheet(): ReportSheet {
  return {
    name: 'Programs',
    headers: ['Program', 'Category', 'Agency', 'Status', 'Start', 'End', 'Budget', 'Eligibility'],
    rows: getPrograms().map((program) => [
      program.name,
      program.category,
      program.sponsoringAgency,
      program.status,
      program.startDate,
      program.endDate ?? '',
      program.budgetAllocation ?? '',
      program.eligibilityCriteria,
    ]),
  }
}

function aiSheet(): ReportSheet {
  const rows = getGeneratedAssistanceList().slice().sort((left, right) => left.rank - right.rank)
  return {
    name: 'AI Assessment',
    headers: ['Rank', 'Name', 'Association', 'Score', 'Classification', 'Program', 'Models Agree', 'Why'],
    rows: rows.map((row) => [
      row.rank,
      row.name,
      row.association,
      row.score,
      row.classification,
      row.program,
      row.modelAgreement === undefined ? '' : yesNo(row.modelAgreement),
      row.reason,
    ]),
  }
}

function auditSheet(): ReportSheet {
  const settings = getPrivacySettings()
  return {
    name: 'Audit Log',
    headers: ['Date', 'User', 'Email', 'Action', 'Description', 'IP Address'],
    rows: getAuditLogs().map((log) => [
      log.date,
      log.user,
      log.userEmail ? (settings.maskEmailInAuditLogs ? maskEmail(log.userEmail) : log.userEmail) : '',
      log.action,
      log.description,
      settings.maskIpInAuditLogs ? maskIp(log.ipAddress) : log.ipAddress,
    ]),
  }
}

function withSummary(title: string, sheets: ReportSheet[]): ReportDataset {
  const count = sheets.reduce((sum, sheet) => sum + sheet.rows.length, 0)
  return {
    title,
    summary: [
      'Barangay Buru-un, Iligan City',
      `${count} record${count === 1 ? '' : 's'} across ${sheets.length} section${sheets.length === 1 ? '' : 's'}`,
    ],
    sheets: sheets.map((sheet) => (sheet.rows.length > 0 ? sheet : emptySheet(sheet.name, sheet.headers))),
  }
}

export function datasetForReport(entry: ReportHistoryEntry): ReportDataset {
  if (entry.name.startsWith('staff_program_status')) {
    return withSummary('Program Status Report', [programSheet()])
  }
  const builders: Record<ReportHistoryType, () => ReportDataset> = {
    beneficiary: () => withSummary('Beneficiary Report', [beneficiarySheet()]),
    vulnerability: () => withSummary('Vulnerability Report', [vulnerabilitySheet()]),
    assistance: () => withSummary('Assistance Report', [requestSheet('Requests', false), programSheet(), aidReceivedSheet()]),
    approved: () => withSummary('Approved Assistance Report', [requestSheet('Approved', true)]),
    ai_scoring: () => withSummary('AI Assessment Report', [aiSheet()]),
    audit: () => withSummary('Audit Log Report', [auditSheet()]),
  }
  return builders[entry.reportType]()
}

export function workbookSheets(dataset: ReportDataset): WorkbookSheet[] {
  return dataset.sheets.map((sheet) => ({
    name: sheet.name.slice(0, 31),
    headers: sheet.headers,
    rows: sheet.rows,
  }))
}
