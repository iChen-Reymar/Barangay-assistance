const honorifics = /^(hon|dr|mr|mrs|ms|atty|engr)\.?$/i

export function getInitials(fullName: string): string {
  const parts = fullName
    .split(/\s+/)
    .filter((part) => part && !honorifics.test(part))

  if (parts.length === 0) return 'AD'
  const first = parts[0][0] ?? ''
  const last = parts.length > 1 ? parts[parts.length - 1][0] ?? '' : ''
  return `${first}${last}`.toUpperCase()
}

export function usernameFromEmail(email: string): string {
  return email.split('@')[0] ?? email
}
