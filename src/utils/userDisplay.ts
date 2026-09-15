export function getInitials(fullName: string): string {
  return fullName
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export function usernameFromEmail(email: string): string {
  return email.split('@')[0] ?? email
}
