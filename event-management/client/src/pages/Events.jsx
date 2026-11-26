import { useEffect, useState } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import EventCard from '../components/EventCard'
import Loader from '../components/Loader'
import Pagination from '../components/Pagination'
import Toast from '../components/Toast'
import { getEvents, searchEvents } from '../services/eventService'
import { eventTypes } from '../data/eventTypes'

const statuses = ['', 'draft', 'published', 'ongoing', 'completed', 'cancelled']
const categories = ['', ...eventTypes.map(([value]) => value)]

function Events() {
  const [searchParams, setSearchParams] = useSearchParams()
  const location = useLocation()
  const [searchInput, setSearchInput] = useState(searchParams.get('q') || '')
  const [events, setEvents] = useState([])
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 })
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState('')

  const queryString = searchParams.toString()

  useEffect(() => {
    if (location.state?.toast) setToast(location.state.toast)
  }, [location.state])

  useEffect(() => {
    const timer = setTimeout(() => {
      const nextParams = new URLSearchParams(searchParams)
      if (searchInput.trim()) nextParams.set('q', searchInput.trim())
      else nextParams.delete('q')
      nextParams.set('page', '1')
      if (nextParams.toString() !== queryString) setSearchParams(nextParams)
    }, 400)
    return () => clearTimeout(timer)
  }, [searchInput, queryString, searchParams, setSearchParams])

  useEffect(() => {
    let active = true
    async function loadEvents() {
      setLoading(true)
      try {
        const params = Object.fromEntries(searchParams.entries())
        const response = params.q ? await searchEvents(params) : await getEvents(params)
        if (active) {
          setEvents(response.data.data)
          setPagination(response.data.pagination)
        }
      } catch (error) {
        if (active) setToast(error.response?.data?.message || 'Unable to load events.')
      } finally {
        if (active) setLoading(false)
      }
    }
    loadEvents()
    return () => { active = false }
  }, [queryString])

  function updateFilter(name, value) {
    const nextParams = new URLSearchParams(searchParams)
    if (value) nextParams.set(name, value)
    else nextParams.delete(name)
    nextParams.set('page', '1')
    setSearchParams(nextParams)
  }

  function changePage(page) {
    updateFilter('page', String(page))
  }

  return (
    <main className="page-shell events-page">
      <div className="page-heading">
        <div><p className="eyebrow">Planning</p><h1>Events</h1></div>
        <Link className="button" to="/events/new">Create event</Link>
      </div>
      <section className="event-toolbar" aria-label="Event filters">
        <input aria-label="Search events" placeholder="Search events..." value={searchInput} onChange={(event) => setSearchInput(event.target.value)} />
        <select aria-label="Filter by status" value={searchParams.get('status') || ''} onChange={(event) => updateFilter('status', event.target.value)}>{statuses.map((status) => <option key={status} value={status}>{status || 'All statuses'}</option>)}</select>
        <select aria-label="Filter by category" value={searchParams.get('category') || ''} onChange={(event) => updateFilter('category', event.target.value)}>{categories.map((category) => <option key={category} value={category}>{category || 'All categories'}</option>)}</select>
        <input aria-label="Filter from date" type="datetime-local" value={searchParams.get('from') || ''} onChange={(event) => updateFilter('from', event.target.value)} />
        <input aria-label="Filter to date" type="datetime-local" value={searchParams.get('to') || ''} onChange={(event) => updateFilter('to', event.target.value)} />
        <select aria-label="Sort events" value={searchParams.get('sort') || '-createdAt'} onChange={(event) => updateFilter('sort', event.target.value)}><option value="-createdAt">Newest</option><option value="startDate">Soonest</option><option value="-startDate">Latest date</option><option value="title">Title A-Z</option></select>
      </section>
      {toast && <Toast message={toast} tone="error" />}
      {loading ? <div className="event-grid">{Array.from({ length: 6 }, (_, index) => <div className="skeleton-card" key={index}><Loader /></div>)}</div> : events.length ? <div className="event-grid">{events.map((event) => <EventCard key={event._id} event={event} />)}</div> : <div className="empty-state"><h2>No events found</h2><p>Try changing the filters or create your first event.</p><Link className="button" to="/events/new">Create event</Link></div>}
      {!loading && events.length > 0 && <Pagination page={pagination.page} totalPages={pagination.totalPages} onChange={changePage} />}
    </main>
  )
}

export default Events
