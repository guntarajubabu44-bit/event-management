import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import AttendeeForm from '../components/AttendeeForm'
import AttendeeTable from '../components/AttendeeTable'
import Loader from '../components/Loader'
import StatusBadge from '../components/StatusBadge'
import Toast from '../components/Toast'
import { addAttendee, deleteAttendee, getAttendees, toggleCheckIn, updateAttendee } from '../services/attendeeService'
import { deleteEvent, getEvent, updateEventStatus } from '../services/eventService'

const transitions = { draft: ['published', 'cancelled'], published: ['ongoing', 'cancelled'], ongoing: ['completed', 'cancelled'], completed: [], cancelled: [] }

function EventDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [event, setEvent] = useState(null)
  const [toast, setToast] = useState(location.state?.toast || '')
  const [loading, setLoading] = useState(true)
  const [attendees, setAttendees] = useState([])
  const [attendeePagination, setAttendeePagination] = useState({ page: 1, totalPages: 1 })
  const [attendeePage, setAttendeePage] = useState(1)
  const [attendeeSearch, setAttendeeSearch] = useState('')
  const [attendeeRsvp, setAttendeeRsvp] = useState('')
  const [attendeeLoading, setAttendeeLoading] = useState(true)
  const [capacityUsed, setCapacityUsed] = useState(0)
  const [attendeeModal, setAttendeeModal] = useState(null)
  const [attendeeErrors, setAttendeeErrors] = useState({})
  const [attendeeSubmitting, setAttendeeSubmitting] = useState(false)
  const attendeeRequestRef = useRef(0)

  useEffect(() => {
    getEvent(id).then((response) => setEvent(response.data.data)).catch((error) => setToast(error.response?.data?.message || 'Unable to load event.')).finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    const timer = setTimeout(() => {
      setAttendeePage(1)
      loadAttendees(1, attendeeSearch, attendeeRsvp)
    }, 400)
    return () => clearTimeout(timer)
  }, [attendeeSearch, attendeeRsvp])

  useEffect(() => {
    loadAttendees(attendeePage, attendeeSearch, attendeeRsvp)
  }, [id, attendeePage])

  async function loadAttendees(page, search = attendeeSearch, rsvpStatus = attendeeRsvp) {
    const requestId = ++attendeeRequestRef.current
    setAttendeeLoading(true)
    try {
      const params = { page, limit: 10 }
      if (search.trim()) params.q = search.trim()
      if (rsvpStatus) params.rsvpStatus = rsvpStatus
      const response = await getAttendees(id, params)
      if (requestId !== attendeeRequestRef.current) return
      setAttendees(response.data.data)
      setAttendeePagination(response.data.pagination)
      const capacityResponse = await getAttendees(id, { page: 1, limit: 50 })
      if (requestId !== attendeeRequestRef.current) return
      setCapacityUsed(capacityResponse.data.data.filter((item) => ['invited', 'confirmed'].includes(item.rsvpStatus)).length)
    } catch (error) {
      if (requestId === attendeeRequestRef.current) setToast(error.response?.data?.message || 'Unable to load attendees.')
    } finally {
      if (requestId === attendeeRequestRef.current) setAttendeeLoading(false)
    }
  }

  async function changeStatus(status) {
    try {
      const response = await updateEventStatus(id, status)
      setEvent(response.data.data)
      setToast(response.data.message || 'Event status updated.')
    } catch (error) {
      setToast(error.response?.data?.message || 'Unable to update status.')
    }
  }

  async function removeEvent() {
    if (!window.confirm('Delete this event and its attendee list?')) return
    try {
      const response = await deleteEvent(id)
      navigate('/events', { replace: true, state: { toast: response.data.message || 'Event deleted successfully.' } })
    } catch (error) {
      setToast(error.response?.data?.message || 'Unable to delete event.')
    }
  }

  function openAttendeeModal(attendee = null) {
    setAttendeeErrors({})
    setAttendeeModal(attendee || {})
  }

  function closeAttendeeModal() {
    setAttendeeModal(null)
    setAttendeeErrors({})
  }

  async function saveAttendee(values) {
    setAttendeeSubmitting(true)
    setAttendeeErrors({})
    try {
      if (attendeeModal?._id) {
        await updateAttendee(attendeeModal._id, values)
        setToast('Attendee updated successfully.')
      } else {
        await addAttendee(id, values)
        setToast('Attendee added successfully.')
      }
      closeAttendeeModal()
      await loadAttendees(attendeePage, attendeeSearch, attendeeRsvp)
    } catch (error) {
      const apiErrors = Object.fromEntries((error.response?.data?.errors || []).map((item) => [item.field, item.message]))
      setAttendeeErrors(apiErrors)
      setToast(error.response?.data?.message || 'Unable to save attendee.')
    } finally {
      setAttendeeSubmitting(false)
    }
  }

  async function removeAttendee(attendee) {
    if (!window.confirm(`Remove ${attendee.name} from this event?`)) return
    try {
      await deleteAttendee(attendee._id)
      setToast('Attendee deleted successfully.')
      await loadAttendees(attendeePage, attendeeSearch, attendeeRsvp)
    } catch (error) {
      setToast(error.response?.data?.message || 'Unable to delete attendee.')
    }
  }

  async function checkIn(attendee) {
    try {
      await toggleCheckIn(attendee._id)
      setToast(attendee.checkedIn ? 'Attendee checked out.' : 'Attendee checked in.')
      await loadAttendees(attendeePage, attendeeSearch, attendeeRsvp)
    } catch (error) {
      setToast(error.response?.data?.message || 'Unable to update check-in.')
    }
  }

  if (loading) return <main className="route-loader"><Loader /></main>
  if (!event) return <main className="page-shell"><Toast message={toast} tone="error" /></main>

  return <main className="page-shell detail-page"><Link className="back-link" to="/events">Back to events</Link><div className="detail-heading"><div><p className="eyebrow">{event.category}</p><h1>{event.title}</h1></div><StatusBadge status={event.status} /></div><p className="lede">{event.description || 'No description yet.'}</p><div className="detail-grid"><div><strong>When</strong><p>{new Date(event.startDate).toLocaleString()} - {new Date(event.endDate).toLocaleString()}</p></div><div><strong>Where</strong><p>{event.location}</p></div><div><strong>Capacity</strong><p>{capacityUsed} / {event.capacity} seats</p></div><div><strong>Ticket price</strong><p>{event.ticketPrice}</p></div></div><section className="detail-actions"><label htmlFor="status-change">Change status</label><select id="status-change" value="" onChange={(eventChange) => eventChange.target.value && changeStatus(eventChange.target.value)} disabled={!transitions[event.status].length}><option value="">{transitions[event.status].length ? 'Choose next status' : 'Final status'}</option>{transitions[event.status].map((status) => <option key={status} value={status}>{status}</option>)}</select><Link className="button" to={`/events/${id}/edit`}>Edit event</Link><button className="danger-button" type="button" onClick={removeEvent}>Delete event</button></section><section className="attendees-panel"><div className="section-heading"><div><p className="eyebrow">Guest list</p><h2>Attendees</h2></div><button className="button" type="button" disabled={capacityUsed >= event.capacity} onClick={() => openAttendeeModal()}>{capacityUsed >= event.capacity ? 'Capacity full' : 'Add attendee'}</button></div><AttendeeTable attendees={attendees} pagination={attendeePagination} loading={attendeeLoading} search={attendeeSearch} rsvpStatus={attendeeRsvp} onSearch={setAttendeeSearch} onRsvpChange={(value) => { setAttendeeRsvp(value); setAttendeePage(1) }} onPageChange={setAttendeePage} onEdit={openAttendeeModal} onDelete={removeAttendee} onCheckIn={checkIn} canCheckIn={['published', 'ongoing'].includes(event.status)} /></section>{toast && <Toast message={toast} />}{attendeeModal && <div className="modal-backdrop"><div className="modal" role="dialog" aria-modal="true" aria-labelledby="attendee-modal-title"><h2 id="attendee-modal-title">{attendeeModal._id ? 'Edit attendee' : 'Add attendee'}</h2><AttendeeForm initialData={attendeeModal} onSubmit={saveAttendee} onCancel={closeAttendeeModal} submitting={attendeeSubmitting} errors={attendeeErrors} /></div></div>}</main>
}

export default EventDetails
