'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'

export default function SetupGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [checking, setChecking] = useState(true)
  const [setupCompleted, setSetupCompleted] = useState<boolean | null>(null)

  useEffect(() => {
    const checkSetup = async () => {
      try {
        const response = await fetch('/api/setup/status')
        const data = await response.json()
        setSetupCompleted(data.setupCompleted)

        if (!data.setupCompleted && !pathname.startsWith('/setup')) {
          router.push('/setup')
          return
        }

        if (data.setupCompleted && pathname.startsWith('/setup')) {
          router.push('/')
          return
        }

        setChecking(false)
      } catch (error) {
        console.error('Setup check failed:', error)
        if (!pathname.startsWith('/setup')) {
          router.push('/setup')
          return
        }
        setChecking(false)
      }
    }

    checkSetup()
  }, [pathname, router])

  if (checking || setupCompleted === null) {
    return (
      <div className="setup-guard-container"></div>
    )
  }

  if (setupCompleted && pathname.startsWith('/setup')) {
    return (
      <div className="setup-guard-container">
        <div className="setup-guard-content">
          <div className="setup-guard-spinner">
            <div className="setup-guard-cube">
              <span className="setup-guard-icon">🏠</span>
            </div>
          </div>
          <p className="setup-guard-text">
            Redirecting...
          </p>
        </div>
      </div>
    )
  }

  if (!setupCompleted && !pathname.startsWith('/setup')) {
    return (
      <div className="setup-guard-container">
        <div className="setup-guard-content">
          <div className="setup-guard-spinner">
            <div className="setup-guard-cube">
              <span className="setup-guard-icon">🏰</span>
            </div>
          </div>
          <p className="setup-guard-text">
            Setting Up Store...
          </p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}