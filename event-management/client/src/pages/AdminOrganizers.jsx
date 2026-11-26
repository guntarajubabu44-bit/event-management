import { useCallback, useEffect, useState } from 'react'
import api from '../services/api'
import Loader from '../components/Loader'
import { useAuth } from '../context/AuthContext'

function AdminOrganizers() {
  const { user } = useAuth()
  const [organizers, setOrganizers] = useState([])
  const [status, setStatus] = useState('pending')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await api.get('/admin/organizers', { params: { status: status === 'all' ? undefined : status, search } })
      setOrganizers(response.data.data || [])
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load organizer applications.')
    } finally { setLoading(false) }
  }, [status, search])

  useEffect(() => { if (user?.role === 'admin') load() }, [user, load])

  async function setOrganizerStatus(organizer, nextStatus) {
    setBusyId(organizer._id)
    setError('')
    setMessage('')
    try {
      const response = await api.patch(`/admin/organizers/${organizer._id}/status`, { status: nextStatus })
      setMessage(response.data.message)
      setOrganizers((current) => current.map((item) => item._id === organizer._id ? { ...item, ...response.data.data } : item).filter((item) => status === 'all' || item.organizerStatus === status))
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to update organizer status.')
    } finally { setBusyId('') }
  }

  if (user?.role !== 'admin') return <main className="page-shell"><p className="eyebrow">Administrator</p><h1>Access not enabled</h1><p className="lede">Only administrators can review organizer applications.</p></main>

  return <main className="page-shell">
    <div className="page-heading"><div><p className="eyebrow">Administrator</p><h1>Organizer applications</h1><p className="lede">Review organizer accounts before they can publish events or manage bookings.</p></div></div>
    <form className="customer-search" onSubmit={(event) => { event.preventDefault(); setSearch(searchInput.trim()) }}><input aria-label="Search organizers" placeholder="Search name, email, phone, or city" value={searchInput} onChange={(event) => setSearchInput(event.target.value)} /><button className="button" type="submit">Search</button><select aria-label="Filter organizer status" value={status} onChange={(event) => setStatus(event.target.value)}><option value="pending">Pending review</option><option value="approved">Approved</option><option value="rejected">Rejected</option><option value="all">All organizers</option></select></form>
    {error && <p className="form-error" role="alert">{error}</p>}{message && <p className="success-message" role="status">{message}</p>}
    {loading ? <Loader /> : <div className="attendee-table-wrap"><table className="attendee-table"><thead><tr><th>Organizer</th><th>Contact</th><th>Location</th><th>Applied</th><th>Status</th><th>Action</th></tr></thead><tbody>{organizers.length ? organizers.map((organizer) => <tr key={organizer._id}><td><strong>{organizer.name}</strong></td><td>{organizer.email}<small>{organizer.phone || 'No phone added'}</small></td><td>{[organizer.city, organizer.state].filter(Boolean).join(', ') || 'Not provided'}</td><td>{new Date(organizer.createdAt).toLocaleDateString('en-IN')}</td><td>{organizer.organizerStatus}</td><td className="history-actions">{organizer.organizerStatus !== 'approved' && <button type="button" className="button" disabled={busyId === organizer._id} onClick={() => setOrganizerStatus(organizer, 'approved')}>Approve</button>}{organizer.organizerStatus !== 'rejected' && <button type="button" className="danger-button" disabled={busyId === organizer._id} onClick={() => setOrganizerStatus(organizer, 'rejected')}>Reject</button>}</td></tr>) : <tr><td colSpan="6">No organizer accounts match this filter.</td></tr>}</tbody></table></div>}
  </main>
}

export default AdminOrganizers
