import { supabase } from '../lib/supabase'

export const AUTH_EXPIRED_EVENT = 'barangay:auth-expired'

async function accessToken(forceRefresh = false) {
  if (forceRefresh) {
    const { data, error } = await supabase.auth.refreshSession()
    if (error) return null
    return data.session?.access_token ?? null
  }

  const { data, error } = await supabase.auth.getSession()
  if (error) return null
  if (data.session?.access_token) return data.session.access_token

  const refreshed = await supabase.auth.refreshSession()
  return refreshed.error ? null : refreshed.data.session?.access_token ?? null
}

function withToken(init: RequestInit, token: string) {
  const headers = new Headers(init.headers)
  headers.set('Authorization', `Bearer ${token}`)
  return { ...init, headers }
}

function announceExpiredSession() {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT))
}

/** Fetches a protected API route and retries once with a refreshed Supabase JWT. */
export async function authenticatedFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const token = await accessToken()
  if (!token) {
    announceExpiredSession()
    return new Response(JSON.stringify({ error: 'Your session expired. Sign in again to continue.' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  let response = await fetch(input, withToken(init, token))
  if (response.status !== 401) return response

  const refreshedToken = await accessToken(true)
  if (!refreshedToken) {
    announceExpiredSession()
    return response
  }

  response = await fetch(input, withToken(init, refreshedToken))
  if (response.status === 401) announceExpiredSession()
  return response
}
