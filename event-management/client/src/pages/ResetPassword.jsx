import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { resetPassword } from '../services/authService'

function ResetPassword() {
  const [searchParams] = useSearchParams()
  const [form, setForm] = useState({ password: '', confirmation: '' })
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const token = searchParams.get('token') || ''

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
    setError('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setMessage('')
    if (!token) return setError('This reset link is missing its token.')
    if (form.password.length < 6) return setError('Password must be at least 6 characters.')
    if (form.password !== form.confirmation) return setError('Passwords do not match.')

    setSubmitting(true)
    try {
      const response = await resetPassword({ token, password: form.password })
      setMessage(response.data.message || 'Password reset successfully.')
      setForm({ password: '', confirmation: '' })
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to reset your password. Please request a new link.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <p className="eyebrow">New password</p>
        <h1>Reset your password</h1>
        <p className="lede">Choose a new password for your Gatherly account.</p>
        <form onSubmit={handleSubmit} noValidate>
          <label htmlFor="new-password">New password</label>
          <input id="new-password" name="password" type="password" value={form.password} onChange={updateField} autoComplete="new-password" />
          <label htmlFor="password-confirmation">Confirm password</label>
          <input id="password-confirmation" name="confirmation" type="password" value={form.confirmation} onChange={updateField} autoComplete="new-password" />
          {error && <p className="form-error" role="alert">{error}</p>}
          {message && <p className="success-message" role="status">{message}</p>}
          <button className="button form-button" type="submit" disabled={submitting}>{submitting ? 'Updating...' : 'Update password'}</button>
        </form>
        <p className="auth-footer"><Link className="text-link" to="/login">Back to sign in</Link></p>
      </section>
    </main>
  )
}

export default ResetPassword
