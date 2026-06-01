import { Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from './auth-context'

export function RequireAuth({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth()
  if (loading) return <p className="container">Loading…</p>
  if (!session) return <Navigate to="/login" replace />
  return <>{children}</>
}
