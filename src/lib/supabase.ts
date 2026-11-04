import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined

// The auth client refreshes a saved login when it is inside this window.
// A rejected refresh is the browser's "400" on grant_type=refresh_token.
const REFRESH_WINDOW_MS = 90_000

export function supabaseAuthStorageKey() {
  try {
    const ref = new URL(supabaseUrl ?? '').hostname.split('.')[0]
    return ref ? `sb-${ref}-auth-token` : 'sb-auth-token'
  } catch {
    return 'sb-auth-token'
  }
}

export function clearSupabaseAuthStorage() {
  if (typeof localStorage === 'undefined') return
  localStorage.removeItem(supabaseAuthStorageKey())
}

function dropStaleAuthSession() {
  if (typeof localStorage === 'undefined') return
  const key = supabaseAuthStorageKey()
  const raw = localStorage.getItem(key)
  if (!raw) return
  try {
    const session = JSON.parse(raw) as { access_token?: string; refresh_token?: string; expires_at?: number }
    const expiresAt = typeof session.expires_at === 'number' ? session.expires_at * 1000 : 0
    const unusable = !session.access_token || !session.refresh_token || expiresAt - Date.now() < REFRESH_WINDOW_MS
    if (unusable) localStorage.removeItem(key)
  } catch {
    localStorage.removeItem(key)
  }
}

dropStaleAuthSession()

export const supabase = createClient(supabaseUrl ?? '', supabaseKey ?? '', {
  auth: {
    storageKey: supabaseAuthStorageKey(),
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
})
