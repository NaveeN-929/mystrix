'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import confetti from 'canvas-confetti'
import { Sparkles } from 'lucide-react'
import { Product } from '@/lib/api'
import { ProductCard } from './ProductCard'
import { cn } from '@/lib/utils'
import { getConfettiConfig } from '@/lib/spinLogic'
import { useCartStore } from '@/lib/store'


interface MysteryBoxProps {
  index: number
  products: Product[]
  isOpened: boolean
  onOpen: () => void
  contestType: string
}

export function MysteryBox({ index, products, isOpened, onOpen, contestType }: MysteryBoxProps) {
  const [isOpening, setIsOpening] = useState(false)
  const [showProducts, setShowProducts] = useState(false)
  const [addedToCart, setAddedToCart] = useState(false)
  const addItemToCart = useCartStore((state) => state.addItem)

  // Once products are revealed, add them to cart automatically (one-time)
  useEffect(() => {
    if (showProducts && !addedToCart) {
      products.forEach((product) => addItemToCart(product, contestType))
      setAddedToCart(true)
    }
  }, [showProducts, addedToCart, products, addItemToCart, contestType])

  const handleClick = () => {
    if (isOpened || isOpening) return

    setIsOpening(true)

    // Play sound effect
    const audio = new Audio('/sounds/box-open.mp3')
    audio.volume = 0.5
    audio.play().catch(() => { })

    // Trigger confetti from box position
    setTimeout(() => {
      confetti({
        ...getConfettiConfig(),
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
      })
    }, 400)

    // Show products after animation
    setTimeout(() => {
      setShowProducts(true)
      setIsOpening(false)
      onOpen()
    }, 1000)
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5, y: 30 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay: index * 0.1, type: 'spring', stiffness: 200 }}
      className="flex flex-col items-center"
    >
      <AnimatePresence mode="wait">
        {!showProducts ? (
          <motion.div
            key="box"
            exit={{ opacity: 0, scale: 0.8, rotateY: 90 }}
            transition={{ duration: 0.3 }}
            className="mystery-box"
            style={{ perspective: 1000 }}
          >
            <motion.button
              onClick={handleClick}
              disabled={isOpened}
              whileHover={!isOpened && !isOpening ? { scale: 1.05, y: -5 } : {}}
              whileTap={!isOpened && !isOpening ? { scale: 0.98 } : {}}
              animate={isOpening ? {
                rotateY: [0, 10, -10, 10, -10, 0],
                scale: [1, 1.05, 1.05, 1.05, 1.05, 1.1],
                transition: { duration: 0.8 }
              } : {}}
              className={cn(
                'relative w-40 h-40 sm:w-48 sm:h-48',
                'rounded-super overflow-hidden',
                'shadow-kawaii hover:shadow-kawaii-hover',
                'transition-all duration-300',
                'group cursor-pointer',
                'bg-gradient-to-br from-pink-200 via-purple-100 to-pink-200'
              )}
            >
              {/* Box Lid */}
              <motion.div
                animate={isOpening ? { y: -30, opacity: 0 } : {}}
                className={cn(
                  'absolute top-0 left-0 right-0 h-1/3',
                  'bg-gradient-to-br from-pink-400 to-purple-400',
                  'rounded-t-super',
                  'flex items-center justify-center',
                  'border-b-4 border-pink-300'
                )}
              >
                <div className="w-12 h-3 bg-yellow-400 rounded-full shadow-md" />
              </motion.div>

              {/* Box Body */}
              <div className={cn(
                'absolute bottom-0 left-0 right-0 h-2/3',
                'bg-gradient-to-br from-pink-300 to-purple-300',
                'rounded-b-super',
                'flex items-center justify-center'
              )}>
                <motion.div
                  animate={isOpening ? { scale: [1, 1.2, 1], opacity: [1, 0.5, 1] } : { y: [0, -5, 0] }}
                  transition={isOpening ? { duration: 0.4 } : { repeat: Infinity, duration: 2 }}
                  className="text-5xl"
                >
                  🎁
                </motion.div>
              </div>

              {/* Sparkles */}
              <motion.div
                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="absolute top-2 right-2"
              >
                <Sparkles className="w-6 h-6 text-yellow-400" />
              </motion.div>
              <motion.div
                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ repeat: Infinity, duration: 1.5, delay: 0.5 }}
                className="absolute top-4 left-4"
              >
                <Sparkles className="w-4 h-4 text-pink-400" />
              </motion.div>

              {/* Hover Overlay */}
              {!isOpening && !isOpened && (
                <div className={cn(
                  'absolute inset-0 flex items-center justify-center',
                  'bg-black/0 group-hover:bg-black/10',
                  'transition-all duration-300',
                  'rounded-super'
                )}>
                  <motion.span
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 0 }}
                    whileHover={{ opacity: 1, y: 0 }}
                    className="text-white font-bold text-lg bg-black/30 px-4 py-2 rounded-full"
                  >
                    Tap to Open!
                  </motion.span>
                </div>
              )}

              {/* Box Number */}
              <div className={cn(
                'absolute bottom-2 right-2',
                'w-8 h-8 rounded-full',
                'bg-white shadow-md',
                'flex items-center justify-center',
                'text-sm font-bold text-pink-500'
              )}>
                {index + 1}
              </div>
            </motion.button>

            {/* Tap to open hint */}
            {!isOpened && !isOpening && (
              <motion.p
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="text-center text-gray-500 text-sm mt-3"
              >
                Tap to reveal! ✨
              </motion.p>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="products"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
            className="w-full"
          >
            <div className={cn(
              'grid gap-4',
              products.length > 1 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'
            )}>
              <AnimatePresence mode="popLayout">
                {products.length > 0 ? (
                  products.map((product, i) => (
                    <motion.div
                      key={product._id}
                      initial={{ opacity: 0, y: 20, rotateY: -90 }}
                      animate={{ opacity: 1, y: 0, rotateY: 0 }}
                      exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.3 } }}
                      transition={{ delay: i * 0.2, type: 'spring' }}
                      layout
                    >
                      <ProductCard product={product} contestType={contestType} />
                    </motion.div>
                  ))
                ) : (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-super border-2 border-dashed border-gray-200"
                  >
                    <span className="text-4xl mb-2">😢</span>
                    <p className="font-bold text-gray-400">Empty Box</p>
                    <p className="text-xs text-gray-400 text-center">Better luck next time! ✨</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

