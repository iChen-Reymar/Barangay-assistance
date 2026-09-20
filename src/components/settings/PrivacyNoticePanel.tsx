import { Shield } from 'lucide-react'
import { getPrivacySettings } from '../../services/privacyStorage'

export function PrivacyNoticePanel() {
  const settings = getPrivacySettings()

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <Shield className="h-5 w-5 text-primary" />
        <h2 className="text-base font-bold text-gray-900">Privacy & Data Protection</h2>
      </div>
      <p className="text-sm text-gray-600">
        Barangay Buru-un applies configured privacy controls to protect beneficiary and association
        data. Personal identifiers may be masked in audit logs and exports according to administrator
        policy.
      </p>
      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-[10px] font-semibold uppercase text-gray-400">Audit Log Retention</dt>
          <dd className="mt-0.5 text-gray-900">{settings.auditLogRetentionDays} days</dd>
        </div>
        <div>
          <dt className="text-[10px] font-semibold uppercase text-gray-400">Assistance Record Retention</dt>
          <dd className="mt-0.5 text-gray-900">{settings.assistanceRecordRetentionDays} days</dd>
        </div>
        <div>
          <dt className="text-[10px] font-semibold uppercase text-gray-400">Contact Masking in Exports</dt>
          <dd className="mt-0.5 text-gray-900">{settings.maskContactInExports ? 'Enabled' : 'Disabled'}</dd>
        </div>
        <div>
          <dt className="text-[10px] font-semibold uppercase text-gray-400">Anonymization Policy</dt>
          <dd className="mt-0.5 capitalize text-gray-900">{settings.anonymizationLevel}</dd>
        </div>
      </dl>
      <p className="mt-4 text-xs text-gray-400">
        Only authorized barangay personnel may access identifiable beneficiary records. Report privacy
        concerns to the barangay administrator.
      </p>
    </div>
  )
}
