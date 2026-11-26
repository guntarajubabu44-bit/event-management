import { useEffect, useMemo, useState } from 'react'
import { eventTypes } from '../data/eventTypes'
import api from '../services/api'
import { indianLocations } from '../data/indianLocations'

const statuses = ['draft', 'published', 'ongoing', 'completed', 'cancelled']
const blankEvent = { title: '', description: '', category: 'wedding', location: '', venue: '', venues: '', city: '', state: '', startDate: '', endDate: '', unavailableDates: '', capacity: 1, ticketPrice: 0, advanceAmount: 0, advancePercentage: 0, status: 'draft', images: '', imageFiles: [], videos: '', videoFiles: [], packages: [], services: [], featuredImage: '', termsAndConditions: '', cancellationPolicy: '' }
const emptyInitialData = {}

function toInputDate(value) {
  if (!value) return ''
  const date = new Date(value)
  const offset = date.getTimezoneOffset() * 60000
  return new Date(date.getTime() - offset).toISOString().slice(0, 16)
}

function dateOnlyIndia(value) { return value ? new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date(value)) : '' }

function initialForm(data) {
  const price = Number(data.ticketPrice || 0)
  const advancePercentage = price > 0 ? Math.round(Number(data.advanceAmount || 0) / price * 1000) / 10 : 0
  return { ...blankEvent, ...data, advancePercentage, images: Array.isArray(data.images) ? data.images.join('\n') : data.images || '', imageFiles: [], videos: Array.isArray(data.videos) ? data.videos.join('\n') : data.videos || '', videoFiles: [], venues: Array.isArray(data.venues) ? data.venues.filter((venue) => venue !== data.venue).join('\n') : data.venues || '', unavailableDates: Array.isArray(data.unavailableDates) ? data.unavailableDates.map(dateOnlyIndia).join('\n') : '', packages: data.packages || [], services: data.services || [], startDate: toInputDate(data.startDate), endDate: toInputDate(data.endDate) }
}

