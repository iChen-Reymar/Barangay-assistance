export type AuditActionColor = 'green' | 'orange' | 'red' | 'blue' | 'purple' | 'teal'

export interface AuditChange {
  field: string
  oldValue: string
  newValue: string
}

export interface AuditLogEntry {
  id: string
  timestamp: string
  date: string
  user: string
  userEmail?: string
  action: string
  actionColor: AuditActionColor
  description: string
  ipAddress: string
  changes: AuditChange[]
  entityType?: string
  entityId?: string
}

export interface LogAuditInput {
  user: string
  userEmail?: string
  action: string
  actionColor: AuditActionColor
  description: string
  changes?: AuditChange[]
  entityType?: string
  entityId?: string
  ipAddress?: string
}
