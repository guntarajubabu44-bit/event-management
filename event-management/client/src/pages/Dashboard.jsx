import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import Loader from '../components/Loader'
import { useAuth } from '../context/AuthContext'
import { getDashboardStats } from '../services/statsService'
import CustomerDashboard from './CustomerDashboard'
import AdminDashboard from './AdminDashboard'

const emptyStats = { totalEvents: 0, totalBookings: 0, upcomingEvents: 0, completedEvents: 0, pendingRevenue: 0, advanceRevenue: 0, totalAttendees: 0, checkInRate: 0, nextEvents: [], ticketSales: 0, revenue: 0, bookingCount: 0, revenueByDay: [], monthlyRevenue: [], monthlyBookings: [], eventsByCategory: {}, topEvents: [], recentBookings: [] }
const money = (value) => `₹${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
const compactMoney = (value) => Number(value) >= 100000 ? `₹${(Number(value) / 100000).toFixed(1)}L` : Number(value) >= 1000 ? `₹${(Number(value) / 1000).toFixed(1)}k` : `₹${Number(value || 0)}`

function OrganizerDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState(emptyStats)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true
    getDashboardStats()
      .then((response) => { if (mounted) setStats({ ...emptyStats, ...response.data.data }) })
      .catch((requestError) => { if (mounted) setError(requestError.response?.data?.message || 'Unable to load your dashboard.') })
      .finally(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
  }, [])

  const salesChart = useMemo(() => (stats.monthlyRevenue?.length ? stats.monthlyRevenue : stats.revenueByDay || []).map((row) => ({ ...row, label: new Date(`${row.month || row.date?.slice(0, 7)}-01T00:00:00`).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }) })), [stats.monthlyRevenue, stats.revenueByDay])
  const bookingChart = useMemo(() => (stats.monthlyBookings || []).map((row) => ({ ...row, label: new Date(`${row.month}-01T00:00:00`).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }) })), [stats.monthlyBookings])
  const categoryChart = useMemo(() => Object.entries(stats.eventsByCategory || {}).map(([category, events]) => ({ category: category.replaceAll('_', ' '), events })), [stats.eventsByCategory])
  const performanceChart = useMemo(() => {
    const months = new Map()
    for (const row of stats.monthlyBookings || []) months.set(row.month, { month: row.month, bookings: row.bookings, revenue: 0 })
    for (const row of stats.monthlyRevenue || []) months.set(row.month, { ...months.get(row.month), month: row.month, revenue: row.revenue })
    return [...months.values()].sort((a, b) => a.month.localeCompare(b.month)).map((row) => ({ ...row, label: new Date(`${row.month}-01T00:00:00`).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }) }))
  }, [stats.monthlyBookings, stats.monthlyRevenue])
  const weeklyRevenue = salesChart.reduce((sum, day) => sum + Number(day.revenue || 0), 0)
  const weeklyTickets = bookingChart.reduce((sum, month) => sum + Number(month.bookings || 0), 0)
  const firstName = user?.name?.trim().split(/\s+/)[0] || 'there'

  if (loading) return <main className="route-loader"><Loader /></main>

  return (
    <main className="page-shell dashboard-shell tickety-dashboard">
      <div className="dashboard-heading">
        <div><p className="eyebrow">Overview</p><h1>Welcome back, {firstName}</h1><p>Here’s what’s happening across your events today.</p></div>
        <Link className="button dashboard-create" to="/events/new"><span aria-hidden="true">＋</span> Create event</Link>
      </div>
      {error && <p className="form-error dashboard-error" role="alert">{error}</p>}

      <section className="dashboard-metrics tickety-metrics" aria-label="Business metrics">
        <article className="tickety-stat"><div className="tickety-stat-top"><span>Total events</span><span className="tickety-stat-icon violet">E</span></div><strong>{Number(stats.totalEvents).toLocaleString('en-IN')}</strong><small>{Number(stats.upcomingEvents)} upcoming</small></article>
        <article className="tickety-stat"><div className="tickety-stat-top"><span>Total bookings</span><span className="tickety-stat-icon blue">B</span></div><strong>{Number(stats.totalBookings || stats.bookingCount).toLocaleString('en-IN')}</strong><small>{Number(stats.completedEvents)} completed events</small></article>
        <article className="tickety-stat"><div className="tickety-stat-top"><span>Total revenue</span><span className="tickety-stat-icon amber">₹</span></div><strong>{money(stats.revenue)}</strong><small>Verified payments received</small></article>
        <article className="tickety-stat"><div className="tickety-stat-top"><span>Advance received</span><span className="tickety-stat-icon pink">A</span></div><strong>{money(stats.advanceRevenue)}</strong><small>Verified advance payments</small></article>
        <article className="tickety-stat"><div className="tickety-stat-top"><span>Pending payments</span><span className="tickety-stat-icon blue">P</span></div><strong>{money(stats.pendingRevenue)}</strong><small>Remaining booking balances</small></article>
        <article className="tickety-stat"><div className="tickety-stat-top"><span>Upcoming events</span><span className="tickety-stat-icon amber">U</span></div><strong>{Number(stats.upcomingEvents).toLocaleString('en-IN')}</strong><small>{Number(stats.totalAttendees).toLocaleString('en-IN')} attendees</small></article>
      </section>

      <section className="tickety-chart-grid">
        <article className="tickety-panel revenue-panel">
          <div className="tickety-panel-heading"><div><span className="panel-kicker">Revenue analytics</span><h2>Sales performance</h2></div><span className="chart-range">Last 12 months <span aria-hidden="true">⌄</span></span></div>
          <div className="chart-summary"><strong>{money(weeklyRevenue)}</strong><span>Verified revenue · 12 months</span></div>
          <div className="revenue-chart">
            <ResponsiveContainer width="100%" height="100%"><AreaChart data={salesChart} margin={{ top: 12, right: 8, left: -16, bottom: 0 }}>
              <defs><linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#9275ff" stopOpacity={0.34} /><stop offset="95%" stopColor="#9275ff" stopOpacity={0} /></linearGradient></defs>
              <CartesianGrid stroke="#292b3b" strokeDasharray="3 5" vertical={false} />
              <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#82849a', fontSize: 11 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#82849a', fontSize: 11 }} tickFormatter={compactMoney} />
              <Tooltip contentStyle={{ background: '#202232', border: '1px solid #383a4d', borderRadius: 12, color: '#fff' }} formatter={(value) => [money(value), 'Revenue']} labelStyle={{ color: '#b9bbca' }} />
              <Area type="monotone" dataKey="revenue" stroke="#9a7cff" strokeWidth={3} fill="url(#revenueFill)" activeDot={{ r: 5, fill: '#b5a1ff', stroke: '#25263a', strokeWidth: 3 }} />
            </AreaChart></ResponsiveContainer>
          </div>
        </article>

        <article className="tickety-panel ticket-panel">
          <div className="tickety-panel-heading"><div><span className="panel-kicker">Sales tracking</span><h2>Bookings by month</h2></div><span className="ticket-chart-icon">▤</span></div>
          <div className="chart-summary"><strong>{weeklyTickets.toLocaleString('en-IN')}</strong><span>Bookings · 12 months</span></div>
          <div className="ticket-chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={bookingChart} margin={{ top: 14, right: 2, left: -24, bottom: 0 }}>
            <CartesianGrid stroke="#292b3b" strokeDasharray="3 5" vertical={false} />
            <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#82849a', fontSize: 10 }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#82849a', fontSize: 10 }} allowDecimals={false} />
            <Tooltip contentStyle={{ background: '#202232', border: '1px solid #383a4d', borderRadius: 12, color: '#fff' }} formatter={(value) => [value, 'Tickets']} />
            <Bar dataKey="bookings" fill="#42d6b0" radius={[5, 5, 0, 0]} maxBarSize={25} />
          </BarChart></ResponsiveContainer></div>
        </article>
        <article className="tickety-panel ticket-panel"><div className="tickety-panel-heading"><div><span className="panel-kicker">Event catalogue</span><h2>Events by category</h2></div></div>{categoryChart.length ? <div className="ticket-chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={categoryChart} layout="vertical" margin={{ left: 12, right: 12 }}><CartesianGrid stroke="#292b3b" strokeDasharray="3 5" horizontal={false} /><XAxis type="number" axisLine={false} tickLine={false} allowDecimals={false} tick={{ fill: '#82849a', fontSize: 10 }} /><YAxis dataKey="category" type="category" width={90} axisLine={false} tickLine={false} tick={{ fill: '#b7b8c5', fontSize: 10 }} /><Tooltip contentStyle={{ background: '#202232', border: '1px solid #383a4d', borderRadius: 12, color: '#fff' }} /><Bar dataKey="events" fill="#9275ff" radius={[0, 5, 5, 0]} maxBarSize={22} /></BarChart></ResponsiveContainer></div> : <p className="empty-inline">Create events to see category performance.</p>}</article>
        <article className="tickety-panel ticket-panel"><div className="tickety-panel-heading"><div><span className="panel-kicker">Monthly performance</span><h2>Revenue &amp; bookings</h2></div></div>{performanceChart.length ? <div className="ticket-chart"><ResponsiveContainer width="100%" height="100%"><ComposedChart data={performanceChart} margin={{ top: 12, right: 8, left: -16, bottom: 0 }}><CartesianGrid stroke="#292b3b" strokeDasharray="3 5" vertical={false} /><XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#82849a', fontSize: 10 }} /><YAxis yAxisId="revenue" axisLine={false} tickLine={false} tick={{ fill: '#82849a', fontSize: 10 }} tickFormatter={compactMoney} /><YAxis yAxisId="bookings" orientation="right" axisLine={false} tickLine={false} allowDecimals={false} tick={{ fill: '#82849a', fontSize: 10 }} /><Tooltip contentStyle={{ background: '#202232', border: '1px solid #383a4d', borderRadius: 12, color: '#fff' }} /><Bar yAxisId="bookings" dataKey="bookings" fill="#42d6b0" radius={[4, 4, 0, 0]} maxBarSize={18} /><Line yAxisId="revenue" dataKey="revenue" stroke="#9a7cff" strokeWidth={3} dot={{ r: 3 }} /></ComposedChart></ResponsiveContainer></div> : <p className="empty-inline">Monthly performance will appear after bookings.</p>}</article>
      </section>

      <section className="tickety-lower-grid">
        <article className="tickety-panel table-panel">
          <div className="tickety-panel-heading"><div><span className="panel-kicker">Your best performers</span><h2>Top events</h2></div><Link to="/events" className="panel-link">View all <span aria-hidden="true">→</span></Link></div>
          {stats.topEvents.length ? <div className="top-event-list">{stats.topEvents.map((event, index) => <Link className="top-event-row" to={`/events/${event.eventId}`} key={event.eventId}><span className={`rank-badge rank-${index + 1}`}>{String(index + 1).padStart(2, '0')}</span><span className="top-event-info"><strong>{event.title}</strong><small>{event.category} · {Number(event.ticketsSold).toLocaleString('en-IN')} tickets</small></span><span className="top-event-revenue"><strong>{money(event.revenue)}</strong><small>revenue</small></span></Link>)}</div> : <div className="dashboard-blank"><span>✦</span><p>Your top events will appear when tickets are booked.</p><Link to="/events/new">Create an event</Link></div>}
        </article>

        <article className="tickety-panel schedule-panel">
          <div className="tickety-panel-heading"><div><span className="panel-kicker">Stay on schedule</span><h2>Upcoming events</h2></div><Link to="/events" className="panel-link">Calendar <span aria-hidden="true">→</span></Link></div>
          {stats.nextEvents.length ? <div className="schedule-list">{stats.nextEvents.slice(0, 4).map((event) => { const date = new Date(event.startDate); return <Link className="schedule-row" to={`/events/${event._id}`} key={event._id}><span className="schedule-date"><strong>{date.toLocaleDateString(undefined, { day: '2-digit' })}</strong><small>{date.toLocaleDateString(undefined, { month: 'short' })}</small></span><span className="schedule-info"><strong>{event.title}</strong><small>{event.location}</small></span><span className="schedule-time">{date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}</span></Link> })}</div> : <div className="dashboard-blank"><span>◷</span><p>No upcoming events on your schedule.</p><Link to="/events/new">Plan an event</Link></div>}
        </article>

        <article className="tickety-panel activity-panel">
          <div className="tickety-panel-heading"><div><span className="panel-kicker">Live from your events</span><h2>Recent activity</h2></div><Link to="/bookings" className="panel-link">All bookings <span aria-hidden="true">→</span></Link></div>
          {stats.recentBookings.length ? <div className="activity-list">{stats.recentBookings.slice(0, 4).map((booking) => <div className="activity-row" key={booking._id}><span className="activity-avatar">{booking.name?.trim().charAt(0).toUpperCase() || 'G'}</span><span className="activity-copy"><strong>{booking.name} <i>booked</i></strong><small>{booking.event?.title || 'Event'} · {new Date(booking.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</small></span><span className="activity-amount">{money(booking.totalAmount)}</span></div>)}</div> : <div className="dashboard-blank"><span>↗</span><p>New ticket bookings will show here.</p><Link to="/events">Explore your events</Link></div>}
        </article>
      </section>
    </main>
  )
}

function Dashboard() {
  const { user } = useAuth()
  if (user?.role === 'customer') return <CustomerDashboard />
  if (user?.role === 'admin') return <AdminDashboard />
  return <OrganizerDashboard />
}

export default Dashboard
