import { supabase } from '../lib/supabase'
import { writeStoreWithoutSync } from './databaseSync'
import type { ReviewInput } from '../types/approval'
import {
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

export function initializeAuthStorage() {
  // Accounts live in Supabase. The app does not create a local administrator.
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

export function getAssociationHeadUsers(): StoredUser[] {
  initializeAuthStorage()
  return getApprovedUsers()
    .filter((user) => user.role === 'association')
    .sort((a, b) => a.fullName.localeCompare(b.fullName))
}

export function assignAssociationHead(
  userId: string,
  associationName: string,
  associationType?: string,
): { success: boolean; error?: string } {
  const users = readUsers()
  const index = users.findIndex((user) => user.id === userId)
  if (index === -1) return { success: false, error: 'User not found.' }

  const name = associationName.trim()
  const updated: StoredUser = {
    ...users[index],
    role: 'association',
    roleLabel: 'Association Head',
    position: 'Association Head',
    department: 'registered-associations',
    associationName: name,
    associationType: associationType?.trim() || users[index].associationType,
  }
  users[index] = updated
  writeUsers(users)
  if (getSession()?.id === userId) syncSession(updated)
  return { success: true }
}

export function releaseAssociationHead(userId: string, associationName: string) {
  const users = readUsers()
  const index = users.findIndex((user) => user.id === userId)
  if (index === -1) return

  const current = users[index]
  if ((current.associationName ?? '').trim().toLowerCase() !== associationName.trim().toLowerCase()) return

  const updated: StoredUser = {
    ...current,
    associationName: undefined,
    associationType: undefined,
  }
  users[index] = updated
  writeUsers(users)
  if (getSession()?.id === userId) syncSession(updated)
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

const ACCESS_TOKEN_KEY = 'supabase_access_token'

export function clearSession() {
  sessionStorage.removeItem(SESSION_KEY)
  localStorage.removeItem(SESSION_KEY)
  sessionStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(ACCESS_TOKEN_KEY)
}

function roleFromLabel(value: string | undefined): UserRole | null {
  const text = (value ?? '').trim().toLowerCase()
  if (text.includes('admin') || text.includes('captain')) return 'admin'
  if (text.includes('staff')) return 'staff'
  if (text.includes('association')) return 'association'
  return null
}

function saveAccessToken(token: string, rememberMe: boolean) {
  sessionStorage.setItem(ACCESS_TOKEN_KEY, token)
  if (rememberMe) localStorage.setItem(ACCESS_TOKEN_KEY, token)
  else localStorage.removeItem(ACCESS_TOKEN_KEY)
}

function readAccessToken() {
  return sessionStorage.getItem(ACCESS_TOKEN_KEY) ?? localStorage.getItem(ACCESS_TOKEN_KEY)
}

function metadataValue(bag: Record<string, unknown> | undefined, names: string[]) {
  if (!bag) return undefined
  for (const [key, value] of Object.entries(bag)) {
    if (names.includes(key.toLowerCase()) && typeof value === 'string' && value.trim()) return value
  }
  return undefined
}

function profileFromRow(row: Record<string, unknown>): StoredUser | null {
  const extra = row.payload && typeof row.payload === 'object' ? row.payload as Record<string, unknown> : {}
  const role = roleFromLabel(typeof row.role === 'string' ? row.role : undefined)
    ?? roleFromLabel(typeof extra.roleLabel === 'string' ? extra.roleLabel : undefined)
    ?? roleFromLabel(typeof row.role_label === 'string' ? row.role_label : undefined)
  if (!role || row.id == null || typeof row.email !== 'string') return null
  const fullName = typeof row.full_name === 'string' ? row.full_name : row.email
  const parts = fullName.trim().split(/\s+/).filter(Boolean)
  const status = row.status === 'pending' || row.status === 'rejected' ? row.status : 'approved'
  const text = (value: unknown, fallback = '') => typeof value === 'string' ? value : fallback
  return {
    id: String(row.id),
    email: row.email,
    password: '',
    firstName: text(extra.firstName, text(row.first_name, parts[0] ?? '')),
    lastName: text(extra.lastName, text(row.last_name, parts.slice(1).join(' '))),
    fullName,
    contactNumber: text(extra.contactNumber, text(row.contact_number)),
    position: text(extra.position, text(row.position)),
    department: text(extra.department, text(row.department)),
    role,
    roleLabel: text(extra.roleLabel, text(row.role_label, roleToLabel(role))),
    status,
    createdAt: text(extra.createdAt, text(row.created_at, new Date().toISOString())),
    associationName: text(row.association_name, text(extra.associationName)) || undefined,
    associationType: text(extra.associationType, text(row.association_type)) || undefined,
    associationAddress: text(extra.associationAddress, text(row.association_address)) || undefined,
    registrationNumber: text(extra.registrationNumber, text(row.registration_number)) || undefined,
  }
}

function rememberUser(account: StoredUser) {
  const users = readUsers().filter((user) => user.id !== account.id && user.email.toLowerCase() !== account.email.toLowerCase())
  writeStoreWithoutSync(USERS_KEY, JSON.stringify([account, ...users]))
}

async function fetchVisibleUsers() {
  const { data, error } = await supabase.from('users').select('*')
  if (error || !Array.isArray(data)) return []
  return data.flatMap((row) => {
    const account = profileFromRow(row as Record<string, unknown>)
    return account ? [account] : []
  })
}

async function createUserRow(account: StoredUser) {
  await supabase.from('users').insert({
    id: account.id,
    email: account.email,
    full_name: account.fullName,
    role: account.role,
    status: account.status,
    association_name: account.associationName || null,
    payload: {
      firstName: account.firstName,
      lastName: account.lastName,
      contactNumber: account.contactNumber,
      position: account.position,
      department: account.department,
      roleLabel: account.roleLabel,
      associationType: account.associationType || null,
      associationAddress: account.associationAddress || null,
      registrationNumber: account.registrationNumber || null,
      createdAt: account.createdAt,
    },
  })
}

export async function restoreUsersFromSession() {
  const token = readAccessToken()
  if (token) {
    const visible = await fetchVisibleUsers()
    if (visible.length > 0) {
      const merged = new Map(readUsers().map((user) => [user.email.toLowerCase(), user]))
      for (const account of visible) merged.set(account.email.toLowerCase(), account)
      writeStoreWithoutSync(USERS_KEY, JSON.stringify([...merged.values()]))
      return
    }
  }

  const session = getSession()
  if (!session) return
  if (readUsers().some((user) => user.email.toLowerCase() === session.email.toLowerCase())) return
  rememberUser({
    id: session.id,
    email: session.email,
    password: '',
    firstName: session.fullName.split(' ')[0] ?? '',
    lastName: session.fullName.split(' ').slice(1).join(' '),
    fullName: session.fullName,
    contactNumber: '',
    position: '',
    department: '',
    role: session.role,
    roleLabel: session.roleLabel,
    status: 'approved',
    createdAt: new Date().toISOString(),
  })
}

export async function login(email: string, password: string, rememberMe: boolean): Promise<LoginResult> {
  if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY) {
    return { success: false, error: 'Supabase is not configured.' }
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  })
  if (error || !data.user || !data.session) {
    return { success: false, error: error?.message || 'Invalid email or password.' }
  }

  saveAccessToken(data.session.access_token, rememberMe)
  const visible = await fetchVisibleUsers()
  const signedInEmail = email.trim().toLowerCase()
  const fromTable = visible.find((user) => user.email.toLowerCase() === signedInEmail)
    ?? readUsers().find((user) => user.email.toLowerCase() === signedInEmail)
  const userMetadata = data.user.user_metadata as Record<string, unknown>
  const appMetadata = data.user.app_metadata as Record<string, unknown>
  const metadataRole = roleFromLabel(metadataValue(userMetadata, ['role', 'user_role', 'role_label']))
    ?? roleFromLabel(metadataValue(appMetadata, ['role', 'user_role', 'role_label']))
  const metadataStatus = metadataValue(userMetadata, ['status'])
  const role = fromTable?.role ?? metadataRole ?? 'admin'
  const status = fromTable?.status ?? (metadataStatus === 'pending' || metadataStatus === 'rejected' ? metadataStatus : 'approved')
  if (status === 'pending') {
    return {
      success: false,
      error: 'Your account is pending admin approval. Please wait for confirmation before signing in.',
    }
  }
  if (status === 'rejected') {
    return {
      success: false,
      error: 'Your access request was rejected. Contact the barangay administrator for assistance.',
    }
  }

  const fullName = fromTable?.fullName
    || metadataValue(userMetadata, ['full_name', 'name'])
    || email.trim()
  const account: StoredUser = fromTable ?? {
    id: data.user.id,
    email: email.trim(),
    password: '',
    firstName: fullName.split(' ')[0] ?? '',
    lastName: fullName.split(' ').slice(1).join(' '),
    fullName,
    contactNumber: '',
    position: '',
    department: '',
    role,
    roleLabel: roleToLabel(role),
    status: 'approved',
    createdAt: new Date().toISOString(),
  }
  rememberUser(account)
  if (!fromTable) await createUserRow(account)

  const session: SessionUser = {
    id: account.id,
    email: account.email,
    fullName: account.fullName,
    role: account.role,
    roleLabel: account.roleLabel,
  }
  setSession(session, rememberMe)
  return { success: true, redirectTo: roleToDashboardPath(account.role) }
}

async function saveAccessRequest(user: StoredUser, password: string): Promise<{ success: boolean; error?: string }> {
  if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY) {
    return { success: false, error: 'Supabase is not configured.' }
  }

  const response = await fetch('/api/access-requests', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(user),
  })
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { error?: string }
    return { success: false, error: body.error ?? 'The request could not be saved to Supabase.' }
  }

  const { error: signupError } = await supabase.auth.signUp({
    email: user.email,
    password,
    options: {
      data: {
        role: user.role,
        full_name: user.fullName,
        status: 'pending',
        contact_number: user.contactNumber,
        position: user.position,
        department: user.department,
      },
    },
  })
  if (signupError) {
    if (signupError.message.toLowerCase().includes('already')) {
      return { success: false, error: 'An account with this email already exists.' }
    }
    return { success: false, error: signupError.message }
  }

  rememberUser(user)
  return { success: true }
}

export async function submitAccessRequest(input: AccessRequestInput): Promise<{ success: boolean; error?: string }> {
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

  return saveAccessRequest(newUser, input.password)
}

export async function submitAssociationHeadRequest(
  input: AssociationHeadRequestInput,
): Promise<{ success: boolean; error?: string }> {
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
    associationName: input.associationName?.trim() || undefined,
    associationType: input.associationType?.trim() || undefined,
    associationAddress: input.associationAddress.trim(),
    registrationNumber: input.registrationNumber?.trim() || undefined,
  }

  return saveAccessRequest(newUser, input.password)
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
