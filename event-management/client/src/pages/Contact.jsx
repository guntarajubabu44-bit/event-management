import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'

const emptyForm = { name: '', email: '', phone: '', subject: '', message: '', kind: 'inquiry' }

function Contact() {
  const [form, setForm] = useState(emptyForm)
  const [supportEmail, setSupportEmail] = useState('support@tickety.app')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    api.get('/public/site-content').then((response) => {
      if (response.data.data?.supportEmail) setSupportEmail(response.data.data.supportEmail)
    }).catch(() => {})
  }, [])

  function update(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  async function submit(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    setSuccess('')
    try {
      const response = await api.post('/contact', form)
      setSuccess(response.data.message)
      setForm(emptyForm)
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'We could not send your message. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return <main className="public-info-page">
    <header className="explore-nav"><Link className="landing-brand" to="/">tickety<span>.</span></Link><nav><Link to="/explore">Explore events</Link><Link to="/about">About</Link></nav></header>
    <section className="contact-layout">
      <div className="contact-copy"><p className="eyebrow">We’re listening</p><h1>Let’s talk<br/><em>about it.</em></h1><p>Questions about an event or your Tickety account? Send us a note and we’ll get back to you.</p><div className="contact-details"><a href={`mailto:${supportEmail}`}>{supportEmail}</a><span>India · Online support</span></div></div>
      <form className="contact-form" onSubmit={submit}>
        <label>Message type<select name="kind" value={form.kind} onChange={update}><option value="inquiry">General inquiry</option><option value="complaint">Complaint</option></select></label>
        <label>Name<input name="name" autoComplete="name" required minLength={2} maxLength={80} value={form.name} onChange={update}/></label>
        <label>Email<input name="email" type="email" autoComplete="email" required value={form.email} onChange={update}/></label>
        <label>Mobile number <span>(optional)</span><input name="phone" autoComplete="tel" value={form.phone} onChange={update} placeholder="+91 98765 43210"/></label>
        <label>Subject<input name="subject" required minLength={3} maxLength={120} value={form.subject} onChange={update}/></label>
        <label>Message<textarea name="message" required minLength={10} maxLength={3000} rows={5} value={form.message} onChange={update}/></label>
        {error && <p className="form-error" role="alert">{error}</p>}{success && <p className="success-message" role="status">{success}</p>}
        <button className="button" type="submit" disabled={busy}>{busy ? 'Sending…' : form.kind === 'complaint' ? 'Submit complaint' : 'Send message'}</button>
      </form>
    </section>
    <footer className="public-footer"><Link className="landing-brand" to="/">tickety<span>.</span></Link><span>Plan. Book. Celebrate.</span><div><Link to="/explore">Events</Link><Link to="/about">About</Link></div></footer>
  </main>
}

export default Contact
