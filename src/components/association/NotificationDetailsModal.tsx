import { AlertTriangle, Bell, CalendarClock, FileText, Users } from 'lucide-react'
import type { ReactNode } from 'react'
import type { AssociationNotification } from '../../services/associationNotificationStorage'
import { Badge } from '../ui/Badge'
import { Modal } from '../ui/Modal'

export function NotificationDetailsModal({
  notification,
  onClose,
}: {
  notification: AssociationNotification | null
  onClose: () => void
}) {
  if (!notification) return null
  const warning = notification.type === 'warning'

  return (
    <Modal open onClose={onClose} title="Notification details" size="lg">
      <div className="space-y-5">
        <div className="flex items-start gap-3">
          <div className={`rounded-xl p-3 ${warning ? 'bg-amber-50 text-amber-700' : 'bg-green-50 text-green-700'}`}>
            {warning ? <AlertTriangle className="h-5 w-5" /> : <Bell className="h-5 w-5" />}
          </div>
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Badge variant={warning ? 'warning' : 'success'}>{warning ? 'Action needed' : 'Update'}</Badge>
              {notification.read ? <Badge variant="neutral">Read</Badge> : <Badge variant="info">New</Badge>}
            </div>
            <p className="leading-6 text-gray-900">{notification.message}</p>
          </div>
        </div>

        <dl className="grid gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm sm:grid-cols-2">
          <Detail icon={<CalendarClock className="h-4 w-4" />} label="Received" value={notification.time} />
          <Detail icon={<FileText className="h-4 w-4" />} label="Request" value={notification.requestId || 'Not linked to a request'} />
          {notification.memberName ? <Detail icon={<Users className="h-4 w-4" />} label="Member" value={notification.memberName} /> : null}
          {notification.documentName ? <Detail icon={<FileText className="h-4 w-4" />} label="Document" value={notification.documentName} /> : null}
          {notification.rejectedBy ? <Detail icon={<Users className="h-4 w-4" />} label="Reviewed by" value={notification.rejectedBy} /> : null}
        </dl>

        {notification.memberNames?.length ? (
          <section className="overflow-hidden rounded-lg border border-amber-200 bg-amber-50/60">
            <div className="border-b border-amber-200 px-4 py-3">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-amber-950">
                <Users className="h-4 w-4" /> Members requiring verification
              </h3>
              <p className="mt-1 text-xs text-amber-800">Complete their Member Qualification Data before generating another list.</p>
            </div>
            <ul className="grid gap-x-6 px-4 py-3 sm:grid-cols-2">
              {notification.memberNames.map((name) => (
                <li key={name} className="border-b border-amber-100 py-2 text-sm font-medium text-gray-900 last:border-0">
                  {name}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {notification.reason ? (
          <section>
            <h3 className="mb-1 text-sm font-semibold text-gray-900">Reason</h3>
            <p className="rounded-lg border-l-4 border-amber-400 bg-amber-50 px-4 py-3 text-sm leading-6 text-gray-700">
              {notification.reason}
            </p>
          </section>
        ) : null}
      </div>
    </Modal>
  )
}

function Detail({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div>
      <dt className="flex items-center gap-1.5 text-xs font-medium text-gray-500">{icon}{label}</dt>
      <dd className="mt-1 break-words text-gray-900">{value}</dd>
    </div>
  )
}
