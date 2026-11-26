import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import Loader from '../components/Loader'

function Notifications() {
  const [items, setItems] = useState([])
  const [unread, setUnread] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await api.get('/notifications', { params: { limit: 50 } })
      setItems(response.data.data || [])
      setUnread(response.data.unread || 0)
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load notifications.')
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  async function markRead(item) {
    try {
      await api.patch(`/notifications/${item._id}/read`)
      setItems((current) => current.map((entry) => entry._id === item._id ? { ...entry, readAt: new Date().toISOString() } : entry))
      setUnread((count) => Math.max(0, count - 1))
    } catch (requestError) { setError(requestError.response?.data?.message || 'Unable to mark notification as read.') }
  }

  async function markAllRead() {
    try {
      await api.patch('/notifications/read-all')
      setItems((current) => current.map((item) => ({ ...item, readAt: item.readAt || new Date().toISOString() })))
      setUnread(0)
    } catch (requestError) { setError(requestError.response?.data?.message || 'Unable to update notifications.') }
  }

  return <main className="page-shell notifications-page"><div className="page-heading"><div><p className="eyebrow">Updates</p><h1>Notifications</h1><p className="lede">Booking, payment, and organizer account updates.</p></div>{unread > 0 && <button className="text-link" type="button" onClick={markAllRead}>Mark all as read ({unread})</button>}</div>{error && <p className="form-error" role="alert">{error}</p>}{loading ? <Loader /> : items.length ? <div className="notification-list">{items.map((item) => <article className={`notification-card ${item.readAt ? '' : 'notification-unread'}`} key={item._id}><div><span className="eyebrow">{item.type}</span><h2>{item.title}</h2><p>{item.message}</p><small>{new Date(item.createdAt).toLocaleString('en-IN')}</small></div><div className="notification-actions">{item.link && <Link className="text-link" to={item.link} onClick={() => !item.readAt && markRead(item)}>Open</Link>}{!item.readAt && <button className="text-link" type="button" onClick={() => markRead(item)}>Mark read</button>}</div></article>)}</div> : <div className="empty-state"><h2>You’re all caught up</h2><p>Updates about your bookings and payments will appear here.</p></div>}</main>
}

export default Notifications
