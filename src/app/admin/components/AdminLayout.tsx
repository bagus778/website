'use client'

import { ReactNode, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { Inter } from 'next/font/google'
import AdminAuthCheck, { clearAuthCache } from './AdminAuthCheck'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

interface AdminLayoutProps {
  children: ReactNode
  title?: string
}

const navigation = [
  { name: 'Dashboard', href: '/admin' },
  { name: 'Products', href: '/admin/products' },
  { name: 'Categories', href: '/admin/categories' },
  { name: 'Pages', href: '/admin/pages' },
  { name: 'Orders', href: '/admin/orders' },
  { name: 'Command Queue', href: '/admin/commands' },
  { name: 'Users', href: '/admin/users' },
  { name: 'Settings', href: '/admin/settings' },
]

export default function AdminLayout({ children, title = 'Admin Panel' }: AdminLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [loggingOut, setLoggingOut] = useState(false)

  const handleLogout = async () => {
    if (loggingOut) return
    setLoggingOut(true)
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include', cache: 'no-store' })
      clearAuthCache()
      window.location.href = '/admin/login'
    } catch (error) {
      console.error('Logout error:', error)
      setLoggingOut(false)
    }
  }

  return (
    <AdminAuthCheck>
      <div className={`admin-container ${inter.variable}`}>
        <div className="admin-sidebar">
          <div className="admin-sidebar-inner">
            <div className="admin-sidebar-header">
              <div className="admin-sidebar-logo-wrapper">
                <div className="admin-sidebar-logo-icon">
                  <span>A</span>
                </div>
                <span className="admin-sidebar-logo-text">Admin Panel</span>
              </div>
            </div>

            <nav className="admin-sidebar-nav">
              <div className="admin-sidebar-nav-list">
                {navigation.map((item) => {
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`admin-sidebar-nav-item ${isActive ? 'admin-sidebar-nav-item-active' : ''}`}
                    >
                      {item.name}
                    </Link>
                  )
                })}
              </div>
            </nav>

            <div className="admin-sidebar-footer">
              <Link
                href="/"
                className="admin-sidebar-footer-link"
              >
                Back to Store
              </Link>
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="admin-sidebar-logout-button"
              >
                {loggingOut ? 'Logging out...' : 'Logout'}
              </button>
            </div>
          </div>
        </div>

        <div className="admin-layout-wrapper">
          <header className="admin-page-header">
            <div className="admin-page-header-inner">
              <h1 className="admin-page-header-title">{title}</h1>
            </div>
          </header>

          <main className="admin-main-content">
            {children}
          </main>
        </div>
      </div>
    </AdminAuthCheck>
  )
}
