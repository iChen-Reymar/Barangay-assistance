export interface AssociationNotification {
  id: string
  associationName: string
  recipientUserId?: string
  message: string
  time: string
  createdAt: string
  read: boolean
  type: 'info' | 'success' | 'warning'
  documentName?: string
  memberName?: string
  rejectedBy?: string
  reason?: string
}

const STORAGE_KEY = 'barangay_association_notifications'
const UPDATED_EVENT = 'association-notifications-updated'

function readAll(): AssociationNotification[] {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return []
  try {
    return JSON.parse(raw) as AssociationNotification[]
  } catch {
    return []
  }
}

function writeAll(notifications: AssociationNotification[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications))
  window.dispatchEvent(new CustomEvent(UPDATED_EVENT))
}

function sameAssociation(left: string, right: string) {
  const a = left.trim().toLowerCase()
  const b = right.trim().toLowerCase()
  if (!a || !b) return false
  return a === b || a.includes(b) || b.includes(a)
}

function belongsToAssociation(
  item: AssociationNotification,
  associationName: string,
  userId?: string,
) {
  if (userId && item.recipientUserId === userId) return true
  return sameAssociation(item.associationName, associationName)
}

function headUserIdFor(associationName: string) {
  try {
    const associations = JSON.parse(localStorage.getItem('barangay_associations') ?? '[]') as {
      name?: string
      headUserId?: string
    }[]
    const assigned = associations.find(
      (row) => row.headUserId && sameAssociation(row.name ?? '', associationName),
    )
    if (assigned?.headUserId) return assigned.headUserId

    const users = JSON.parse(localStorage.getItem('barangay_users') ?? '[]') as {
      id?: string
      role?: string
      status?: string
      associationName?: string
    }[]
    return users.find(
      (user) =>
        user.role === 'association' &&
        user.status !== 'rejected' &&
        user.id &&
        sameAssociation(user.associationName ?? '', associationName),
    )?.id
  } catch {
    return undefined
  }
}

export function resolveAssociationViewer(input: {
  id?: string
  associationName?: string
} | null): { userId?: string; associationName: string } {
  const userId = input?.id
  const named = input?.associationName?.trim() ?? ''
  if (named) return { userId, associationName: named }

  let associationName = ''
  if (userId) {
    try {
      const associations = JSON.parse(localStorage.getItem('barangay_associations') ?? '[]') as {
        name?: string
        headUserId?: string
      }[]
      associationName = associations.find((row) => row.headUserId === userId)?.name?.trim() ?? ''
      if (!associationName) {
        const users = JSON.parse(localStorage.getItem('barangay_users') ?? '[]') as {
          id?: string
          associationName?: string
        }[]
        associationName = users.find((user) => user.id === userId)?.associationName?.trim() ?? ''
      }
    } catch {
      associationName = ''
    }
  }
  if (!associationName) {
    try {
      const details = JSON.parse(localStorage.getItem('barangay_association_details') ?? 'null') as {
        name?: string
      } | null
      associationName = details?.name?.trim() ?? ''
    } catch {
      associationName = ''
    }
  }
  return { userId, associationName }
}

export function getAssociationNotifications(
  associationName: string,
  userId?: string,
): AssociationNotification[] {
  return readAll().filter((item) => belongsToAssociation(item, associationName, userId))
}

export function countUnreadAssociationNotifications(associationName: string, userId?: string) {
  return getAssociationNotifications(associationName, userId).filter((item) => !item.read).length
}

export function markAssociationNotificationsRead(associationName: string, userId?: string) {
  const next = readAll().map((item) =>
    belongsToAssociation(item, associationName, userId) ? { ...item, read: true } : item,
  )
  writeAll(next)
}

export function notifyDocumentRejected(input: {
  associationName: string
  documentName: string
  memberName?: string
  rejectedBy: string
  reason?: string
}) {
  const what = input.memberName
    ? `${input.documentName} for ${input.memberName}`
    : input.documentName
  const reason = input.reason?.trim()
  const now = new Date()
  const notification: AssociationNotification = {
    id: crypto.randomUUID(),
    associationName: input.associationName,
    recipientUserId: headUserIdFor(input.associationName),
    message: `${input.rejectedBy} rejected ${what}.`,
    reason,
    time: now.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }),
    createdAt: now.toISOString(),
    read: false,
    type: 'warning',
    documentName: input.documentName,
    memberName: input.memberName,
    rejectedBy: input.rejectedBy,
  }
  const existing = readAll().find(
    (item) =>
      !item.read &&
      sameAssociation(item.associationName, notification.associationName) &&
      item.documentName === notification.documentName &&
      (item.memberName ?? '') === (notification.memberName ?? '') &&
      item.rejectedBy === notification.rejectedBy &&
      (item.reason ?? '') === (notification.reason ?? ''),
  )
  if (existing) {
    if (!existing.recipientUserId && notification.recipientUserId) {
      writeAll(
        readAll().map((item) =>
          item.id === existing.id ? { ...item, recipientUserId: notification.recipientUserId } : item,
        ),
      )
    }
    return existing
  }
  writeAll([notification, ...readAll()])
  return notification
}

export function subscribeAssociationNotifications(callback: () => void) {
  const handler = () => callback()
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) callback()
  }
  window.addEventListener(UPDATED_EVENT, handler)
  window.addEventListener('storage', onStorage)
  return () => {
    window.removeEventListener(UPDATED_EVENT, handler)
    window.removeEventListener('storage', onStorage)
  }
}
