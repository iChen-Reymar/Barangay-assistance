import type { AccountStatus, UserRole } from '../types/auth'

export type TrustedAuthClaims = {
  role: UserRole
  status: AccountStatus
  fullName: string
  associationName?: string
}

export function trustedAuthClaims(metadata: Record<string, unknown> | undefined): TrustedAuthClaims | null {
  const role = metadata?.barangay_role
  const status = metadata?.barangay_status
  const fullName = metadata?.barangay_full_name
  if (role !== 'admin' && role !== 'staff' && role !== 'association') return null
  if (status !== 'approved' && status !== 'pending' && status !== 'rejected') return null
  if (typeof fullName !== 'string' || !fullName.trim()) return null
  const associationName = typeof metadata?.barangay_association_name === 'string'
    ? metadata.barangay_association_name.trim()
    : ''
  return {
    role,
    status,
    fullName: fullName.trim(),
    associationName: associationName || undefined,
  }
}
