import { useEffect, useState } from 'react'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'

const defaults = { heroKicker: 'YOUR NEXT GREAT EVENT STARTS HERE', heroTitle: 'Plan. Book. Celebrate.', heroSubtitle: 'Discover and book unforgettable events across India. Find your city, choose your moment, and make plans worth looking forward to.', supportEmail: 'support@tickety.app', announcement: '' }

function AdminContent() {
  const { user } = useAuth()
  const [content, setContent] = useState(defaults)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    let active = true
    api.get('/admin/site-content').then((response) => { if (active) setContent({ ...defaults, ...response.data.data }) })
      .catch((requestError) => { if (active) setError(requestError.response?.data?.message || 'Unable to load website content.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  function update(event) { setContent((current) => ({ ...current, [event.target.name]: event.target.value })) }

  async function save(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    setMessage('')
    try {
      const response = await api.put('/admin/site-content', content)
      setContent({ ...defaults, ...response.data.data })
      setMessage(response.data.message || 'Website content saved.')
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to save website content.')
    } finally { setSaving(false) }
  }

  if (user?.role !== 'admin') return <main className="page-shell"><p className="eyebrow">Administrator</p><h1>Access not enabled</h1><p className="lede">Only administrators can change website content.</p></main>
  if (loading) return <main className="page-shell"><p className="eyebrow">Administrator</p><h1>Website content</h1><p>Loading content...</p></main>

  return <main className="page-shell"><p className="eyebrow">Administrator</p><h1>Website content</h1><p className="lede">Edit the public landing page and customer support contact shown on the website.</p>
    <form className="settings-form finance-form" onSubmit={save}><section className="settings-section"><h2>Landing page</h2>
      <div className="form-field"><label htmlFor="hero-kicker">Short heading</label><input id="hero-kicker" name="heroKicker" maxLength={80} minLength={3} required value={content.heroKicker} onChange={update}/></div>
      <div className="form-field"><label htmlFor="hero-title">Main heading</label><input id="hero-title" name="heroTitle" maxLength={100} minLength={3} required value={content.heroTitle} onChange={update}/></div>
      <div className="form-field"><label htmlFor="hero-subtitle">Description</label><textarea id="hero-subtitle" name="heroSubtitle" maxLength={300} minLength={10} rows={4} required value={content.heroSubtitle} onChange={update}/></div>
      <div className="form-field"><label htmlFor="support-email">Support email</label><input id="support-email" name="supportEmail" type="email" required value={content.supportEmail} onChange={update}/></div>
      <div className="form-field"><label htmlFor="announcement">Announcement banner <span>(optional, up to 180 characters)</span></label><input id="announcement" name="announcement" maxLength={180} value={content.announcement} onChange={update}/></div>
    </section>{error && <p className="form-error" role="alert">{error}</p>}{message && <p className="success-message" role="status">{message}</p>}<button className="button form-button" type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save website content'}</button></form>
  </main>
}

export default AdminContent
