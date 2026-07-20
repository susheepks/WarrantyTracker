'use client'

import { useState } from 'react'

type PlatformIconProps = {
  name: string
  domain?: string | null
  iconOverrideUrl?: string | null
  size?: number
}

// Simple hash function for consistent color generation
const hashString = (str: string) => {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  return hash
}

export function PlatformIcon({ name, domain, iconOverrideUrl, size = 24 }: PlatformIconProps) {
  const [hasError, setHasError] = useState(false)

  // Use override if provided, otherwise try favicon using domain
  const src = iconOverrideUrl 
    ? iconOverrideUrl 
    : domain 
      ? `https://www.google.com/s2/favicons?domain=${domain}&sz=64` 
      : null

  const showFallback = hasError || !src

  if (showFallback) {
    const letters = name.substring(0, 2).toUpperCase()
    
    // Pick a consistent color from a small set
    const colors = [
      'bg-red-100 text-red-700 border-red-200',
      'bg-blue-100 text-blue-700 border-blue-200',
      'bg-green-100 text-green-700 border-green-200',
      'bg-yellow-100 text-yellow-700 border-yellow-200',
      'bg-purple-100 text-purple-700 border-purple-200',
      'bg-pink-100 text-pink-700 border-pink-200',
      'bg-indigo-100 text-indigo-700 border-indigo-200',
      'bg-teal-100 text-teal-700 border-teal-200'
    ]
    const colorClass = colors[Math.abs(hashString(name)) % colors.length]

    return (
      <div 
        className={`flex items-center justify-center rounded-full border shrink-0 ${colorClass}`}
        style={{ width: size, height: size, fontSize: Math.max(10, size * 0.4) }}
        aria-label={name}
        title={name}
      >
        <span className="font-semibold">{letters}</span>
      </div>
    )
  }

  return (
    <img 
      src={src} 
      alt={name}
      title={name}
      width={size}
      height={size}
      className="rounded-full object-cover shrink-0 border border-gray-100 bg-white"
      onError={() => setHasError(true)}
    />
  )
}
