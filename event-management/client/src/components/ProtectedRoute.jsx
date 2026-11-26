import { Navigate, Outlet, useLocation } from 'react-router-dom'
import Loader from './Loader'
import { useAuth } from '../context/AuthContext'

function ProtectedRoute() {
  const location = useLocation()
  const { user, loading } = useAuth()

  if (loading) return <div className="route-loader"><Loader /></div>
  if (user?.role === 'customer' && location.pathname.startsWith('/events')) return <Navigate to="/explore" replace />
  if (location.pathname.startsWith('/admin/bookings') && !['organizer', 'admin'].includes(user?.role)) return <Navigate to="/dashboard" replace />
  if (location.pathname.startsWith('/admin') && !location.pathname.startsWith('/admin/bookings') && user?.role !== 'admin') return <Navigate to="/dashboard" replace />
  return user ? <Outlet /> : <Navigate to="/login" replace state={{ from: location }} />
}

export default ProtectedRoute
