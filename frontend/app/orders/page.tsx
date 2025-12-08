'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Package, Clock, Truck, CheckCircle, XCircle, ChevronDown, ShoppingBag } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatPrice } from '@/lib/utils'
import { ordersApi, Order } from '@/lib/api'

// Fallback for legacy auth storage (pre-NextAuth)
function getLegacyToken(): string | null {
  if (typeof window === 'undefined') return null
  try {
    const stored = localStorage.getItem('mystrix-auth')
    if (!stored) return null
    const parsed = JSON.parse(stored)
    return parsed?.state?.token || parsed?.token || null
  } catch {
    return null
  }
}

export default function OrdersPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  // Support NextAuth token first; fallback to legacy localStorage token
  const token = session?.accessToken || getLegacyToken()
  
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoadingOrders, setIsLoadingOrders] = useState(true)
  const [error, setError] = useState('')
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null)

  useEffect(() => {
    // If no token from either NextAuth or legacy store, redirect
    if (status === 'unauthenticated' && !token) {
      router.push('/login?redirect=/orders')
    }
  }, [status, token, router])

  // Fetch user orders
  useEffect(() => {
    const fetchOrders = async () => {
      if (!token) return
      
      setIsLoadingOrders(true)
      setError('')
      
      try {
        const response = await ordersApi.getMyOrders({}, token)
        setOrders(response.orders)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load orders')
      } finally {
        setIsLoadingOrders(false)
      }
    }

    if (token) {
      fetchOrders()
    }
  }, [status, token])

  // Show loading while checking authentication
  if (status === 'loading' || (!token && status === 'unauthenticated')) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
          className="w-12 h-12 border-4 border-pink-200 border-t-pink-500 rounded-full"
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <ShoppingBag className="w-8 h-8 text-pink-500" />
            <h1 className="text-3xl font-bold text-gray-800">My Orders</h1>
          </div>
          <p className="text-gray-500">Track and manage your orders 📦</p>
        </motion.div>

        {/* Loading State */}
        {isLoadingOrders && (
          <div className="flex items-center justify-center py-12">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
              className="w-12 h-12 border-4 border-pink-200 border-t-pink-500 rounded-full"
            />
          </div>
        )}

        {/* Error State */}
        {error && !isLoadingOrders && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-kawaii bg-red-50 border border-red-200 text-red-600"
          >
            {error}
          </motion.div>
        )}

        {/* Empty State */}
        {!isLoadingOrders && !error && orders.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              'text-center py-16 px-4',
              'bg-white/90 backdrop-blur-md rounded-super',
              'shadow-kawaii border border-pink-100'
            )}
          >
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-r from-pink-100 to-lavender-100 mb-4">
              <Package className="w-10 h-10 text-pink-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">No orders yet</h3>
            <p className="text-gray-500 mb-6">Start shopping to see your orders here!</p>
            <button
              onClick={() => router.push('/')}
              className={cn(
                'px-6 py-3 rounded-kawaii font-medium',
                'bg-gradient-to-r from-pink-500 to-purple-500',
                'text-white shadow-kawaii hover:shadow-kawaii-hover',
                'transition-all duration-300'
              )}
            >
              Start Shopping
            </button>
          </motion.div>
        )}

        {/* Orders List */}
        {!isLoadingOrders && !error && orders.length > 0 && (
          <div className="space-y-4">
            {orders.map((order, index) => (
              <motion.div
                key={order._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={cn(
                  'bg-white/90 backdrop-blur-md rounded-super',
                  'shadow-kawaii border border-pink-100',
                  'overflow-hidden transition-all duration-300'
                )}
              >
                {/* Order Header */}
                <div
                  className="p-6 cursor-pointer hover:bg-pink-50/50 transition-colors"
                  onClick={() => setExpandedOrder(expandedOrder === order._id ? null : order._id)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      {/* Order ID and Date */}
                      <div className="flex flex-wrap items-center gap-3 mb-3">
                        <h3 className="font-bold text-gray-800">Order #{order.orderId}</h3>
                        <span className="text-sm text-gray-500">
                          {new Date(order.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </span>
                      </div>

                      {/* Items Count and Total */}
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                        <span>{order.items.length} item{order.items.length > 1 ? 's' : ''}</span>
                        <span className="font-bold text-gray-800">
                          {formatPrice(order.totalAmount)}
                        </span>
                      </div>
                    </div>

                    {/* Status and Expand Icon */}
                    <div className="flex items-center gap-3">
                      <OrderStatus status={order.status} />
                      <motion.div
                        animate={{ rotate: expandedOrder === order._id ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      </motion.div>
                    </div>
                  </div>
                </div>

                {/* Expanded Order Details */}
                <AnimatePresence>
                  {expandedOrder === order._id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="border-t border-pink-100"
                    >
                      <div className="p-6 space-y-4">
                        {/* Order Items */}
                        <div>
                          <h4 className="text-sm font-semibold text-gray-700 mb-3">Order Items</h4>
                          <div className="space-y-2">
                            {order.items.map((item, idx) => (
                              <div
                                key={idx}
                                className="flex items-center justify-between p-3 bg-pink-50/50 rounded-lg"
                              >
                                <div>
                                  <p className="font-medium text-gray-800">{item.name}</p>
                                  <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                                </div>
                                <p className="font-semibold text-gray-800">
                                  {formatPrice(item.price * item.quantity)}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Delivery Address */}
                        <div>
                          <h4 className="text-sm font-semibold text-gray-700 mb-2">Delivery Address</h4>
                          <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
                            <p className="font-medium text-gray-800">{order.customerInfo.name}</p>
                            <p>{order.customerInfo.phone}</p>
                            <p>{order.customerInfo.address}</p>
                            {order.customerInfo.city && <p>{order.customerInfo.city}</p>}
                            {order.customerInfo.pincode && <p>{order.customerInfo.pincode}</p>}
                          </div>
                        </div>

                        {/* Payment Info */}
                        <div className="flex items-center justify-between pt-3 border-t border-pink-100">
                          <span className="text-sm text-gray-600">Payment Status</span>
                          <span className={cn(
                            'px-3 py-1 rounded-full text-xs font-medium',
                            order.paymentStatus === 'completed' && 'bg-green-100 text-green-700',
                            order.paymentStatus === 'pending' && 'bg-yellow-100 text-yellow-700',
                            order.paymentStatus === 'failed' && 'bg-red-100 text-red-700'
                          )}>
                            {order.paymentStatus}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// Order Status Badge Component
function OrderStatus({ status }: { status: string }) {
  const statusConfig = {
    pending: {
      icon: Clock,
      color: 'from-amber-400 to-orange-500',
      bgColor: 'bg-amber-100',
      textColor: 'text-amber-700',
      label: 'Pending'
    },
    confirmed: {
      icon: CheckCircle,
      color: 'from-blue-400 to-indigo-500',
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-700',
      label: 'Confirmed'
    },
    shipped: {
      icon: Truck,
      color: 'from-purple-400 to-violet-500',
      bgColor: 'bg-purple-100',
      textColor: 'text-purple-700',
      label: 'Shipped'
    },
    delivered: {
      icon: Package,
      color: 'from-green-400 to-emerald-500',
      bgColor: 'bg-green-100',
      textColor: 'text-green-700',
      label: 'Delivered'
    },
    cancelled: {
      icon: XCircle,
      color: 'from-red-400 to-rose-500',
      bgColor: 'bg-red-100',
      textColor: 'text-red-700',
      label: 'Cancelled'
    }
  }

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
  const Icon = config.icon

  return (
    <div className={cn(
      'flex items-center gap-2 px-3 py-1.5 rounded-full',
      config.bgColor
    )}>
      <Icon className={cn('w-4 h-4', config.textColor)} />
      <span className={cn('text-xs font-medium', config.textColor)}>
        {config.label}
      </span>
    </div>
  )
}
