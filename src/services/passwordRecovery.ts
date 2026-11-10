export function recoveryEmailError(email: string) {
  const normalized = email.trim().toLowerCase()
  if (!normalized.includes('@')) return 'Enter a valid email address.'
  if (normalized.endsWith('@buruun.local')) {
    return 'Internal usernames cannot receive email. Ask the administrator to assign a real email address.'
  }
  return ''
}

export function newPasswordError(password: string, confirmation: string) {
  if (password.length < 8) return 'Use at least 8 characters for your new password.'
  if (password !== confirmation) return 'The passwords do not match.'
  return ''
}
