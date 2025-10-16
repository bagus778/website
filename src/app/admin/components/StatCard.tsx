interface StatCardProps {
  label: string
  value: string | number
  hint?: string
  icon: string
}

export default function StatCard({ label, value, hint, icon }: StatCardProps) {
  return (
    <div className="admin-stat-card">
      <div className="admin-stat-card-content">
        <div className="admin-stat-card-info">
          <p className="admin-stat-card-label">{label}</p>
          <p className="admin-stat-card-value">{value}</p>
          {hint && <p className="admin-form-hint">{hint}</p>}
        </div>
        <div className="admin-stat-card-icon admin-stat-card-icon-blue">
          <span className="admin-stat-card-icon-text">{icon}</span>
        </div>
      </div>
    </div>
  )
}