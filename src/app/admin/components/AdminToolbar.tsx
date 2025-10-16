'use client'

import { ReactNode } from 'react'

interface AdminToolbarProps {
  searchValue: string
  onSearchChange: (value: string) => void
  searchPlaceholder?: string
  children?: ReactNode
}

export default function AdminToolbar({
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search…',
  children,
}: AdminToolbarProps) {
  return (
    <div className="admin-toolbar">
      <div className="admin-toolbar-search-wrapper">
        <div className="admin-toolbar-search-container">
          <input
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="admin-toolbar-search-input"
          />
          <svg
            className="admin-toolbar-search-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
        </div>
      </div>
      <div className="admin-toolbar-actions-wrapper">{children}</div>
    </div>
  )
}
