interface CategoryPillProps {
  label: string
  active?: boolean
  onClick?: () => void
  image?: string
}

export default function CategoryPill({ label, active, onClick, image }: CategoryPillProps) {
  return (
    <button
      onClick={onClick}
      className={`category-pill ${active ? 'category-pill-active' : 'category-pill-inactive'}`}
      aria-pressed={!!active}
    >
      {image ? (
        <img src={image} alt="" className="category-pill-image pixelated" />
      ) : null}
      <span className="category-pill-label">{label}</span>
    </button>
  )
}