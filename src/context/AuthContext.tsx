import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { AuthContext } from './authContextValue'
import { initializeAuditStorage, buildChanges, logAuditEvent } from '../services/auditStorage'
import { initializeDecisionStorage } from '../services/decisionStorage'
import { initializePrivacyStorage } from '../services/privacyStorage'
import { initializePriorityStorage } from '../services/priorityStorage'
import { initializeStaffBeneficiaryStorage } from '../services/staffBeneficiaryStorage'
import { initializeReportHistoryStorage } from '../services/reportHistoryService'
import { initializeAssociationStorage } from '../services/associationStorage'
import { initializeProgramStorage } from '../services/programStorage'
import {
  approveUser,
  changeUserPassword,
  clearLocalSession,
  clearSession,
  formatDepartment,
  getAllUsers,
  getPendingUsers,
  getSession,
  getUserById,
  initializeAuthStorage,
  login as loginUser,
  replaceTemporaryPassword,
  rejectUser,
  submitAccessRequest,
  submitAssociationHeadRequest,
  updateUserProfile,
} from '../services/authStorage'
import { initializeMemberStorage, syncAssociationFromApprovedUser } from '../services/memberStorage'
import type {
  AccessRequestInput,
  AssociationHeadRequestInput,
  PasswordChangeInput,
  ProfileUpdateInput,
  SessionUser,
  StoredUser,
} from '../types/auth'
import { AUTH_EXPIRED_EVENT } from '../services/authenticatedFetch'
import { supabase } from '../lib/supabase'
import { discardFailedSynchronizations, pullFromDatabase } from '../services/databaseSync'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null)
  const [authReady, setAuthReady] = useState(false)
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
    initializeAssociationStorage()
    initializeProgramStorage()
    initializeMemberStorage()
  }, [])

  useEffect(() => {
    let active = true
    void supabase.auth.getSession().then(async ({ data, error }) => {
      if (!active) return
      const appSession = getSession()
      const valid = !error && data.session?.user?.id && appSession?.id === data.session.user.id
      const recoveringPassword = window.location.pathname === '/reset-password'
      if (valid) {
        await pullFromDatabase()
        if (!active) return
        setPendingRequests(getPendingUsers())
        setAllUsers(getAllUsers())
        setUser(appSession)
      }
      else if (recoveringPassword && data.session) setUser(null)
      else if (appSession || data.session) {
        clearLocalSession()
        await supabase.auth.signOut({ scope: 'local' })
      }
      if (active) setAuthReady(true)
    })

    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (!active) return
      if (event === 'SIGNED_OUT' || event === 'PASSWORD_RECOVERY') {
        discardFailedSynchronizations()
        clearLocalSession(event !== 'PASSWORD_RECOVERY')
        setUser(null)
        setPendingRequests([])
        setAllUsers([])
      }
    })
    return () => {
      active = false
      authListener.subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    const handleExpiredSession = () => {
      discardFailedSynchronizations()
      clearSession()
      setUser(null)
      setPendingRequests([])
      setAllUsers([])
    }
    window.addEventListener(AUTH_EXPIRED_EVENT, handleExpiredSession)
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, handleExpiredSession)
  }, [])

  const refreshUsers = useCallback(() => {
    setPendingRequests(getPendingUsers())
    setAllUsers(getAllUsers())
  }, [])

  useEffect(() => {
    const handleUserStorage = (event: StorageEvent) => {
      if (event.key === 'barangay_users') refreshUsers()
    }
    window.addEventListener('storage', handleUserStorage)
    return () => window.removeEventListener('storage', handleUserStorage)
  }, [refreshUsers])

  const enterDashboard = useCallback(() => {
    const session = getSession()
    setUser(session)
    setPendingRequests(getPendingUsers())
    setAllUsers(getAllUsers())
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
  }, [])

  const login = useCallback(
    async (email: string, password: string, rememberMe: boolean) => loginUser(email, password, rememberMe),
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
    async (input: AccessRequestInput) => {
      const result = await submitAccessRequest(input)
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
            { key: 'email', label: 'Email', oldValue: 'â€”', newValue: input.email.trim() },
            { key: 'role', label: 'Role', oldValue: 'â€”', newValue: input.roleLabel },
            { key: 'department', label: 'Department', oldValue: 'â€”', newValue: formatDepartment(input.department) },
            { key: 'status', label: 'Status', oldValue: 'â€”', newValue: 'PENDING' },
          ]),
        })
      }
      return result
    },
    [refreshUsers],
  )

  const submitAssociationHeadRequestHandler = useCallback(
    async (input: AssociationHeadRequestInput) => {
      const result = await submitAssociationHeadRequest(input)
      if (result.success) {
        refreshUsers()
        logAuditEvent({
          user: `${input.firstName.trim()} ${input.lastName.trim()}`,
          userEmail: input.email.trim(),
          action: 'Access Request',
          actionColor: 'teal',
          description: input.associationName?.trim()
            ? `Submitted Association Head registration for ${input.associationName.trim()}.`
            : 'Submitted Association Head registration.',
          entityType: 'user',
          changes: buildChanges([
            { key: 'email', label: 'Email', oldValue: 'â€”', newValue: input.email.trim() },
            { key: 'role', label: 'Role', oldValue: 'â€”', newValue: 'Association Head' },
            {
              key: 'association',
              label: 'Association',
              oldValue: 'â€”',
              newValue: input.associationName?.trim() || 'Assigned by administrator',
            },
            { key: 'status', label: 'Status', oldValue: 'â€”', newValue: 'PENDING' },
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
          { key: 'notes', label: 'Decision Notes', oldValue: 'â€”', newValue: notes || 'â€”' },
          { key: 'reviewedAt', label: 'Reviewed At', oldValue: 'â€”', newValue: new Date().toISOString() },
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
          { key: 'notes', label: 'Decision Notes', oldValue: 'â€”', newValue: notes },
          { key: 'reviewedAt', label: 'Reviewed At', oldValue: 'â€”', newValue: new Date().toISOString() },
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
    async (input: PasswordChangeInput) => {
      if (!user) return { success: false, error: 'Not signed in.' }
      const result = await changeUserPassword(user.id, input)
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

  const completeTemporaryPasswordChange = useCallback(
    async (newPassword: string) => {
      if (!user) return { success: false, error: 'Not signed in.' }
      const result = await replaceTemporaryPassword(user.id, newPassword)
      if (result.success) {
        refreshUsers()
        logAuditEvent({
          user: user.fullName,
          userEmail: user.email,
          action: 'Security',
          actionColor: 'purple',
          description: `${user.fullName} replaced a temporary password.`,
          entityType: 'user',
          entityId: user.id,
          changes: [{ field: 'Temporary password', oldValue: 'Issued', newValue: 'Replaced' }],
        })
      }
      return result
    },
    [user, refreshUsers],
  )

  const profile = useMemo(() => {
    if (!user) return null
    return allUsers.find((u) => u.id === user.id) ?? null
  }, [user, allUsers])

  const value = useMemo(
    () => ({
      user,
      authReady,
      profile,
      pendingRequests,
      allUsers,
      login,
      enterDashboard,
      logout,
      submitRequest,
      submitAssociationHeadRequest: submitAssociationHeadRequestHandler,
      approveRequest,
      rejectRequest,
      updateProfile,
      changePassword,
      completeTemporaryPasswordChange,
      refreshUsers,
    }),
    [user, authReady, profile, pendingRequests, allUsers, login, enterDashboard, logout, submitRequest, submitAssociationHeadRequestHandler, approveRequest, rejectRequest, updateProfile, changePassword, completeTemporaryPasswordChange, refreshUsers],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
