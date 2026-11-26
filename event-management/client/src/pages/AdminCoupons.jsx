import { useEffect, useState } from 'react'
import api from '../services/api'

const emptyForm = { code: '', discountType: 'percentage', discountValue: '', minimumAmount: '0', maximumDiscount: '', startsAt: '', expiresAt: '', usageLimit: '0' }
const money = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`

function AdminCoupons() {
  const [coupons, setCoupons] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  async function load() { try { const response = await api.get('/admin/coupons', { params: { limit: 100 } }); setCoupons(response.data.data || []) } catch (requestError) { setError(requestError.response?.data?.message || 'Unable to load coupons.') } }
  useEffect(() => { let active = true; api.get('/admin/coupons', { params: { limit: 100 } }).then((response) => { if (active) setCoupons(response.data.data || []) }).catch((requestError) => { if (active) setError(requestError.response?.data?.message || 'Unable to load coupons.') }); return () => { active = false } }, [])
  async function create(event) {
    event.preventDefault(); setError(''); setMessage('')
    try { await api.post('/admin/coupons', { ...form, code: form.code.toUpperCase(), discountValue: Number(form.discountValue), minimumAmount: Number(form.minimumAmount || 0), maximumDiscount: Number(form.maximumDiscount || 0), usageLimit: Number(form.usageLimit || 0), startsAt: new Date(form.startsAt).toISOString(), expiresAt: new Date(form.expiresAt).toISOString() }); setForm(emptyForm); setMessage('Coupon created.'); await load() }
    catch (requestError) { setError(requestError.response?.data?.message || 'Unable to create coupon.') }
  }
  async function toggle(coupon) { try { await api.put(`/admin/coupons/${coupon._id}`, { active: !coupon.active }); await load() } catch (requestError) { setError(requestError.response?.data?.message || 'Unable to update coupon.') } }
  async function remove(coupon) { if (!window.confirm(`Delete coupon ${coupon.code}?`)) return; try { await api.delete(`/admin/coupons/${coupon._id}`); await load() } catch (requestError) { setError(requestError.response?.data?.message || 'Unable to delete coupon.') } }
  return <main className="page-shell"><p className="eyebrow">Platform promotions</p><h1>Coupons</h1><p className="lede">Create discounts customers can apply while booking an event.</p>
    {error && <p className="form-error" role="alert">{error}</p>}{message && <p className="success-message" role="status">{message}</p>}
    <form className="settings-form" onSubmit={create}><section className="settings-section"><h2>Create a coupon</h2><div className="booking-form-row"><label>Coupon code<input value={form.code} onChange={e=>setForm({...form,code:e.target.value.toUpperCase()})} minLength={3} maxLength={32} pattern="[A-Z0-9_-]+" required /></label><label>Discount type<select value={form.discountType} onChange={e=>setForm({...form,discountType:e.target.value})}><option value="percentage">Percentage</option><option value="fixed">Fixed amount</option></select></label><label>Discount value<input type="number" min="0.01" step="0.01" max={form.discountType==='percentage'?100:undefined} value={form.discountValue} onChange={e=>setForm({...form,discountValue:e.target.value})} required /></label></div><div className="booking-form-row"><label>Minimum order (₹)<input type="number" min="0" step="0.01" value={form.minimumAmount} onChange={e=>setForm({...form,minimumAmount:e.target.value})}/></label><label>Maximum discount (₹, 0 = no cap)<input type="number" min="0" step="0.01" value={form.maximumDiscount} onChange={e=>setForm({...form,maximumDiscount:e.target.value})}/></label><label>Usage limit (0 = unlimited)<input type="number" min="0" step="1" value={form.usageLimit} onChange={e=>setForm({...form,usageLimit:e.target.value})}/></label></div><div className="booking-form-row"><label>Starts<input type="datetime-local" value={form.startsAt} onChange={e=>setForm({...form,startsAt:e.target.value})} required /></label><label>Expires<input type="datetime-local" value={form.expiresAt} onChange={e=>setForm({...form,expiresAt:e.target.value})} required /></label></div><button className="button" type="submit">Create coupon</button></section></form>
    <section className="admin-booking-list"><div className="attendee-table-wrap"><table className="attendee-table"><thead><tr><th>Code</th><th>Discount</th><th>Minimum</th><th>Redemptions</th><th>Validity</th><th>Status</th><th>Actions</th></tr></thead><tbody>{coupons.map(c=><tr key={c._id}><td><strong>{c.code}</strong></td><td>{c.discountType==='percentage'?`${c.discountValue}%`:money(c.discountValue)}{c.maximumDiscount>0&&<small>Maximum {money(c.maximumDiscount)}</small>}</td><td>{money(c.minimumAmount)}</td><td>{c.usedCount}{c.usageLimit?` / ${c.usageLimit}`:' / ∞'}</td><td>{new Date(c.startsAt).toLocaleDateString('en-IN')} – {new Date(c.expiresAt).toLocaleDateString('en-IN')}</td><td>{c.active?'Active':'Inactive'}</td><td><button className="text-link" type="button" onClick={()=>toggle(c)}>{c.active?'Deactivate':'Activate'}</button><button className="danger-button" type="button" onClick={()=>remove(c)}>Delete</button></td></tr>)}</tbody></table></div></section>
  </main>
}

export default AdminCoupons
