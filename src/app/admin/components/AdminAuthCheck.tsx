'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

let cachedAuthStatus: 'loading' | 'authed' | 'unauthed' | null = null

export function clearAuthCache() {
  cachedAuthStatus = null
}

export default function AdminAuthCheck({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'authed' | 'unauthed'>(cachedAuthStatus || 'loading')
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (cachedAuthStatus === 'authed') {
      setStatus('authed')
      return
    }

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    const checkAuth = async (): Promise<'authed' | 'unauthed' | null> => {
      try {
        const res = await fetch('/api/auth/me', {
          method: 'GET',
          credentials: 'include',
          cache: 'no-store',
          headers: { 'Accept': 'application/json' },
          signal: controller.signal,
        })

        if (!res.ok) {
          cachedAuthStatus = 'unauthed'
          return 'unauthed'
        }

        const data = await res.json().catch((e) => {
          return null
        })

        const role = data?.data?.user?.role


        if (data?.success && role === 'admin') {
          cachedAuthStatus = 'authed'
          return 'authed'
        } else {
          cachedAuthStatus = 'unauthed'
          return 'unauthed'
        }
      } catch (err: any) {
        if (err?.name === 'AbortError') {
          return null
        }
        cachedAuthStatus = 'unauthed'
        return 'unauthed'
      }
    }

    checkAuth().then((result) => {
      if (result === null) {
        return
      }

      setStatus(result)

      if (result !== 'authed') {
        redirectToLogin()
      }
    })

    return () => {
      controller.abort()
    }
  }, [])

  function redirectToLogin() {
    setStatus('unauthed')
    const next = typeof window !== 'undefined' ? window.location.pathname + window.location.search : '/admin'
    router.replace(`/admin/login?next=${encodeURIComponent(next)}`)
  }

  if (status === 'loading') {
    return <FullScreenLoader />
  }

  if (status !== 'authed') {
    return null
  }

  return <>{children}</>
}

function FullScreenLoader() {
  return (
    <div className="admin-auth-loader">
      <div className="admin-auth-loader-content">
        <p className="admin-auth-loader-text">
          Checking session...
        </p>
      </div>
    </div>
  )
}