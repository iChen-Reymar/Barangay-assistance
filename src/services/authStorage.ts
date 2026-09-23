import type { ReviewInput } from '../types/approval'
import {
  DEFAULT_ADMIN,
  roleLabelToRole,
  roleToDashboardPath,
  type AccessRequestInput,
  type AssociationHeadRequestInput,
  type LoginResult,
  type PasswordChangeInput,
  type ProfileUpdateInput,
  type SessionUser,
  type StoredUser,
  type UserRole,
} from '../types/auth'

const USERS_KEY = 'barangay_users'
const SESSION_KEY = 'barangay_session'
const DEMO_USERS_KEY = 'barangay_managed_users_seeded'

function readUsers(): StoredUser[] {
  const raw = localStorage.getItem(USERS_KEY)
  if (!raw) return []
  try {
    return JSON.parse(raw) as StoredUser[]
  } catch {
    return []
  }
}

function writeUsers(users: StoredUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

function roleToLabel(role: UserRole): string {
  if (role === 'admin') return 'Administrator'
  if (role === 'association') return 'Association Head'
  return 'Barangay Staff'
}

function demoUsers(now: string): StoredUser[] {
  return [
    {
      id: 'user-bryan-martinez',
      email: 'bryan.martinez@barangayburuun.gov.ph',
      password: 'Staff@2026',
      firstName: 'Bryan',
      lastName: 'Martinez',
      fullName: 'Bryan S. Martinez',
      contactNumber: '+63 917 111 2201',
      position: 'Barangay Staff',
      department: 'social-services',
      role: 'staff',
      roleLabel: 'Barangay Staff',
      status: 'approved',
      createdAt: now,
      approvedAt: now,
    },
    {
      id: 'user-maria-santos',
      email: 'maria.santos@barangayburuun.gov.ph',
      password: 'Staff@2026',
      firstName: 'Maria',
      lastName: 'Santos',
      fullName: 'Maria L. Santos',
      contactNumber: '+63 917 111 2202',
      position: 'Barangay Staff',
      department: 'health',
      role: 'staff',
      roleLabel: 'Barangay Staff',
      status: 'approved',
      createdAt: now,
      approvedAt: now,
    },
    {
      id: 'user-ricardo-lopez',
      email: 'ricardo.lopez@sitoyfarmers.org',
      password: 'Assoc@2026',
      firstName: 'Ricardo',
      lastName: 'Lopez',
      fullName: 'Ricardo Lopez',
      contactNumber: '+63 921 567 8901',
      position: 'Association Head',
      department: 'registered-associations',
      role: 'association',
      roleLabel: 'Association Head',
      status: 'approved',
      createdAt: now,
      approvedAt: now,
      associationName: "Sitoy Farmer's Group",
      associationType: 'Agricultural',
    },
  ]
}

export function initializeAuthStorage() {
  let users = readUsers()
  const hasAdmin = users.some(
    (u) => u.email.toLowerCase() === DEFAULT_ADMIN.email.toLowerCase(),
  )
  if (!hasAdmin) {
    const now = new Date().toISOString()
    const adminUser: StoredUser = {
      id: crypto.randomUUID(),
      email: DEFAULT_ADMIN.email,
      password: DEFAULT_ADMIN.password,
      firstName: 'Ricardo',
      lastName: 'Dela Cruz',
      fullName: DEFAULT_ADMIN.fullName,
      contactNumber: '+63 917 000 0000',
      position: 'Barangay Captain',
      department: 'barangay-hall',
      role: 'admin',
      roleLabel: 'Administrator',
      status: 'approved',
      createdAt: now,
      approvedAt: now,
    }
    users = [adminUser, ...users]
  }

  if (!localStorage.getItem(DEMO_USERS_KEY)) {
    const now = new Date().toISOString()
    for (const demo of demoUsers(now)) {
      if (!users.some((user) => user.email.toLowerCase() === demo.email.toLowerCase())) {
        users.push(demo)
      }
    }
    localStorage.setItem(DEMO_USERS_KEY, '1')
  }

  writeUsers(users)
}

function approvedAdminCount(users: StoredUser[], exceptId?: string) {
  return users.filter(
    (user) => user.id !== exceptId && user.role === 'admin' && user.status === 'approved',
  ).length
}

export function createManagedUser(input: {
  firstName: string
  lastName: string
  email: string
  password: string
  contactNumber: string
  role: UserRole
  associationName?: string
}): { success: boolean; error?: string } {
  if (input.password.length < 6) {
    return { success: false, error: 'Password must be at least 6 characters.' }
  }

  const users = readUsers()
  const email = input.email.trim().toLowerCase()
  if (users.some((user) => user.email.toLowerCase() === email)) {
    return { success: false, error: 'An account with this email already exists.' }
  }

  const now = new Date().toISOString()
  const roleLabel = roleToLabel(input.role)
  const user: StoredUser = {
    id: crypto.randomUUID(),
    email: input.email.trim(),
    password: input.password,
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
    fullName: `${input.firstName.trim()} ${input.lastName.trim()}`,
    contactNumber: input.contactNumber.trim(),
    position: roleLabel,
    department: input.role === 'association' ? 'registered-associations' : 'barangay-hall',
    role: input.role,
    roleLabel,
    status: 'approved',
    createdAt: now,
    approvedAt: now,
    associationName: input.role === 'association' ? input.associationName?.trim() || undefined : undefined,
  }
  writeUsers([...users, user])
  return { success: true }
}

export function updateUserRole(
  userId: string,
  role: UserRole,
): { success: boolean; error?: string } {
  const users = readUsers()
  const index = users.findIndex((user) => user.id === userId)
  if (index === -1) return { success: false, error: 'User not found.' }

  const current = users[index]
  if (current.role === 'admin' && current.status === 'approved' && role !== 'admin' && approvedAdminCount(users, userId) === 0) {
    return { success: false, error: 'At least one administrator must remain.' }
  }

  const roleLabel = roleToLabel(role)
  const updated: StoredUser = {
    ...current,
    role,
    roleLabel,
    position: roleLabel,
    department: role === 'association' ? 'registered-associations' : current.department === 'registered-associations' ? 'barangay-hall' : current.department,
  }
  users[index] = updated
  writeUsers(users)
  if (getSession()?.id === userId) syncSession(updated)
  return { success: true }
}

export function removeUser(
  userId: string,
  actorId: string,
): { success: boolean; error?: string } {
  if (userId === actorId) {
    return { success: false, error: 'You cannot remove the account you are signed in with.' }
  }

  const users = readUsers()
  const target = users.find((user) => user.id === userId)
  if (!target) return { success: false, error: 'User not found.' }
  if (target.role === 'admin' && target.status === 'approved' && approvedAdminCount(users, userId) === 0) {
    return { success: false, error: 'At least one administrator must remain.' }
  }

  writeUsers(users.filter((user) => user.id !== userId))
  return { success: true }
}

export function getAllUsers(): StoredUser[] {
  return readUsers()
}

export function getPendingUsers(): StoredUser[] {
  return readUsers().filter((u) => u.status === 'pending')
}

export function getApprovedUsers(): StoredUser[] {
  return readUsers().filter((u) => u.status === 'approved')
}

export function getUserById(userId: string): StoredUser | null {
  return readUsers().find((u) => u.id === userId) ?? null
}

export function getSession(): SessionUser | null {
  const raw = sessionStorage.getItem(SESSION_KEY) ?? localStorage.getItem(SESSION_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as SessionUser
  } catch {
    return null
  }
}

export function setSession(user: SessionUser, rememberMe: boolean) {
  const data = JSON.stringify(user)
  sessionStorage.setItem(SESSION_KEY, data)
  if (rememberMe) {
    localStorage.setItem(SESSION_KEY, data)
  } else {
    localStorage.removeItem(SESSION_KEY)
  }
}

export function clearSession() {
  sessionStorage.removeItem(SESSION_KEY)
  localStorage.removeItem(SESSION_KEY)
}

export function login(email: string, password: string, rememberMe: boolean): LoginResult {
  const users = readUsers()
  const user = users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase())

  if (!user || user.password !== password) {
    return { success: false, error: 'Invalid email or password.' }
  }

  if (user.status === 'pending') {
    return {
      success: false,
      error: 'Your account is pending admin approval. Please wait for confirmation before signing in.',
    }
  }

  if (user.status === 'rejected') {
    return {
      success: false,
      error: 'Your access request was rejected. Contact the barangay administrator for assistance.',
    }
  }

  const session: SessionUser = {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    roleLabel: user.roleLabel,
  }

  setSession(session, rememberMe)
  return { success: true, redirectTo: roleToDashboardPath(user.role) }
}

