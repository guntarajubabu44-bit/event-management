function Pagination({ page = 1, totalPages = 1, onChange }) {
  return (
    <div className="pagination" aria-label="Pagination">
      <button type="button" disabled={page <= 1} onClick={() => onChange(page - 1)}>Previous</button>
      <span>Page {page} of {totalPages}</span>
      <button type="button" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>Next</button>
    </div>
  )
}

export default Pagination
