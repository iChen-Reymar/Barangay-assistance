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
  onSelect?: (notificationId: string) => void
}

export function NotificationPanel({
  notifications,
  title = 'Notifications',
  compact = false,
  onSelect,
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
          <li key={n.id}>
            <button
              type="button"
              onClick={() => onSelect?.(n.id)}
              disabled={!onSelect}
              className="flex w-full gap-3 rounded-lg border border-gray-100 p-3 text-left hover:border-green-200 hover:bg-green-50/40 focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:cursor-default disabled:hover:border-gray-100 disabled:hover:bg-transparent"
            >
              <Bell className={`mt-0.5 h-4 w-4 shrink-0 ${n.type === 'warning' ? 'text-red-500' : 'text-primary'}`} />
              <span className="min-w-0 flex-1">
                <span className={`block text-sm ${n.read ? 'text-gray-500' : 'font-medium text-gray-900'}`}>
                  {n.message}
                </span>
                {n.reason && <span className="mt-1 block truncate text-sm text-gray-600">Reason: {n.reason}</span>}
                <span className="block text-xs text-gray-400">{n.time}</span>
                {onSelect ? <span className="mt-1 block text-xs font-medium text-green-700">Open details</span> : null}
              </span>
              {!n.read && <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />}
            </button>
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
          <button
            key={n.id}
            type="button"
            onClick={() => onSelect?.(n.id)}
            disabled={!onSelect}
            className="flex w-full items-start gap-3 px-5 py-4 text-left hover:bg-green-50/40 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary/30 disabled:cursor-default disabled:hover:bg-transparent"
          >
            <span className={`rounded-lg p-2 ${n.type === 'warning' ? 'bg-red-50' : 'bg-green-50'}`}>
              <Bell className={`h-4 w-4 ${n.type === 'warning' ? 'text-red-500' : 'text-primary'}`} />
            </span>
            <span className="min-w-0 flex-1">
              <span className={`block text-sm ${n.read ? 'text-gray-500' : 'font-medium text-gray-900'}`}>
                {n.message}
              </span>
              {n.reason && <span className="mt-1 block text-sm text-gray-600">Reason: {n.reason}</span>}
              <span className="mt-1 block text-xs text-gray-400">{n.time}</span>
              {onSelect ? <span className="mt-1 block text-xs font-medium text-green-700">Open details</span> : null}
            </span>
            {!n.read && <Badge variant="info">New</Badge>}
          </button>
        ))}
      </div>
    </div>
  )
}
