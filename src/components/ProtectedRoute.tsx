import { Navigate, Outlet, useLocation } from 'react-router'
import { isLoggedIn } from '@/lib/auth'

/** 路由守卫:未登录跳转到 /login,并在 state 里记住来源,登录后跳回 */
function ProtectedRoute() {
  const location = useLocation()

  if (!isLoggedIn()) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }
  return <Outlet />
}

export default ProtectedRoute
