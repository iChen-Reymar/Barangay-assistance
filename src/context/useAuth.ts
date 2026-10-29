import { useContext } from 'react'
import { AuthContext } from './authContextValue'

/**
 * Read the signed-in user and the actions the auth provider exposes.
 *
 * Separate from the provider module so that file exports only a component and
 * stays compatible with React Fast Refresh.
 */
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return ctx
}
