'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface MinecraftUserContextType {
  username: string | null
  setUsername: (username: string | null) => void
  isLoggedIn: boolean
}

const MinecraftUserContext = createContext<MinecraftUserContextType | undefined>(undefined)

export function MinecraftUserProvider({ children }: { children: ReactNode }) {
  const [username, setUsernameState] = useState<string | null>(null)
  const [isHydrated, setIsHydrated] = useState(false)

  // Load username from localStorage on mount
  useEffect(() => {
    const savedUsername = localStorage.getItem('minecraft_username')
    if (savedUsername) {
      setUsernameState(savedUsername)
    }
    setIsHydrated(true)
  }, [])

  const setUsername = (newUsername: string | null) => {
    setUsernameState(newUsername)
    // Only update localStorage after hydration to prevent SSR issues
    if (isHydrated) {
      if (newUsername) {
        localStorage.setItem('minecraft_username', newUsername)
      } else {
        localStorage.removeItem('minecraft_username')
      }
    }
  }

  return (
    <MinecraftUserContext.Provider
      value={{
        username,
        setUsername,
        isLoggedIn: username !== null,
      }}
    >
      {children}
    </MinecraftUserContext.Provider>
  )
}

export function useMinecraftUser() {
  const context = useContext(MinecraftUserContext)
  if (!context) {
    throw new Error('useMinecraftUser must be used within MinecraftUserProvider')
  }
  return context
}