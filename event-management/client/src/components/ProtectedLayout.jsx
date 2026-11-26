import { Outlet, useLocation } from 'react-router-dom'
import Navbar from './Navbar'

function ProtectedLayout() {
  const location = useLocation()
  const pageTitle = location.pathname.startsWith('/events') ? 'Events' : location.pathname.startsWith('/bookings') ? 'Bookings' : location.pathname.startsWith('/settings') ? 'Settings' : location.pathname.startsWith('/admin') ? 'Customers' : 'Dashboard'

  return (
    <div className={`app-layout ${location.pathname === '/dashboard' ? 'dashboard-layout' : ''}`}>
      <Navbar />
      <div className="app-workspace">
        <header className="workspace-topbar"><div className="breadcrumb"><span>Workspace</span><i>/</i><strong>{pageTitle}</strong></div><div className="topbar-date"><span className="topbar-live-dot" />Your event space, at a glance</div></header>
        <div className="app-content"><Outlet /></div>
      </div>
    </div>
  )
}

export default ProtectedLayout
