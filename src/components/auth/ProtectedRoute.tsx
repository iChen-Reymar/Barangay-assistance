import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { roleToDashboardPath, type UserRole } from '../../types/auth'

interface ProtectedRouteProps {
  allowedRoles: UserRole[]
  children: React.ReactNode
}

export function ProtectedRoute({ allowedRoles, children }: ProtectedRouteProps) {
  const { user } = useAuth()
  const location = useLocation()

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to={roleToDashboardPath(user.role)} replace />
  }

  return children
}

interface PublicOnlyRouteProps {
  children: React.ReactNode
}

export function PublicOnlyRoute({ children }: PublicOnlyRouteProps) {
  const { user } = useAuth()

  if (user) {
    return <Navigate to={roleToDashboardPath(user.role)} replace />
  }

  return children
}
