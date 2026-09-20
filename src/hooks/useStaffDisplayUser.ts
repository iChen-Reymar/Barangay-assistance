import { useAuth } from '../context/AuthContext'
import { getInitials } from '../utils/userDisplay'

export function useStaffDisplayUser() {
  const { user, profile } = useAuth()
  const name = profile?.fullName ?? user?.fullName ?? 'Staff'
  const initials = getInitials(name)
  const role = profile?.roleLabel ?? user?.roleLabel ?? 'Barangay Staff'

  return { name, initials, role }
}
