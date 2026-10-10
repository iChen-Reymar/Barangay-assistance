const STORE_KEYS = [
  'barangay_users',
  'barangay_reviewable_items',
  'barangay_associations',
  'barangay_staff_beneficiaries',
  'barangay_assistance_programs',
  'barangay_association_members',
  'barangay_association_details',
  'barangay_priority_list',
  'barangay_audit_logs',
  'barangay_report_history',
  'barangay_privacy_settings',
  'barangay_generated_assistance_list',
  'barangay_managed_users_seeded',
]

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

export async function pullFromDatabase() {
  installDatabaseSync()
  hydrating = true
  for (const key of STORE_KEYS) localStorage.removeItem(key)
  if (localStorage.getItem(VERSION_KEY) !== VERSION) {
    localStorage.removeItem('barangay_session')
    sessionStorage.removeItem('barangay_session')
    localStorage.setItem(VERSION_KEY, VERSION)
  }
  hydrating = false

  try {
    const response = await fetch('/api/bootstrap')
    if (!response.ok) return
    const body = (await response.json()) as { stores?: { key: string; payload: string }[] }
    const stores = body.stores ?? []
    hydrating = true
    for (const row of stores) {
      if (shouldSync(row.key)) localStorage.setItem(row.key, row.payload)
    }
    hydrating = false
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
