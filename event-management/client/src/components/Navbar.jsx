import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const navigationLinks = user?.role === 'customer'
    ? [{ to: '/dashboard', label: 'Dashboard', icon: '▦', end: true }, { to: '/explore', label: 'Explore events', icon: '✳' }, { to: '/bookings', label: 'My bookings', icon: '▤' }]
    : [{ to: '/dashboard', label: 'Dashboard', icon: '▦', end: true }, { to: '/events', label: 'Events', icon: '▣' }, { to: '/bookings', label: 'Bookings', icon: '▤' }]

  async function handleLogout() {
    await logout()
    navigate('/login', { replace: true })
  }

  const initials = user?.name?.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'O'

  return (
    <aside className="sidebar">
      <NavLink className="brand tickety-brand" to="/dashboard"><span className="brand-mark" aria-hidden="true">t</span><span>tickety<span className="brand-period">.</span></span></NavLink>
      <p className="sidebar-label">WORKSPACE</p>
      <nav className="sidebar-nav" aria-label="Main navigation">
        {navigationLinks.map((link) => <NavLink key={link.to} to={link.to} end={link.end}><span className="nav-icon" aria-hidden="true">{link.icon}</span>{link.label}</NavLink>)}
        {['organizer', 'admin'].includes(user?.role) && <NavLink to="/admin/bookings"><span className="nav-icon" aria-hidden="true">▤</span>Manage bookings</NavLink>}
      </nav>
      <p className="sidebar-label sidebar-tools-label">MANAGE</p>
      <nav className="sidebar-nav" aria-label="Management navigation">
        {user?.role === 'admin' && <NavLink to="/admin/categories"><span className="nav-icon" aria-hidden="true">?</span>Categories</NavLink>}
        {user?.role === 'admin' && <NavLink to="/admin/coupons"><span className="nav-icon" aria-hidden="true">%</span>Coupons</NavLink>}
        {user?.role === 'admin' && <NavLink to="/admin/reviews"><span className="nav-icon" aria-hidden="true">★</span>Reviews</NavLink>}
        {user?.role === 'admin' && <NavLink to="/admin/contact"><span className="nav-icon" aria-hidden="true">✉</span>Messages</NavLink>}
        {user?.role === 'admin' && <NavLink to="/admin/customers"><span className="nav-icon" aria-hidden="true">♧</span>Customers</NavLink>}
        {user?.role === 'admin' && <NavLink to="/admin/organizers"><span className="nav-icon" aria-hidden="true">O</span>Organizer applications</NavLink>}
        {user?.role === 'admin' && <NavLink to="/admin/finance"><span className="nav-icon" aria-hidden="true">?</span>Platform finance</NavLink>}
        {user?.role === 'admin' && <NavLink to="/admin/content"><span className="nav-icon" aria-hidden="true">W</span>Website content</NavLink>}
        <NavLink to="/payments"><span className="nav-icon" aria-hidden="true">₹</span>Payments</NavLink>
        <NavLink to="/notifications"><span className="nav-icon" aria-hidden="true">!</span>Notifications</NavLink>
        <NavLink to="/settings"><span className="nav-icon" aria-hidden="true">⚙</span>Settings</NavLink>
      </nav>
      <div className="sidebar-spacer" />
      <div className="sidebar-help"><span className="help-spark">✦</span><strong>Need a hand?</strong><p>We’re here to help your next event shine.</p><a href="mailto:support@tickety.app">Contact support <span aria-hidden="true">→</span></a></div>
      <div className="sidebar-account"><span className="account-avatar">{initials}</span><span className="account-copy"><strong>{user?.name || 'Organizer'}</strong><small>{user?.role === 'admin' ? 'Administrator' : user?.role === 'customer' ? 'Customer' : 'Event organizer'}</small></span><button className="account-logout" type="button" onClick={handleLogout} aria-label="Log out" title="Log out">↗</button></div>
    </aside>
  )
}

export default Navbar
