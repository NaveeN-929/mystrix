'use client'

import { usePathname } from 'next/navigation'

export function Footer() {
  const pathname = usePathname()
  
  // Don't render footer on admin pages
  if (pathname?.startsWith('/admin')) {
    return null
  }

  return (
    <footer className="hidden md:block relative z-10 mt-8 py-8 text-center">
      <div className="flex items-center justify-center gap-2 text-pink-400">
        <span className="text-2xl">🎀</span>
        <p className="font-medium">Made with love by mystrix</p>
        <span className="text-2xl">🎀</span>
      </div>
      <p className="text-sm text-gray-400 mt-2">© 2024 All rights reserved ✨</p>
    </footer>
  )
}

