'use client'

import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { Trash2, ShoppingBag, ArrowRight, ArrowLeft, Gift } from 'lucide-react'
import { useCartStore } from '@/lib/store'
import { formatPrice, cn } from '@/lib/utils'

export default function CartPage() {
  const router = useRouter()
  const { status } = useSession()
  const { items, removeItem, clearCart, getTotalPrice } = useCartStore()

  const itemsWorth = getTotalPrice()

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="text-8xl mb-6"
          >
            🛒
          </motion.div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-4">
            Your cart is empty!
          </h1>
          <p className="text-gray-500 mb-8">
            Play a contest to win amazing products! 🎁
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push('/')}
            className={cn(
              'px-8 py-4 rounded-kawaii',
              'bg-gradient-to-r from-pink-500 to-purple-500',
              'text-white font-bold text-lg',
              'shadow-kawaii hover:shadow-kawaii-hover',
              'flex items-center gap-2 mx-auto'
            )}
          >
            <Gift size={24} />
            Start Playing
          </motion.button>
        </motion.div>
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
          className="flex items-center justify-between mb-8"
        >
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 flex items-center gap-3">
              <ShoppingBag className="text-pink-500" />
              Your Cart
            </h1>
            <p className="text-gray-500 mt-1">
              {items.length} {items.length === 1 ? 'item' : 'items'} in your cart
            </p>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push('/')}
            className={cn(
              'px-4 py-2 rounded-kawaii',
              'bg-white border-2 border-pink-200',
              'text-pink-500 font-medium',
              'flex items-center gap-2',
              'shadow-soft hover:shadow-kawaii'
            )}
          >
            <ArrowLeft size={18} />
            Resume the Mystery
          </motion.button>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            <AnimatePresence mode="popLayout">
              {items.map((item, index) => (
                <motion.div
                  key={item.product._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20, height: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={cn(
                    'bg-white rounded-super p-4 sm:p-6',
                    'shadow-kawaii border border-pink-100',
                    'flex gap-4'
                  )}
                >
                  {/* Product Image */}
                  <div className="relative w-24 h-24 sm:w-32 sm:h-32 flex-shrink-0 rounded-kawaii overflow-hidden bg-gradient-to-br from-pink-50 to-lavender-50">
                    {(() => {
                      const imageSrc =
                        (item.product.image && item.product.image.trim()) ||
                        'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="150" height="150" viewBox="0 0 150 150"><rect width="150" height="150" fill="%23f5f3ff"/><text x="75" y="80" text-anchor="middle" fill="%23a855f7" font-size="16" font-family="Arial">No Image</text></svg>'

                      return (
                    <Image
                          src={imageSrc}
                          alt={item.product.name}
                          fill
                          className="object-cover"
                        />
                      )
                    })()}
                    {/* Contest Badge */}
                    <span className={cn(
                      'absolute top-2 left-2 px-2 py-0.5 rounded-full',
                      'text-xs font-bold text-white',
                      'bg-gradient-to-r from-pink-400 to-purple-400'
                    )}>
                      #{item.product.productNumber}
                    </span>
                  </div>

                  {/* Product Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <h3 className="font-bold text-gray-800 line-clamp-1">
                          {item.product.name}
                        </h3>
                        <p className="text-sm text-gray-500">
                          Contest {item.product.contestId || item.contestType || 'Unknown'}
                        </p>
                        <p className="text-xs text-purple-400 mt-1">
                          Added from contest {item.contestType || item.product.contestId || 'Unknown'}
                        </p>
                      </div>

                      {/* Remove Button */}
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => removeItem(item.product._id)}
                        className="p-2 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 size={18} />
                      </motion.button>
                    </div>

                    {/* Price & Quantity (read-only) */}
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex flex-col">
                        <span className="text-xs text-gray-500 uppercase tracking-wide">Worth</span>
                        <span className="text-xl font-bold gradient-text">
                          {formatPrice(item.product.price * item.quantity)}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Qty</p>
                        <p className="text-lg font-bold text-gray-800">{item.quantity}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Clear Cart */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={clearCart}
              className={cn(
                'w-full py-3 rounded-kawaii',
                'border-2 border-red-200 text-red-400',
                'font-medium hover:bg-red-50',
                'transition-colors duration-300'
              )}
            >
              Clear Cart
            </motion.button>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                'bg-white rounded-super p-6',
                'shadow-kawaii border border-pink-100',
                'sticky top-24'
              )}
            >
              <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <span className="text-2xl">📝</span>
                Order Summary
              </h2>

              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-gray-600">
                  <span>Items worth</span>
                  <span>{formatPrice(itemsWorth)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Contest fee</span>
                  <span className="text-green-500">Paid ✓</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span className="text-green-500">Free! 🎉</span>
                </div>
                <hr className="border-pink-100" />
                <div className="flex justify-between font-bold text-lg">
                  <span className="text-gray-800">Total due now</span>
                  <span className="text-green-500">₹0</span>
                </div>
              </div>

              {/* Checkout Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  if (status !== 'authenticated') {
                    router.push('/login?redirect=/checkout')
                    return
                  }
                  router.push('/checkout')
                }}
                className={cn(
                  'w-full py-4 rounded-kawaii',
                  'bg-gradient-to-r from-pink-500 to-purple-500',
                  'text-white font-bold text-lg',
                  'shadow-kawaii hover:shadow-kawaii-hover',
                  'flex items-center justify-center gap-2'
                )}
              >
                Proceed to Checkout
                <ArrowRight size={20} />
              </motion.button>

              {/* Trust Badges */}
              <div className="flex justify-center gap-4 mt-6 text-gray-400 text-sm">
                <span>🔒 Secure</span>
                <span>📦 Fast Shipping</span>
                <span>💝 Premium</span>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}

