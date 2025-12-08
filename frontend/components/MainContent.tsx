'use client'

import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

interface MainContentProps {
  children: React.ReactNode
}

export function MainContent({ children }: MainContentProps) {
  const pathname = usePathname()
  const isAdminPage = pathname?.startsWith('/admin')

  return (
    <main className={cn(
      'relative z-10',
      !isAdminPage && 'pt-20'
    )}>
      {children}
    </main>
  )
}

