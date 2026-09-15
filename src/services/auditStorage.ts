import type { AuditChange, AuditLogEntry, LogAuditInput } from '../types/audit'

const AUDIT_LOGS_KEY = 'barangay_audit_logs'
const CLIENT_IP_KEY = 'barangay_client_ip'
const AUDIT_UPDATED_EVENT = 'audit-log-updated'

const seedLogs: AuditLogEntry[] = [
  {
    id: 'seed-1',
    timestamp: '2026-08-10T11:24:00.000Z',
    date: 'August 10, 2026 11:24 AM',
    user: 'Barangay Staff',
    userEmail: 'bryan.martinez@barangayburuun.gov.ph',
    action: 'Vulnerability Assessment',
    actionColor: 'green',
    description: 'Generated vulnerability score for Farmers Association.',
    ipAddress: '192.168.1.24',
    entityType: 'association',
    changes: [
      { field: 'Vulnerability Score', oldValue: '—', newValue: '72/100' },
      { field: 'Classification', oldValue: '—', newValue: 'MEDIUM' },
    ],
  },
  {
    id: 'seed-2',
    timestamp: '2026-08-09T15:15:00.000Z',
    date: 'August 9, 2026 03:15 PM',
    user: 'Barangay Staff',
    userEmail: 'maria.santos@barangayburuun.gov.ph',
    action: 'Beneficiary Update',
    actionColor: 'orange',
    description: 'Updated information for Maria Santos.',
    ipAddress: '192.168.1.31',
    entityType: 'beneficiary',
    changes: [
      { field: 'Monthly Income', oldValue: '₱ 4,200.00', newValue: '₱ 4,500.00' },
      { field: 'Housing', oldValue: 'Temporary/Salvaged', newValue: 'Light Materials' },
      { field: 'Vulnerability', oldValue: 'MEDIUM', newValue: 'HIGH' },
    ],
  },
  {
    id: 'seed-3',
    timestamp: '2026-08-09T10:00:00.000Z',
    date: 'August 9, 2026 10:00 AM',
    user: 'Administrator',
    userEmail: 'admin@barangayburuun.gov.ph',
    action: 'Approval',
    actionColor: 'green',
    description: 'Approved assistance request for PWD Group.',
    ipAddress: '192.168.1.10',
    entityType: 'assistance_request',
    changes: [
      { field: 'Status', oldValue: 'PENDING', newValue: 'APPROVED' },
      { field: 'Reviewed By', oldValue: '—', newValue: 'Administrator' },
    ],
  },
  {
    id: 'seed-4',
    timestamp: '2026-08-08T14:30:00.000Z',
    date: 'August 8, 2026 02:30 PM',
    user: 'Barangay Staff',
    userEmail: 'bryan.martinez@barangayburuun.gov.ph',
    action: 'Report Generated',
    actionColor: 'blue',
    description: 'Exported Vulnerability Assessment Q3 2026 report.',
    ipAddress: '192.168.1.24',
    changes: [],
  },
  {
    id: 'seed-5',
    timestamp: '2026-08-07T16:55:00.000Z',
    date: 'August 7, 2026 04:55 PM',
    user: 'Administrator',
    userEmail: 'admin@barangayburuun.gov.ph',
    action: 'Approval',
    actionColor: 'red',
    description: 'Rejected assistance request — insufficient documentation.',
    ipAddress: '192.168.1.10',
    entityType: 'assistance_request',
    changes: [
      { field: 'Status', oldValue: 'UNDER REVIEW', newValue: 'REJECTED' },
      { field: 'Remarks', oldValue: '—', newValue: 'Insufficient supporting documents' },
    ],
  },
  {
    id: 'seed-6',
    timestamp: '2026-08-07T11:00:00.000Z',
    date: 'August 7, 2026 11:00 AM',
    user: 'Barangay Staff',
    userEmail: 'maria.santos@barangayburuun.gov.ph',
    action: 'Association Update',
    actionColor: 'purple',
    description: 'Updated contact details for Fishermen Association.',
    ipAddress: '192.168.1.31',
    entityType: 'association',
    changes: [
      { field: 'Contact Person', oldValue: 'Pedro Santos', newValue: 'Pedro M. Santos' },
      { field: 'Contact Number', oldValue: '+63 918 234 5678', newValue: '+63 918 234 9999' },
    ],
  },
  {
    id: 'seed-7',
    timestamp: '2026-08-06T09:30:00.000Z',
    date: 'August 6, 2026 09:30 AM',
    user: 'Administrator',
    userEmail: 'admin@barangayburuun.gov.ph',
    action: 'User Management',
    actionColor: 'teal',
    description: 'Added new user account for Ana R. Garcia.',
    ipAddress: '192.168.1.10',
    entityType: 'user',
    changes: [
      { field: 'Account Status', oldValue: '—', newValue: 'ACTIVE' },
      { field: 'Role', oldValue: '—', newValue: 'Viewer' },
      { field: 'Email', oldValue: '—', newValue: 'ana.garcia@barangayburuun.gov.ph' },
    ],
  },
  {
    id: 'seed-8',
    timestamp: '2026-08-05T15:00:00.000Z',
    date: 'August 5, 2026 03:00 PM',
    user: 'Barangay Staff',
    userEmail: 'bryan.martinez@barangayburuun.gov.ph',
    action: 'Beneficiary Update',
    actionColor: 'orange',
    description: 'Registered new beneficiary Juan dela Cruz.',
    ipAddress: '192.168.1.24',
    entityType: 'beneficiary',
    changes: [
      { field: 'Name', oldValue: '—', newValue: 'Juan dela Cruz' },
      { field: 'Association', oldValue: '—', newValue: 'Farmers Association' },
      { field: 'Status', oldValue: '—', newValue: 'ACTIVE' },
    ],
  },
]

