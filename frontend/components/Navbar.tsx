'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingCart, Home, User, LogOut, ChevronDown } from 'lucide-react'
import { useCartStore } from '@/lib/store'
import { cn } from '@/lib/utils'

export function Navbar() {
  const pathname = usePathname()
  const { data: session, status } = useSession()
  const totalItems = useCartStore((state) => state.getTotalItems())
  const [showUserMenu, setShowUserMenu] = useState(false)
  const isAuthenticated = status === 'authenticated'
  const user = session?.user

  const handleLogout = () => {
    setShowUserMenu(false)
    // Ensure signOut triggers navigation even if NextAuth call fails
    signOut({ callbackUrl: '/login', redirect: true }).catch((error) => {
      console.error('Sign out failed, forcing redirect', error)
      window.location.href = '/login'
    })
  }

  const navLinks = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/cart', label: 'Cart', icon: ShoppingCart, badge: totalItems },
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
                className="text-3xl"
              >
                🎁
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
                <div className="flex items-center gap-2 relative z-50">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2 rounded-full',
                      'bg-gradient-to-r from-pink-500 to-purple-500',
                      'text-white font-medium',
                      'transition-all duration-300'
                    )}
                  >
                    <User size={18} />
                    <span className="hidden sm:block max-w-[100px] truncate">
                      {user?.name?.split(' ')[0] || 'User'}
                    </span>
                    <ChevronDown size={16} className={cn(
                      'transition-transform duration-200',
                      showUserMenu && 'rotate-180'
                    )} />
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleLogout}
                    className={cn(
                      'flex items-center gap-2 px-3 py-2 rounded-full',
                      'bg-white border border-pink-200 text-pink-600',
                      'shadow-sm hover:bg-pink-50 transition-all duration-200'
                    )}
                    aria-label="Logout"
                  >
                    <LogOut size={16} />
                    <span className="hidden sm:block text-sm font-medium">Logout</span>
                  </motion.button>

                  {/* User Dropdown Menu */}
                  <AnimatePresence>
                    {showUserMenu && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className={cn(
                          'absolute right-0 mt-2 w-56',
                          'bg-white rounded-2xl shadow-kawaii border border-pink-100',
                          'py-2 z-50 overflow-hidden'
                        )}
                      >
                        {/* User Info Header */}
                        <div className="px-4 py-3 bg-gradient-to-r from-pink-50 to-lavender-50 border-b border-pink-100">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 flex items-center justify-center text-white font-bold">
                              {(user?.name || 'U').charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-gray-800 truncate">{user?.name}</p>
                              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                            </div>
                          </div>
                        </div>

                        {/* Menu Items */}
                        <div className="py-1">
                          <Link
                            href="/profile"
                            onClick={() => setShowUserMenu(false)}
                            className={cn(
                              'flex items-center gap-3 px-4 py-2.5',
                              'text-gray-700 hover:bg-pink-50 hover:text-pink-600',
                              'transition-colors duration-200'
                            )}
                          >
                            <User size={16} />
                            <span className="text-sm font-medium">My Profile</span>
                          </Link>

                          <Link
                            href="/orders"
                            onClick={() => setShowUserMenu(false)}
                            className={cn(
                              'flex items-center gap-3 px-4 py-2.5',
                              'text-gray-700 hover:bg-pink-50 hover:text-pink-600',
                              'transition-colors duration-200'
                            )}
                          >
                            <ShoppingCart size={16} />
                            <span className="text-sm font-medium">My Orders</span>
                          </Link>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
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

      {/* Click outside to close dropdown */}
      {showUserMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowUserMenu(false)}
        />
      )}
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
            initial={{ scale: 0 }}
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

