import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { indianLocations } from '../data/indianLocations'

function Register() {
  const navigate = useNavigate()
  const { register } = useAuth()
  const [form, setForm] = useState({ name: '', email: '', phone: '', state: '', city: '', role: 'customer', password: '', confirmation: '' })
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [approvalPending, setApprovalPending] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
    setErrors((current) => ({ ...current, [event.target.name]: '' }))
    setServerError('')
  }

  function validate() {
    const nextErrors = {}
    if (form.name.trim().length < 2) nextErrors.name = 'Name must be at least 2 characters.'
    if (!/^\S+@\S+\.\S+$/.test(form.email)) nextErrors.email = 'Enter a valid email.'
    if (!/^(?:\+91[-\s]?)?[6-9]\d{9}$/.test(form.phone)) nextErrors.phone = 'Enter a valid 10-digit Indian mobile number.'
    if (!form.state) nextErrors.state = 'Choose your state or union territory.'
    if (!form.city.trim()) nextErrors.city = 'Enter your city or town.'
    if (form.password.length < 8) nextErrors.password = 'Password must be at least 8 characters.'
    if (form.password !== form.confirmation) nextErrors.confirmation = 'Passwords do not match.'
    return nextErrors
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const nextErrors = validate()
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors)
      return
    }

    setSubmitting(true)
    setServerError('')
    try {
      const { confirmation: _confirmation, ...details } = form
      const createdUser = await register({ ...details, name: form.name.trim(), email: form.email.trim().toLowerCase(), phone: form.phone.trim() })
      if (createdUser.role === 'organizer') {
        setApprovalPending(true)
        return
      }
      navigate('/dashboard', { replace: true })
    } catch (error) {
      const fieldErrors = error.response?.data?.errors
      if (Array.isArray(fieldErrors)) setErrors(Object.fromEntries(fieldErrors.map(({ field, message }) => [field, message])))
      setServerError(error.response?.data?.message || (error.request
        ? 'Could not connect to the server. Check your connection and try again.'
        : error.message || 'Unable to create your account. Please try again.'))
    } finally {
      setSubmitting(false)
    }
  }

  if (approvalPending) return <main className="auth-page"><section className="auth-card"><p className="eyebrow">Application received</p><h1>Thanks for joining Tickety.</h1><p className="lede">An administrator needs to approve your organizer account before you can create events or manage bookings. You can sign in after approval.</p><Link className="button form-button" to="/login">Return to sign in</Link></section></main>

  return (
    <main className="auth-page">
      <section className="auth-card">
        <p className="eyebrow">Start planning</p>
        <h1>Create your account</h1>
        <p className="lede">Create an account to discover and manage events across India.</p>
        <form onSubmit={handleSubmit} noValidate>
          <label htmlFor="role">I am joining as</label>
          <select id="role" name="role" value={form.role} onChange={updateField}><option value="customer">Customer</option><option value="organizer">Event organizer</option></select>
          <label htmlFor="name">Full name</label>
          <input id="name" name="name" value={form.name} onChange={updateField} autoComplete="name" />
          {errors.name && <small className="field-error">{errors.name}</small>}
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" value={form.email} onChange={updateField} autoComplete="email" />
          {errors.email && <small className="field-error">{errors.email}</small>}
          <label htmlFor="phone">Mobile number</label>
          <input id="phone" name="phone" type="tel" inputMode="tel" placeholder="98765 43210" value={form.phone} onChange={updateField} autoComplete="tel-national" />
          {errors.phone && <small className="field-error">{errors.phone}</small>}
          <label htmlFor="state">State or union territory</label>
          <select id="state" name="state" value={form.state} onChange={(event) => { updateField(event); setForm((current) => ({ ...current, state: event.target.value, city: '' })) }}><option value="">Choose your state</option>{Object.keys(indianLocations).sort().map((state) => <option key={state} value={state}>{state}</option>)}</select>
          {errors.state && <small className="field-error">{errors.state}</small>}
          <label htmlFor="city">City or town</label>
          <input id="city" name="city" type="text" list="registration-cities" maxLength="80" placeholder={form.state ? 'Type your city or town' : 'Choose a state first'} value={form.city} disabled={!form.state} onChange={updateField} autoComplete="address-level2" />
          <datalist id="registration-cities">{(indianLocations[form.state] || []).map((city) => <option key={city} value={city} />)}</datalist>
          {form.state && <small>Choose a suggestion or enter any city or town in {form.state}.</small>}
          {errors.city && <small className="field-error">{errors.city}</small>}
          <label htmlFor="password">Password</label>
          <input id="password" name="password" type="password" value={form.password} onChange={updateField} autoComplete="new-password" />
          {errors.password && <small className="field-error">{errors.password}</small>}
          <label htmlFor="confirmation">Confirm password</label>
          <input id="confirmation" name="confirmation" type="password" value={form.confirmation} onChange={updateField} autoComplete="new-password" />
          {errors.confirmation && <small className="field-error">{errors.confirmation}</small>}
          {serverError && <p className="form-error" role="alert">{serverError}</p>}
          <button className="button form-button" type="submit" disabled={submitting}>{submitting ? 'Creating account...' : 'Create account'}</button>
        </form>
        <p className="auth-footer">Already registered? <Link className="text-link" to="/login">Sign in</Link></p>
      </section>
    </main>
  )
}

export default Register
