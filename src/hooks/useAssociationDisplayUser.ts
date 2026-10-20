import { useAuth } from '../context/AuthContext'
import { getInitials } from '../utils/userDisplay'

export function useAssociationDisplayUser() {
  const { user, profile } = useAuth()
  const name = profile?.fullName ?? user?.fullName ?? 'Association Head'
  const initials = getInitials(name)
  const role = profile?.roleLabel ?? user?.roleLabel ?? 'Association Head'

  return { name, initials, role }
}
