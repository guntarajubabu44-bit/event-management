import Pagination from './Pagination'

function RsvpBadge({ status }) {
  return <span className={`rsvp-badge rsvp-${status}`}>{status}</span>
}

function AttendeeTable({ attendees, pagination, loading, search, rsvpStatus, onSearch, onRsvpChange, onPageChange, onEdit, onDelete, onCheckIn, canCheckIn }) {
  return <section className="attendee-section">
    <div className="attendee-toolbar">
      <input aria-label="Search attendees" placeholder="Search name or email..." value={search} onChange={(event) => onSearch(event.target.value)} />
      <select aria-label="Filter attendees by RSVP" value={rsvpStatus} onChange={(event) => onRsvpChange(event.target.value)}><option value="">All RSVPs</option><option value="invited">invited</option><option value="confirmed">confirmed</option><option value="declined">declined</option></select>
    </div>
    {loading ? <div className="table-loading">Loading attendees...</div> : attendees.length ? <div className="attendee-table-wrap"><table className="attendee-table"><thead><tr><th>Name</th><th>Contact</th><th>RSVP</th><th>Check-in</th><th>Actions</th></tr></thead><tbody>{attendees.map((attendee) => <tr key={attendee._id}><td><strong>{attendee.name}</strong></td><td><span>{attendee.email}</span>{attendee.phone && <small>{attendee.phone}</small>}</td><td><RsvpBadge status={attendee.rsvpStatus} /></td><td><button className="checkin-button" type="button" disabled={!canCheckIn || attendee.rsvpStatus !== 'confirmed'} onClick={() => onCheckIn(attendee)}>{attendee.checkedIn ? 'Checked in' : 'Check in'}</button></td><td><div className="row-actions"><button type="button" onClick={() => onEdit(attendee)}>Edit</button><button type="button" onClick={() => onDelete(attendee)}>Delete</button></div></td></tr>)}</tbody></table></div> : <div className="table-empty">No attendees match these filters.</div>}
    {!loading && attendees.length > 0 && <Pagination page={pagination.page} totalPages={pagination.totalPages} onChange={onPageChange} />}
  </section>
}

export default AttendeeTable
