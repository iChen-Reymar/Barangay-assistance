const MAX_CONTACT_DIGITS = 15

export function sanitizeContactNumber(value: string): string {
  return value.replace(/\D/g, '').slice(0, MAX_CONTACT_DIGITS)
}

export function isValidContactNumber(value: string): boolean {
  return /^\d{7,15}$/.test(value)
}
