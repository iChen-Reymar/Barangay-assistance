import type { AuditChange, AuditLogEntry, LogAuditInput } from '../types/audit'

const AUDIT_LOGS_KEY = 'barangay_audit_logs'
const CLIENT_IP_KEY = 'barangay_client_ip'
const AUDIT_UPDATED_EVENT = 'audit-log-updated'

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

export function initializeAuditStorage() {}

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

export function replaceAuditLogs(logs: AuditLogEntry[]) {
  writeLogs(logs)
}

function maskEmail(email: string): string {
  const [local, domain] = email.split('@')
  if (!local || !domain) return '***@***.***'
  return `${local.slice(0, 1)}***@${domain}`
}

function maskIp(ip: string): string {
  const parts = ip.split('.')
  if (parts.length !== 4) return '***.***.***.***'
  return `${parts[0]}.${parts[1]}.***.***`
}

export function anonymizeAuditLogsInStorage(options: {
  maskIp: boolean
  maskEmail: boolean
}): number {
  const logs = readLogs()
  let count = 0
  const updated = logs.map((log) => {
    let changed = false
    const next = { ...log }
    if (options.maskIp && !log.ipAddress.includes('***')) {
      next.ipAddress = maskIp(log.ipAddress)
      changed = true
    }
    if (options.maskEmail && log.userEmail && !log.userEmail.includes('***')) {
      next.userEmail = maskEmail(log.userEmail)
      changed = true
    }
    if (changed) count += 1
    return next
  })
  writeLogs(updated)
  return count
}

export function purgeAuditLogsOlderThan(days: number): number {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000
  const logs = readLogs()
  const kept = logs.filter((log) => new Date(log.timestamp).getTime() >= cutoff)
  const removed = logs.length - kept.length
  if (removed > 0) writeLogs(kept)
  return removed
}

export function subscribeAuditLogs(callback: () => void) {
  window.addEventListener(AUDIT_UPDATED_EVENT, callback)
  return () => window.removeEventListener(AUDIT_UPDATED_EVENT, callback)
}
