import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import EventForm from '../components/EventForm'
import Toast from '../components/Toast'
import { createEvent, uploadEventImages, uploadEventVideos } from '../services/eventService'

function EventCreate() {
  const navigate = useNavigate()
  const [errors, setErrors] = useState({})
  const [toast, setToast] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(values) {
    setSubmitting(true)
    setErrors({})
    try {
      const { imageFiles, videoFiles, ...eventValues } = values
      const response = await createEvent(eventValues)
      if (imageFiles?.length) {
        try {
          await uploadEventImages(response.data.data._id, imageFiles)
        } catch (uploadError) {
          setToast(uploadError.response?.data?.message || 'Event saved. Image upload was skipped because Cloudinary is not configured.')
        }
      }
      if (videoFiles?.length) {
        try { await uploadEventVideos(response.data.data._id, videoFiles) }
        catch (uploadError) { setToast(uploadError.response?.data?.message || 'Event saved. Video upload could not be completed.') }
      }
      navigate(`/events/${response.data.data._id}`, { state: { toast: response.data.message || 'Event created successfully.' } })
    } catch (error) {
      const fieldErrors = Object.fromEntries((error.response?.data?.errors || []).map((item) => [item.field, item.message]))
      setErrors(fieldErrors)
      setToast(error.response?.data?.message || 'Unable to create event.')
    } finally {
      setSubmitting(false)
    }
  }

  return <main className="page-shell"><p className="eyebrow">New event</p><h1>Create an event</h1><p className="lede">Give your gathering a clear shape.</p>{toast && <Toast message={toast} tone="error" />}<EventForm onSubmit={handleSubmit} submitting={submitting} errors={errors} /></main>
}

export default EventCreate
