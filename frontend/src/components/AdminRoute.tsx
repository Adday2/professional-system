import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/useAuth'

function AdminRoute() {
  const { user } = useAuth()

  if (user?.role !== 'admin') {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}

export default AdminRoute