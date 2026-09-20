export type AnonymizationLevel = 'none' | 'partial' | 'full'

export interface PrivacySettings {
  maskContactInExports: boolean
  maskIpInAuditLogs: boolean
  maskEmailInAuditLogs: boolean
  anonymizeRejectedRequests: boolean
  anonymizationLevel: AnonymizationLevel
  auditLogRetentionDays: number
  assistanceRecordRetentionDays: number
  accessRequestRetentionDays: number
  autoPurgeEnabled: boolean
  lastAnonymizationRun?: string
  lastPurgeRun?: string
}

export interface PrivacyOperationResult {
  rejectedUsersAnonymized: number
  auditLogsAnonymized: number
  assistanceRecordsAnonymized: number
  auditLogsRemoved: number
  accessRecordsRemoved: number
}
