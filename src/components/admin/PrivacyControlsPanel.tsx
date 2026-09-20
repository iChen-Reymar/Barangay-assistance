import { useEffect, useState } from 'react'
import { Shield, Trash2, UserX } from 'lucide-react'
import { Button } from '../ui/Button'
import { useAuth } from '../../context/AuthContext'
import { buildChanges, logAuditEvent } from '../../services/auditStorage'
import { formatDate } from '../../services/authStorage'
import {
  getPrivacySettings,
  getPrivacySummary,
  runAnonymization,
  runRetentionPurge,
  savePrivacySettings,
  subscribePrivacySettings,
} from '../../services/privacyStorage'
import type { AnonymizationLevel, PrivacySettings } from '../../types/privacy'

const retentionOptions = [
  { value: 90, label: '90 days' },
  { value: 180, label: '180 days' },
  { value: 365, label: '1 year' },
  { value: 730, label: '2 years' },
  { value: 1095, label: '3 years' },
]

export function PrivacyControlsPanel() {
  const { user, profile } = useAuth()
  const [settings, setSettings] = useState<PrivacySettings>(() => getPrivacySettings())
  const [summary, setSummary] = useState(() => getPrivacySummary())
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const refresh = () => {
      setSettings(getPrivacySettings())
      setSummary(getPrivacySummary())
    }
    refresh()
    return subscribePrivacySettings(refresh)
  }, [])

  function auditPrivacyAction(description: string, changes: ReturnType<typeof buildChanges>) {
    logAuditEvent({
      user: profile?.fullName ?? user?.fullName ?? 'Administrator',
      userEmail: profile?.email ?? user?.email,
      action: 'Privacy Control',
      actionColor: 'purple',
      description,
      entityType: 'privacy_settings',
      changes,
    })
  }

  function handleSave() {
    setError('')
    savePrivacySettings(settings)
    setMessage('Privacy and retention settings saved.')
    auditPrivacyAction('Updated privacy and data retention controls.', buildChanges([
      { key: 'maskIp', label: 'Mask IP in Audit Logs', oldValue: '—', newValue: settings.maskIpInAuditLogs ? 'Enabled' : 'Disabled' },
      { key: 'retention', label: 'Audit Log Retention', oldValue: '—', newValue: `${settings.auditLogRetentionDays} days` },
      { key: 'autoPurge', label: 'Auto Purge', oldValue: '—', newValue: settings.autoPurgeEnabled ? 'Enabled' : 'Disabled' },
    ]))
  }

  function handleAnonymize() {
    setError('')
    const result = runAnonymization(settings)
    setMessage(
      `Anonymization complete: ${result.rejectedUsersAnonymized} access request(s), ${result.assistanceRecordsAnonymized} assistance record(s), ${result.auditLogsAnonymized} audit log(s) updated.`,
    )
    auditPrivacyAction('Executed data anonymization run.', buildChanges([
      { key: 'users', label: 'Rejected Users', oldValue: '—', newValue: result.rejectedUsersAnonymized },
      { key: 'assistance', label: 'Assistance Records', oldValue: '—', newValue: result.assistanceRecordsAnonymized },
      { key: 'audit', label: 'Audit Logs', oldValue: '—', newValue: result.auditLogsAnonymized },
    ]))
  }

  function handlePurge() {
    setError('')
    const result = runRetentionPurge(settings)
    setMessage(
      `Retention purge complete: ${result.auditLogsRemoved} audit log(s) and ${result.accessRecordsRemoved} expired record(s) removed.`,
    )
    auditPrivacyAction('Executed retention purge run.', buildChanges([
      { key: 'auditRemoved', label: 'Audit Logs Removed', oldValue: '—', newValue: result.auditLogsRemoved },
      { key: 'recordsRemoved', label: 'Records Removed', oldValue: '—', newValue: result.accessRecordsRemoved },
    ]))
  }

  return (
    <div className="space-y-6">
      {message && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          {message}
        </div>
      )}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <div className="flex items-start gap-3">
          <Shield className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
          <p className="text-sm text-blue-800">
            Configure privacy masking, anonymization, and retention policies for beneficiary,
            association, and audit data stored in this barangay system.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-bold text-gray-900">Privacy Controls</h3>
          <div className="space-y-3 text-sm">
            {[
              {
                key: 'maskContactInExports' as const,
                label: 'Mask contact details in exports',
                description: 'Hide phone numbers and emails when generating CSV/PDF exports.',
              },
              {
                key: 'maskIpInAuditLogs' as const,
                label: 'Mask IP addresses in audit logs',
                description: 'Display and store truncated IP values for non-admin views.',
              },
              {
                key: 'maskEmailInAuditLogs' as const,
                label: 'Mask email addresses in audit logs',
                description: 'Redact user emails in audit log listings and detail views.',
              },
              {
                key: 'anonymizeRejectedRequests' as const,
                label: 'Anonymize rejected access requests',
                description: 'Replace personal identifiers on rejected registration records.',
              },
              {
                key: 'autoPurgeEnabled' as const,
                label: 'Auto-run retention purge on save',
                description: 'Automatically purge expired records when settings are saved.',
              },
            ].map((item) => (
              <label
                key={item.key}
                className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-100 p-3 hover:bg-gray-50"
              >
                <input
                  type="checkbox"
                  checked={settings[item.key]}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, [item.key]: e.target.checked }))
                  }
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-primary accent-primary"
                />
                <span>
                  <span className="font-medium text-gray-900">{item.label}</span>
                  <span className="mt-0.5 block text-xs text-gray-500">{item.description}</span>
                </span>
              </label>
            ))}
          </div>

          <div className="mt-4">
            <label className="mb-1 block text-xs font-semibold uppercase text-gray-500">
              Anonymization Level
            </label>
            <select
              value={settings.anonymizationLevel}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  anonymizationLevel: e.target.value as AnonymizationLevel,
                }))
              }
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="none">None — no automatic anonymization</option>
              <option value="partial">Partial — mask identifiers, keep operational metadata</option>
              <option value="full">Full — maximum redaction for expired records</option>
            </select>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-bold text-gray-900">Data Retention Policies</h3>
          <div className="space-y-4">
            {[
              { key: 'auditLogRetentionDays' as const, label: 'Audit log retention' },
              { key: 'assistanceRecordRetentionDays' as const, label: 'Rejected assistance records' },
              { key: 'accessRequestRetentionDays' as const, label: 'Rejected access requests' },
            ].map((item) => (
              <div key={item.key}>
                <label className="mb-1 block text-xs font-semibold uppercase text-gray-500">
                  {item.label}
                </label>
                <select
                  value={settings[item.key]}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      [item.key]: Number(e.target.value),
                    }))
                  }
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {retentionOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          <dl className="mt-5 grid gap-3 rounded-lg border border-gray-100 bg-gray-50 p-4 text-sm">
            <div>
              <dt className="text-[10px] font-semibold uppercase text-gray-400">Audit Logs Stored</dt>
              <dd className="mt-0.5 font-medium text-gray-900">{summary.totalAuditLogs}</dd>
            </div>
            <div>
              <dt className="text-[10px] font-semibold uppercase text-gray-400">Last Anonymization</dt>
              <dd className="mt-0.5 text-gray-900">
                {settings.lastAnonymizationRun ? formatDate(settings.lastAnonymizationRun) : 'Never'}
              </dd>
            </div>
            <div>
              <dt className="text-[10px] font-semibold uppercase text-gray-400">Last Retention Purge</dt>
              <dd className="mt-0.5 text-gray-900">
                {settings.lastPurgeRun ? formatDate(settings.lastPurgeRun) : 'Never'}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <h3 className="mb-3 text-sm font-bold text-gray-900">Masking Preview</h3>
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-[10px] font-semibold uppercase text-gray-400">Sample Email</dt>
            <dd className="mt-0.5 font-mono text-gray-900">{summary.maskedAuditPreview.userEmail ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-[10px] font-semibold uppercase text-gray-400">Sample IP Address</dt>
            <dd className="mt-0.5 font-mono text-gray-900">{summary.maskedAuditPreview.ipAddress}</dd>
          </div>
        </dl>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button onClick={handleSave}>Save Privacy Settings</Button>
        <Button variant="outline" onClick={handleAnonymize}>
          <UserX className="h-4 w-4" />
          Run Anonymization
        </Button>
        <Button variant="outline" onClick={handlePurge}>
          <Trash2 className="h-4 w-4" />
          Run Retention Purge
        </Button>
      </div>
    </div>
  )
}
