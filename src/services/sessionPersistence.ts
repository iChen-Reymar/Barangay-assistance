const REMEMBER_KEY = 'barangay_remember_session'

function hasBrowserStorage() {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined' && typeof sessionStorage !== 'undefined'
}

export function rememberSessionEnabled() {
  if (!hasBrowserStorage()) return false
  return localStorage.getItem(REMEMBER_KEY) === 'true'
}

export function setRememberSession(remember: boolean) {
  if (!hasBrowserStorage()) return
  localStorage.setItem(REMEMBER_KEY, String(remember))
}

export const supabaseSessionStorage = {
  getItem(key: string) {
    if (!hasBrowserStorage()) return null
    return sessionStorage.getItem(key) ?? localStorage.getItem(key)
  },
  setItem(key: string, value: string) {
    if (!hasBrowserStorage()) return
    if (rememberSessionEnabled()) {
      localStorage.setItem(key, value)
      sessionStorage.removeItem(key)
    } else {
      sessionStorage.setItem(key, value)
      localStorage.removeItem(key)
    }
  },
  removeItem(key: string) {
    if (!hasBrowserStorage()) return
    sessionStorage.removeItem(key)
    localStorage.removeItem(key)
  },
}
