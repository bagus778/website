'use client'

import { useEffect, useState } from 'react'

interface MaintenanceGuardProps {
  children: React.ReactNode
}

export default function MaintenanceGuard({ children }: MaintenanceGuardProps) {
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false)
  const [storeName, setStoreName] = useState('Store')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkMaintenanceMode()
  }, [])

  const checkMaintenanceMode = async () => {
    try {
      const response = await fetch('/api/admin/settings')
      const data = await response.json()

      if (data.success && data.data) {
        setIsMaintenanceMode(data.data.features?.maintenanceMode || false)
        setStoreName(data.data.name || 'Store')
      }
    } catch (error) {
      console.error('Error checking maintenance mode:', error)
      setIsMaintenanceMode(false)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="maintenance-loading-container">
        <div className="maintenance-loading-content">
          <div className="maintenance-loading-spinner"></div>
          <p className="maintenance-loading-text">
            Loading...
          </p>
        </div>
      </div>
    )
  }

  if (isMaintenanceMode) {
    return (
      <div className="maintenance-container">
        <div className="maintenance-content">
          <div className="maintenance-header">
            <div className="maintenance-icon-wrapper">
              <span className="maintenance-icon">🔧</span>
            </div>
            <h1 className="maintenance-title">Under Maintenance</h1>
            <h2 className="maintenance-store-name">{storeName}</h2>
          </div>

          <div className="maintenance-card">
            <p className="maintenance-message">
              We're currently performing maintenance on our store. We'll be back online shortly.
            </p>
            <p className="maintenance-submessage">
              Please check back later or contact support if you need immediate assistance.
            </p>
          </div>

          <div className="maintenance-footer">
            <p>Estimated downtime: Coming back soon</p>
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}