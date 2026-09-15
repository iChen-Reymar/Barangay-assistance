import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import type { AuditLogEntry } from '../../types/audit'

interface AuditLogDetailModalProps {
  open: boolean
  onClose: () => void
  entry: AuditLogEntry | null
}

const actionColors: Record<string, string> = {
  green: 'text-green-600',
  orange: 'text-orange-600',
  red: 'text-red-600',
  blue: 'text-blue-600',
  purple: 'text-purple-600',
  teal: 'text-teal-600',
}

export function AuditLogDetailModal({ open, onClose, entry }: AuditLogDetailModalProps) {
  if (!entry) return null

  const selected = entry

  return (
    <Modal open={open} onClose={onClose} title="Audit Log Details" size="lg">
      <div className="space-y-4">
        <dl className="grid gap-3 rounded-lg border border-gray-100 bg-gray-50 p-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-[10px] font-semibold uppercase text-gray-400">Date & Time</dt>
            <dd className="mt-0.5 text-gray-900">{selected.date}</dd>
          </div>
          <div>
            <dt className="text-[10px] font-semibold uppercase text-gray-400">IP Address</dt>
            <dd className="mt-0.5 font-mono text-gray-900">{selected.ipAddress}</dd>
          </div>
          <div>
            <dt className="text-[10px] font-semibold uppercase text-gray-400">User</dt>
            <dd className="mt-0.5 text-gray-900">{selected.user}</dd>
          </div>
          <div>
            <dt className="text-[10px] font-semibold uppercase text-gray-400">Email</dt>
            <dd className="mt-0.5 text-gray-900">{selected.userEmail ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-[10px] font-semibold uppercase text-gray-400">Action</dt>
            <dd className={`mt-0.5 font-semibold ${actionColors[selected.actionColor]}`}>
              {selected.action}
            </dd>
          </div>
          <div>
            <dt className="text-[10px] font-semibold uppercase text-gray-400">Entity</dt>
            <dd className="mt-0.5 text-gray-900">{selected.entityType ?? '—'}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-[10px] font-semibold uppercase text-gray-400">Description</dt>
            <dd className="mt-0.5 text-gray-900">{selected.description}</dd>
          </div>
        </dl>

        <div>
          <h3 className="mb-2 text-sm font-bold text-gray-900">Old / New Values</h3>
          {selected.changes.length === 0 ? (
            <p className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3 text-sm text-gray-500">
              No field-level changes recorded for this event.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
                    <th className="px-3 py-2">Field</th>
                    <th className="px-3 py-2">Old Value</th>
                    <th className="px-3 py-2">New Value</th>
                  </tr>
                </thead>
                <tbody>
                  {selected.changes.map((change) => (
                    <tr key={`${change.field}-${change.oldValue}-${change.newValue}`} className="border-b border-gray-50">
                      <td className="px-3 py-2 font-medium text-gray-900">{change.field}</td>
                      <td className="px-3 py-2 text-red-600 line-through decoration-red-300">
                        {change.oldValue}
                      </td>
                      <td className="px-3 py-2 font-medium text-green-700">{change.newValue}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <Button type="button" variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  )
}
