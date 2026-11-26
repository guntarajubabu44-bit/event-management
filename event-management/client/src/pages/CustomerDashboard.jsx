import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Loader from '../components/Loader'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import { getDashboardStats } from '../services/statsService'

const money = (amount) => `₹${Number(amount || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`

function CustomerDashboard() {
  const { user } = useAuth()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [stats, setStats] = useState({ totalBookings: 0, upcomingEvents: 0, completedEvents: 0, pendingPayments: 0, pendingBalance: 0, totalSpent: 0 })

  useEffect(() => {
    let active = true
    Promise.all([api.get('/bookings/history', { params: { limit: 5 } }), getDashboardStats()]).then(([bookingResponse, statsResponse]) => {
      if (!active) return
      setBookings(bookingResponse.data.data || [])
      setStats((current) => ({ ...current, ...statsResponse.data.data }))
    }).catch((requestError) => { if (active) setError(requestError.response?.data?.message || 'Unable to load your bookings.') }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  const metrics = stats

  if (loading) return <main className="route-loader"><Loader /></main>
  return <main className="page-shell customer-dashboard"><div className="dashboard-heading"><div><p className="eyebrow">Your plans</p><h1>Welcome back, {user?.name?.trim().split(/\s+/)[0] || 'there'}</h1><p>Keep every celebration and reservation in one place.</p></div><Link className="button" to="/explore">Explore events <span aria-hidden="true">→</span></Link></div>
    {error && <p className="form-error" role="alert">{error}</p>}
    <section className="customer-metrics" aria-label="Booking summary"><article><span>Total bookings</span><strong>{metrics.totalBookings}</strong></article><article><span>Upcoming events</span><strong>{metrics.upcomingEvents}</strong></article><article><span>Completed events</span><strong>{metrics.completedEvents}</strong></article><article><span>Pending payments</span><strong>{metrics.pendingPayments}</strong></article><article><span>Total spent</span><strong>{money(metrics.totalSpent)}</strong></article><article><span>Remaining balance</span><strong>{money(metrics.pendingBalance)}</strong></article></section>
    <section className="customer-bookings"><div className="section-heading"><div><p className="eyebrow">Your reservations</p><h2>Recent bookings</h2></div><Link className="text-link" to="/bookings">View all bookings →</Link></div>{bookings.length ? <div className="customer-booking-list">{bookings.slice(0, 5).map((booking) => { const date = booking.eventDate || booking.event?.startDate; return <article key={booking._id} className="customer-booking-card"><div className="customer-booking-date"><strong>{date ? new Date(date).toLocaleDateString('en-IN', { day: '2-digit' }) : '—'}</strong><span>{date ? new Date(date).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : 'Event'}</span></div><div className="customer-booking-info"><span className="eyebrow">{booking.bookingRef}</span><h3>{booking.event?.title || 'Event details unavailable'}</h3><p>{booking.venue || booking.event?.city || 'Venue to be confirmed'} · {booking.quantity} seat{booking.quantity === 1 ? '' : 's'}</p><small>{money(booking.totalAmount)} total · {money(booking.advancePaid)} paid · {money(booking.remainingAmount)} remaining</small></div><div className="customer-booking-status"><span className={`status-badge status-${booking.bookingStatus}`}>{booking.bookingStatus?.replaceAll('_', ' ')}</span><strong>{booking.paymentStatus?.replaceAll('_', ' ')}</strong><Link className="text-link" to="/bookings">View options</Link></div></article> })}</div> : <div className="customer-empty"><span>✳</span><h2>Your next great day is waiting.</h2><p>Browse upcoming events and find something worth celebrating.</p><Link className="button" to="/explore">Explore upcoming events</Link></div>}</section>
  </main>
}

export default CustomerDashboard
