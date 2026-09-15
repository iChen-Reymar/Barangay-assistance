import { useAuth } from '../context/AuthContext'

export function useReviewActor() {
  const { user, profile } = useAuth()

  return {
    name: profile?.fullName ?? user?.fullName ?? 'Authorized User',
    email: profile?.email ?? user?.email,
  }
}
