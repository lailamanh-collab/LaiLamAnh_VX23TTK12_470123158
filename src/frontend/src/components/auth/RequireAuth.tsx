import type { ReactNode } from "react"
import { Navigate } from "react-router-dom"
import { useAuth } from "../../auth/AuthContext"

export function RequireAuth({ children, role }: { children: ReactNode; role?: string }) {
  const { ready, user } = useAuth()

  if (!ready) {
    return <p className="page muted">Đang tải phiên đăng nhập...</p>
  }

  if (!user) {
    return <Navigate to="/" replace />
  }

  if (role && user.role !== role) {
    return <Navigate to="/" replace />
  }

  return children
}
