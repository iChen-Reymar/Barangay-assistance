import { Bell } from 'lucide-react'
import { Badge } from './Badge'

export interface NotificationItem {
  id: string
  message: string
  time: string
  read?: boolean
  type?: 'info' | 'success' | 'warning'
  reason?: string
}

interface NotificationPanelProps {
  notifications: NotificationItem[]
  title?: string
  compact?: boolean
}

export function NotificationPanel({
  notifications,
  title = 'Notifications',
  compact = false,
}: NotificationPanelProps) {
  if (notifications.length === 0) {
    return (
      <p className="text-sm text-gray-500">No notifications yet.</p>
    )
  }

  if (compact) {
    return (
      <ul className="space-y-3">
        {notifications.map((n) => (
          <li key={n.id} className="flex gap-3 rounded-lg border border-gray-100 p-3 hover:bg-gray-50">
            <Bell className={`mt-0.5 h-4 w-4 shrink-0 ${n.type === 'warning' ? 'text-red-500' : 'text-primary'}`} />
            <div className="min-w-0 flex-1">
              <p className={`text-sm ${n.read ? 'text-gray-500' : 'font-medium text-gray-900'}`}>
                {n.message}
              </p>
              {n.reason && <p className="mt-1 text-sm text-gray-600">Reason: {n.reason}</p>}
              <p className="text-xs text-gray-400">{n.time}</p>
            </div>
            {!n.read && <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />}
          </li>
        ))}
      </ul>
    )
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-200 px-5 py-4">
        <h2 className="text-base font-bold text-gray-900">{title}</h2>
      </div>
      <div className="divide-y divide-gray-100">
        {notifications.map((n) => (
          <div key={n.id} className="flex items-start gap-3 px-5 py-4 hover:bg-gray-50">
            <div className={`rounded-lg p-2 ${n.type === 'warning' ? 'bg-red-50' : 'bg-green-50'}`}>
              <Bell className={`h-4 w-4 ${n.type === 'warning' ? 'text-red-500' : 'text-primary'}`} />
            </div>
            <div className="min-w-0 flex-1">
              <p className={`text-sm ${n.read ? 'text-gray-500' : 'font-medium text-gray-900'}`}>
                {n.message}
              </p>
              {n.reason && <p className="mt-1 text-sm text-gray-600">Reason: {n.reason}</p>}
              <p className="mt-1 text-xs text-gray-400">{n.time}</p>
            </div>
            {!n.read && <Badge variant="info">New</Badge>}
          </div>
        ))}
      </div>
    </div>
  )
}
