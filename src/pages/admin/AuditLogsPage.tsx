import { useEffect, useMemo, useState } from 'react'
import { Eye } from 'lucide-react'
import { AdminHeader } from '../../components/admin/AdminHeader'
import { AuditLogDetailModal } from '../../components/admin/AuditLogDetailModal'
import { Pagination } from '../../components/admin/Pagination'
import { ResponsiveToolbar } from '../../components/layout/ResponsiveToolbar'
import { ResponsiveTable } from '../../components/ui/ResponsiveTable'
import { getAuditLogs, subscribeAuditLogs } from '../../services/auditStorage'
import type { AuditLogEntry } from '../../types/audit'

const actionColors: Record<string, string> = {
  green: 'text-green-600',
  orange: 'text-orange-600',
  red: 'text-red-600',
  blue: 'text-blue-600',
  purple: 'text-purple-600',
  teal: 'text-teal-600',
}

const uniqueActions = (logs: AuditLogEntry[]) =>
  [...new Set(logs.map((log) => log.action))].sort()

const uniqueUsers = (logs: AuditLogEntry[]) =>
  [...new Set(logs.map((log) => log.user))].sort()

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>(() => getAuditLogs())
  const [userFilter, setUserFilter] = useState('All')
  const [actionFilter, setActionFilter] = useState('All')
  const [selectedEntry, setSelectedEntry] = useState<AuditLogEntry | null>(null)

  useEffect(() => {
    setLogs(getAuditLogs())
    return subscribeAuditLogs(() => setLogs(getAuditLogs()))
  }, [])

  const filtered = useMemo(() => {
    return logs.filter((row) => {
      const userMatch = userFilter === 'All' || row.user === userFilter
      const actionMatch = actionFilter === 'All' || row.action === actionFilter
      return userMatch && actionMatch
    })
  }, [logs, userFilter, actionFilter])

  const users = useMemo(() => uniqueUsers(logs), [logs])
  const actions = useMemo(() => uniqueActions(logs), [logs])

  return (
    <>
      <AdminHeader title="System Audit Logs" />
      <main className="flex-1 overflow-y-auto p-4 sm:p-5 md:p-6">
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
          <ResponsiveToolbar>
            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <select
                value={userFilter}
                onChange={(e) => setUserFilter(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 sm:w-auto"
              >
                <option value="All">User: All Users</option>
                {users.map((user) => (
                  <option key={user} value={user}>
                    {user}
                  </option>
                ))}
              </select>
              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 sm:w-auto"
              >
                <option value="All">Action: All Actions</option>
                {actions.map((action) => (
                  <option key={action} value={action}>
                    {action}
                  </option>
                ))}
              </select>
            </div>
            <p className="text-sm text-gray-500">
              {filtered.length} event{filtered.length === 1 ? '' : 's'}
            </p>
          </ResponsiveToolbar>

          <ResponsiveTable
            data={filtered}
            keyExtractor={(row) => row.id}
            emptyMessage="No audit logs match your filters."
            columns={[
              {
                key: 'action',
                header: 'Action',
                primary: true,
                render: (row) => (
                  <span className={`font-semibold ${actionColors[row.actionColor]}`}>
                    {row.action}
                  </span>
                ),
              },
              { key: 'date', header: 'Date', mobileLabel: 'Date' },
              { key: 'user', header: 'User', mobileLabel: 'User' },
              {
                key: 'ipAddress',
                header: 'IP Address',
                mobileLabel: 'IP',
                render: (row) => <span className="font-mono text-xs">{row.ipAddress}</span>,
              },
              {
                key: 'description',
                header: 'Description',
                mobileLabel: 'Description',
                render: (row) => row.description,
              },
              {
                key: 'actions',
                header: 'Changes',
                hideOnMobile: false,
                render: (row) =>
                  row.changes.length > 0 ? (
                    <button
                      type="button"
                      onClick={() => setSelectedEntry(row)}
                      className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 hover:text-primary"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      {row.changes.length} change{row.changes.length === 1 ? '' : 's'}
                    </button>
                  ) : (
                    <span className="text-xs text-gray-400">—</span>
                  ),
              },
            ]}
          />

          <Pagination
            showing={
              filtered.length === 0
                ? 'Showing 0 events'
                : `Showing 1 to ${filtered.length} of ${filtered.length} events`
            }
            totalPages={Math.max(1, Math.ceil(filtered.length / 10))}
          />
        </div>
      </main>

      <AuditLogDetailModal
        open={selectedEntry !== null}
        onClose={() => setSelectedEntry(null)}
        entry={selectedEntry}
      />
    </>
  )
}
