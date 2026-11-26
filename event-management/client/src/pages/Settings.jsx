import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { updateMe } from '../services/authService'

const providers = [['upi', 'UPI ID'], ['phonepe', 'PhonePe number or ID'], ['googlepay', 'Google Pay number or ID']]
const blankAccount = { provider: 'upi', label: '', value: '', details: '', enabled: true }

function Settings() {
  const { user, setUser } = useAuth()
  const [phone, setPhone] = useState(user?.phone || '')
  const [accounts, setAccounts] = useState(user?.paymentAccounts || [])
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  function updateAccount(index, field, value) {
    setAccounts((current) => current.map((account, accountIndex) => accountIndex === index ? { ...account, [field]: value } : account))
  }

  async function submit(event) {
    event.preventDefault()
    setMessage('')
    setError('')
    setSaving(true)
    try {
      const response = await updateMe({ phone, ...(user?.role !== 'customer' ? { paymentAccounts: accounts } : {}) })
      setUser(response.data.data)
      setAccounts(response.data.data.paymentAccounts || [])
      setMessage(response.data.message)
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to save settings.')
    } finally { setSaving(false) }
  }

  return (
    <main className="page-shell settings-shell">
      <p className="eyebrow">Account</p>
      <h1>Settings</h1>
      <p className="lede">Keep your contact details current and configure how customers can pay you.</p>
      <form className="settings-form" onSubmit={submit}>
        <section className="settings-section">
          <h2>Contact</h2>
          <div className="form-field"><label htmlFor="settings-phone">Phone number</label><input id="settings-phone" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+91 98765 43210" /></div>
          <p className="settings-note">Signed in as {user?.email}</p>
        </section>
        {user?.role !== 'customer' && <section className="settings-section">
          <div className="section-heading"><h2>Payment accounts</h2><button type="button" className="text-link" onClick={() => setAccounts((current) => [...current, { ...blankAccount }])}>+ Add account</button></div>
          <p className="settings-note">Add at least one UPI ID, PhonePe, or Google Pay account. Customers see these payment instructions after booking. Bank account numbers, passwords, PINs, and OTPs are not accepted here.</p>
          {!accounts.length && <p className="empty-inline">No payment accounts yet.</p>}
          {accounts.map((account, index) => <div className="account-row" key={`${index}-${account.provider}`}>
            <select aria-label="Payment provider" value={account.provider} onChange={(event) => updateAccount(index, 'provider', event.target.value)}>{providers.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
            <input aria-label="Account label" value={account.label || ''} onChange={(event) => updateAccount(index, 'label', event.target.value)} placeholder="Label, e.g. Event Desk" />
            <input aria-label="Account value" value={account.value || ''} onChange={(event) => updateAccount(index, 'value', event.target.value)} placeholder={account.provider === 'upi' ? 'yourname@bank' : 'Phone number or payment ID'} required />
            <input aria-label="Account details" value={account.details || ''} onChange={(event) => updateAccount(index, 'details', event.target.value)} placeholder="Optional payment note" />
            <button type="button" className="danger-button" onClick={() => setAccounts((current) => current.filter((_, accountIndex) => accountIndex !== index))}>Remove</button>
          </div>)}
        </section>}
        {user?.role === 'customer' && <section className="settings-section"><h2>Payment details</h2><p className="settings-note">Payment instructions are provided by each event organizer and appear after you reserve a seat. If you organize events, sign up or sign in with an organizer account to add your UPI details here.</p></section>}
        {message && <p className="success-message">{message}</p>}
        {error && <p className="form-error">{error}</p>}
        <button className="button form-button" type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save settings'}</button>
      </form>
    </main>
  )
}

export default Settings
