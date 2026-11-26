import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Pagination from '../components/Pagination'
import Loader from '../components/Loader'
import api from '../services/api'
import { getPublicEvents } from '../services/eventService'

const rupees = (value) => `₹${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`

function ExploreEvents() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [events, setEvents] = useState([])
  const [categories, setCategories] = useState([])
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const query = searchParams.toString()

  useEffect(() => { let active = true; api.get('/categories').then((response) => { if (active) setCategories(response.data.data || []) }).catch(() => {}); return () => { active = false } }, [])

  useEffect(() => {
    let active = true
    getPublicEvents(Object.fromEntries(searchParams.entries()))
      .then((response) => { if (active) { setEvents(response.data.data); setPagination(response.data.pagination); setError('') } })
      .catch((requestError) => { if (active) setError(requestError.response?.data?.message || 'Unable to load events. Check your connection and try again.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [query])

  function updateFilter(key, value) {
    const next = new URLSearchParams(searchParams)
    if (value) next.set(key, value)
    else next.delete(key)
    next.set('page', '1')
    setSearchParams(next)
  }

  return <main className="explore-page">
    <header className="explore-nav"><Link className="landing-brand" to="/">tickety<span>.</span></Link><div><Link to="/login">Sign in</Link><Link className="button" to="/register">Join Tickety</Link></div></header>
    <section className="explore-heading"><p className="eyebrow">Experiences across India</p><h1>Find your next<br /><em>reason to celebrate.</em></h1><p>Discover gatherings, celebrations, and experiences near you.</p></section>
    <section className="explore-filters" aria-label="Filter public events">
      <input aria-label="Search events and cities" placeholder="Search events, cities, categories..." value={searchParams.get('q') || ''} onChange={(event) => updateFilter('q', event.target.value)} />
      <select aria-label="Filter by category" value={searchParams.get('category') || ''} onChange={(event) => updateFilter('category', event.target.value)}><option value="">All categories</option>{categories.map((category) => <option key={category.slug} value={category.slug}>{category.name}</option>)}</select>
      <input aria-label="Filter by city" placeholder="City, e.g. Hyderabad" value={searchParams.get('city') || ''} onChange={(event) => updateFilter('city', event.target.value)} />
      <input aria-label="Filter by state" placeholder="State" value={searchParams.get('state') || ''} onChange={(event) => updateFilter('state', event.target.value)} />
      <input aria-label="Events from date" type="date" value={searchParams.get('from') || ''} onChange={(event) => updateFilter('from', event.target.value)} />
      <input aria-label="Events through date" type="date" value={searchParams.get('to') || ''} onChange={(event) => updateFilter('to', event.target.value)} />
      <input aria-label="Minimum ticket price" type="number" min="0" placeholder="Min ₹" value={searchParams.get('minPrice') || ''} onChange={(event) => updateFilter('minPrice', event.target.value)} />
      <input aria-label="Maximum ticket price" type="number" min="0" placeholder="Max ₹" value={searchParams.get('maxPrice') || ''} onChange={(event) => updateFilter('maxPrice', event.target.value)} />
      <label className="availability-filter"><input type="checkbox" checked={searchParams.get('available') === 'true'} onChange={(event) => updateFilter('available', event.target.checked ? 'true' : '')} /> Seats available</label>
      <select aria-label="Sort public events" value={searchParams.get('sort') || ''} onChange={(event) => updateFilter('sort', event.target.value)}><option value="">Soonest first</option><option value="date-desc">Latest dates</option><option value="price">Price: low to high</option><option value="price-desc">Price: high to low</option></select>
    </section>
    {error && <p className="form-error" role="alert">{error}</p>}
    {loading ? <div className="explore-loading"><Loader /></div> : events.length ? <section className="public-event-grid" aria-label="Upcoming events">{events.map((event) => <article className="public-event-card" key={event._id}>
      <Link to={`/public/events/${event.publicId}`} className="public-event-image">{event.featuredImage || event.images?.[0] ? <img src={event.featuredImage || event.images[0]} alt={event.title} loading="lazy" /> : <div className="public-event-placeholder"><span>{event.category}</span><strong>{event.title}</strong></div>}<span className="public-event-tag">{event.category?.replaceAll('_', ' ')}</span></Link>
      <div className="public-event-card-body"><p className="public-event-date">{new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' }).format(new Date(event.startDate))}</p><h2><Link to={`/public/events/${event.publicId}`}>{event.title}</Link></h2><p className="public-event-location">{event.venue ? `${event.venue} · ` : ''}{event.city}, {event.state}</p><div className="public-event-pricing"><div><strong>{rupees(event.ticketPrice)}</strong><small>per ticket</small></div><div><strong>{rupees(event.advanceAmount)}</strong><small>advance</small></div></div><Link className="public-event-link" to={`/public/events/${event.publicId}`}>View details <span>→</span></Link></div>
    </article>)}</section> : <section className="explore-empty"><span>✳</span><h2>No upcoming events found</h2><p>Try a different city or category, or check back soon for new experiences.</p><Link className="button" to="/register">Create an account</Link></section>}
    {!loading && events.length > 0 && <Pagination page={pagination.page} totalPages={pagination.totalPages} onChange={(page) => updateFilter('page', String(page))} />}
  </main>
}

export default ExploreEvents
