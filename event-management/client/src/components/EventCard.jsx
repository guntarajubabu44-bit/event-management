import { Link } from 'react-router-dom'
import StatusBadge from './StatusBadge'

function formatDate(value) {
  return new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

function EventCard({ event }) {
  return (
    <article className="event-card">
      <Link className="event-card-cover" to={`/events/${event._id}`} aria-label={`Open ${event.title}`}>
        {event.featuredImage || event.images?.[0] ? <img src={event.featuredImage || event.images[0]} alt={event.title} loading="lazy" /> : <span className="event-card-cover-placeholder">{event.category?.replaceAll('_', ' ') || 'Your next event'}</span>}
        <span className="event-card-cover-tag">{event.category?.replaceAll('_', ' ') || 'Event'}</span>
      </Link>
      <div className="event-card-body">
        <div className="event-card-top"><p className="event-category">{formatDate(event.startDate)}</p><StatusBadge status={event.status} /></div>
        <h2><Link to={`/events/${event._id}`}>{event.title}</Link></h2>
        <p className="event-meta">{event.city ? `${event.city}${event.state ? `, ${event.state}` : ''}` : event.location}</p>
        <p className="event-description">{event.description || 'Add a description to help guests discover your event.'}</p>
        <div className="event-card-footer"><span>{Number(event.availableSeats ?? event.capacity ?? 0).toLocaleString('en-IN')} seats available</span><Link className="text-link" to={`/events/${event._id}`}>View event <span aria-hidden="true">→</span></Link></div>
      </div>
    </article>
  )
}

export default EventCard
