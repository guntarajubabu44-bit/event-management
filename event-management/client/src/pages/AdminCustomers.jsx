import { useCallback, useEffect, useState } from 'react'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'

function AdminCustomers() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const [customers, setCustomers] = useState([])
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 })
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const loadCustomers = useCallback(async (page = 1, term = search) => {
    setLoading(true)
    setError('')
    try {
      const response = await api.get('/admin/customers', { params: { page, limit: 20, search: term } })
      setCustomers(response.data.data)
      setPagination(response.data.pagination)
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load customer accounts.')
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => {
    if (isAdmin) loadCustomers(1, search)
  }, [isAdmin, search, loadCustomers])

  if (!isAdmin) {
    return <main className="page-shell"><p className="eyebrow">Administrator</p><h1>Access not enabled</h1><p className="lede">Set your account email as ADMIN_EMAIL on the server and VITE_ADMIN_EMAIL on the client, then sign in again.</p></main>
  }

  function submitSearch(event) {
    event.preventDefault()
    setSearch(searchInput.trim())
  }

  async function toggleCustomer(customer) {
    try {
      const response = await api.patch(`/admin/customers/${customer._id}/status`, { isActive: !customer.isActive })
      setCustomers((current) => current.map((item) => item._id === customer._id ? { ...item, isActive: response.data.data.isActive } : item))
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to update this customer account.')
    }
  }

  return (
    <main className="page-shell">
      <div className="page-heading"><div><p className="eyebrow">Administrator</p><h1>Customer accounts</h1><p className="lede">View customer account contact details and account creation dates.</p></div><span className="status-badge">{pagination.total} accounts</span></div>
      <form className="customer-search" onSubmit={submitSearch}>
        <input aria-label="Search customers" placeholder="Search by name or email" value={searchInput} onChange={(event) => setSearchInput(event.target.value)} />
        <button className="button" type="submit">Search</button>
      </form>
      <p className="settings-note">Customer passwords are encrypted and cannot be viewed. Customers can change a forgotten password from the sign-in page.</p>
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="attendee-table-wrap">
        <table className="attendee-table">
          <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Joined</th><th>Account</th></tr></thead>
          <tbody>
            {loading ? <tr><td colSpan="5">Loading customer accounts…</td></tr> : customers.length ? customers.map((customer) => (
              <tr key={customer._id}><td><strong>{customer.name}</strong><small>{customer.city}{customer.city && customer.state ? ', ' : ''}{customer.state}</small></td><td>{customer.email}</td><td>{customer.phone || '—'}</td><td>{new Date(customer.createdAt).toLocaleDateString('en-IN')}</td><td><button type="button" className={customer.isActive ? 'danger-button' : 'button'} onClick={() => toggleCustomer(customer)}>{customer.isActive ? 'Deactivate' : 'Activate'}</button></td></tr>
            )) : <tr><td colSpan="5">No customer accounts found.</td></tr>}
          </tbody>
        </table>
      </div>
      <div className="admin-pagination"><button type="button" disabled={loading || pagination.page <= 1} onClick={() => loadCustomers(pagination.page - 1)}>Previous</button><span>Page {pagination.page} of {pagination.totalPages}</span><button type="button" disabled={loading || pagination.page >= pagination.totalPages} onClick={() => loadCustomers(pagination.page + 1)}>Next</button></div>
    </main>
  )
}

export default AdminCustomers
