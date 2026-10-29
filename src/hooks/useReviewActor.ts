import { useAuth } from '../context/useAuth'

export function useReviewActor() {
  const { user, profile } = useAuth()

  return {
    name: profile?.fullName ?? user?.fullName ?? 'Authorized User',
    email: profile?.email ?? user?.email,
  }
}
