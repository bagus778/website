interface StepThreeProps {
  formData: {
    adminUsername: string
    adminEmail: string
    adminPassword: string
  }
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}

export default function StepThree({ formData, onChange }: StepThreeProps) {
  return (
    <div className="setup-form-section">
      <div className="setup-info-box">
        <p className="setup-info-text">
          <strong>Admin Account:</strong> Create your administrator account to manage the store.
        </p>
      </div>

      <div className="setup-form-field">
        <label className="setup-form-label">
          Admin Username <span className="setup-form-required">*</span>
        </label>
        <input
          type="text"
          name="adminUsername"
          value={formData.adminUsername}
          onChange={onChange}
          placeholder="admin"
          className="setup-form-input"
          required
          minLength={3}
        />
        <p className="setup-form-hint">
          Minimum 3 characters
        </p>
      </div>

      <div className="setup-form-field">
        <label className="setup-form-label">
          Admin Email <span className="setup-form-required">*</span>
        </label>
        <input
          type="email"
          name="adminEmail"
          value={formData.adminEmail}
          onChange={onChange}
          placeholder="admin@example.com"
          className="setup-form-input"
          required
        />
        <p className="setup-form-hint">
          Used for login and notifications
        </p>
      </div>

      <div className="setup-form-field">
        <label className="setup-form-label">
          Admin Password <span className="setup-form-required">*</span>
        </label>
        <input
          type="password"
          name="adminPassword"
          value={formData.adminPassword}
          onChange={onChange}
          placeholder="••••••••"
          className="setup-form-input"
          required
          minLength={6}
        />
        <p className="setup-form-hint">
          Minimum 6 characters
        </p>
      </div>
    </div>
  )
}