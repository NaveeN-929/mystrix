'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import { ShoppingCart, Home, User } from 'lucide-react'
import { useCartStore } from '@/lib/store'
import { cn } from '@/lib/utils'

export function Navbar() {
  const pathname = usePathname()
  const { data: session, status } = useSession()
  const totalItems = useCartStore((state) => state.getTotalItems())
  const [isClient, setIsClient] = useState(false)
  const cartCount = isClient ? totalItems : 0
  const isAuthenticated = status === 'authenticated'
  const user = session?.user

  useEffect(() => {
    setIsClient(true)
  }, [])

  const navLinks = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/cart', label: 'Cart', icon: ShoppingCart, badge: cartCount },
  ]

  // Don't render navbar on admin pages
  if (pathname?.startsWith('/admin')) {
    return null
  }

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 100, damping: 20 }}
      className="fixed top-0 left-0 right-0 z-50 px-4 py-3"
    >
      <div className="max-w-6xl mx-auto">
        <div className="bg-white/80 backdrop-blur-md rounded-full shadow-kawaii border border-white/50 px-6 py-3">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group">
              <motion.div
                whileHover={{ rotate: 15, scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="relative w-16 h-16"
              >
                <Image
                  src="/logo.png"
                  alt="Mystrix Logo"
                  fill
                  className="object-contain"
                  priority
                />
              </motion.div>
              <span className="font-bold text-xl gradient-text hidden sm:block">
                mystrix
              </span>
            </Link>

            {/* Nav Links */}
            <div className="flex items-center gap-2">
              {navLinks.map((link) => (
                <NavLink key={link.href} {...link} />
              ))}

              {/* Auth Section */}
              {status === 'loading' ? (
                <div className="flex items-center gap-2 px-4 py-2">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                    className="w-4 h-4 border-2 border-pink-500 border-t-transparent rounded-full"
                  />
                </div>
              ) : isAuthenticated && user ? (
                <Link href="/profile" aria-label="Go to profile">
                  <motion.div
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.96 }}
                    className={cn(
                      'flex items-center justify-center h-11 w-11 rounded-full',
                      'bg-gradient-to-r from-pink-500 to-purple-500',
                      'text-white font-semibold',
                      'shadow-kawaii hover:shadow-kawaii-hover',
                      'transition-all duration-300'
                    )}
                  >
                    <User size={18} />
                  </motion.div>
                </Link>
              ) : (
                <Link href="/login">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2 rounded-full',
                      'bg-gradient-to-r from-pink-500 to-purple-500',
                      'text-white font-medium',
                      'transition-all duration-300'
                    )}
                  >
                    <User size={18} />
                    <span className="hidden sm:block">Login</span>
                  </motion.div>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

    </motion.nav>
  )
}

interface NavLinkProps {
  href: string
  label: string
  icon: React.ElementType
  badge?: number
}

function NavLink({ href, label, icon: Icon, badge }: NavLinkProps) {
  return (
    <Link href={href}>
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={cn(
          'relative flex items-center gap-2 px-4 py-2 rounded-full',
          'bg-gradient-to-r from-pink-50 to-lavender-50',
          'hover:from-pink-100 hover:to-lavender-100',
          'border border-pink-100 hover:border-pink-200',
          'transition-all duration-300',
          'text-gray-700 hover:text-pink-600',
          'font-medium'
        )}
      >
        <Icon size={18} />
        <span className="hidden sm:block">{label}</span>

        {badge !== undefined && badge > 0 && (
          <motion.span
            initial={false}
            animate={{ scale: 1 }}
            className={cn(
              'absolute -top-1 -right-1',
              'w-5 h-5 rounded-full',
              'bg-gradient-to-r from-pink-500 to-rose-500',
              'text-white text-xs font-bold',
              'flex items-center justify-center',
              'shadow-lg'
            )}
          >
            {badge > 9 ? '9+' : badge}
          </motion.span>
        )}
      </motion.div>
    </Link>
  )
}

