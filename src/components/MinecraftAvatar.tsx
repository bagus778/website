'use client'

import { useState, useEffect } from 'react'

interface MinecraftAvatarProps {
  username: string
  size?: number
  className?: string
}

export default function MinecraftAvatar({ username, size = 32, className = '' }: MinecraftAvatarProps) {
  const [imgSrc, setImgSrc] = useState<string>(`https://mc-heads.net/avatar/${username}/${size}`)
  const [error, setError] = useState(false)

  useEffect(() => {
    setImgSrc(`https://mc-heads.net/avatar/${username}/${size}`)
    setError(false)
  }, [username, size])

  const handleError = () => {
    if (!error) {
      // fallback to steve
      setImgSrc(`https://mc-heads.net/avatar/steve/${size}`)
      setError(true)
    }
  }

  return (
    <img
      src={imgSrc}
      alt={`${username}'s Minecraft avatar`}
      width={size}
      height={size}
      onError={handleError}
      className={`rounded ${className}`}
    />
  )
}