'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { Home, ShoppingCart, User, Wallet } from 'lucide-react'
import { useCartStore } from '@/lib/store'
import { useSession } from 'next-auth/react'
import { cn } from '@/lib/utils'
import { useEffect, useState } from 'react'

export function MobileBottomNav() {
    const pathname = usePathname()
    const { data: session, status } = useSession()
    const totalItems = useCartStore((state) => state.getTotalItems())
    const { walletRewards } = useCartStore()
    const [isClient, setIsClient] = useState(false)
    const cartCount = isClient ? (totalItems + (walletRewards > 0 ? 1 : 0)) : 0
    const isAuthenticated = status === 'authenticated'

    useEffect(() => {
        setIsClient(true)
    }, [])

    // Don't render on admin pages
    if (pathname?.startsWith('/admin')) {
        return null
    }

    const navItems = [
        { href: '/', label: 'Home', icon: Home, active: pathname === '/' },
        { href: '/cart', label: 'Cart', icon: ShoppingCart, badge: cartCount, active: pathname === '/cart' },
        ...(isAuthenticated && session?.user?.walletBalance !== undefined ? [
            {
                href: '/wallet',
                label: `₹${session.user.walletBalance}`,
                icon: Wallet,
                active: pathname === '/wallet'
            }
        ] : []),
        {
            href: isAuthenticated ? '/profile' : '/login',
            label: isAuthenticated ? 'Profile' : 'Login',
            icon: User,
            active: pathname === '/profile' || pathname === '/login'
        },
    ]

    return (
        <>
            {/* Spacer to prevent content from being hidden behind fixed nav */}
            <div className="h-20 md:hidden" />

            {/* Bottom Navigation - Mobile Only */}
            <motion.nav
                initial={{ y: 100 }}
                animate={{ y: 0 }}
                transition={{ type: 'spring', stiffness: 100, damping: 20 }}
                className={cn(
                    'fixed bottom-0 left-0 right-0 z-50',
                    'md:hidden',
                    'px-4 pb-4 pt-2'
                )}
            >
                <div className={cn(
                    'bg-white/95 backdrop-blur-xl rounded-[28px]',
                    'shadow-[0_-4px_24px_rgba(0,0,0,0.08)]',
                    'border border-white/50',
                    'px-2 py-3'
                )}>
                    <div className="flex items-center justify-around">
                        {navItems.map((item) => (
                            <NavItem key={item.href} {...item} />
                        ))}
                    </div>
                </div>
            </motion.nav>
        </>
    )
}

interface NavItemProps {
    href: string
    label: string
    icon: React.ElementType
    badge?: number
    active: boolean
}

function NavItem({ href, label, icon: Icon, badge, active }: NavItemProps) {
    return (
        <Link href={href} className="relative">
            <motion.div
                whileTap={{ scale: 0.9 }}
                className="flex flex-col items-center gap-1 px-3 py-2 min-w-[64px]"
            >
                <div className="relative">
                    <motion.div
                        animate={{
                            scale: active ? 1 : 0.9,
                        }}
                        className={cn(
                            'relative p-2 rounded-2xl transition-colors',
                            active
                                ? 'bg-gradient-to-br from-pink-500 to-purple-500'
                                : 'bg-transparent'
                        )}
                    >
                        <Icon
                            size={22}
                            className={cn(
                                'transition-colors',
                                active ? 'text-white' : 'text-gray-600'
                            )}
                        />
                    </motion.div>

                    {/* Badge */}
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
                                'shadow-lg border-2 border-white'
                            )}
                        >
                            {badge > 9 ? '9+' : badge}
                        </motion.span>
                    )}
                </div>

                {/* Label */}
                <span
                    className={cn(
                        'text-xs font-medium transition-colors',
                        active
                            ? 'text-pink-600'
                            : 'text-gray-500'
                    )}
                >
                    {label}
                </span>

                {/* Active indicator */}
                {active && (
                    <motion.div
                        layoutId="activeTab"
                        className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-pink-500"
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                )}
            </motion.div>
        </Link>
    )
}
