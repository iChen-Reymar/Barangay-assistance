export type UserRole = 'admin' | 'staff' | 'association'
export type AccountStatus = 'approved' | 'pending' | 'rejected'

export interface StoredUser {
  id: string
  email: string
  password: string
  firstName: string
  lastName: string
  fullName: string
  contactNumber: string
  position: string
  department: string
  role: UserRole
  roleLabel: string
  status: AccountStatus
  createdAt: string
  approvedAt?: string
  rejectedAt?: string
  reviewNotes?: string
  reviewedBy?: string
  reviewedByEmail?: string
  reviewedAt?: string
  reviewDecision?: 'approve' | 'reject'
  associationName?: string
  associationType?: string
  associationAddress?: string
  registrationNumber?: string
  isAnonymized?: boolean
  anonymizedAt?: string
}

export interface SessionUser {
  id: string
  email: string
  fullName: string
  role: UserRole
  roleLabel: string
}

export interface AccessRequestInput {
  firstName: string
  lastName: string
  email: string
  contactNumber: string
  position: string
  department: string
  roleLabel: string
  password: string
}

export interface AssociationHeadRequestInput {
  firstName: string
  lastName: string
  email: string
  contactNumber: string
  password: string
  associationName: string
  associationType: string
  associationAddress: string
  registrationNumber?: string
}

export interface ProfileUpdateInput {
  firstName: string
  lastName: string
  email: string
  contactNumber: string
  position: string
  department: string
}

export interface PasswordChangeInput {
  currentPassword: string
  newPassword: string
}

export interface LoginResult {
  success: boolean
  error?: string
  redirectTo?: string
}

export const DEFAULT_ADMIN = {
  email: 'admin@barangayburuun.gov.ph',
  password: 'Admin@2026',
  fullName: 'Hon. Ricardo L. Dela Cruz',
}

export function roleLabelToRole(roleLabel: string): UserRole {
  if (roleLabel === 'Association Head') return 'association'
  if (roleLabel === 'Barangay Staff') return 'staff'
  return 'staff'
}

export function roleToDashboardPath(role: UserRole): string {
  if (role === 'admin') return '/admin'
  if (role === 'association') return '/association'
  return '/staff'
}
