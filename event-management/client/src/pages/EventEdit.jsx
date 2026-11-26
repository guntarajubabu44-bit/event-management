import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import EventForm from '../components/EventForm'
import Loader from '../components/Loader'
import Toast from '../components/Toast'
import { getEvent, updateEvent, uploadEventImages, uploadEventVideos } from '../services/eventService'

function EventEdit() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [event, setEvent] = useState(null)
  const [errors, setErrors] = useState({})
  const [toast, setToast] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    getEvent(id).then((response) => setEvent(response.data.data)).catch((error) => setToast(error.response?.data?.message || 'Unable to load event.'))
  }, [id])

  async function handleSubmit(values) {
    setSubmitting(true)
    setErrors({})
    try {
      const { imageFiles, videoFiles, ...eventValues } = values
      await updateEvent(id, eventValues)
      if (imageFiles?.length) {
        try {
          await uploadEventImages(id, imageFiles)
        } catch (uploadError) {
          setToast(uploadError.response?.data?.message || 'Event saved. Image upload was skipped because Cloudinary is not configured.')
        }
      }
      if (videoFiles?.length) {
        try { await uploadEventVideos(id, videoFiles) }
        catch (uploadError) { setToast(uploadError.response?.data?.message || 'Event saved. Video upload could not be completed.') }
      }
      navigate(`/events/${id}`, { state: { toast: 'Event updated successfully.' } })
    } catch (error) {
      setErrors(Object.fromEntries((error.response?.data?.errors || []).map((item) => [item.field, item.message])))
      setToast(error.response?.data?.message || 'Unable to update event.')
    } finally {
      setSubmitting(false)
    }
  }

  if (!event) return <main className="route-loader"><Loader /></main>
  return <main className="page-shell"><p className="eyebrow">Edit event</p><h1>Refine {event.title}</h1>{toast && <Toast message={toast} tone="error" />}<EventForm initialData={event} statusOptions={[event.status]} onSubmit={handleSubmit} submitting={submitting} errors={errors} /></main>
}

export default EventEdit
