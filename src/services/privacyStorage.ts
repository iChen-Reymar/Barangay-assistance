import type { AuditLogEntry } from '../types/audit'
import type { PrivacyOperationResult, PrivacySettings } from '../types/privacy'
import {
  anonymizeAuditLogsInStorage,
  getAuditLogs,
  purgeAuditLogsOlderThan,
} from './auditStorage'
import {
  anonymizeRejectedUsers,
  purgeAnonymizedRejectedUsersOlderThan,
} from './authStorage'
import { anonymizeRejectedAssistanceRecords, purgeRejectedAssistanceOlderThan } from './decisionStorage'

const PRIVACY_KEY = 'barangay_privacy_settings'
const UPDATED_EVENT = 'privacy-settings-updated'

export const defaultPrivacySettings: PrivacySettings = {
  maskContactInExports: true,
  maskIpInAuditLogs: true,
  maskEmailInAuditLogs: true,
  anonymizeRejectedRequests: true,
  anonymizationLevel: 'partial',
  auditLogRetentionDays: 365,
  assistanceRecordRetentionDays: 730,
  accessRequestRetentionDays: 180,
  autoPurgeEnabled: false,
}

function readSettings(): PrivacySettings {
  const raw = localStorage.getItem(PRIVACY_KEY)
  if (!raw) return defaultPrivacySettings
  try {
    return { ...defaultPrivacySettings, ...(JSON.parse(raw) as PrivacySettings) }
  } catch {
    return defaultPrivacySettings
  }
}

function writeSettings(settings: PrivacySettings) {
  localStorage.setItem(PRIVACY_KEY, JSON.stringify(settings))
  window.dispatchEvent(new CustomEvent(UPDATED_EVENT))
}

export function initializePrivacyStorage() {
  if (!localStorage.getItem(PRIVACY_KEY)) {
    writeSettings(defaultPrivacySettings)
  }
}

export function getPrivacySettings(): PrivacySettings {
  initializePrivacyStorage()
  return readSettings()
}

export function savePrivacySettings(settings: PrivacySettings) {
  writeSettings(settings)
  if (settings.autoPurgeEnabled) {
    runRetentionPurge(settings)
  }
  return settings
}

export function subscribePrivacySettings(callback: () => void) {
  const handler = () => callback()
  window.addEventListener(UPDATED_EVENT, handler)
  return () => window.removeEventListener(UPDATED_EVENT, handler)
}

export function maskEmail(email: string): string {
  const [local, domain] = email.split('@')
  if (!local || !domain) return '***@***.***'
  const visible = local.slice(0, 1)
  return `${visible}***@${domain}`
}

export function maskIp(ip: string): string {
  const parts = ip.split('.')
  if (parts.length !== 4) return '***.***.***.***'
  return `${parts[0]}.${parts[1]}.***.***`
}

export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.length < 4) return '***-***-****'
  return `***-***-${digits.slice(-4)}`
}

export function applyAuditLogPrivacy(
  entry: AuditLogEntry,
  settings: PrivacySettings = getPrivacySettings(),
): AuditLogEntry {
  return {
    ...entry,
    ipAddress: settings.maskIpInAuditLogs ? maskIp(entry.ipAddress) : entry.ipAddress,
    userEmail:
      settings.maskEmailInAuditLogs && entry.userEmail
        ? maskEmail(entry.userEmail)
        : entry.userEmail,
  }
}

export function applyAuditLogsPrivacy(
  entries: AuditLogEntry[],
  settings: PrivacySettings = getPrivacySettings(),
): AuditLogEntry[] {
  return entries.map((entry) => applyAuditLogPrivacy(entry, settings))
}

export function runAnonymization(
  settings: PrivacySettings = getPrivacySettings(),
): PrivacyOperationResult {
  const result: PrivacyOperationResult = {
    rejectedUsersAnonymized: 0,
    auditLogsAnonymized: 0,
    assistanceRecordsAnonymized: 0,
    auditLogsRemoved: 0,
    accessRecordsRemoved: 0,
  }

  if (settings.anonymizeRejectedRequests) {
    result.rejectedUsersAnonymized = anonymizeRejectedUsers()
    result.assistanceRecordsAnonymized = anonymizeRejectedAssistanceRecords(
      settings.assistanceRecordRetentionDays,
    )
  }

  if (settings.maskIpInAuditLogs || settings.maskEmailInAuditLogs) {
    result.auditLogsAnonymized = anonymizeAuditLogsInStorage({
      maskIp: settings.maskIpInAuditLogs,
      maskEmail: settings.maskEmailInAuditLogs,
    })
  }

  const updatedSettings: PrivacySettings = {
    ...settings,
    lastAnonymizationRun: new Date().toISOString(),
  }
  writeSettings(updatedSettings)
  return result
}

export function runRetentionPurge(
  settings: PrivacySettings = getPrivacySettings(),
): PrivacyOperationResult {
  const result: PrivacyOperationResult = {
    rejectedUsersAnonymized: 0,
    auditLogsAnonymized: 0,
    assistanceRecordsAnonymized: 0,
    auditLogsRemoved: purgeAuditLogsOlderThan(settings.auditLogRetentionDays),
    accessRecordsRemoved:
      purgeAnonymizedRejectedUsersOlderThan(settings.accessRequestRetentionDays) +
      purgeRejectedAssistanceOlderThan(settings.assistanceRecordRetentionDays),
  }

  const updatedSettings: PrivacySettings = {
    ...settings,
    lastPurgeRun: new Date().toISOString(),
  }
  writeSettings(updatedSettings)
  return result
}

export function getPrivacySummary() {
  const settings = getPrivacySettings()
  const logs = getAuditLogs()
  return {
    settings,
    totalAuditLogs: logs.length,
    maskedAuditPreview: applyAuditLogPrivacy(logs[0] ?? {
      id: 'preview',
      timestamp: new Date().toISOString(),
      date: 'Preview',
      user: 'Sample User',
      userEmail: 'sample.user@barangayburuun.gov.ph',
      action: 'Preview',
      actionColor: 'blue',
      description: 'Preview of privacy masking rules.',
      ipAddress: '192.168.1.24',
      changes: [],
    }),
  }
}
