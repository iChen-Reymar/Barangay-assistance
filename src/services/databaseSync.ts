const VERSION_KEY = 'barangay_store_version'
const VERSION = 'supabase-live-1'
const SKIP_KEYS = new Set(['barangay_session', 'barangay_client_ip', VERSION_KEY])

let hydrating = false
let installed = false

function shouldSync(key: string) {
  return key.startsWith('barangay_') && !SKIP_KEYS.has(key)
}

async function pushKey(key: string, value: string) {
  try {
    await fetch(`/api/store/${encodeURIComponent(key)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payload: value }),
    })
  } catch {
    // The screen still works from local storage when the API is offline.
  }
}

async function deleteKey(key: string) {
  try {
    await fetch(`/api/store/${encodeURIComponent(key)}`, { method: 'DELETE' })
  } catch {
    // Ignore while the API is offline.
  }
}

export function installDatabaseSync() {
  if (installed || typeof window === 'undefined') return
  installed = true
  const originalSet = localStorage.setItem.bind(localStorage)
  const originalRemove = localStorage.removeItem.bind(localStorage)

  localStorage.setItem = (key: string, value: string) => {
    originalSet(key, value)
    if (!hydrating && shouldSync(key)) void pushKey(key, value)
  }

  localStorage.removeItem = (key: string) => {
    originalRemove(key)
    if (!hydrating && shouldSync(key)) void deleteKey(key)
  }
}

export function writeStoreWithoutSync(key: string, value: string) {
  hydrating = true
  localStorage.setItem(key, value)
  hydrating = false
}

const NOTIFICATIONS_KEY = 'barangay_association_notifications'

function readNotificationList(raw: string | null) {
  if (!raw) return [] as { id?: string; createdAt?: string }[]
  try {
    const parsed = JSON.parse(raw) as unknown
    return Array.isArray(parsed) ? parsed as { id?: string; createdAt?: string }[] : []
  } catch {
    return []
  }
}

function mergeNotifications(localRaw: string | null, remotePayload: string) {
  const byId = new Map<string, { id?: string; createdAt?: string }>()
  for (const item of readNotificationList(remotePayload)) {
    if (item?.id) byId.set(item.id, item)
  }
  for (const item of readNotificationList(localRaw)) {
    if (item?.id && !byId.has(item.id)) byId.set(item.id, item)
  }
  return [...byId.values()].sort((left, right) =>
    String(right.createdAt ?? '').localeCompare(String(left.createdAt ?? '')),
  )
}

export async function pullFromDatabase() {
  installDatabaseSync()
  if (localStorage.getItem(VERSION_KEY) !== VERSION) {
    localStorage.removeItem('barangay_session')
    sessionStorage.removeItem('barangay_session')
    localStorage.setItem(VERSION_KEY, VERSION)
  }

  try {
    const response = await fetch('/api/bootstrap')
    if (!response.ok) return
    const body = (await response.json()) as { stores?: { key: string; payload: string }[] }
    const stores = body.stores ?? []
    let notificationsToPush: string | null = null
    hydrating = true
    for (const row of stores) {
      if (!shouldSync(row.key)) continue
      if (row.key === NOTIFICATIONS_KEY) {
        const merged = JSON.stringify(mergeNotifications(localStorage.getItem(row.key), row.payload))
        if (merged !== row.payload) notificationsToPush = merged
        localStorage.setItem(row.key, merged)
        continue
      }
      localStorage.setItem(row.key, row.payload)
    }
    hydrating = false
    if (notificationsToPush) void pushKey(NOTIFICATIONS_KEY, notificationsToPush)
  } catch {
    hydrating = false
  }

  try {
    const { restoreUsersFromSession } = await import('./authStorage')
    await restoreUsersFromSession()
  } catch {
    // The sign-in screen can still load the account.
  }
}
