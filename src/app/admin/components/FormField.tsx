import { ReactNode } from 'react'

interface FormFieldProps {
  label: string
  error?: string
  required?: boolean
  hint?: string
  children: ReactNode
}

export default function FormField({ label, error, required, hint, children }: FormFieldProps) {
  return (
    <div className="admin-form-field">
      <label className="admin-form-label">
        {label}
        {required && <span className="admin-form-label-required">*</span>}
      </label>
      {children}
      {hint && !error && <p className="admin-form-hint">{hint}</p>}
      {error && <p className="admin-form-error">{error}</p>}
    </div>
  )
}