export function submitAccessRequest(input: AccessRequestInput): { success: boolean; error?: string } {
  const users = readUsers()
  const email = input.email.trim().toLowerCase()

  if (users.some((u) => u.email.toLowerCase() === email)) {
    return { success: false, error: 'An account with this email already exists.' }
  }

  const newUser: StoredUser = {
    id: crypto.randomUUID(),
    email: input.email.trim(),
    password: input.password,
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
    fullName: `${input.firstName.trim()} ${input.lastName.trim()}`,
    contactNumber: input.contactNumber.trim(),
    position: input.position.trim(),
    department: input.department,
    role: roleLabelToRole(input.roleLabel),
    roleLabel: input.roleLabel,
    status: 'pending',
    createdAt: new Date().toISOString(),
  }

  writeUsers([...users, newUser])
  return { success: true }
}

export function submitAssociationHeadRequest(
  input: AssociationHeadRequestInput,
): { success: boolean; error?: string } {
  const users = readUsers()
  const email = input.email.trim().toLowerCase()

  if (users.some((u) => u.email.toLowerCase() === email)) {
    return { success: false, error: 'An account with this email already exists.' }
  }

  const newUser: StoredUser = {
    id: crypto.randomUUID(),
    email: input.email.trim(),
    password: input.password,
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
    fullName: `${input.firstName.trim()} ${input.lastName.trim()}`,
    contactNumber: input.contactNumber.trim(),
    position: 'Association Head',
    department: 'registered-associations',
    role: 'association',
    roleLabel: 'Association Head',
    status: 'pending',
    createdAt: new Date().toISOString(),
    associationName: input.associationName.trim(),
    associationType: input.associationType,
    associationAddress: input.associationAddress.trim(),
    registrationNumber: input.registrationNumber?.trim() || undefined,
  }

  writeUsers([...users, newUser])
  return { success: true }
}