function EventForm({ initialData = emptyInitialData, onSubmit, submitting = false, errors = {}, statusOptions = statuses }) {
  const [form, setForm] = useState(() => initialForm(initialData))
  const [clientErrors, setClientErrors] = useState({})
  const [categories, setCategories] = useState(eventTypes.map(([slug, name]) => ({ slug, name })))
  const filePreviews = useMemo(() => form.imageFiles.map((file) => ({ name: file.name, url: URL.createObjectURL(file) })), [form.imageFiles])

  useEffect(() => () => filePreviews.forEach((preview) => URL.revokeObjectURL(preview.url)), [filePreviews])
  useEffect(() => { let active = true; api.get('/categories').then((response) => { if (active && response.data.data?.length) setCategories(response.data.data) }).catch(() => {}); return () => { active = false } }, [])
  useEffect(() => setForm(initialForm(initialData)), [initialData])

  function updateField(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value, ...(name === 'state' ? { city: '' } : {}) }))
    setClientErrors((current) => ({ ...current, [name]: '' }))
  }

  function validate() {
    const nextErrors = {}
    if (form.title.trim().length < 3) nextErrors.title = 'Title must be at least 3 characters.'
    if (!form.city.trim()) nextErrors.city = 'Enter the event city or town.'
    if (!form.state) nextErrors.state = 'Choose the event state.'
    if (!form.location.trim()) nextErrors.location = 'Address or location details are required.'
    if (!form.startDate) nextErrors.startDate = 'Start date is required.'
    if (!form.endDate) nextErrors.endDate = 'End date is required.'
    if (form.startDate && form.endDate && new Date(form.endDate) < new Date(form.startDate)) nextErrors.endDate = 'End date must be after the start date.'
    const blockedDates = form.unavailableDates.split('\n').map((date) => date.trim()).filter(Boolean)
    if (blockedDates.length > 365 || blockedDates.some((date) => !/^\d{4}-\d{2}-\d{2}$/.test(date) || date < form.startDate.slice(0, 10) || date > form.endDate.slice(0, 10))) nextErrors.unavailableDates = 'Blocked dates must be valid dates within the event date range (up to 365).'
    if (Number(form.capacity) < 1) nextErrors.capacity = 'Capacity must be at least 1.'
    if (Number(form.ticketPrice) < 0) nextErrors.ticketPrice = 'Total price cannot be negative.'
    if (Number(form.advancePercentage) < 0 || Number(form.advancePercentage) > 100) nextErrors.advancePercentage = 'Advance percentage must be between 0% and 100%.'
    if (form.images.split('\n').map((image) => image.trim()).filter(Boolean).length + form.imageFiles.length > 10) nextErrors.images = 'An event can have up to 10 images.'
    if (form.videos.split('\n').map((video) => video.trim()).filter(Boolean).length + form.videoFiles.length > 5) nextErrors.videos = 'An event can have up to five videos.'
    if (form.videos.split('\n').map((video) => video.trim()).filter(Boolean).some((video) => !/^https?:\/\//i.test(video))) nextErrors.videos = 'Use a valid HTTP or HTTPS video URL.'
    if (form.venues.split('\n').map((venue) => venue.trim()).filter(Boolean).length > 19) nextErrors.venues = 'An event can have up to 20 venue options.'
    if (form.packages.some((item) => !item.name?.trim() || Number(item.price) < 0 || Number(item.advanceAmount || 0) > Number(item.price))) nextErrors.packages = 'Each package needs a name, a valid price, and an advance no greater than the package price.'
    if (form.services.some((item) => !item.name?.trim() || Number(item.price) < 0)) nextErrors.services = 'Each service needs a name and a valid price.'
    return nextErrors
  }

  function handleSubmit(event) {
    event.preventDefault()
    const nextErrors = validate()
    if (Object.keys(nextErrors).length) {
      setClientErrors(nextErrors)
      return
    }
    const images = form.images.split('\n').map((image) => image.trim()).filter(Boolean)
    const videos = form.videos.split('\n').map((video) => video.trim()).filter(Boolean)
    const venues = [...new Set([form.venue.trim(), ...form.venues.split('\n').map((venue) => venue.trim())].filter(Boolean))]
    const status = event.nativeEvent.submitter?.value || form.status
    const unavailableDates = [...new Set(form.unavailableDates.split('\n').map((date) => date.trim()).filter(Boolean))]
    onSubmit({ ...form, status, images, videos, venues, unavailableDates, packages: form.packages.filter((item) => item.name?.trim()).map((item) => ({ ...item, name: item.name.trim(), price: Number(item.price), advanceAmount: Number(item.advanceAmount || 0) })), services: form.services.filter((item) => item.name?.trim()).map((item) => ({ ...item, name: item.name.trim(), price: Number(item.price) })), title: form.title.trim(), city: form.city.trim(), state: form.state.trim(), location: form.location.trim(), capacity: Number(form.capacity), ticketPrice: Number(form.ticketPrice), advanceAmount: Math.round(Number(form.ticketPrice) * Number(form.advancePercentage) / 100 * 100) / 100 })
  }

  const fieldError = (name) => clientErrors[name] || errors[name]

  return (
    <form className="event-form" onSubmit={handleSubmit} noValidate>
      <div className="form-grid">
        <div className="form-field form-field-wide"><label htmlFor="title">Event title</label><input id="title" name="title" maxLength="120" value={form.title} onChange={updateField} />{fieldError('title') && <small className="field-error">{fieldError('title')}</small>}</div>
        <div className="form-field"><label htmlFor="category">Category</label><select id="category" name="category" value={form.category} onChange={updateField}>{categories.map((category) => <option key={category.slug} value={category.slug}>{category.name}</option>)}</select></div>
        <div className="form-field"><label htmlFor="state">State / union territory</label><select id="state" name="state" value={form.state} onChange={updateField}><option value="">Select state</option>{Object.keys(indianLocations).sort().map((state) => <option key={state} value={state}>{state}</option>)}</select>{fieldError('state') && <small className="field-error">{fieldError('state')}</small>}</div>
        <div className="form-field"><label htmlFor="city">City or town</label><input id="city" name="city" type="text" list="event-cities" maxLength="80" placeholder={form.state ? 'Type city or town' : 'Select a state first'} value={form.city} onChange={updateField} disabled={!form.state} autoComplete="address-level2" /><datalist id="event-cities">{(indianLocations[form.state] || []).map((city) => <option key={city} value={city} />)}</datalist><small>Choose a suggestion or enter any town in {form.state || 'the selected state'}.</small>{fieldError('city') && <small className="field-error">{fieldError('city')}</small>}</div>
        <div className="form-field"><label htmlFor="venue">Venue</label><input id="venue" name="venue" maxLength="160" value={form.venue} onChange={updateField} placeholder="Venue or event space" /></div>
        <div className="form-field"><label htmlFor="venues">Other venue options</label><textarea id="venues" name="venues" rows="2" value={form.venues} onChange={updateField} placeholder="One venue per line" /><small>Customers can choose from the primary venue and these options.</small>{fieldError('venues') && <small className="field-error">{fieldError('venues')}</small>}</div>
        <div className="form-field form-field-wide"><label htmlFor="location">Address and location details</label><input id="location" name="location" value={form.location} onChange={updateField} placeholder="Street, area, or online location" />{fieldError('location') && <small className="field-error">{fieldError('location')}</small>}</div>
        <div className="form-field"><label htmlFor="startDate">Date and start time (Indian local time)</label><input id="startDate" name="startDate" type="datetime-local" value={form.startDate} onChange={updateField} />{fieldError('startDate') && <small className="field-error">{fieldError('startDate')}</small>}</div>
        <div className="form-field"><label htmlFor="endDate">Date and end time (Indian local time)</label><input id="endDate" name="endDate" type="datetime-local" value={form.endDate} onChange={updateField} />{fieldError('endDate') && <small className="field-error">{fieldError('endDate')}</small>}</div>
        <div className="form-field form-field-wide"><label htmlFor="unavailableDates">Blocked dates (India date, one per line)</label><textarea id="unavailableDates" name="unavailableDates" rows="3" value={form.unavailableDates} onChange={updateField} placeholder="2026-12-25" /><small>Customers cannot reserve this event on these dates. Dates must fall within the event range.</small>{fieldError('unavailableDates') && <small className="field-error">{fieldError('unavailableDates')}</small>}</div>
        <div className="form-field"><label htmlFor="capacity">Total capacity</label><input id="capacity" name="capacity" type="number" min="1" step="1" value={form.capacity} onChange={updateField} />{fieldError('capacity') && <small className="field-error">{fieldError('capacity')}</small>}</div>
        <div className="form-field"><label htmlFor="ticketPrice">Total price (₹)</label><input id="ticketPrice" name="ticketPrice" type="number" min="0" step="0.01" value={form.ticketPrice} onChange={updateField} />{fieldError('ticketPrice') && <small className="field-error">{fieldError('ticketPrice')}</small>}</div>
        <div className="form-field"><label htmlFor="advancePercentage">Advance percentage (%)</label><input id="advancePercentage" name="advancePercentage" type="number" min="0" max="100" step="0.1" value={form.advancePercentage} onChange={updateField} /><small>Calculated on the base event price. Package-specific advance values can be set below.</small>{fieldError('advancePercentage') && <small className="field-error">{fieldError('advancePercentage')}</small>}</div>
        <div className="form-field form-field-wide"><label htmlFor="description">Description</label><textarea id="description" name="description" rows="4" maxLength="5000" value={form.description} onChange={updateField} /></div>
        <div className="form-field form-field-wide"><label htmlFor="images">Image URLs</label><textarea id="images" name="images" rows="3" value={form.images} onChange={updateField} placeholder="Add one image URL per line" /><small>Paste hosted image URLs or upload images below. Up to 10 event images.</small>{fieldError('images') && <small className="field-error">{fieldError('images')}</small>}</div>
        <div className="form-field form-field-wide"><label htmlFor="imageFiles">Upload event images</label><input id="imageFiles" name="imageFiles" type="file" accept="image/*" multiple onChange={(event) => setForm((current) => ({ ...current, imageFiles: [...current.imageFiles, ...Array.from(event.target.files || [])].slice(0, 10) }))} /><small>Uploads need Cloudinary credentials on the API. JPG, PNG, and WebP up to 8 MB each.</small>{filePreviews.length > 0 && <div className="image-preview-list">{filePreviews.map((preview) => <figure key={`${preview.name}-${preview.url}`}><img src={preview.url} alt={`Preview of ${preview.name}`} /><figcaption>{preview.name}</figcaption></figure>)}</div>}</div>
        <div className="form-field form-field-wide"><label htmlFor="videos">Event video URLs</label><textarea id="videos" name="videos" rows="2" value={form.videos} onChange={updateField} placeholder="Paste an MP4 or WebM URL, one per line" /><small>Up to five hosted video URLs. Or upload MP4/WebM files below with Cloudinary configured.</small>{fieldError('videos') && <small className="field-error">{fieldError('videos')}</small>}</div>
        <div className="form-field form-field-wide"><label htmlFor="videoFiles">Upload event videos</label><input id="videoFiles" name="videoFiles" type="file" accept="video/mp4,video/webm,video/quicktime" multiple onChange={(event) => setForm((current) => ({ ...current, videoFiles: [...current.videoFiles, ...Array.from(event.target.files || [])].slice(0, 5) }))} /><small>Video uploads need Cloudinary and are limited to 80 MB each. {form.videoFiles.map((file) => file.name).join(', ')}</small></div>
        <div className="form-field form-field-wide"><div className="section-heading"><h2>Packages</h2><button type="button" className="text-link" onClick={() => setForm((current) => ({ ...current, packages: [...current.packages, { name: '', description: '', price: 0, advanceAmount: 0 }] }))}>+ Add package</button></div><small>Customers choose one package. If none are added, the standard event price is used.</small>{form.packages.map((item, index) => <div className="event-option-row" key={item._id || `package-${index}`}><input aria-label={`Package ${index + 1} name`} value={item.name || ''} onChange={(event) => setForm((current) => ({ ...current, packages: current.packages.map((entry, row) => row === index ? { ...entry, name: event.target.value } : entry) }))} placeholder="Package name" /><input aria-label={`Package ${index + 1} price`} type="number" min="0" value={item.price ?? 0} onChange={(event) => setForm((current) => ({ ...current, packages: current.packages.map((entry, row) => row === index ? { ...entry, price: event.target.value } : entry) }))} placeholder="Price per guest" /><input aria-label={`Package ${index + 1} advance`} type="number" min="0" value={item.advanceAmount ?? 0} onChange={(event) => setForm((current) => ({ ...current, packages: current.packages.map((entry, row) => row === index ? { ...entry, advanceAmount: event.target.value } : entry) }))} placeholder="Advance per guest" /><input aria-label={`Package ${index + 1} description`} value={item.description || ''} onChange={(event) => setForm((current) => ({ ...current, packages: current.packages.map((entry, row) => row === index ? { ...entry, description: event.target.value } : entry) }))} placeholder="What is included?" /><button type="button" className="danger-button" onClick={() => setForm((current) => ({ ...current, packages: current.packages.filter((_, row) => row !== index) }))}>Remove</button></div>)}{fieldError('packages') && <small className="field-error">{fieldError('packages')}</small>}</div>
        <div className="form-field form-field-wide"><div className="section-heading"><h2>Add-on services</h2><button type="button" className="text-link" onClick={() => setForm((current) => ({ ...current, services: [...current.services, { name: '', description: '', price: 0 }] }))}>+ Add service</button></div><small>Optional services are priced per guest and added to the booking total.</small>{form.services.map((item, index) => <div className="event-option-row" key={item._id || `service-${index}`}><input aria-label={`Service ${index + 1} name`} value={item.name || ''} onChange={(event) => setForm((current) => ({ ...current, services: current.services.map((entry, row) => row === index ? { ...entry, name: event.target.value } : entry) }))} placeholder="Service name" /><input aria-label={`Service ${index + 1} price`} type="number" min="0" value={item.price ?? 0} onChange={(event) => setForm((current) => ({ ...current, services: current.services.map((entry, row) => row === index ? { ...entry, price: event.target.value } : entry) }))} placeholder="Price per guest" /><input aria-label={`Service ${index + 1} description`} value={item.description || ''} onChange={(event) => setForm((current) => ({ ...current, services: current.services.map((entry, row) => row === index ? { ...entry, description: event.target.value } : entry) }))} placeholder="Service details" /><button type="button" className="danger-button" onClick={() => setForm((current) => ({ ...current, services: current.services.filter((_, row) => row !== index) }))}>Remove</button></div>)}{fieldError('services') && <small className="field-error">{fieldError('services')}</small>}</div>
        <div className="form-field form-field-wide"><label htmlFor="termsAndConditions">Terms and conditions</label><textarea id="termsAndConditions" name="termsAndConditions" rows="3" maxLength="5000" value={form.termsAndConditions} onChange={updateField} /></div>
        <div className="form-field form-field-wide"><label htmlFor="cancellationPolicy">Cancellation policy</label><textarea id="cancellationPolicy" name="cancellationPolicy" rows="3" maxLength="3000" value={form.cancellationPolicy} onChange={updateField} placeholder="Explain cancellation deadlines, fees, and refund rules." /></div>
      </div>
      {initialData._id ? <button className="button form-button" type="submit" value={form.status} disabled={submitting}>{submitting ? 'Saving...' : 'Update event'}</button> : <div className="event-form-actions"><button className="button secondary-button" type="submit" value="draft" disabled={submitting}>{submitting ? 'Saving...' : 'Save Draft'}</button><button className="button form-button" type="submit" value="published" disabled={submitting}>{submitting ? 'Saving...' : 'Publish event'}</button></div>}
    </form>
  )
}

export default EventForm
