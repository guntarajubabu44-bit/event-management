function StatusBadge({ status = 'draft' }) {
  return <span className={`status-badge status-${status}`}>{status}</span>
}

export default StatusBadge
