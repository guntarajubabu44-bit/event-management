import { useEffect, useMemo, useState } from 'react'
import api from '../services/api'
import Loader from '../components/Loader'

const money = (amount) => `₹${Number(amount || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`
const safe = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char])

function printReceipt(payment) {
  const booking = payment.booking || {}
  const event = booking.event || {}
  const receipt = window.open('', '_blank', 'width=760,height=820')
  if (!receipt) return
  const rows = [['Booking ID', booking.bookingRef], ['Customer', booking.name], ['Event', event.title], ['Event date', booking.eventDate || event.startDate ? new Date(booking.eventDate || event.startDate).toLocaleString('en-IN') : 'Not available'], ['Venue', booking.venue], ['Package', booking.packageName], ['Services', booking.selectedServices?.map((service) => service.name).join(', ')], ['Total amount', money(booking.totalAmount)], ['Advance paid', money(booking.advancePaid)], ['Remaining amount', money(booking.remainingAmount)], ['Payment ID', payment.paymentId], ['Payment method', payment.method?.replaceAll('_', ' ')], ['Payment date', new Date(payment.createdAt).toLocaleString('en-IN')], ['Payment status', payment.status]].map(([label, value]) => `<tr><th>${safe(label)}</th><td>${safe(value || 'Not available')}</td></tr>`).join('')
  receipt.document.write(`<!doctype html><html><head><title>Receipt ${safe(payment.paymentId)}</title><meta charset="utf-8"><style>body{font:16px Arial,sans-serif;color:#192621;margin:48px}main{max-width:680px;margin:auto;border:1px solid #dce5df;border-radius:18px;padding:36px}h1{margin:0 0 4px;color:#225b44}.sub{color:#607068;margin:0 0 28px}table{border-collapse:collapse;width:100%}th,td{text-align:left;padding:13px;border-bottom:1px solid #e7ece8}th{width:38%;color:#65736b}.foot{margin-top:24px;color:#68756e;font-size:13px}@media print{body{margin:0}main{border:0}}</style></head><body><main><h1>Tickety</h1><p class="sub">Event booking payment receipt</p><table>${rows}</table><p class="foot">Keep this receipt for your records. Tickety does not store card or banking credentials.</p></main><script>window.onload=()=>window.print()</script></body></html>`)
  receipt.document.close()
}

function PaymentHistory() {
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')

  useEffect(() => {
    let active = true
    api.get('/payments/history').then((response) => { if (active) setPayments(response.data.data || []) }).catch((requestError) => { if (active) setError(requestError.response?.data?.message || 'Unable to load payments.') }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  const filtered = useMemo(() => payments.filter((payment) => {
    const matchesQuery = `${payment.paymentId} ${payment.booking?.bookingRef || ''} ${payment.booking?.event?.title || ''}`.toLowerCase().includes(query.trim().toLowerCase())
    return matchesQuery && (status === 'all' || payment.status === status)
  }), [payments, query, status])

  return <main className="page-shell history-shell">
    <p className="eyebrow">Your account</p><h1>Payment history</h1><p className="lede">Search transactions, check verification status, and print receipts.</p>
    {!loading && payments.length > 0 && <div className="history-filters"><input aria-label="Search payments" placeholder="Search payment ID, booking ID, or event" value={query} onChange={(event) => setQuery(event.target.value)} /><select aria-label="Filter payments by status" value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">All payments</option><option value="pending">Pending</option><option value="submitted">Submitted for review</option><option value="verified">Verified</option><option value="failed">Failed</option><option value="refunded">Refunded</option></select></div>}
    {loading && <Loader />}{error && <p className="form-error" role="alert">{error}</p>}
    {!loading && !error && !payments.length && <div className="empty-state"><h2>No payments yet</h2><p>Payment transactions will appear here after you book an event.</p></div>}
    {!loading && !error && payments.length > 0 && !filtered.length && <p className="empty-inline">No payments match these filters.</p>}
    {!!filtered.length && <div className="attendee-table-wrap"><table className="attendee-table"><thead><tr><th>Transaction</th><th>Booking / event</th><th>Amount</th><th>Method</th><th>Status</th><th>Receipt</th></tr></thead><tbody>{filtered.map((payment) => <tr key={payment._id}><td><strong>{payment.paymentId}</strong><small>{new Date(payment.createdAt).toLocaleString('en-IN')}</small></td><td>{payment.booking?.bookingRef}<small>{payment.booking?.event?.title || 'Event'}</small></td><td>{money(payment.amount)}</td><td>{payment.method?.replaceAll('_', ' ')}</td><td>{payment.status}</td><td>{payment.status === 'verified' ? <button className="text-link" type="button" onClick={() => printReceipt(payment)}>Print receipt</button> : 'Available after verification'}</td></tr>)}</tbody></table></div>}
  </main>
}

export default PaymentHistory
