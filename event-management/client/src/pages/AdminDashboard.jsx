import { useEffect, useState } from 'react'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import Loader from '../components/Loader'
import { getDashboardStats } from '../services/statsService'

const empty = { totalEvents: 0, totalCustomers: 0, totalBookings: 0, confirmedBookings: 0, pendingBookings: 0, revenue: 0, pendingRevenue: 0, monthlyBookings: [], monthlyRevenue: [], eventsByCategory: {}, bookingsByStatus: {}, upcomingEvents: [], recentBookings: [] }
const money = (amount) => `₹${Number(amount || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`

function AdminDashboard() {
  const [stats, setStats] = useState(empty)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  useEffect(() => { let active = true; getDashboardStats().then((response) => { if (active) setStats({ ...empty, ...response.data.data }) }).catch((requestError) => { if (active) setError(requestError.response?.data?.message || 'Unable to load platform analytics.') }).finally(() => { if (active) setLoading(false) }); return () => { active = false } }, [])

  if (loading) return <main className="route-loader"><Loader /></main>
  const bookingData = stats.monthlyBookings.map((row) => ({ ...row, label: new Date(`${row.month}-01T00:00:00`).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }) }))
  const categoryData = Object.entries(stats.eventsByCategory).map(([category, count]) => ({ category: category.replaceAll('_', ' '), events: count }))
  const statusData = Object.entries(stats.bookingsByStatus).map(([status, count]) => ({ status: status.replaceAll('_', ' '), bookings: count }))
  return <main className="page-shell admin-dashboard"><div className="dashboard-heading"><div><p className="eyebrow">Platform overview</p><h1>Good morning, {new Date().toLocaleDateString('en-IN', { weekday: 'long' })}</h1><p>Bookings, customers, and events across Tickety.</p></div></div>{error && <p className="form-error" role="alert">{error}</p>}
    <section className="customer-metrics"><article><span>Total events</span><strong>{stats.totalEvents}</strong></article><article><span>Customers</span><strong>{stats.totalCustomers}</strong></article><article><span>Total bookings</span><strong>{stats.totalBookings}</strong></article><article><span>Confirmed</span><strong>{stats.confirmedBookings}</strong></article><article><span>Total revenue</span><strong>{money(stats.revenue)}</strong></article><article><span>Pending balance</span><strong>{money(stats.pendingRevenue)}</strong></article></section>
    <section className="admin-analytics-grid"><article className="tickety-panel"><div className="tickety-panel-heading"><div><span className="panel-kicker">Last 12 months</span><h2>Monthly bookings</h2></div></div>{bookingData.length ? <div className="admin-chart"><ResponsiveContainer width="100%" height="100%"><AreaChart data={bookingData}><defs><linearGradient id="adminBookingFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#9275ff" stopOpacity={0.35} /><stop offset="100%" stopColor="#9275ff" stopOpacity={0.02} /></linearGradient></defs><CartesianGrid stroke="#292b3b" strokeDasharray="3 5" vertical={false} /><XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#82849a', fontSize: 11 }} /><YAxis axisLine={false} tickLine={false} allowDecimals={false} tick={{ fill: '#82849a', fontSize: 11 }} /><Tooltip contentStyle={{ background: '#202232', border: '1px solid #383a4d', borderRadius: 12, color: '#fff' }} /><Area dataKey="bookings" stroke="#9a7cff" strokeWidth={3} fill="url(#adminBookingFill)" /></AreaChart></ResponsiveContainer></div> : <p className="empty-inline">Bookings by month will appear here.</p>}</article>
      <article className="tickety-panel"><div className="tickety-panel-heading"><div><span className="panel-kicker">Event catalogue</span><h2>Popular categories</h2></div></div>{categoryData.length ? <div className="admin-chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={categoryData} layout="vertical" margin={{ left: 12 }}><CartesianGrid stroke="#292b3b" strokeDasharray="3 5" horizontal={false} /><XAxis type="number" axisLine={false} tickLine={false} allowDecimals={false} tick={{ fill: '#82849a', fontSize: 11 }} /><YAxis dataKey="category" type="category" width={100} axisLine={false} tickLine={false} tick={{ fill: '#b7b8c5', fontSize: 10 }} /><Tooltip contentStyle={{ background: '#202232', border: '1px solid #383a4d', borderRadius: 12, color: '#fff' }} /><Bar dataKey="events" fill="#42d6b0" radius={[0, 5, 5, 0]} /></BarChart></ResponsiveContainer></div> : <p className="empty-inline">Events by category will appear here.</p>}</article></section>
    <section className="tickety-panel admin-status-panel"><div className="tickety-panel-heading"><div><span className="panel-kicker">Operations</span><h2>Booking status</h2></div></div>{statusData.length ? <div className="admin-status-grid">{statusData.map((item) => <div key={item.status}><span>{item.status}</span><strong>{item.bookings}</strong></div>)}</div> : <p className="empty-inline">No booking activity yet.</p>}</section>
  </main>
}

export default AdminDashboard
