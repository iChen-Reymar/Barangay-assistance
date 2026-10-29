import { createContext } from 'react'
import type {
  changeUserPassword,
  login as loginUser,
  submitAccessRequest,
  submitAssociationHeadRequest,
  updateUserProfile,
} from '../services/authStorage'
import type {
  AccessRequestInput,
  AssociationHeadRequestInput,
  PasswordChangeInput,
  ProfileUpdateInput,
  SessionUser,
  StoredUser,
} from '../types/auth'

/**
 * The shape of the value the auth provider makes available to the tree.
 *
 * Kept with the context rather than in the provider module so that the provider
 * (a component) and the `useAuth` hook can live in separate files. React Fast
 * Refresh can only preserve edits when a file exports components alone, so a
 * module exporting both a provider and a hook loses its state on edit.
 */
export interface AuthContextValue {
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

export const AuthContext = createContext<AuthContextValue | null>(null)
