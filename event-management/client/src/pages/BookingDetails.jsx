import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Loader from '../components/Loader'
import StatusBadge from '../components/StatusBadge'
import api from '../services/api'

const money = (amount) => `₹${Number(amount || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`

function BookingDetails() {
  const { bookingRef } = useParams()
  const [booking, setBooking] = useState(null)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    let active = true
    api.get(`/bookings/${encodeURIComponent(bookingRef)}`).then((response) => { if (active) setBooking(response.data.data) }).catch((requestError) => { if (active) setError(requestError.response?.data?.message || 'Unable to load this booking.') })
    return () => { active = false }
  }, [bookingRef])

  if (error) return <main className="page-shell"><Link className="back-link" to="/bookings">Back to bookings</Link><p className="form-error" role="alert">{error}</p></main>
  if (!booking) return <main className="route-loader"><Loader /></main>
  const eventDate = booking.eventDate || booking.event?.startDate
  async function requestCancellation() {
    if (!window.confirm('Request cancellation for this booking? Any verified advance payment will be reviewed by the organizer for refund.')) return
    setBusy(true); setError(''); setMessage('')
    try { const response = await api.patch(`/bookings/${encodeURIComponent(bookingRef)}/cancel`); setBooking(response.data.data); setMessage(response.data.message) }
    catch (requestError) { setError(requestError.response?.data?.message || 'Unable to request cancellation.') }
    finally { setBusy(false) }
  }
  return <main className="page-shell"><Link className="back-link" to="/bookings">Back to bookings</Link><p className="eyebrow">Booking details</p><h1>{booking.event?.title || 'Your event booking'}</h1><p className="lede">Booking reference: {booking.bookingRef}</p>
    {error && <p className="form-error" role="alert">{error}</p>}{message && <p className="success-message" role="status">{message}</p>}
    <section className="customer-metrics"><article><span>Booking status</span><strong><StatusBadge status={booking.bookingStatus}/></strong></article><article><span>Payment status</span><strong><StatusBadge status={booking.paymentStatus}/></strong></article><article><span>Total amount</span><strong>{money(booking.totalAmount)}</strong></article><article><span>Advance paid</span><strong>{money(booking.advancePaid)}</strong></article><article><span>Remaining amount</span><strong>{money(booking.remainingAmount)}</strong></article></section>
    <section className="settings-section booking-detail-card"><h2>Reservation</h2><dl><dt>Event date</dt><dd>{eventDate ? new Date(eventDate).toLocaleString('en-IN') : 'Not specified'}</dd><dt>Venue</dt><dd>{booking.venue || booking.event?.venue || booking.event?.city || 'To be confirmed'}</dd><dt>Package</dt><dd>{booking.packageName || 'Standard'}</dd><dt>Services</dt><dd>{booking.selectedServices?.length ? booking.selectedServices.map((service) => `${service.name} (${money(service.price)})`).join(', ') : 'None selected'}</dd><dt>Guests</dt><dd>{booking.quantity}</dd><dt>Contact</dt><dd>{booking.name} · {booking.email} · {booking.phone}</dd><dt>Special requirements</dt><dd>{booking.specialRequirements || 'None'}</dd></dl>{booking.event?.publicId && <Link className="text-link" to={`/public/events/${booking.event.publicId}`}>Open event page</Link>}{!['cancelled', 'refunded', 'completed', 'rejected', 'cancellation_requested'].includes(booking.bookingStatus) && <button className="danger-button" type="button" disabled={busy} onClick={requestCancellation}>{busy ? 'Sending request...' : 'Request cancellation'}</button>}{booking.bookingStatus === 'cancellation_requested' && <p className="empty-inline">Cancellation requested. The organizer will review any payment for refund.</p>}</section>
  </main>
}

export default BookingDetails
