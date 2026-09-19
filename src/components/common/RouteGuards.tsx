import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/features/auth/AuthContext'
import type { UserRole } from '@/types'
import { ROLE_HOME_ROUTE } from '@/constants'

export function RequireAuth() {
  const { session, loading } = useAuth()
  const location = useLocation()

  if (loading) return <FullscreenSpinner />
  if (!session) return <Navigate to="/login" replace state={{ from: location }} />
  return <Outlet />
}

export function RequireRole({ roles }: { roles: UserRole[] }) {
  const { profile, loading } = useAuth()

  if (loading) return <FullscreenSpinner />
  if (!profile) return <Navigate to="/login" replace />
  if (!profile.is_active) return <Navigate to="/account-disabled" replace />
  if (!roles.includes(profile.role)) return <Navigate to={ROLE_HOME_ROUTE[profile.role]} replace />
  return <Outlet />
}

export function FullscreenSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg">
      <div className="size-8 animate-spin rounded-full border-2 border-brand-700 border-t-transparent" />
    </div>
  )
}
