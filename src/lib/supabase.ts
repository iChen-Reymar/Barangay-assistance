import { createClient } from '@supabase/supabase-js'
import { supabaseSessionStorage } from '../services/sessionPersistence'
import { publicSupabaseKey, publicSupabaseUrl } from '../../config/supabase-public.mjs'

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined) || publicSupabaseUrl
const supabaseKey = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined) || publicSupabaseKey

export function supabaseAuthStorageKey() {
  try {
    const ref = new URL(supabaseUrl ?? '').hostname.split('.')[0]
    return ref ? `sb-${ref}-auth-token` : 'sb-auth-token'
  } catch {
    return 'sb-auth-token'
  }
}

export function clearSupabaseAuthStorage() {
  if (typeof localStorage === 'undefined' || typeof sessionStorage === 'undefined') return
  localStorage.removeItem(supabaseAuthStorageKey())
  sessionStorage.removeItem(supabaseAuthStorageKey())
}

function dropStaleAuthSession() {
  if (typeof localStorage === 'undefined' || typeof sessionStorage === 'undefined') return
  const key = supabaseAuthStorageKey()
  const raw = sessionStorage.getItem(key) ?? localStorage.getItem(key)
  if (!raw) return
  try {
    const session = JSON.parse(raw) as { access_token?: string; refresh_token?: string }
    // Keep expired access tokens when a refresh token exists. Supabase restores
    // and refreshes them automatically; deleting them here left the app's local
    // profile signed in while its real Auth session had disappeared.
    const unusable = !session.access_token || !session.refresh_token
    if (unusable) supabaseSessionStorage.removeItem(key)
  } catch {
    supabaseSessionStorage.removeItem(key)
  }
}

dropStaleAuthSession()

export const supabase = createClient(supabaseUrl ?? '', supabaseKey ?? '', {
  auth: {
    storageKey: supabaseAuthStorageKey(),
    storage: supabaseSessionStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})
