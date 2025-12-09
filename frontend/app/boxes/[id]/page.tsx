'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingCart, ArrowRight, Gift } from 'lucide-react'
import { MysteryBox } from '@/components/MysteryBox'
import { ContestConfig, normalizeContest } from '@/lib/contestConfig'
import { useGameStore, useCartStore } from '@/lib/store'
import { Product, productsApi, contestsApi } from '@/lib/api'
import { cn } from '@/lib/utils'
import { LoadingSpinner } from '@/components/LoadingSpinner'

export default function BoxesPage() {
  const router = useRouter()
  const params = useParams()
  const [contest, setContest] = useState<ContestConfig | null>(null)
  const [boxProducts, setBoxProducts] = useState<Product[][]>([])
  const [openedBoxes, setOpenedBoxes] = useState<boolean[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [allOpened, setAllOpened] = useState(false)

  const { gameState } = useGameStore()
  const totalCartItems = useCartStore((state) => state.getTotalItems())

  // Fetch products for boxes
  const fetchProducts = useCallback(async (contestConfig: ContestConfig) => {
    if (!gameState.wheelResult) {
      router.push('/')
      return
    }

    const boxCount = gameState.wheelResult
    const productsPerBox = contestConfig.productsPerBox
    const totalProducts = boxCount * productsPerBox

    try {
      // Fetch products from API
      const data = await productsApi.getRandom(totalProducts, contestConfig.id)
      const products = data.products || []

      if (products.length === 0) {
        console.error('No products available')
        router.push('/')
        return
      }

      // Distribute products into boxes
      const boxes: Product[][] = []
      for (let i = 0; i < boxCount; i++) {
        const boxProds = products.slice(
          i * productsPerBox,
          (i + 1) * productsPerBox
        )
        boxes.push(boxProds)
      }

      setBoxProducts(boxes)
      setOpenedBoxes(new Array(boxCount).fill(false))
      setIsLoading(false)
    } catch (error) {
      console.error('Error fetching products:', error)
      // Redirect back home on error - no mock data
      router.push('/')
    }
  }, [gameState.wheelResult, router])

  useEffect(() => {
    async function loadContest() {
      const contestId = params.id as string
      try {
        // Fetch from API only - no fallback
        const data = await contestsApi.getById(contestId)
        if (data.contest && data.contest.isActive !== false) {
          const contestConfig = normalizeContest(data.contest)
          setContest(contestConfig)
          fetchProducts(contestConfig)
        } else {
          // Contest not found or not active - redirect home
          router.push('/')
        }
      } catch (error) {
        console.error('Failed to fetch contest:', error)
        // Contest not available - redirect home
        router.push('/')
      }
    }
    loadContest()
  }, [params.id, router, fetchProducts])

  useEffect(() => {
    if (openedBoxes.length > 0 && openedBoxes.every((opened) => opened)) {
      setAllOpened(true)
    }
  }, [openedBoxes])

  const handleBoxOpen = (index: number) => {
    setOpenedBoxes((prev) => {
      const newState = [...prev]
      newState[index] = true
      return newState
    })
  }

  if (isLoading || !contest) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Preparing your mystery boxes" />
      </div>
    )
  }

  const openedCount = openedBoxes.filter(Boolean).length
  const totalBoxes = openedBoxes.length

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <span className="text-5xl">{contest.icon}</span>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mt-4">
            Your Mystery Boxes! 🎁
          </h1>
          <p className="text-gray-600 mt-2">
            Tap each box to reveal your amazing products!
          </p>

          {/* Progress Bar */}
          <div className="max-w-md mx-auto mt-6">
            <div className="flex justify-between text-sm text-gray-500 mb-2">
              <span>Opened: {openedCount}/{totalBoxes}</span>
              <span>{Math.round((openedCount / totalBoxes) * 100)}%</span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(openedCount / totalBoxes) * 100}%` }}
                className={cn(
                  'h-full rounded-full',
                  `bg-gradient-to-r ${contest.color}`
                )}
              />
            </div>
          </div>
        </motion.div>

        {/* Boxes Grid */}
        <div className={cn(
          'grid gap-6',
          totalBoxes <= 3 ? 'grid-cols-1 sm:grid-cols-3' :
          totalBoxes <= 6 ? 'grid-cols-2 sm:grid-cols-3' :
          'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'
        )}>
          {boxProducts.map((products, index) => (
            <MysteryBox
              key={index}
              index={index}
              products={products}
              isOpened={openedBoxes[index]}
              onOpen={() => handleBoxOpen(index)}
              contestType={contest.id}
            />
          ))}
        </div>

        {/* Cart Summary & Actions */}
        <AnimatePresence>
          {allOpened && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 30 }}
              className={cn(
                'fixed bottom-0 left-0 right-0 z-40',
                'bg-white/95 backdrop-blur-md',
                'border-t-2 border-pink-100',
                'shadow-kawaii-hover',
                'p-4 sm:p-6'
              )}
            >
              <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    'w-14 h-14 rounded-full flex items-center justify-center',
                    `bg-gradient-to-r ${contest.color}`
                  )}>
                    <Gift size={28} className="text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-800 text-lg">
                      🎉 All boxes revealed!
                    </p>
                    <p className="text-gray-500 text-sm">
                      {totalCartItems} items in cart
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => router.push('/cart')}
                    className={cn(
                      'px-6 py-3 rounded-kawaii',
                      'bg-white border-2 border-pink-300',
                      'font-bold text-pink-500',
                      'flex items-center gap-2',
                      'shadow-soft hover:shadow-kawaii',
                      'transition-all duration-300'
                    )}
                  >
                    <ShoppingCart size={20} />
                    View Cart ({totalCartItems})
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => router.push('/checkout')}
                    className={cn(
                      'px-6 py-3 rounded-kawaii',
                      'text-white font-bold',
                      'flex items-center gap-2',
                      'shadow-lg hover:shadow-xl',
                      'transition-all duration-300',
                      `bg-gradient-to-r ${contest.color}`
                    )}
                  >
                    Checkout
                    <ArrowRight size={20} />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Cart Button */}
        {!allOpened && totalCartItems > 0 && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => router.push('/cart')}
            className={cn(
              'fixed bottom-6 right-6 z-40',
              'w-16 h-16 rounded-full',
              'bg-gradient-to-r from-pink-500 to-purple-500',
              'shadow-glow-pink',
              'flex items-center justify-center',
              'text-white'
            )}
          >
            <ShoppingCart size={24} />
            <span className={cn(
              'absolute -top-1 -right-1',
              'w-6 h-6 rounded-full',
              'bg-yellow-400 text-gray-800',
              'text-sm font-bold',
              'flex items-center justify-center'
            )}>
              {totalCartItems}
            </span>
          </motion.button>
        )}

        {/* Bottom Padding for fixed bar */}
        {allOpened && <div className="h-32" />}
      </div>
    </div>
  )
}

