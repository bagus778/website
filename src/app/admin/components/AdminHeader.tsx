'use client'

import Link from 'next/link'

interface AdminHeaderProps {
  title: string
  backHref?: string
  primaryAction?: { label: string; onClick: () => void }
}

export default function AdminHeader({ title, backHref = '/admin', primaryAction }: AdminHeaderProps) {
  return (
    <header className="admin-header">
      <div className="admin-header-inner">
        <div className="admin-header-content">
          <div>
            <Link
              href={backHref}
              className="admin-header-back-link"
            >
              ← Back to Dashboard
            </Link>
            <h1 className="admin-header-title">{title}</h1>
          </div>
          {primaryAction ? (
            <button
              onClick={primaryAction.onClick}
              className="admin-header-action-button"
            >
              {primaryAction.label}
            </button>
          ) : null}
        </div>
      </div>
    </header>
  )
}
