import React from 'react'

const rsvpStatuses = ['invited', 'confirmed', 'declined']

function AttendeeForm({ initialData = {}, onSubmit, onCancel, submitting = false, errors = {} }) {
  const [name, setName] = React.useState(initialData.name || '')
  const [email, setEmail] = React.useState(initialData.email || '')
  const [phone, setPhone] = React.useState(initialData.phone || '')
  const [rsvpStatus, setRsvpStatus] = React.useState(initialData.rsvpStatus || 'invited')
  const [clientErrors, setClientErrors] = React.useState({})

  function validate() {
    const nextErrors = {}
    if (!name.trim()) nextErrors.name = 'Name is required.'
    if (!/^\S+@\S+\.\S+$/.test(email)) nextErrors.email = 'Enter a valid email.'
    return nextErrors
  }

  function handleSubmit(event) {
    event.preventDefault()
    const nextErrors = validate()
    if (Object.keys(nextErrors).length) {
      setClientErrors(nextErrors)
      return
    }
    onSubmit({ name: name.trim(), email: email.trim(), phone: phone.trim(), rsvpStatus })
  }

  const fieldError = (name) => clientErrors[name] || errors[name]

  return <form className="modal-form" onSubmit={handleSubmit} noValidate>
    <div className="form-field"><label htmlFor="attendee-name">Name</label><input id="attendee-name" value={name} onChange={(event) => setName(event.target.value)} />{fieldError('name') && <small className="field-error">{fieldError('name')}</small>}</div>
    <div className="form-field"><label htmlFor="attendee-email">Email</label><input id="attendee-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />{fieldError('email') && <small className="field-error">{fieldError('email')}</small>}</div>
    <div className="form-field"><label htmlFor="attendee-phone">Phone</label><input id="attendee-phone" value={phone} onChange={(event) => setPhone(event.target.value)} /></div>
    <div className="form-field"><label htmlFor="attendee-rsvp">RSVP</label><select id="attendee-rsvp" value={rsvpStatus} onChange={(event) => setRsvpStatus(event.target.value)}>{rsvpStatuses.map((status) => <option key={status} value={status}>{status}</option>)}</select></div>
    {errors.capacity && <p className="form-error" role="alert">{errors.capacity}</p>}
    <div className="modal-actions"><button className="button" type="submit" disabled={submitting}>{submitting ? 'Saving...' : 'Save attendee'}</button><button className="cancel-button" type="button" onClick={onCancel}>Cancel</button></div>
  </form>
}

export default AttendeeForm
