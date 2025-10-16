'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Inter } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

function LoginForm() {
  const searchParams = useSearchParams()
  const next = searchParams?.get('next') || '/admin'

  const [formData, setFormData] = useState({ username: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((s) => ({ ...s, [name]: value }))
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.username || !formData.password) {
      setError('Please fill in both fields.')
      return
    }
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(formData),
        credentials: 'include',
        cache: 'no-store',
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        throw new Error(data?.message || 'Invalid username or password')
      }

      window.location.href = next
    } catch (err: any) {
      setError(err?.message || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`admin-login-container ${inter.variable}`} style={{ fontFamily: 'var(--font-inter), system-ui, sans-serif' }}>
      <div className="admin-login-card">
        {/* Decorative */}
        <div className="admin-login-decorative" />

        <div className="admin-login-content">
          <div className="admin-login-header">
            <div className="admin-login-logo">
              A
            </div>
            <h1 className="admin-login-title">Admin Panel</h1>
            <p className="admin-login-subtitle">Sign in to access the admin panel</p>
          </div>

          {error ? (
            <div className="admin-login-error" role="alert">
              {error}
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="admin-login-form" noValidate>
            <div className="admin-login-form-field">
              <label htmlFor="username" className="admin-login-form-label">
                Username
              </label>
              <div className="admin-login-form-input-wrapper">
                <input
                  id="username"
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  autoComplete="username"
                  required
                  className="admin-login-form-input"
                  aria-invalid={!!error}
                />
                <svg className="admin-login-form-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
            </div>

            <div className="admin-login-form-field">
              <label htmlFor="password" className="admin-login-form-label">
                Password
              </label>
              <div className="admin-login-form-input-wrapper">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  autoComplete="current-password"
                  required
                  className="admin-login-form-input admin-login-form-input-with-button"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="admin-login-form-toggle-button"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <div className="admin-login-form-options">
              <label className="admin-login-form-remember">
                <input type="checkbox" className="admin-login-form-checkbox" />
                Remember me
              </label>
              <a href="#" className="admin-login-form-forgot">
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="admin-login-submit"
            >
              {loading ? (
                <>
                  <span className="admin-login-spinner" />
                  Signing in…
                </>
              ) : (
                <>Sign in</>
              )}
            </button>
          </form>

          <div className="admin-login-back">
            <Link href="/" className="admin-login-back-link">
              ← Back to Store
            </Link>
          </div>
        </div>

        <div className="admin-login-footer">
          <span>© {new Date().getFullYear()} Moonchunk</span>
          <div className="admin-login-footer-links">
            <a href="#" className="admin-login-footer-link">Privacy</a>
            <a href="#" className="admin-login-footer-link">Terms</a>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="admin-login-loading">
        <div className="admin-login-loading-spinner" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
