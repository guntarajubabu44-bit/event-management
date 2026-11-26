import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Loader from '../components/Loader'
import StatusBadge from '../components/StatusBadge'
import { useAuth } from '../context/AuthContext'
import { cancelBooking, createRazorpayOrder, getBookingHistory, submitBookingPayment, verifyRazorpayPayment } from '../services/eventService'
import api from '../services/api'

const labels = { pending: 'Awaiting payment', advance_pending: 'Advance pending', advance_paid: 'Advance paid', submitted: 'Submitted for review', partially_paid: 'Partially paid', fully_paid: 'Fully paid', failed: 'Failed', refunded: 'Refunded' }
const money = (amount) => `₹${Number(amount || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`

function loadCheckout() {
  if (window.Razorpay) return Promise.resolve()
  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = resolve
    script.onerror = () => reject(new Error('Secure checkout could not be loaded.'))
    document.body.appendChild(script)
  })
}

function printBookingReceipt(booking) {
  const escape = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char])
  const rows = [['Booking ID', booking.bookingRef], ['Customer', `${booking.name} · ${booking.email} · ${booking.phone}`], ['Event', booking.event?.title], ['Date', new Date(booking.eventDate || booking.event?.startDate || booking.createdAt).toLocaleString('en-IN')], ['Venue', booking.venue || booking.event?.venue || booking.event?.city], ['Package', booking.packageName || 'Standard'], ['Services', booking.selectedServices?.map((service) => service.name).join(', ') || 'None'], ...(booking.couponCode ? [['Coupon', booking.couponCode], ['Discount', money(booking.discountAmount)]] : []), ['Booking status', booking.bookingStatus], ['Payment status', booking.paymentStatus], ['Total amount', money(booking.totalAmount)], ['Advance paid', money(booking.advancePaid)], ['Balance due', money(booking.remainingAmount)]]
  const receipt = window.open('', '_blank', 'width=760,height=820')
  if (!receipt) return
  receipt.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Booking ${escape(booking.bookingRef)}</title><style>body{font:16px Arial,sans-serif;color:#192621;margin:40px}main{max-width:680px;margin:auto;border:1px solid #dce5df;border-radius:18px;padding:36px}h1{color:#225b44}table{border-collapse:collapse;width:100%}th,td{text-align:left;padding:12px;border-bottom:1px solid #e7ece8}th{color:#65736b;width:38%}@media print{body{margin:0}main{border:0}}</style></head><body><main><h1>Tickety booking receipt</h1><table>${rows.map(([key, value]) => `<tr><th>${escape(key)}</th><td>${escape(value)}</td></tr>`).join('')}</table><p>Print this page or choose Save as PDF in the print dialog.</p></main><script>window.onload=()=>window.print()</script></body></html>`)
  receipt.document.close()
}

