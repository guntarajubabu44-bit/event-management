import { useEffect, useState } from 'react'
import api from '../services/api'
import { getDashboardStats } from '../services/statsService'
import { useAuth } from '../context/AuthContext'

const money = (amount) => `₹${Number(amount || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`

function AdminFinance() {
  const { user } = useAuth()
  const [commission, setCommission] = useState('0')
  const [stats, setStats] = useState({ revenue: 0, platformCommission: 0, pendingRevenue: 0 })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    let active = true
    Promise.all([api.get('/admin/finance/settings'), getDashboardStats()]).then(([settings, dashboard]) => {
      if (!active) return
      setCommission(String(settings.data.data.commissionPercent ?? 0))
      setStats((current) => ({ ...current, ...dashboard.data.data }))
    }).catch((requestError) => { if (active) setError(requestError.response?.data?.message || 'Unable to load finance settings.') }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  async function save(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    setMessage('')
    try {
      const response = await api.put('/admin/finance/settings', { commissionPercent: Number(commission) })
      setCommission(String(response.data.data.commissionPercent))
      setMessage(response.data.message)
    } catch (requestError) { setError(requestError.response?.data?.message || 'Unable to save commission settings.') }
    finally { setSaving(false) }
  }

  if (user?.role !== 'admin') return <main className="page-shell"><p className="eyebrow">Administrator</p><h1>Access not enabled</h1><p className="lede">Only administrators can manage platform finance settings.</p></main>
  if (loading) return <main className="page-shell"><p className="eyebrow">Administrator</p><h1>Finance</h1><p>Loading finance details...</p></main>

  return <main className="page-shell"><p className="eyebrow">Administrator</p><h1>Platform finance</h1><p className="lede">Review verified payments and manage the commission rate applied to new verified transactions.</p>
    <section className="customer-metrics finance-metrics"><article><span>Verified payment volume</span><strong>{money(stats.revenue)}</strong></article><article><span>Platform commission earned</span><strong>{money(stats.platformCommission)}</strong></article><article><span>Pending booking balance</span><strong>{money(stats.pendingRevenue)}</strong></article></section>
    <form className="settings-form finance-form" onSubmit={save}><section className="settings-section"><h2>Commission settings</h2><p className="settings-note">The rate is saved for future payment verifications. Previously verified payments keep their recorded commission.</p><div className="form-field"><label htmlFor="commission-percent">Platform commission (%)</label><input id="commission-percent" type="number" min="0" max="50" step="0.1" value={commission} onChange={(event) => setCommission(event.target.value)} required /></div></section>{error && <p className="form-error" role="alert">{error}</p>}{message && <p className="success-message" role="status">{message}</p>}<button className="button form-button" type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save finance settings'}</button></form>
  </main>
}

export default AdminFinance
