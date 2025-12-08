'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingCart, Check, Heart, Sparkles } from 'lucide-react'
import { Product } from '@/lib/api'
import { useCartStore } from '@/lib/store'
import { formatPrice } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface ProductCardProps {
  product: Product
  contestType?: string
  showAddToCart?: boolean
}

export function ProductCard({ product, contestType, showAddToCart = true }: ProductCardProps) {
  const [isLiked, setIsLiked] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [justAdded, setJustAdded] = useState(false)
  const addItem = useCartStore((state) => state.addItem)
  const cartItems = useCartStore((state) => state.items)
  
  // Check if product is already in cart
  const isInCart = cartItems.some((item) => item.product._id === product._id)
  
  // Reset justAdded when product is removed from cart
  useEffect(() => {
    if (!isInCart) {
      setJustAdded(false)
    }
  }, [isInCart])

  const handleAddToCart = () => {
    if (isInCart) return
    
    addItem(product, contestType)
    setJustAdded(true)
    
    // Play sound
    const audio = new Audio('/sounds/success.mp3')
    audio.volume = 0.3
    audio.play().catch(() => {})
  }

  // If product is in cart, show a compact "In Cart" indicator instead
  if (isInCart) {
    return (
      <motion.div
        initial={{ opacity: 1, scale: 1 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        className={cn(
          'relative bg-gradient-to-br from-green-50 to-emerald-50 rounded-super overflow-hidden',
          'shadow-soft border-2 border-green-200',
          'p-4 flex items-center gap-3'
        )}
      >
        <div className={cn(
          'w-12 h-12 rounded-full',
          'bg-green-500',
          'flex items-center justify-center',
          'shadow-md'
        )}>
          <Check size={24} className="text-white" />
        </div>
        <div className="flex-1">
          <p className="font-bold text-green-700 text-sm">Added to Cart!</p>
          <p className="text-green-600 text-xs">{product.name}</p>
        </div>
        <span className="text-2xl">✨</span>
      </motion.div>
    )
  }

  return (
    <motion.div
      whileHover={{ y: -5 }}
      className={cn(
        'relative bg-white rounded-super overflow-hidden',
        'shadow-kawaii hover:shadow-kawaii-hover',
        'border-2 border-pink-100',
        'transition-all duration-300'
      )}
    >
      {/* Product Number Badge */}
      <div className={cn(
        'absolute top-3 left-3 z-10',
        'px-3 py-1 rounded-full',
        'bg-gradient-to-r from-pink-400 to-purple-400',
        'text-white text-xs font-bold',
        'shadow-md'
      )}>
        #{product.productNumber}
      </div>

      {/* Like Button */}
      <motion.button
        whileHover={{ scale: 1.2 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsLiked(!isLiked)}
        className={cn(
          'absolute top-3 right-3 z-10',
          'w-8 h-8 rounded-full',
          'bg-white shadow-md',
          'flex items-center justify-center',
          'transition-all duration-300'
        )}
      >
        <Heart
          size={16}
          className={cn(
            'transition-all duration-300',
            isLiked ? 'fill-pink-500 text-pink-500' : 'text-gray-400'
          )}
        />
      </motion.button>

      {/* Image Container */}
      <div className="relative w-full aspect-square bg-gradient-to-br from-pink-50 to-lavender-50 overflow-hidden">
        {!imageError ? (
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-cover hover:scale-110 transition-transform duration-500"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-6xl">🎁</div>
          </div>
        )}
        
        {/* Sparkle Overlay */}
        <motion.div
          animate={{ opacity: [0, 1, 0] }}
          transition={{ repeat: Infinity, duration: 2, delay: Math.random() * 2 }}
          className="absolute top-1/4 left-1/4"
        >
          <Sparkles className="w-4 h-4 text-yellow-400" />
        </motion.div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Category */}
        <span className="text-xs font-medium text-purple-400 uppercase tracking-wide">
          {product.category}
        </span>

        {/* Name */}
        <h3 className="font-bold text-gray-800 text-lg mt-1 line-clamp-1">
          {product.name}
        </h3>

        {/* Description */}
        <p className="text-gray-500 text-sm mt-1 line-clamp-2">
          {product.description}
        </p>

        {/* Price */}
        <div className="flex items-center justify-between mt-3">
          <span className="text-xl font-bold gradient-text">
            {formatPrice(product.price)}
          </span>
          
          {/* Stock Status */}
          {product.stock > 0 ? (
            <span className="text-xs text-green-500 flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              In Stock
            </span>
          ) : (
            <span className="text-xs text-red-500">Out of Stock</span>
          )}
        </div>

        {/* Add to Cart Button */}
        {showAddToCart && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleAddToCart}
            disabled={justAdded || product.stock === 0}
            className={cn(
              'w-full mt-4 py-3 rounded-kawaii',
              'font-bold text-white',
              'flex items-center justify-center gap-2',
              'transition-all duration-300',
              justAdded
                ? 'bg-green-500'
                : product.stock === 0
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 shadow-md hover:shadow-lg'
            )}
          >
            {justAdded ? (
              <>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring' }}
                >
                  <Check size={20} />
                </motion.div>
                Added to Cart!
              </>
            ) : (
              <>
                <ShoppingCart size={20} />
                Add to Cart
              </>
            )}
          </motion.button>
        )}
      </div>
    </motion.div>
  )
}

