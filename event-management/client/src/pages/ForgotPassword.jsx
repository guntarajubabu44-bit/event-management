import { useState } from 'react'
import { Link } from 'react-router-dom'
import { forgotPassword, resetPassword } from '../services/authService'

function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)
  const [otp, setOtp] = useState('')
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setMessage('')
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError('Enter a valid email address.')
      return
    }

    setSubmitting(true)
    try {
      const response = await forgotPassword({ email })
      setMessage(response.data.message || 'If that email exists, reset instructions have been sent.')
      setSent(true)
      if (response.data.data?.resetToken) {
        setMessage(`Email delivery is not configured. Development code: ${response.data.data.resetToken}`)
      }
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to send reset instructions. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleReset(event) {
    event.preventDefault()
    setError('')
    if (!/^\d{6}$/.test(otp)) return setError('Enter the 6-digit code from your email.')
    if (password.length < 6) return setError('Password must be at least 6 characters.')
    if (password !== confirmation) return setError('Passwords do not match.')
    setSubmitting(true)
    try {
      const response = await resetPassword({ otp, password })
      setMessage(response.data.message || 'Password reset successfully. You can now sign in.')
      setSent(false)
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to reset your password. Check the code and try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <p className="eyebrow">Account recovery</p>
        <h1>Forgot your password?</h1>
        <p className="lede">{sent ? 'Enter the 6-digit code sent to your email and choose a new password.' : 'Enter your account email and we will send you a 6-digit reset code.'}</p>
        {!sent && <form onSubmit={handleSubmit} noValidate>
          <label htmlFor="recovery-email">Email</label>
          <input id="recovery-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" />
          {error && <p className="form-error" role="alert">{error}</p>}
          {message && <p className="success-message" role="status">{message}</p>}
          <button className="button form-button" type="submit" disabled={submitting}>{submitting ? 'Sending...' : 'Send reset code'}</button>
        </form>}
        {sent && <form onSubmit={handleReset} noValidate>
          <label htmlFor="reset-otp">6-digit code</label>
          <input id="reset-otp" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))} />
          <label htmlFor="new-password">New password</label>
          <input id="new-password" type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} />
          <label htmlFor="confirm-password">Confirm password</label>
          <input id="confirm-password" type="password" autoComplete="new-password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} />
          {error && <p className="form-error" role="alert">{error}</p>}
          {message && <p className="success-message" role="status">{message}</p>}
          <button className="button form-button" type="submit" disabled={submitting}>{submitting ? 'Updating...' : 'Reset password'}</button>
        </form>}
        <p className="auth-footer"><Link className="text-link" to="/login">Back to sign in</Link></p>
      </section>
    </main>
  )
}

export default ForgotPassword
