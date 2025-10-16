'use client'

import { useState } from 'react'
import { useMinecraftUser } from '@/contexts/MinecraftUserContext'

interface MinecraftLoginModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function MinecraftLoginModal({ isOpen, onClose }: MinecraftLoginModalProps) {
  const { setUsername } = useMinecraftUser()
  const [inputUsername, setInputUsername] = useState('')
  const [error, setError] = useState('')

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = inputUsername.trim()

    if (!trimmed) {
      setError('Please enter a username')
      return
    }

    if (trimmed.length < 3 || trimmed.length > 16) {
      setError('Username must be 3-16 characters')
      return
    }

    if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) {
      setError('Username can only contain letters, numbers, and underscores')
      return
    }

    setUsername(trimmed)
    setInputUsername('')
    setError('')
    onClose()
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2 className="modal-title">Enter Your Minecraft Username</h2>
          <button
            onClick={onClose}
            className="modal-close"
            aria-label="Close"
          >
            <svg className="modal-close-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="form">
          <div>
            <input
              type="text"
              value={inputUsername}
              onChange={(e) => {
                setInputUsername(e.target.value)
                setError('')
              }}
              placeholder="Steve"
              className="form-input"
              maxLength={16}
              autoFocus
            />
            {error && <p className="form-error">{error}</p>}
          </div>

          <button type="submit" className="form-submit">
            Continue
          </button>
        </form>

        <p className="form-help-text">
          This is stored locally and used to personalize your experience
        </p>
      </div>
    </div>
  )
}
