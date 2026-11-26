import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import heroImage from '../assets/hero.png'
import { createPublicBooking, createRazorpayOrder, getPublicEvent, submitBookingPayment, verifyRazorpayPayment } from '../services/eventService'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'

const methods = [['upi', 'UPI (PhonePe / Google Pay)'], ['cash', 'Pay at venue']]
const accountLabels = { upi: 'UPI', phonepe: 'PhonePe', googlepay: 'Google Pay' }
const money = (value) => `\u20b9${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`

function loadRazorpayCheckout() {
  if (window.Razorpay) return Promise.resolve(true)
  return new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-razorpay-checkout]')
    if (existing) { existing.addEventListener('load', () => resolve(true), { once: true }); existing.addEventListener('error', reject, { once: true }); return }
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.dataset.razorpayCheckout = 'true'
    script.onload = () => resolve(true)
    script.onerror = () => reject(new Error('Secure checkout could not be loaded.'))
    document.body.appendChild(script)
  })
}

function PublicEvent() {
  const { publicId } = useParams()
  const { user } = useAuth()
  const [event, setEvent] = useState(null)
  const [booking, setBooking] = useState(null)
  const [paymentReference, setPaymentReference] = useState('')
  const [couponInput, setCouponInput] = useState('')
  const [coupon, setCoupon] = useState(null)
  const [couponMessage, setCouponMessage] = useState('')
  const [form, setForm] = useState({ name: '', email: '', phone: '', quantity: 1, paymentMethod: 'upi', eventDate: '', venue: '', packageId: '', serviceIds: [], specialRequirements: '' })
  const [message, setMessage] = useState('Loading event...')
  const [activeImage, setActiveImage] = useState(0)
  const [galleryOpen, setGalleryOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [reviews, setReviews] = useState([])
  const [ratingSummary, setRatingSummary] = useState({ average: 0, count: 0 })
  const [reviewForm, setReviewForm] = useState({ bookingRef: '', rating: 5, comment: '' })
  const [reviewMessage, setReviewMessage] = useState('')
  const [razorpayEnabled, setRazorpayEnabled] = useState(false)

  useEffect(() => {
    let active = true
    getPublicEvent(publicId).then((response) => { if (active) { const nextEvent = response.data.data; setEvent(nextEvent); setMessage(''); setActiveImage(0); setForm((current) => ({ ...current, eventDate: new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date(nextEvent.startDate)), venue: nextEvent.venues?.[0] || nextEvent.venue || '', packageId: nextEvent.packages?.[0]?._id || '' })) } }).catch((error) => { if (active) setMessage(error.response?.data?.message || 'Event unavailable.') })
    return () => { active = false }
  }, [publicId])

  useEffect(() => { api.get('/payments/config').then((response) => setRazorpayEnabled(Boolean(response.data.data?.razorpayEnabled))).catch(() => setRazorpayEnabled(false)) }, [])

  useEffect(() => { if (!event) return; let active = true; api.get(`/public/events/${publicId}/reviews`).then((response) => { if (active) { setReviews(response.data.data || []); setRatingSummary(response.data.ratingSummary || { average: 0, count: 0 }) } }).catch(() => {}); return () => { active = false } }, [event, publicId])

  async function submitReview(e) { e.preventDefault(); setReviewMessage(''); try { const response = await api.post(`/public/events/${publicId}/reviews`, reviewForm); setReviewMessage(response.data.message); setReviewForm({ bookingRef: '', rating: 5, comment: '' }) } catch (error) { setReviewMessage(error.response?.data?.message || 'Unable to submit your review.') } }

  const images = event?.images?.length ? event.images : []
  const coverImage = event?.featuredImage || images[activeImage] || heroImage
  const quantity = Math.max(1, Math.min(20, Number(form.quantity) || 1))
  const selectedPackage = event?.packages?.find((item) => item._id === form.packageId)
  const selectedServices = event?.services?.filter((item) => form.serviceIds.includes(item._id)) || []
  const packagePrice = Number(selectedPackage?.price ?? event?.ticketPrice ?? 0)
  const servicesPrice = selectedServices.reduce((sum, service) => sum + Number(service.price || 0), 0)
  const total = (packagePrice + servicesPrice) * quantity
  const discount = Number(coupon?.subtotal === total ? coupon.discountAmount : 0)
  const discountedTotal = Math.max(0, total - discount)
  const advancePerTicket = Math.min(packagePrice + servicesPrice, (Number(selectedPackage?.advanceAmount) || Number(event?.advanceAmount) || packagePrice) + servicesPrice)
  const advance = total ? Math.min(discountedTotal, Math.round(advancePerTicket * quantity * discountedTotal / total * 100) / 100) : 0
  const isPaid = packagePrice + servicesPrice > 0

  async function submit(eventSubmit) {
    eventSubmit.preventDefault()
    setMessage('')
    setSubmitting(true)
    try { const response = await createPublicBooking(publicId, { ...form, quantity, couponCode: coupon?.code || '' }); setBooking(response.data.data); setMessage(response.data.message) } catch (error) { setMessage(error.response?.data?.message || 'Unable to complete booking.') } finally { setSubmitting(false) }
  }

  async function applyCoupon() {
    setCouponMessage('')
    try { const response = await api.post('/public/coupons/validate', { code: couponInput, subtotal: total }); setCoupon({ ...response.data.data, subtotal: total }); setCouponMessage(response.data.message || 'Coupon applied.') }
    catch (error) { setCoupon(null); setCouponMessage(error.response?.data?.message || 'Unable to apply coupon.') }
  }

  async function submitPayment(eventSubmit) {
    eventSubmit.preventDefault()
    setSubmitting(true)
    try { const response = await submitBookingPayment(booking.bookingRef, paymentReference, booking.bookingAccessToken); setBooking((current) => ({ ...current, ...response.data.data, paymentStatus: 'submitted' })); setMessage(response.data.message) } catch (error) { setMessage(error.response?.data?.message || 'Unable to submit payment reference.') } finally { setSubmitting(false) }
  }

  async function payOnline() {
    setSubmitting(true)
    setMessage('')
    try {
      const orderResponse = await createRazorpayOrder(booking.bookingRef, booking.bookingAccessToken)
      await loadRazorpayCheckout()
      const order = orderResponse.data.data
      const checkout = new window.Razorpay({ key: order.keyId, amount: order.amount, currency: order.currency, name: 'Tickety', description: event.title, order_id: order.orderId, prefill: { name: booking.name, email: booking.email, contact: booking.phone }, theme: { color: '#6b58bd' }, handler: async (details) => {
        try {
          const response = await verifyRazorpayPayment(booking.bookingRef, booking.bookingAccessToken, details)
          setBooking((current) => ({ ...current, ...response.data.data, status: response.data.data.bookingStatus, paymentStatus: response.data.data.paymentStatus }))
          setMessage(response.data.message || 'Payment successful.')
        } catch (error) { setMessage(error.response?.data?.message || 'We could not verify the payment. Contact the organiser with your payment ID.') }
      } })
      checkout.on('payment.failed', (details) => setMessage(details.error?.description || 'Payment failed. Please try again.'))
      checkout.open()
    } catch (error) { setMessage(error.response?.data?.message || error.message || 'Unable to start secure checkout.') }
    finally { setSubmitting(false) }
  }

  if (!event) return <main className="page-shell"><Link className="back-link" to="/explore">Back to events</Link><p role="status">{message}</p></main>
  const available = Number(event.availableSeats ?? event.capacity)
  const venueOptions = [...new Set([event.venue, ...(event.venues || [])].filter(Boolean))]
  const dateValue = (value) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date(value))
  const selectedDateUnavailable = (event.unavailableDates || []).some((date) => dateValue(date) === form.eventDate)

  return <main className="public-event-shell">
    <nav className="public-detail-nav"><Link className="landing-brand" to="/">tickety<span>.</span></Link><Link className="back-link" to="/explore">Explore events</Link></nav>
    <section className="public-hero"><button className="public-hero-image" type="button" onClick={() => setGalleryOpen(true)} aria-label="Open event image gallery"><img src={coverImage} alt={event.title} /></button><div className="public-hero-overlay"><p className="eyebrow">{event.category?.replaceAll('_', ' ') || 'Featured event'}</p><h1>{event.title}</h1><p>{event.description || 'An experience worth showing up for.'}</p></div></section>
    {images.length > 1 && <div className="image-gallery-thumbnails" aria-label="Event images">{images.map((image, index) => <button key={image} type="button" aria-label={`Show image ${index + 1}`} aria-pressed={activeImage === index} onClick={() => setActiveImage(index)}><img src={image} alt="" /></button>)}</div>}
    {!!event.videos?.length && <section className="public-event-videos"><p className="eyebrow">Event preview</p><h2>Watch the event</h2><div>{event.videos.map((video, index) => <video key={video} src={video} controls preload="metadata" playsInline aria-label={`${event.title} video ${index + 1}`} />)}</div></section>}
    <section className="public-event-content">
      <div className="public-event-copy"><p className="eyebrow">{event.city ? `${event.city}, ${event.state}` : 'Save your seat'}</p><h2>{new Intl.DateTimeFormat('en-IN', { dateStyle: 'full' }).format(new Date(event.startDate))}</h2><p className="lede">{new Intl.DateTimeFormat('en-IN', { timeStyle: 'short' }).format(new Date(event.startDate))} · {event.venue ? `${event.venue}, ` : ''}{event.location}</p><p className="organizer-byline">Organised by {event.owner?.name || 'Event organiser'}</p><div className="event-type-strip"><span>{event.category?.replaceAll('_', ' ') || 'Event'}</span><strong>{isPaid ? `${money(event.ticketPrice)} per seat` : 'Free entry'}</strong></div><div className="public-event-facts"><span><strong>{available}</strong> seats available</span>{isPaid && <span><strong>{money(advancePerTicket)}</strong> advance per seat</span>}<span>Up to <strong>{money(event.ticketPrice)}</strong> per seat</span></div>{event.termsAndConditions && <details className="event-terms"><summary>Terms and conditions</summary><p>{event.termsAndConditions}</p></details>}{event.cancellationPolicy && <details className="event-terms"><summary>Cancellation policy</summary><p>{event.cancellationPolicy}</p></details>}</div>
      <section className="booking-panel">
        {booking ? <>
          <p className="eyebrow">{booking.bookingStatus === 'confirmed' ? 'Booking confirmed' : 'Reservation received'}</p>
          <h2>{booking.bookingStatus === 'confirmed' ? 'See you there.' : 'Your seat is held.'}</h2>
          <p>{message}</p>
          <div className="booking-summary"><strong>{booking.bookingRef}</strong><span>{booking.quantity} seat{booking.quantity > 1 ? 's' : ''} ? {money(booking.totalAmount)}</span><small>{booking.eventDate ? new Date(booking.eventDate).toLocaleDateString('en-IN') : ''} ? {booking.venue || 'Venue to be confirmed'} ? {booking.packageName || 'Standard'}{booking.selectedServices?.length ? ` ? ${booking.selectedServices.map((service) => service.name).join(', ')}` : ''}</small></div>
          <div className="booking-amounts"><span>Advance due <strong>{money(Math.max(0, booking.advanceAmount - booking.advancePaid))}</strong></span><span>Balance after advance <strong>{money(booking.remainingAmount)}</strong></span></div>
          {razorpayEnabled && ['pending', 'partially_paid'].includes(booking.paymentStatus) && booking.remainingAmount > 0 && ['card', 'netbanking', 'wallet'].includes(booking.paymentMethod) && <button className="button" type="button" onClick={payOnline} disabled={submitting}>{submitting ? 'Opening secure checkout...' : <>Pay {money(booking.advancePaid < booking.advanceAmount ? booking.advanceAmount - booking.advancePaid : booking.remainingAmount)} securely</>}</button>}
          {booking.paymentStatus === 'pending' && booking.paymentMethod === 'upi' && booking.paymentInstructions?.accounts?.length > 0 && <form onSubmit={submitPayment} className="payment-followup">
            <div className="payment-accounts">{booking.paymentInstructions.accounts.map((account, index) => <div className="payment-account" key={`${account.provider}-${index}`}><strong>{account.label || accountLabels[account.provider]}</strong><span>{account.value}</span></div>)}</div>
            <label htmlFor="payment-reference">UPI transaction reference</label><input id="payment-reference" value={paymentReference} onChange={(e) => setPaymentReference(e.target.value)} placeholder="Enter the UPI transaction reference" required minLength="4" maxLength="160" />
            <button className="button" type="submit" disabled={submitting}>{submitting ? 'Submitting...' : 'Send payment for verification'}</button>
            <small>After paying the advance, send the UPI reference. The organizer will verify it and update your booking.</small>
          </form>}
          {booking.paymentStatus === 'pending' && booking.paymentMethod === 'upi' && !booking.paymentInstructions?.accounts?.length && <p className="form-error" role="status">The organizer has not added UPI payment details yet. Contact the organizer before sending your advance.</p>}
          {booking.paymentStatus === 'pending' && booking.paymentMethod === 'cash' && <form onSubmit={submitPayment} className="payment-followup"><label htmlFor="payment-reference">Cash receipt or confirmation reference</label><input id="payment-reference" value={paymentReference} onChange={(e) => setPaymentReference(e.target.value)} placeholder="Enter the receipt reference from the organizer" required minLength="4" maxLength="160" /><button className="button" type="submit" disabled={submitting}>{submitting ? 'Submitting...' : 'Send for verification'}</button><small>Your organizer will verify the advance and update your booking.</small></form>}
          {booking.paymentStatus === 'submitted' && <p className="success-message">Payment reference received. Waiting for organiser verification.</p>}
          <Link className="text-link" to="/explore">Continue exploring events</Link>
        </> : <>
          <p className="eyebrow">Book online</p><h2>Make it yours.</h2>
          {message && message !== 'Loading event...' && <p className="form-error" role="alert">{message}</p>}
          <form onSubmit={submit} className="booking-form">
            <label htmlFor="public-name">Full name</label><input id="public-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoComplete="name" minLength="2" maxLength="100" required />
            <label htmlFor="public-email">Email</label><input id="public-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} autoComplete="email" required />
            <label htmlFor="event-date">Event date</label><input id="event-date" type="date" value={form.eventDate} min={dateValue(event.startDate)} max={dateValue(event.endDate)} onChange={(e) => setForm({ ...form, eventDate: e.target.value })} required />{event.unavailableDates?.length > 0 && <small>Unavailable dates: {event.unavailableDates.map((date) => dateValue(date)).join(', ')}</small>}{selectedDateUnavailable && <p className="form-error" role="alert">This event is unavailable on the selected date. Choose another date.</p>}
            {venueOptions.length > 1 ? <><label htmlFor="booking-venue">Choose a venue</label><select id="booking-venue" value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} required>{venueOptions.map((venue) => <option key={venue} value={venue}>{venue}</option>)}</select></> : <><label htmlFor="booking-venue">Venue</label><input id="booking-venue" value={form.venue || event.venue || 'Venue to be confirmed'} readOnly /></>}
            {event.packages?.length > 0 && <fieldset className="booking-choice-group"><legend>Choose a package</legend>{event.packages.map((item) => <label className="booking-choice" key={item._id}><input type="radio" name="event-package" checked={form.packageId === item._id} onChange={() => setForm({ ...form, packageId: item._id })} /><span><strong>{item.name}</strong><small>{item.description}</small></span><b>{money(item.price)} / guest</b></label>)}</fieldset>}
            {event.services?.length > 0 && <fieldset className="booking-choice-group"><legend>Add services</legend>{event.services.map((item) => <label className="booking-choice" key={item._id}><input type="checkbox" checked={form.serviceIds.includes(item._id)} onChange={(e) => setForm({ ...form, serviceIds: e.target.checked ? [...form.serviceIds, item._id] : form.serviceIds.filter((id) => id !== item._id) })} /><span><strong>{item.name}</strong><small>{item.description}</small></span><b>+{money(item.price)} / guest</b></label>)}</fieldset>}
            <label htmlFor="public-phone">Indian mobile number</label><input id="public-phone" type="tel" inputMode="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+91 98765 43210" autoComplete="tel" required />
            <div className="booking-form-row"><div><label htmlFor="quantity">Seats</label><input id="quantity" type="number" min="1" max={Math.min(20, available)} value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} required /></div>{isPaid && <div><label htmlFor="payment-method">Payment method</label><select id="payment-method" value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}>{[...methods, ...(razorpayEnabled ? [['card', 'Card'], ['netbanking', 'Net banking'], ['wallet', 'Wallet']] : [])].map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>}</div>
            <label htmlFor="requirements">Special requirements (optional)</label><textarea id="requirements" maxLength="1000" value={form.specialRequirements} onChange={(e) => setForm({ ...form, specialRequirements: e.target.value })} />
            <div className="coupon-entry"><label htmlFor="coupon-code">Coupon code</label><div className="booking-form-row"><input id="coupon-code" value={couponInput} onChange={(e) => { setCouponInput(e.target.value); setCoupon(null); setCouponMessage('') }} placeholder="Enter coupon code" maxLength={32} /><button className="text-link" type="button" onClick={applyCoupon} disabled={!couponInput.trim()}>Apply</button></div>{couponMessage && <small role="status">{couponMessage}</small>}{coupon && coupon.subtotal !== total && <small>Booking options changed. Apply the coupon again to recalculate the discount.</small>}</div>
            <div className="booking-amounts"><span>Subtotal <strong>{money(total)}</strong></span>{discount > 0 && <span>Discount ({coupon.code}) <strong>−{money(discount)}</strong></span>}<span>Total amount <strong>{money(discountedTotal)}</strong></span><span>Pay now <strong>{money(advance)}</strong></span><span>Due after advance <strong>{money(Math.max(0, discountedTotal - advance))}</strong></span></div>
            <button className="button" type="submit" disabled={submitting || available < 1 || selectedDateUnavailable}>{available < 1 ? 'Sold out' : selectedDateUnavailable ? 'Choose another date' : submitting ? 'Reserving...' : isPaid ? 'Reserve and pay advance' : 'Reserve my seat'}</button>
          </form>
        </>}
      </section>
    </section>
    <section className="event-reviews"><div className="section-heading"><div><p className="eyebrow">Guest notes</p><h2>Reviews {ratingSummary.count > 0 && <span>· {ratingSummary.average} / 5 ({ratingSummary.count})</span>}</h2></div></div>{reviews.length ? <div className="review-grid">{reviews.map((review) => <article className="review-card" key={review._id}><div aria-label={`${review.rating} out of 5 stars`} className="review-stars">{'★'.repeat(review.rating)}{'☆'.repeat(5-review.rating)}</div><p>{review.comment}</p><small>{review.customer?.name || 'Tickety guest'} · {new Date(review.createdAt).toLocaleDateString('en-IN')}</small></article>)}</div> : <p className="empty-inline">No reviews yet. Be the first to share how it went.</p>}{user?.role === 'customer' && <form className="review-form" onSubmit={submitReview}><h3>Share your experience</h3><p>Reviews require a completed booking and are checked before they appear publicly.</p><label>Booking ID<input value={reviewForm.bookingRef} onChange={e=>setReviewForm({...reviewForm,bookingRef:e.target.value})} placeholder="EVT-2026-000123" required pattern="EVT-\d{4}-\d{6}"/></label><label>Rating<select value={reviewForm.rating} onChange={e=>setReviewForm({...reviewForm,rating:Number(e.target.value)})}>{[5,4,3,2,1].map(value=><option key={value} value={value}>{value} star{value===1?'':'s'}</option>)}</select></label><label>Your review<textarea value={reviewForm.comment} onChange={e=>setReviewForm({...reviewForm,comment:e.target.value})} minLength={10} maxLength={1500} required rows={4}/></label>{reviewMessage&&<p className="success-message" role="status">{reviewMessage}</p>}<button className="button" type="submit">Submit review</button></form>}</section>    {galleryOpen && <div className="gallery-lightbox" role="dialog" aria-modal="true" aria-label="Event image gallery" onClick={() => setGalleryOpen(false)}><button type="button" className="gallery-close" aria-label="Close gallery" onClick={() => setGalleryOpen(false)}>×</button><button type="button" className="gallery-arrow gallery-prev" aria-label="Previous image" onClick={(e) => { e.stopPropagation(); setActiveImage((activeImage + Math.max(images.length, 1) - 1) % Math.max(images.length, 1)) }}>â€¹</button><img src={images[activeImage] || coverImage} alt={`${event.title} gallery image ${activeImage + 1}`} onClick={(e) => e.stopPropagation()} /><button type="button" className="gallery-arrow gallery-next" aria-label="Next image" onClick={(e) => { e.stopPropagation(); setActiveImage((activeImage + 1) % Math.max(images.length, 1)) }}>â€º</button></div>}
  </main>
}

export default PublicEvent