export function approveUser(userId: string, review: ReviewInput): boolean {
  const users = readUsers()
  const index = users.findIndex((u) => u.id === userId)
  if (index === -1) return false

  const now = new Date().toISOString()
  users[index] = {
    ...users[index],
    status: 'approved',
    approvedAt: now,
    rejectedAt: undefined,
    reviewNotes: review.notes,
    reviewedBy: review.reviewedBy,
    reviewedByEmail: review.reviewedByEmail,
    reviewedAt: now,
    reviewDecision: 'approve',
  }
  writeUsers(users)
  return true
}

export function rejectUser(userId: string, review: ReviewInput): boolean {
  const users = readUsers()
  const index = users.findIndex((u) => u.id === userId)
  if (index === -1) return false

  const now = new Date().toISOString()
  users[index] = {
    ...users[index],
    status: 'rejected',
    rejectedAt: now,
    reviewNotes: review.notes,
    reviewedBy: review.reviewedBy,
    reviewedByEmail: review.reviewedByEmail,
    reviewedAt: now,
    reviewDecision: 'reject',
  }
  writeUsers(users)
  return true
}

export function getReviewedAccessRequests(): StoredUser[] {
  return readUsers()
    .filter((u) => u.reviewedAt && u.status !== 'pending')
    .sort((a, b) => new Date(b.reviewedAt!).getTime() - new Date(a.reviewedAt!).getTime())
}

