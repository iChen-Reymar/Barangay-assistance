import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { initializeAuditStorage, buildChanges, logAuditEvent } from '../services/auditStorage'
import { initializeDecisionStorage } from '../services/decisionStorage'
import { initializePrivacyStorage } from '../services/privacyStorage'
import { initializePriorityStorage } from '../services/priorityStorage'
import { initializeStaffBeneficiaryStorage } from '../services/staffBeneficiaryStorage'
import { initializeReportHistoryStorage } from '../services/reportHistoryService'
import {
  approveUser,
  changeUserPassword,
  clearSession,
  formatDepartment,
  getAllUsers,
  getPendingUsers,
  getSession,
  getUserById,
  initializeAuthStorage,
  login as loginUser,
  rejectUser,
  submitAccessRequest,
  submitAssociationHeadRequest,
  updateUserProfile,
} from '../services/authStorage'
import { syncAssociationFromApprovedUser } from '../services/memberStorage'
import type {
  AccessRequestInput,
  AssociationHeadRequestInput,
  PasswordChangeInput,
  ProfileUpdateInput,
  SessionUser,
  StoredUser,
} from '../types/auth'

interface AuthContextValue {
  user: SessionUser | null
  profile: StoredUser | null
  pendingRequests: StoredUser[]
  allUsers: StoredUser[]
  login: (email: string, password: string, rememberMe: boolean) => ReturnType<typeof loginUser>
  logout: () => void
  submitRequest: (input: AccessRequestInput) => ReturnType<typeof submitAccessRequest>
  submitAssociationHeadRequest: (
    input: AssociationHeadRequestInput,
  ) => ReturnType<typeof submitAssociationHeadRequest>
  approveRequest: (userId: string, notes: string) => void
  rejectRequest: (userId: string, notes: string) => void
  updateProfile: (input: ProfileUpdateInput) => ReturnType<typeof updateUserProfile>
  changePassword: (input: PasswordChangeInput) => ReturnType<typeof changeUserPassword>
  refreshUsers: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(() => getSession())
  const [pendingRequests, setPendingRequests] = useState<StoredUser[]>(() => getPendingUsers())
  const [allUsers, setAllUsers] = useState<StoredUser[]>(() => getAllUsers())

  useEffect(() => {
    initializeAuthStorage()
    initializeAuditStorage()
    initializeDecisionStorage()
    initializePrivacyStorage()
    initializePriorityStorage()
    initializeStaffBeneficiaryStorage()
    initializeReportHistoryStorage()
    setPendingRequests(getPendingUsers())
    setAllUsers(getAllUsers())
    setUser(getSession())
  }, [])

  const refreshUsers = useCallback(() => {
    setPendingRequests(getPendingUsers())
    setAllUsers(getAllUsers())
  }, [])

  const login = useCallback(
    (email: string, password: string, rememberMe: boolean) => {
      const result = loginUser(email, password, rememberMe)
      if (result.success) {
        const session = getSession()
        setUser(session)
        if (session) {
          logAuditEvent({
            user: session.fullName,
            userEmail: session.email,
            action: 'Login',
            actionColor: 'blue',
            description: `${session.fullName} signed in to the system.`,
            entityType: 'session',
            entityId: session.id,
          })
        }
      }
      return result
    },
    [],
  )

  const logout = useCallback(() => {
    const session = getSession()
    if (session) {
      logAuditEvent({
        user: session.fullName,
        userEmail: session.email,
        action: 'Logout',
        actionColor: 'blue',
        description: `${session.fullName} signed out of the system.`,
        entityType: 'session',
        entityId: session.id,
      })
    }
    clearSession()
    setUser(null)
  }, [])

  const submitRequest = useCallback(
    (input: AccessRequestInput) => {
      const result = submitAccessRequest(input)
      if (result.success) {
        refreshUsers()
        logAuditEvent({
          user: `${input.firstName.trim()} ${input.lastName.trim()}`,
          userEmail: input.email.trim(),
          action: 'Access Request',
          actionColor: 'teal',
          description: `Submitted access request for ${input.roleLabel} account.`,
          entityType: 'user',
          changes: buildChanges([
            { key: 'email', label: 'Email', oldValue: '—', newValue: input.email.trim() },
            { key: 'role', label: 'Role', oldValue: '—', newValue: input.roleLabel },
            { key: 'department', label: 'Department', oldValue: '—', newValue: formatDepartment(input.department) },
            { key: 'status', label: 'Status', oldValue: '—', newValue: 'PENDING' },
          ]),
        })
      }
      return result
    },
    [refreshUsers],
  )

  const submitAssociationHeadRequestHandler = useCallback(
    (input: AssociationHeadRequestInput) => {
      const result = submitAssociationHeadRequest(input)
      if (result.success) {
        refreshUsers()
        logAuditEvent({
          user: `${input.firstName.trim()} ${input.lastName.trim()}`,
          userEmail: input.email.trim(),
          action: 'Access Request',
          actionColor: 'teal',
          description: `Submitted Association Head registration for ${input.associationName.trim()}.`,
          entityType: 'user',
          changes: buildChanges([
            { key: 'email', label: 'Email', oldValue: '—', newValue: input.email.trim() },
            { key: 'role', label: 'Role', oldValue: '—', newValue: 'Association Head' },
            {
              key: 'association',
              label: 'Association',
              oldValue: '—',
              newValue: input.associationName.trim(),
            },
            { key: 'status', label: 'Status', oldValue: '—', newValue: 'PENDING' },
          ]),
        })
      }
      return result
    },
    [refreshUsers],
  )