function readLogs(): AuditLogEntry[] {
  const raw = localStorage.getItem(AUDIT_LOGS_KEY)
  if (!raw) return []
  try {
    return JSON.parse(raw) as AuditLogEntry[]
  } catch {
    return []
  }
}

function writeLogs(logs: AuditLogEntry[]) {
  localStorage.setItem(AUDIT_LOGS_KEY, JSON.stringify(logs))
  window.dispatchEvent(new CustomEvent(AUDIT_UPDATED_EVENT))
}

export function initializeAuditStorage() {
  if (!localStorage.getItem(AUDIT_LOGS_KEY)) {
    writeLogs(seedLogs)
  }
}

export function getClientIpAddress(): string {
  const stored = sessionStorage.getItem(CLIENT_IP_KEY)
  if (stored) return stored

  const mockIp = `192.168.1.${Math.floor(Math.random() * 200) + 10}`
  sessionStorage.setItem(CLIENT_IP_KEY, mockIp)
  return mockIp
}

export function formatAuditDate(iso: string): string {
  return new Date(iso).toLocaleString('en-PH', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function buildChanges(
  fields: { key: string; label: string; oldValue: unknown; newValue: unknown }[],
): AuditChange[] {
  return fields
    .filter(({ oldValue, newValue }) => String(oldValue ?? '') !== String(newValue ?? ''))
    .map(({ label, oldValue, newValue }) => ({
      field: label,
      oldValue: formatChangeValue(oldValue),
      newValue: formatChangeValue(newValue),
    }))
}

function formatChangeValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—'
  return String(value)
}

export function logAuditEvent(input: LogAuditInput): AuditLogEntry {
  const timestamp = new Date().toISOString()
  const entry: AuditLogEntry = {
    id: crypto.randomUUID(),
    timestamp,
    date: formatAuditDate(timestamp),
    user: input.user,
    userEmail: input.userEmail,
    action: input.action,
    actionColor: input.actionColor,
    description: input.description,
    ipAddress: input.ipAddress ?? getClientIpAddress(),
    changes: input.changes ?? [],
    entityType: input.entityType,
    entityId: input.entityId,
  }

  const logs = readLogs()
  writeLogs([entry, ...logs])
  return entry
}

export function getAuditLogs(): AuditLogEntry[] {
  return readLogs()
}

export function subscribeAuditLogs(callback: () => void) {
  window.addEventListener(AUDIT_UPDATED_EVENT, callback)
  return () => window.removeEventListener(AUDIT_UPDATED_EVENT, callback)
}