function BookingHistory() {
  const { user } = useAuth()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')
  const [busyRef, setBusyRef] = useState('')
  const [razorpayEnabled, setRazorpayEnabled] = useState(false)
  const [paymentReferences, setPaymentReferences] = useState({})

  useEffect(() => {
    let active = true
    getBookingHistory().then((response) => { if (active) setBookings(response.data.data || []) }).catch((requestError) => { if (active) setError(requestError.response?.data?.message || 'Unable to load bookings.') }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  useEffect(() => { api.get('/payments/config').then((response) => setRazorpayEnabled(Boolean(response.data.data?.razorpayEnabled))).catch(() => setRazorpayEnabled(false)) }, [])

  const filtered = useMemo(() => bookings.filter((booking) => {
    const matchesQuery = `${booking.bookingRef} ${booking.name} ${booking.event?.title || ''} ${booking.event?.city || ''}`.toLowerCase().includes(query.trim().toLowerCase())
    const matchesStatus = status === 'all' || (status === 'upcoming' && ['pending', 'advance_pending', 'advance_paid', 'confirmed'].includes(booking.bookingStatus)) || booking.bookingStatus === status || (status === 'payment_due' && ['pending', 'partially_paid'].includes(booking.paymentStatus))
    return matchesQuery && matchesStatus
  }), [bookings, query, status])

  async function cancel(booking) {
    if (!window.confirm(`Cancel booking ${booking.bookingRef}?`)) return
    setBusyRef(booking.bookingRef)
    setError('')
    try {
      await cancelBooking(booking.bookingRef)
      setBookings((current) => current.map((item) => item.bookingRef === booking.bookingRef ? { ...item, bookingStatus: 'cancelled' } : item))
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to cancel this booking.')
    } finally { setBusyRef('') }
  }

  async function payBalance(booking) {
    setBusyRef(booking.bookingRef)
    setError('')
    try {
      const result = await createRazorpayOrder(booking.bookingRef)
      await loadCheckout()
      const order = result.data.data
      const checkout = new window.Razorpay({ key: order.keyId, amount: order.amount, currency: order.currency, name: 'Tickety', description: booking.event?.title || `Booking ${booking.bookingRef}`, order_id: order.orderId, prefill: { name: booking.name, email: booking.email, contact: booking.phone }, theme: { color: '#6b58bd' }, handler: async (details) => {
        try {
          const response = await verifyRazorpayPayment(booking.bookingRef, undefined, details)
          setBookings((current) => current.map((item) => item.bookingRef === booking.bookingRef ? { ...item, ...response.data.data } : item))
        } catch (requestError) { setError(requestError.response?.data?.message || 'Payment was received but could not be verified. Contact the organizer.') }
      } })
      checkout.on('payment.failed', (details) => setError(details.error?.description || 'Payment failed. Please try again.'))
      checkout.open()
    } catch (requestError) { setError(requestError.response?.data?.message || requestError.message || 'Unable to start payment.') }
    finally { setBusyRef('') }
  }

  async function submitManualPayment(event, booking) {
    event.preventDefault()
    setBusyRef(booking.bookingRef)
    setError('')
    try {
      await submitBookingPayment(booking.bookingRef, paymentReferences[booking.bookingRef] || '')
      setBookings((current) => current.map((item) => item.bookingRef === booking.bookingRef ? { ...item, manualPaymentPending: true } : item))
      setPaymentReferences((current) => ({ ...current, [booking.bookingRef]: '' }))
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to submit this payment reference.')
    } finally { setBusyRef('') }
  }

  return <main className="page-shell history-shell">
    <p className="eyebrow">{user?.role === 'customer' ? 'Your account' : 'Bookings'}</p>
    <h1>{user?.role === 'customer' ? 'My bookings' : 'Booking history'}</h1>
    <p className="lede">Search reservations, filter by status, and review payment balances.</p>
    {!loading && bookings.length > 0 && <div className="history-filters"><input aria-label="Search bookings" placeholder="Search booking ID, event, or city" value={query} onChange={(event) => setQuery(event.target.value)} /><select aria-label="Filter bookings by status" value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">All bookings</option><option value="upcoming">Upcoming</option><option value="payment_due">Payment due</option><option value="confirmed">Confirmed</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option><option value="refunded">Refunded</option></select></div>}
    {loading && <Loader />}{error && <p className="form-error" role="alert">{error}</p>}
    {!loading && !error && !bookings.length && <div className="empty-state"><h2>No bookings yet</h2><p>Explore events and save a seat for your next celebration.</p><Link className="button" to="/explore">Explore events</Link></div>}
    {!loading && !error && bookings.length > 0 && !filtered.length && <p className="empty-inline">No bookings match these filters.</p>}
    {!!filtered.length && <div className="attendee-table-wrap"><table className="attendee-table"><thead><tr><th>Booking</th><th>Attendee</th><th>Event</th><th>Total</th><th>Advance / balance</th><th>Payment</th><th>Status</th><th>Options</th></tr></thead><tbody>{filtered.map((booking) => <tr key={booking._id}><td><strong>{booking.bookingRef}</strong><small>{new Date(booking.createdAt).toLocaleDateString('en-IN')}</small></td><td><strong>{booking.name}</strong><small>{booking.email} · {booking.phone}</small></td><td>{booking.event?.title || 'Event'}<small>{new Date(booking.eventDate || booking.event?.startDate || booking.createdAt).toLocaleDateString('en-IN')} · {booking.venue || booking.event?.city || ''}</small><small>{booking.packageName || 'Standard'}{booking.selectedServices?.length ? ` · ${booking.selectedServices.map((service) => service.name).join(', ')}` : ''}</small></td><td>{money(booking.totalAmount)}<small>{booking.quantity} seat{booking.quantity === 1 ? '' : 's'}</small></td><td><strong>{money(booking.advancePaid)} paid</strong><small>{money(booking.remainingAmount)} due</small></td><td><strong>{booking.paymentMethod?.replaceAll('_', ' ')}</strong><small>{labels[booking.paymentStatus] || booking.paymentStatus}</small></td><td><StatusBadge status={booking.bookingStatus} /></td><td className="history-actions"><Link className="text-link" to={`/bookings/${encodeURIComponent(booking.bookingRef)}`}>View booking</Link>{booking.event?.publicId && <Link className="text-link" to={`/public/events/${booking.event.publicId}`}>View event</Link>}<button type="button" className="text-link" onClick={() => printBookingReceipt(booking)}>Download receipt</button>{user?.role === 'customer' && razorpayEnabled && Number(booking.remainingAmount) > 0 && !['cancelled', 'refunded', 'completed'].includes(booking.bookingStatus) && <button type="button" className="text-link" disabled={busyRef === booking.bookingRef} onClick={() => payBalance(booking)}>{busyRef === booking.bookingRef ? 'Opening checkout...' : 'Pay remaining amount'}</button>}{user?.role === 'customer' && ['pending', 'advance_pending'].includes(booking.bookingStatus) && Number(booking.advancePaid) === 0 && <button type="button" className="danger-button" disabled={busyRef === booking.bookingRef} onClick={() => cancel(booking)}>{busyRef === booking.bookingRef ? 'Cancelling...' : 'Cancel booking'}</button>}</td></tr>)}</tbody></table></div>}
    {user?.role === 'customer' && filtered.filter((booking) => ['upi', 'cash'].includes(booking.paymentMethod) && Number(booking.remainingAmount) > 0 && !booking.manualPaymentPending && !['cancelled', 'refunded', 'completed'].includes(booking.bookingStatus)).map((booking) => <section className="payment-followup" key={`manual-payment-${booking._id}`}><h2>{booking.advancePaid > 0 ? 'Submit balance payment' : 'Submit payment reference'} · {booking.bookingRef}</h2>{booking.paymentMethod === 'upi' && booking.paymentInstructions?.accounts?.map((account, index) => <div className="payment-account" key={`${account.provider}-${index}`}><strong>{account.label || account.provider}</strong><span>{account.value}</span></div>)}<p>Amount due: {money(booking.advancePaid < booking.advanceAmount ? booking.advanceAmount - booking.advancePaid : booking.remainingAmount)}</p><form onSubmit={(event) => submitManualPayment(event, booking)}><label htmlFor={`manual-reference-${booking._id}`}>Transaction or receipt reference</label><input id={`manual-reference-${booking._id}`} value={paymentReferences[booking.bookingRef] || ''} onChange={(event) => setPaymentReferences((current) => ({ ...current, [booking.bookingRef]: event.target.value }))} required minLength="4" maxLength="160" /><button className="button" type="submit" disabled={busyRef === booking.bookingRef}>{busyRef === booking.bookingRef ? 'Submitting...' : 'Send for verification'}</button></form></section>)}
    {user?.role === 'customer' && filtered.some((booking) => booking.manualPaymentPending) && <p className="success-message">A payment reference is waiting for organizer verification.</p>}
  </main>
}

export default BookingHistory