export function anonymizeRejectedUsers(): number {
  const users = readUsers()
  let count = 0
  const updated = users.map((user) => {
    if (user.status !== 'rejected' || user.isAnonymized) return user
    count += 1
    return {
      ...user,
      firstName: 'Anonymized',
      lastName: 'User',
      fullName: `Anonymized User ${user.id.slice(0, 6).toUpperCase()}`,
      email: `anon-${user.id.slice(0, 8)}@redacted.local`,
      contactNumber: '***-***-****',
      password: crypto.randomUUID(),
      associationAddress: undefined,
      associationName: user.associationName
        ? `Association ${user.id.slice(0, 6).toUpperCase()}`
        : undefined,
      registrationNumber: undefined,
      isAnonymized: true,
      anonymizedAt: new Date().toISOString(),
    }
  })
  if (count > 0) writeUsers(updated)
  return count
}

export function purgeAnonymizedRejectedUsersOlderThan(days: number): number {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000
  const users = readUsers()
  const kept = users.filter((user) => {
    if (user.status !== 'rejected' || !user.isAnonymized) return true
    const reference = user.anonymizedAt ?? user.rejectedAt ?? user.createdAt
    return new Date(reference).getTime() >= cutoff
  })
  const removed = users.length - kept.length
  if (removed > 0) writeUsers(kept)
  return removed
}

function syncSession(user: StoredUser) {
  const session: SessionUser = {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    roleLabel: user.roleLabel,
  }
  const data = JSON.stringify(session)
  sessionStorage.setItem(SESSION_KEY, data)
  if (localStorage.getItem(SESSION_KEY)) {
    localStorage.setItem(SESSION_KEY, data)
  }
}

export function updateUserProfile(
  userId: string,
  input: ProfileUpdateInput,
): { success: boolean; error?: string } {
  const users = readUsers()
  const index = users.findIndex((u) => u.id === userId)
  if (index === -1) {
    return { success: false, error: 'User not found.' }
  }

  const email = input.email.trim().toLowerCase()
  const duplicate = users.find(
    (u) => u.id !== userId && u.email.toLowerCase() === email,
  )
  if (duplicate) {
    return { success: false, error: 'This email is already used by another account.' }
  }

  const updated: StoredUser = {
    ...users[index],
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
    fullName: `${input.firstName.trim()} ${input.lastName.trim()}`,
    email: input.email.trim(),
    contactNumber: input.contactNumber.trim(),
    position: input.position.trim(),
    department: input.department,
  }

  users[index] = updated
  writeUsers(users)
  syncSession(updated)
  return { success: true }
}

export function changeUserPassword(
  userId: string,
  input: PasswordChangeInput,
): { success: boolean; error?: string } {
  const users = readUsers()
  const index = users.findIndex((u) => u.id === userId)
  if (index === -1) {
    return { success: false, error: 'User not found.' }
  }

  if (users[index].password !== input.currentPassword) {
    return { success: false, error: 'Current password is incorrect.' }
  }

  if (input.newPassword.length < 6) {
    return { success: false, error: 'New password must be at least 6 characters.' }
  }

  users[index] = { ...users[index], password: input.newPassword }
  writeUsers(users)
  return { success: true }
}

export const departmentOptions = [
  { value: 'barangay-hall', label: 'Barangay Hall' },
  { value: 'social-services', label: 'Social Services' },
  { value: 'health', label: 'Health & Sanitation' },
  { value: 'peace-order', label: 'Peace & Order' },
  { value: 'youth-sports', label: 'Youth & Sports' },
  { value: 'registered-associations', label: 'Registered Association' },
]

export function formatDepartment(value: string): string {
  const labels: Record<string, string> = {
    'barangay-hall': 'Barangay Hall',
    'social-services': 'Social Services',
    health: 'Health & Sanitation',
    'peace-order': 'Peace & Order',
    'youth-sports': 'Youth & Sports',
    'registered-associations': 'Registered Association',
  }
  return labels[value] ?? value
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}
