'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Settings,
  Menu,
  X,
  Home,
  ChevronRight,
  Trophy,
  LogOut,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAdminStore } from '@/lib/authStore'

const sidebarLinks = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/contests', label: 'Contests', icon: Trophy },
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingCart },
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const pathname = usePathname()
  const router = useRouter()
  const { isAdmin, adminEmail, adminLogout } = useAdminStore()

  // Check if current path is the login page
  const isLoginPage = pathname === '/admin/login'

  // Protect admin routes
  useEffect(() => {
    // Skip auth check for login page
    if (isLoginPage) {
      setIsCheckingAuth(false)
      return
    }

    // If not admin, redirect to admin login
    if (!isAdmin) {
      router.push('/admin/login')
    } else {
      setIsCheckingAuth(false)
    }
  }, [isAdmin, isLoginPage, router])

  // Handle logout
  const handleLogout = () => {
    adminLogout()
    router.push('/admin/login')
  }

  // Show loading while checking auth
  if (isCheckingAuth && !isLoginPage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-pink-50">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
          className="w-12 h-12 border-4 border-pink-200 border-t-pink-500 rounded-full"
        />
      </div>
    )
  }

  // For login page, render without sidebar
  if (isLoginPage) {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen flex">
      {/* Mobile Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/30 z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed lg:sticky top-0 left-0 z-50 h-screen w-64',
          'bg-white/95 backdrop-blur-md border-r border-pink-100',
          'shadow-kawaii lg:shadow-none',
          'transform transition-transform duration-300 ease-out',
          'lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-pink-100">
            <Link href="/" className="flex items-center gap-3">
              <motion.div
                whileHover={{ rotate: 15 }}
                className="text-3xl"
              >
                🎁
              </motion.div>
              <div>
                <h1 className="font-bold text-lg gradient-text">
                  mystrix
                </h1>
                <p className="text-xs text-gray-400">Admin Panel</p>
              </div>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {sidebarLinks.map((link) => {
              const isActive = pathname === link.href || 
                (link.href !== '/admin' && pathname.startsWith(link.href))
              
              return (
                <Link key={link.href} href={link.href} onClick={() => setSidebarOpen(false)}>
                  <motion.div
                    whileHover={{ x: 5 }}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-kawaii',
                      'font-medium transition-all duration-200',
                      isActive
                        ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-kawaii'
                        : 'text-gray-600 hover:bg-pink-50 hover:text-pink-600'
                    )}
                  >
                    <link.icon size={20} />
                    {link.label}
                    {isActive && (
                      <ChevronRight size={16} className="ml-auto" />
                    )}
                  </motion.div>
                </Link>
              )
            })}
          </nav>

          {/* Footer Links */}
          <div className="p-4 border-t border-pink-100 space-y-2">
            {/* Admin Info */}
            <div className="px-4 py-2 mb-2">
              <p className="text-xs text-gray-400">Logged in as</p>
              <p className="text-sm font-medium text-gray-600 truncate">{adminEmail}</p>
            </div>
            
            <Link href="/">
              <motion.div
                whileHover={{ x: 5 }}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-kawaii',
                  'text-gray-500 hover:bg-pink-50 hover:text-pink-600',
                  'font-medium transition-all duration-200'
                )}
              >
                <Home size={20} />
                Back to Store
              </motion.div>
            </Link>
            <motion.button
              whileHover={{ x: 5 }}
              onClick={handleLogout}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3 rounded-kawaii',
                'text-red-500 hover:bg-red-50 hover:text-red-600',
                'font-medium transition-all duration-200'
              )}
            >
              <LogOut size={20} />
              Logout
            </motion.button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 lg:ml-0">
        {/* Mobile Header */}
        <header className="lg:hidden sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-pink-100 px-4 py-3">
          <div className="flex items-center justify-between">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-lg hover:bg-pink-50"
            >
              <Menu size={24} className="text-gray-600" />
            </motion.button>
            
            <div className="flex items-center gap-2">
              <span className="text-2xl">🎁</span>
              <span className="font-bold gradient-text">Admin</span>
            </div>

            <Link href="/">
              <motion.button
                whileTap={{ scale: 0.95 }}
                className="p-2 rounded-lg hover:bg-pink-50"
              >
                <Home size={24} className="text-gray-600" />
              </motion.button>
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="min-h-screen">
          {children}
        </main>
      </div>

      {/* Mobile Close Button */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => setSidebarOpen(false)}
            className={cn(
              'fixed top-4 right-4 z-50 lg:hidden',
              'p-3 rounded-full bg-white shadow-kawaii'
            )}
          >
            <X size={24} className="text-gray-600" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}