  const approveRequest = useCallback(
    (userId: string, notes: string) => {
      const target = getUserById(userId)
      const actor = getSession()
      if (!target || !actor) return

      approveUser(userId, {
        notes,
        reviewedBy: actor.fullName,
        reviewedByEmail: actor.email,
      })
      const approved = getUserById(userId)
      if (approved?.role === 'association') {
        syncAssociationFromApprovedUser(approved)
      }
      refreshUsers()
      logAuditEvent({
        user: actor.fullName,
        userEmail: actor.email,
        action: 'User Management',
        actionColor: 'green',
        description: `Approved access request for ${target.fullName}.`,
        entityType: 'user',
        entityId: userId,
        changes: buildChanges([
          { key: 'status', label: 'Account Status', oldValue: 'PENDING', newValue: 'APPROVED' },
          { key: 'notes', label: 'Decision Notes', oldValue: '—', newValue: notes || '—' },
          { key: 'reviewedAt', label: 'Reviewed At', oldValue: '—', newValue: new Date().toISOString() },
        ]),
      })
    },
    [refreshUsers],
  )

  const rejectRequest = useCallback(
    (userId: string, notes: string) => {
      const target = getUserById(userId)
      const actor = getSession()
      if (!target || !actor) return

      rejectUser(userId, {
        notes,
        reviewedBy: actor.fullName,
        reviewedByEmail: actor.email,
      })
      refreshUsers()
      logAuditEvent({
        user: actor.fullName,
        userEmail: actor.email,
        action: 'User Management',
        actionColor: 'red',
        description: `Rejected access request for ${target.fullName}.`,
        entityType: 'user',
        entityId: userId,
        changes: buildChanges([
          { key: 'status', label: 'Account Status', oldValue: 'PENDING', newValue: 'REJECTED' },
          { key: 'notes', label: 'Decision Notes', oldValue: '—', newValue: notes },
          { key: 'reviewedAt', label: 'Reviewed At', oldValue: '—', newValue: new Date().toISOString() },
        ]),
      })
    },
    [refreshUsers],
  )

  const updateProfile = useCallback(
    (input: ProfileUpdateInput) => {
      if (!user) return { success: false, error: 'Not signed in.' }
      const before = getUserById(user.id)
      const result = updateUserProfile(user.id, input)
      if (result.success && before) {
        setUser(getSession())
        refreshUsers()
        logAuditEvent({
          user: before.fullName,
          userEmail: before.email,
          action: 'Profile Update',
          actionColor: 'orange',
          description: `Updated profile for ${before.fullName}.`,
          entityType: 'user',
          entityId: user.id,
          changes: buildChanges([
            { key: 'firstName', label: 'First Name', oldValue: before.firstName, newValue: input.firstName.trim() },
            { key: 'lastName', label: 'Last Name', oldValue: before.lastName, newValue: input.lastName.trim() },
            { key: 'email', label: 'Email', oldValue: before.email, newValue: input.email.trim() },
            { key: 'contactNumber', label: 'Contact Number', oldValue: before.contactNumber, newValue: input.contactNumber.trim() },
            { key: 'position', label: 'Position', oldValue: before.position, newValue: input.position.trim() },
            { key: 'department', label: 'Department', oldValue: formatDepartment(before.department), newValue: formatDepartment(input.department) },
          ]),
        })
      }
      return result
    },
    [user, refreshUsers],
  )

  const changePassword = useCallback(
    (input: PasswordChangeInput) => {
      if (!user) return { success: false, error: 'Not signed in.' }
      const result = changeUserPassword(user.id, input)
      if (result.success) {
        logAuditEvent({
          user: user.fullName,
          userEmail: user.email,
          action: 'Security',
          actionColor: 'purple',
          description: `${user.fullName} changed account password.`,
          entityType: 'user',
          entityId: user.id,
          changes: [{ field: 'Password', oldValue: '********', newValue: '********' }],
        })
      }
      return result
    },
    [user],
  )

  const profile = useMemo(() => {
    if (!user) return null
    return allUsers.find((u) => u.id === user.id) ?? null
  }, [user, allUsers])

  const value = useMemo(
    () => ({
      user,
      profile,
      pendingRequests,
      allUsers,
      login,
      logout,
      submitRequest,
      submitAssociationHeadRequest: submitAssociationHeadRequestHandler,
      approveRequest,
      rejectRequest,
      updateProfile,
      changePassword,
      refreshUsers,
    }),
    [user, profile, pendingRequests, allUsers, login, logout, submitRequest, submitAssociationHeadRequestHandler, approveRequest, rejectRequest, updateProfile, changePassword, refreshUsers],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return ctx
}
