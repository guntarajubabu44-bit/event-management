import { useCallback, useEffect, useState } from 'react'
import api from '../services/api'
import Loader from '../components/Loader'

function AdminContact() {
  const [messages, setMessages] = useState([])
  const [status, setStatus] = useState('new')
  const [kind, setKind] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await api.get('/admin/contact', { params: { status, kind: kind === 'all' ? undefined : kind, limit: 50 } })
      setMessages(response.data.data || [])
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load contact messages.')
    } finally {
      setLoading(false)
    }
  }, [status, kind])

  useEffect(() => { load() }, [load])

  async function resolve(item) {
    try {
      await api.patch(`/admin/contact/${item._id}/status`, { status: item.status === 'new' ? 'resolved' : 'new' })
      await load()
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to update this message.')
    }
  }

  return <main className="page-shell"><p className="eyebrow">Customer support</p><h1>Contact messages &amp; complaints</h1><p className="lede">Review and track messages sent through the public contact form.</p>
    <div className="admin-booking-filters"><select aria-label="Filter by status" value={status} onChange={(event) => setStatus(event.target.value)}><option value="new">New messages</option><option value="resolved">Resolved messages</option></select><select aria-label="Filter by message type" value={kind} onChange={(event) => setKind(event.target.value)}><option value="all">All types</option><option value="inquiry">Inquiries</option><option value="complaint">Complaints</option></select></div>
    {error && <p className="form-error" role="alert">{error}</p>}{loading ? <Loader/> : messages.length ? <div className="contact-inbox">{messages.map((message) => <article className="contact-message" key={message._id}><div><p className="eyebrow">{message.kind === 'complaint' ? 'Complaint' : 'Inquiry'} · {new Date(message.createdAt).toLocaleString('en-IN')}</p><h2>{message.subject}</h2><p>{message.message}</p><small>{message.name} · <a href={`mailto:${message.email}`}>{message.email}</a> {message.phone && `· ${message.phone}`}</small></div><button className="text-link" onClick={() => resolve(message)}>{message.status === 'new' ? 'Mark resolved' : 'Reopen'}</button></article>)}</div> : <p className="empty-inline">No {status} {kind === 'all' ? 'messages' : `${kind}s`}.</p>}
  </main>
}

export default AdminContact
