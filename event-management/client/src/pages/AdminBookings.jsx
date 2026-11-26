import { useCallback, useEffect, useState } from 'react'
import api from '../services/api'
import Loader from '../components/Loader'
import StatusBadge from '../components/StatusBadge'

const money = (amount) => `₹${Number(amount || 0).toLocaleString('en-IN')}`
const statuses = ['', 'pending', 'advance_pending', 'confirmed', 'rejected', 'completed', 'cancelled', 'refunded']

function AdminBookings() {
  const [bookings, setBookings] = useState([])
  const [payments, setPayments] = useState([])
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [bookingResponse, paymentResponse] = await Promise.all([
        api.get('/admin/bookings', { params: { status: status || undefined, search: search || undefined, limit: 50 } }),
        api.get('/admin/payments', { params: { status: 'submitted', limit: 50 } }),
      ])
      setBookings(bookingResponse.data.data || [])
      setPayments(paymentResponse.data.data || [])
    } catch (requestError) { setError(requestError.response?.data?.message || 'Unable to load bookings and payments.') }
    finally { setLoading(false) }
  }, [status, search])

  useEffect(() => { load() }, [load])

  function exportReport() {
    const cell = (value) => { let text = String(value ?? ''); if (/^[=+@\-\t\r]/.test(text)) text = `'${text}`; return `"${text.replaceAll('"', '""')}"` }
    const headers = ['Booking ID','Customer','Email','Phone','Event','Event date','Tickets','Total INR','Paid INR','Balance INR','Payment status','Booking status']
    const rows = bookings.map((b) => [b.bookingRef,b.name,b.email,b.phone,b.event?.title,b.event?.startDate ? new Date(b.event.startDate).toLocaleString('en-IN') : '',b.quantity,b.totalAmount,b.advancePaid,b.remainingAmount,b.paymentStatus,b.bookingStatus])
    const blob = new Blob(['\uFEFF' + [headers, ...rows].map((row) => row.map(cell).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = `tickety-bookings-${new Date().toISOString().slice(0,10)}.csv`; link.click(); URL.revokeObjectURL(url)
  }
  async function verifyPayment(paymentId) {
    setBusyId(paymentId)
    setError('')
    try { const response = await api.patch(`/admin/payments/${paymentId}/verify`); setMessage(response.data.message || 'Payment verified.'); await load() }
    catch (requestError) { setError(requestError.response?.data?.message || 'Unable to verify this payment.') }
    finally { setBusyId('') }
  }

  async function changeStatus(booking, nextStatus) {
    if (['cancelled', 'rejected'].includes(nextStatus) && !window.confirm((nextStatus === 'rejected' ? 'Reject' : 'Cancel') + ' booking ' + booking.bookingRef + '?')) return
    setBusyId(booking._id)
    setError('')
    try { await api.patch(`/admin/bookings/${booking._id}/status`, { status: nextStatus }); setMessage(`Booking ${booking.bookingRef} updated.`); await load() }
    catch (requestError) { setError(requestError.response?.data?.message || 'Unable to update booking.') }
    finally { setBusyId('') }
  }

  async function completeRefund(booking) {
    if (!window.confirm(`Process or confirm the refund of ₹${Number(booking.advancePaid || 0).toLocaleString('en-IN')} for ${booking.bookingRef}? For UPI or cash payments, send the refund outside Tickety before confirming.`)) return
    setBusyId(booking._id); setError(''); setMessage('')
    try { const response = await api.post(`/admin/bookings/${booking._id}/refund-complete`, { confirmManualRefund: true }); setMessage(response.data.message || 'Refund completed.'); await load() }
    catch (requestError) { setError(requestError.response?.data?.message || 'Unable to complete this refund.') }
    finally { setBusyId('') }
  }

  return <main className="page-shell admin-bookings"><div className="page-heading"><div><p className="eyebrow">Operations</p><h1>Bookings and payments</h1><p className="lede">Review reservations, confirm payment references, and track balances.</p></div></div>
    {error && <p className="form-error" role="alert">{error}</p>}{message && <p className="success-message" role="status">{message}</p>}
    <section className="admin-payment-queue"><div className="section-heading"><div><p className="eyebrow">Needs review</p><h2>Payment references</h2></div><span className="status-badge">{payments.length} submitted</span></div>
      {payments.length ? <div className="attendee-table-wrap"><table className="attendee-table"><thead><tr><th>Payment</th><th>Booking</th><th>Customer</th><th>Amount</th><th>Method / reference</th><th>Action</th></tr></thead><tbody>{payments.map((payment) => <tr key={payment.paymentId}><td><strong>{payment.paymentId}</strong><small>{new Date(payment.createdAt).toLocaleString('en-IN')}</small></td><td>{payment.booking?.bookingRef}<small>{payment.booking?.event?.title}</small></td><td>{payment.booking?.name}<small>{payment.booking?.email}</small></td><td>{money(payment.amount)}</td><td><strong>{payment.method?.replaceAll('_', ' ')}</strong><small>{payment.gatewayReference || 'â€”'}</small></td><td><button className="button" type="button" disabled={busyId === payment.paymentId} onClick={() => verifyPayment(payment.paymentId)}>{busyId === payment.paymentId ? 'Verifyingâ€¦' : 'Verify payment'}</button></td></tr>)}</tbody></table></div> : <p className="empty-inline">No payment references are waiting for review.</p>}
    </section>
    <section className="admin-booking-list"><div className="section-heading"><div><p className="eyebrow">Reservations</p><h2>All bookings</h2></div><button className="text-link" type="button" disabled={!bookings.length} onClick={exportReport}>Download CSV report</button></div><div className="admin-booking-filters"><input aria-label="Search bookings" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search booking, customer, or email" /><select aria-label="Filter bookings by status" value={status} onChange={(event) => setStatus(event.target.value)}>{statuses.map((item) => <option key={item} value={item}>{item ? item.replaceAll('_', ' ') : 'All statuses'}</option>)}</select></div>
      {loading ? <Loader /> : bookings.length ? <div className="attendee-table-wrap"><table className="attendee-table"><thead><tr><th>Booking ID</th><th>Customer</th><th>Event</th><th>Date</th><th>Guests</th><th>Total</th><th>Advance paid</th><th>Remaining</th><th>Payment status</th><th>Booking status</th><th>Actions</th></tr></thead><tbody>{bookings.map((booking) => <tr key={booking._id}><td><strong>{booking.bookingRef}</strong><small>{new Date(booking.createdAt).toLocaleDateString('en-IN')}</small></td><td>{booking.name}<small>{booking.email} · {booking.phone}</small></td><td>{booking.event?.title || 'Event'}<small>{booking.event?.city}</small></td><td>{new Date(booking.eventDate || booking.event?.startDate || booking.createdAt).toLocaleString('en-IN')}</td><td>{booking.quantity}</td><td>{money(booking.totalAmount)}</td><td>{money(booking.advancePaid)}</td><td>{money(booking.remainingAmount)}</td><td><StatusBadge status={booking.paymentStatus} /><small>{booking.paymentMethod?.replaceAll('_', ' ')}</small></td><td><StatusBadge status={booking.bookingStatus} /></td><td className="booking-admin-actions">{booking.bookingStatus === 'cancellation_requested' && <button className="danger-button" type="button" disabled={busyId === booking._id} onClick={() => completeRefund(booking)}>Complete refund</button>}{['pending', 'advance_pending', 'advance_paid'].includes(booking.bookingStatus) && <><button className="button" type="button" disabled={busyId === booking._id} onClick={() => changeStatus(booking, 'confirmed')}>Accept</button><button className="danger-button" type="button" disabled={busyId === booking._id} onClick={() => changeStatus(booking, 'rejected')}>Reject</button></>}{!['completed', 'cancelled', 'rejected', 'refunded'].includes(booking.bookingStatus) && <select aria-label="Update booking status" value="" disabled={busyId === booking._id} onChange={(event) => event.target.value && changeStatus(booking, event.target.value)}><option value="">Update status</option>{['completed', 'cancelled'].filter((item) => item !== booking.bookingStatus).map((item) => <option key={item} value={item}>{item}</option>)}</select>}</td></tr>)}</tbody></table></div> : <p className="empty-inline">No bookings match these filters.</p>}
    </section>
  </main>
}

export default AdminBookings
