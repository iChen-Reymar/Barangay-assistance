const VERSION_KEY = 'barangay_store_version'
const VERSION = 'supabase-records-2'
const SKIP_KEYS = new Set(['barangay_session', 'barangay_client_ip', VERSION_KEY])
const RECORD_IDS: Partial<Record<string, (record: Record<string, unknown>, index: number) => string>> = {
  barangay_users: (record) => String(record.id ?? ''),
  barangay_associations: (record) => String(record.id ?? ''),
  barangay_association_members: (record) => String(record.id ?? ''),
  barangay_association_notifications: (record) => String(record.id ?? ''),
  barangay_aid_records: (record) => String(record.id ?? ''),
  barangay_staff_beneficiaries: (record) => String(record.id ?? ''),
  barangay_assistance_programs: (record) => String(record.id ?? ''),
  barangay_reviewable_items: (record) => String(record.id ?? ''),
  barangay_generated_assistance_list: (record) => String(record.id ?? ''),
  barangay_priority_list: (record) => String(record.id ?? ''),
  barangay_audit_logs: (record) => String(record.id ?? ''),
  barangay_report_history: (record) => String(record.id ?? ''),
}

let hydrating = false
let installed = false
let rejectedBootstrapToken = ''
const syncQueues = new Map<string, Promise<void>>()

function shouldSync(key: string) {
  return key.startsWith('barangay_') && !SKIP_KEYS.has(key)
}

async function authHeaders(includeJson = false) {
  const { data } = await supabase.auth.getSession()
  const headers: Record<string, string> = {}
  if (includeJson) headers['Content-Type'] = 'application/json'
  if (data.session?.access_token) headers.Authorization = `Bearer ${data.session.access_token}`
  return headers
}

function parseJson(raw: string | null): unknown {
  if (!raw) return null
  try {
    return JSON.parse(raw) as unknown
  } catch {
    return null
  }
}

function recordMap(key: string, value: unknown) {
  const identify = RECORD_IDS[key]
  const records = new Map<string, Record<string, unknown>>()
  if (!identify || !Array.isArray(value)) return records
  value.forEach((item, index) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return
    const record = item as Record<string, unknown>
    const id = identify(record, index).trim()
    if (id) records.set(id, record)
  })
  return records
}

async function putRecord(key: string, id: string, payload: unknown) {
  const response = await fetch(`/api/records/${encodeURIComponent(key)}/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: await authHeaders(true),
    body: JSON.stringify({ payload }),
  })
  if (!response.ok && response.status !== 401) {
    const body = await response.json().catch(() => ({})) as { error?: string }
    console.error(body.error || `Could not save ${key}/${id}.`)
  }
}

async function deleteRecord(key: string, id: string) {
  const response = await fetch(`/api/records/${encodeURIComponent(key)}/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: await authHeaders(),
  })
  if (!response.ok && response.status !== 401) {
    const body = await response.json().catch(() => ({})) as { error?: string }
    console.error(body.error || `Could not delete ${key}/${id}.`)
  }
}

async function syncStoreChange(key: string, previousRaw: string | null, nextRaw: string | null) {
  const previous = parseJson(previousRaw)
  const next = parseJson(nextRaw)
  const identify = RECORD_IDS[key]
  if (identify) {
    const before = recordMap(key, previous)
    const after = recordMap(key, next)
    for (const [id, record] of after) {
      if (JSON.stringify(before.get(id)) !== JSON.stringify(record)) await putRecord(key, id, record)
    }
    if (key !== 'barangay_users') {
      for (const id of before.keys()) {
        if (!after.has(id)) await deleteRecord(key, id)
      }
    }
    return
  }

  if (key === 'barangay_association_details' || key === 'barangay_privacy_settings') {
    if (next && typeof next === 'object' && !Array.isArray(next)) {
      await putRecord(key, key === 'barangay_privacy_settings' ? 'default' : String((next as { id?: unknown }).id ?? 'profile'), next)
    }
  }
}

function queueStoreChange(key: string, previousRaw: string | null, nextRaw: string | null) {
  const pending = syncQueues.get(key) ?? Promise.resolve()
  const next = pending.then(() => syncStoreChange(key, previousRaw, nextRaw)).catch((error) => {
    console.error(`Database synchronization failed for ${key}.`, error)
  })
  syncQueues.set(key, next)
}

export function installDatabaseSync() {
  if (installed || typeof window === 'undefined') return
  installed = true
  const originalSet = localStorage.setItem.bind(localStorage)
  const originalRemove = localStorage.removeItem.bind(localStorage)

  localStorage.setItem = (key: string, value: string) => {
    const previous = localStorage.getItem(key)
    originalSet(key, value)
    if (!hydrating && shouldSync(key)) queueStoreChange(key, previous, value)
  }

  localStorage.removeItem = (key: string) => {
    const previous = localStorage.getItem(key)
    originalRemove(key)
    if (!hydrating && shouldSync(key)) queueStoreChange(key, previous, null)
  }
}

export function writeStoreWithoutSync(key: string, value: string) {
  hydrating = true
  localStorage.setItem(key, value)
  hydrating = false
}

export async function pullFromDatabase() {
  installDatabaseSync()
  if (localStorage.getItem(VERSION_KEY) !== VERSION) {
    localStorage.removeItem('barangay_session')
    sessionStorage.removeItem('barangay_session')
    localStorage.setItem(VERSION_KEY, VERSION)
  }

  // The application calls this once before rendering the sign-in page. Bootstrap
  // is protected, so do not send a request until Supabase has an authenticated
  // session and can attach its bearer token. LoginPage calls this function again
  // immediately after a successful sign-in.
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
  if (sessionError || !sessionData.session?.access_token) return
  const accessToken = sessionData.session.access_token
  if (rejectedBootstrapToken === accessToken) return

  try {
    const response = await fetch('/api/bootstrap', {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    if (response.status === 401) {
      rejectedBootstrapToken = accessToken
      return
    }
    if (!response.ok) return
    rejectedBootstrapToken = ''
    const body = (await response.json()) as { stores?: { key: string; payload: string }[] }
    const stores = body.stores ?? []
    const remoteKeys = new Set(stores.map((row) => row.key))
    const changedKeys: string[] = []
    hydrating = true
    for (let index = localStorage.length - 1; index >= 0; index -= 1) {
      const key = localStorage.key(index)
      if (key && shouldSync(key) && !remoteKeys.has(key)) {
        localStorage.removeItem(key)
        changedKeys.push(key)
      }
    }
    for (const row of stores) {
      if (!shouldSync(row.key)) continue
      if (localStorage.getItem(row.key) !== row.payload) {
        localStorage.setItem(row.key, row.payload)
        changedKeys.push(row.key)
      }
    }
    hydrating = false
    for (const key of new Set(changedKeys)) {
      window.dispatchEvent(new StorageEvent('storage', { key, newValue: localStorage.getItem(key) }))
    }
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
import { supabase } from '../lib/supabase'
