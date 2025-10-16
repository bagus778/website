'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useCart } from '@/contexts/CartContext'
import { useMinecraftUser } from '@/contexts/MinecraftUserContext'
import MinecraftAvatar from './MinecraftAvatar'
import MinecraftLoginModal from './MinecraftLoginModal'

interface NavbarProps {
  showSearch?: boolean
  searchQuery?: string
  onSearchChange?: (query: string) => void
}

export default function Navbar({ showSearch = false, searchQuery = '', onSearchChange }: NavbarProps) {
  const { totalItems } = useCart()
  const { username, setUsername, isLoggedIn } = useMinecraftUser()
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showUserDropdown, setShowUserDropdown] = useState(false)
  const siteName = process.env.NEXT_PUBLIC_SITE_NAME || 'Moonchunk Store'

  const handleLogout = () => {
    setUsername(null)
    setShowUserDropdown(false)
  }

  return (
    <>
      <header className="navbar">
        <div className="navbar-content">
          <div className="navbar-inner">
            <Link href="/" className="navbar-logo-link">
              <div className="navbar-logo-container">
                <span className="navbar-logo-icon">{siteName[0]}</span>
                <span className="navbar-logo-pulse"></span>
              </div>
              <span className="navbar-logo-text">{siteName}</span>
            </Link>

            {/* Search */}
            {showSearch && onSearchChange && (
              <div className="navbar-search">
                <div className="navbar-search-wrapper">
                  <input
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder="Search items..."
                    className="navbar-search-input"
                  />
                  <svg
                    className="navbar-search-icon"
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
            )}

            <nav className="navbar-nav">
              <Link href="/cart" className="navbar-cart mc-button">
                <span className="navbar-cart-icon-wrapper">
                  <svg className="navbar-cart-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 6h15l-1.5 9h-12z" />
                    <path d="M6 6l-1-2H3" />
                    <circle cx="9" cy="18" r="1.5" />
                    <circle cx="17" cy="18" r="1.5" />
                  </svg>
                </span>
                Cart
                {totalItems > 0 && (
                  <span className="navbar-cart-badge">{totalItems}</span>
                )}
              </Link>

              {/* Minecraft User */}
              {isLoggedIn && username ? (
                <div className="navbar-user-dropdown">
                  <button
                    onClick={() => setShowUserDropdown(!showUserDropdown)}
                    className="navbar-user-button mc-button"
                  >
                    <MinecraftAvatar username={username} size={28} className="navbar-user-avatar" />
                    <span className="navbar-user-name">{username}</span>
                  </button>

                  {showUserDropdown && (
                    <div className="navbar-dropdown-menu">
                      <div className="navbar-dropdown-content">
                        <button onClick={handleLogout} className="navbar-dropdown-item">
                          Logout
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="navbar-login mc-button"
                >
                  Login
                </button>
              )}
            </nav>
          </div>
        </div>
      </header>

      <MinecraftLoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
    </>
  )
}
