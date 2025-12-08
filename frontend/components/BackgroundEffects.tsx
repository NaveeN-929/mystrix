'use client'

import { usePathname } from 'next/navigation'

export function BackgroundEffects() {
  const pathname = usePathname()
  
  // Don't render background effects on admin pages
  if (pathname?.startsWith('/admin')) {
    return null
  }

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* Floating Circles */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-pink-200/30 rounded-full blur-3xl animate-float" />
      <div className="absolute top-40 right-20 w-40 h-40 bg-lavender-200/30 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
      <div className="absolute bottom-40 left-1/4 w-36 h-36 bg-mint-200/30 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
      <div className="absolute bottom-20 right-1/3 w-28 h-28 bg-peach-200/30 rounded-full blur-3xl animate-float" style={{ animationDelay: '0.5s' }} />
      <div className="absolute top-1/2 left-1/2 w-48 h-48 bg-sky-200/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '1.5s' }} />
    </div>
  )
}

