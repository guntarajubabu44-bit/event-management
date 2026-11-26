import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { requestLoginOtp } from '../services/authService'

function requestErrorMessage(error, fallback) {
  if (error.response?.status === 429) {
    const retryAfter = Number(error.response.headers?.['retry-after'])
    return retryAfter > 0 ? `Too many code requests. Try again in ${retryAfter} seconds.` : 'Too many code requests. Please wait before trying again.'
  }
  return error.response?.data?.message || fallback
}

function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { loginWithOtp } = useAuth()
  const [channel, setChannel] = useState('email')
  const [identifier, setIdentifier] = useState('')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState('request')
  const [rememberMe, setRememberMe] = useState(false)
  const [serverError, setServerError] = useState('')
  const [statusMessage, setStatusMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function changeChannel(nextChannel) {
    setChannel(nextChannel)
    setIdentifier('')
    setOtp('')
    setServerError('')
    setStatusMessage('')
  }

  function validateIdentifier() {
    if (channel === 'email') return /^\S+@\S+\.\S+$/.test(identifier.trim()) ? '' : 'Enter a valid email address.'
    return /^(?:\+?91[-\s]?)?[6-9]\d{9}$/.test(identifier.trim()) ? '' : 'Enter a valid 10-digit Indian mobile number.'
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setServerError('')
    setStatusMessage('')
    if (step === 'request') {
      const validationMessage = validateIdentifier()
      if (validationMessage) {
        setServerError(validationMessage)
        return
      }
    }

    setSubmitting(true)
    try {
      if (step === 'request') {
        const response = await requestLoginOtp({ channel, identifier: identifier.trim() })
        setStep('verify')
        const developmentOtp = response.data.data?.developmentOtp
        setOtp(developmentOtp || '')
        setStatusMessage(developmentOtp ? `${response.data.message} Code: ${developmentOtp}` : (response.data.message || `If an account matches, a code was sent by ${channel}.`))
      } else {
        await loginWithOtp({ channel, identifier: identifier.trim(), otp }, rememberMe)
        navigate(location.state?.from?.pathname || '/dashboard', { replace: true })
      }
    } catch (error) {
      setServerError(requestErrorMessage(error, 'Unable to sign in. Please try again.'))
    } finally {
      setSubmitting(false)
    }
  }

  async function resendCode() {
    setSubmitting(true)
    setServerError('')
    setStatusMessage('')
    try {
      const response = await requestLoginOtp({ channel, identifier: identifier.trim() })
      const developmentOtp = response.data.data?.developmentOtp
      setStatusMessage(developmentOtp ? `${response.data.message} Code: ${developmentOtp}` : (response.data.message || `If an account matches, a new code was sent by ${channel}.`))
    } catch (error) {
      setServerError(requestErrorMessage(error, 'Unable to send a new code. Please try again.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <p className="eyebrow">Welcome back</p>
        <h1>Sign in</h1>
        <p className="lede">Get a one-time sign-in code by email or phone.</p>
        <form onSubmit={handleSubmit} noValidate>
          <div className="login-channel-switch" role="group" aria-label="Choose where to receive your code">
            <button type="button" className={channel === 'email' ? 'active' : ''} aria-pressed={channel === 'email'} disabled={step === 'verify'} onClick={() => changeChannel('email')}>Email OTP</button>
            <button type="button" className={channel === 'phone' ? 'active' : ''} aria-pressed={channel === 'phone'} disabled={step === 'verify'} onClick={() => changeChannel('phone')}>Phone OTP</button>
          </div>
          {step === 'request' ? <>
            <label htmlFor="identifier">{channel === 'email' ? 'Email address' : 'Mobile number'}</label>
            <input id="identifier" name="identifier" type={channel === 'email' ? 'email' : 'tel'} inputMode={channel === 'email' ? 'email' : 'tel'} placeholder={channel === 'email' ? 'you@example.com' : '98765 43210'} value={identifier} onChange={(event) => { setIdentifier(event.target.value); setServerError('') }} autoComplete={channel === 'email' ? 'email' : 'tel-national'} />
          </> : <>
            <label htmlFor="otp">Six-digit code</label>
            <input id="otp" name="otp" type="text" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} autoComplete="one-time-code" placeholder="000000" value={otp} onChange={(event) => { setOtp(event.target.value.replace(/\D/g, '').slice(0, 6)); setServerError('') }} />
            <p className="login-destination">Code sent to {identifier}</p>
          </>}
          <label className="remember-option"><input name="rememberMe" type="checkbox" checked={rememberMe} onChange={(event) => setRememberMe(event.target.checked)} /> Remember me on this device</label>
          <Link className="text-link auth-recovery-link" to="/forgot-password">Forgot your password?</Link>
          {serverError && <p className="form-error" role="alert">{serverError}</p>}
          {statusMessage && <p className="login-status" role="status">{statusMessage}</p>}
          <button className="button form-button" type="submit" disabled={submitting || (step === 'verify' && otp.length !== 6)}>{submitting ? (step === 'request' ? 'Sending code...' : 'Verifying...') : (step === 'request' ? 'Send sign-in code' : 'Verify and sign in')}</button>
        </form>
        {step === 'verify' && <div className="login-code-actions"><button type="button" className="text-link" disabled={submitting} onClick={resendCode}>Resend code</button><button type="button" className="text-link" disabled={submitting} onClick={() => { setStep('request'); setOtp(''); setStatusMessage(''); setServerError('') }}>Change {channel === 'email' ? 'email' : 'number'}</button></div>}
        <p className="auth-footer">New here? <Link className="text-link" to="/register">Create an account</Link></p>
      </section>
    </main>
  )
}

export default Login
