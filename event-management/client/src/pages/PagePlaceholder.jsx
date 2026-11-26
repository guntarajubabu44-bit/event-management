function PagePlaceholder({ eyebrow, title, description, action }) {
  return (
    <main className="page-shell">
      <p className="eyebrow">{eyebrow}</p>
      <h1>{title}</h1>
      <p className="lede">{description}</p>
      {action}
    </main>
  )
}

export default PagePlaceholder
