import { useCallback, useEffect, useState } from 'react'
import Loader from '../components/Loader'
import api from '../services/api'

function AdminReviews() {
  const [reviews, setReviews] = useState([])
  const [status, setStatus] = useState('pending')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await api.get('/admin/reviews', { params: { status, limit: 50 } })
      setReviews(response.data.data || [])
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load reviews.')
    } finally {
      setLoading(false)
    }
  }, [status])

  useEffect(() => { load() }, [load])

  async function moderate(review, nextStatus) {
    try {
      await api.patch(`/admin/reviews/${review._id}/status`, { status: nextStatus })
      await load()
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to update review.')
    }
  }

  return <main className="page-shell">
    <p className="eyebrow">Trust and safety</p>
    <h1>Reviews</h1>
    <p className="lede">Moderate customer feedback before it appears on public event pages.</p>
    <div className="admin-booking-filters"><select value={status} onChange={(event) => setStatus(event.target.value)}><option value="pending">Pending review</option><option value="approved">Published</option><option value="rejected">Rejected</option></select></div>
    {error && <p className="form-error" role="alert">{error}</p>}
    {loading ? <Loader /> : reviews.length ? <div className="review-grid admin-review-grid">{reviews.map((review) => <article className="review-card" key={review._id}>
      <div aria-label={`${review.rating} out of 5 stars`} className="review-stars">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</div>
      <h2>{review.event?.title || 'Event'}</h2><p>{review.comment}</p>
      <small>{review.customer?.name || 'Tickety guest'} · {review.customer?.email} · {review.booking?.bookingRef}</small>
      {review.status === 'pending' && <div className="review-actions"><button className="button" onClick={() => moderate(review, 'approved')}>Approve</button><button className="danger-button" onClick={() => moderate(review, 'rejected')}>Reject</button></div>}
      {review.status !== 'pending' && <button className="text-link" onClick={() => moderate(review, review.status === 'approved' ? 'rejected' : 'approved')}>{review.status === 'approved' ? 'Remove from public view' : 'Approve review'}</button>}
    </article>)}</div> : <p className="empty-inline">No {status} reviews.</p>}
  </main>
}

export default AdminReviews
