import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/useAuth'
import { roleToDashboardPath, type UserRole } from '../../types/auth'
import TemporaryPasswordChangePage from '../../pages/TemporaryPasswordChangePage'

interface ProtectedRouteProps {
  allowedRoles: UserRole[]
  children: React.ReactNode
}

export function ProtectedRoute({ allowedRoles, children }: ProtectedRouteProps) {
  const { user, authReady, profile } = useAuth()
  const location = useLocation()

  if (!authReady) {
    return <div className="flex min-h-screen items-center justify-center bg-gray-50 text-sm text-gray-500">Checking your session...</div>
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to={roleToDashboardPath(user.role)} replace />
  }

  if (profile?.mustChangePassword) return <TemporaryPasswordChangePage />

  return children
}

interface PublicOnlyRouteProps {
  children: React.ReactNode
}

export function PublicOnlyRoute({ children }: PublicOnlyRouteProps) {
  const { user, authReady } = useAuth()

  if (!authReady) {
    return <div className="flex min-h-screen items-center justify-center bg-gray-50 text-sm text-gray-500">Checking your session...</div>
  }

  if (user) {
    return <Navigate to={roleToDashboardPath(user.role)} replace />
  }

  return children
}
