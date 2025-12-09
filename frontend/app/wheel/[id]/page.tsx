'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowRight, AlertCircle } from 'lucide-react'
import { Wheel } from '@/components/Wheel'
import { ContestConfig, normalizeContest } from '@/lib/contestConfig'
import { contestsApi } from '@/lib/api'
import { useGameStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import { LoadingSpinner } from '@/components/LoadingSpinner'

export default function WheelPage() {
  const router = useRouter()
  const params = useParams()
  const [contest, setContest] = useState<ContestConfig | null>(null)
  const [isPageLoading, setIsPageLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [spinResult, setSpinResult] = useState<number | null>(null)
  const { setWheelResult, initializeBoxes, markAsSpun, gameState } = useGameStore()

  useEffect(() => {
    async function fetchContest() {
      const contestId = params.id as string
      try {
        const data = await contestsApi.getById(contestId)
        if (data.contest && data.contest.isActive !== false) {
          setContest(normalizeContest(data.contest))
        } else {
          // Contest not found or not active
          setNotFound(true)
        }
      } catch (error) {
        console.error('Failed to fetch contest:', error)
        setNotFound(true)
      } finally {
        setIsPageLoading(false)
      }
    }
    fetchContest()
  }, [params.id, router])

  useEffect(() => {
    if (gameState.hasSpun && gameState.wheelResult !== null && spinResult === null) {
      setSpinResult(gameState.wheelResult)
    }
  }, [gameState.hasSpun, gameState.wheelResult, spinResult])

  const handleSpinComplete = (result: number) => {
    setSpinResult(result)
    setWheelResult(result)
    markAsSpun()
    if (result > 0) {
      initializeBoxes(result)
    }
  }

  const handleContinue = () => {
    if (contest && spinResult !== null) {
      if (spinResult === 0) {
        // No boxes won - go back home
        router.push('/')
      } else {
        router.push(`/boxes/${contest.id}`)
      }
    }
  }

  const handleOpenBoxes = () => {
    if (contest && gameState.wheelResult && gameState.wheelResult > 0) {
      router.push(`/boxes/${contest.id}`)
    }
  }

  if (isPageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading Wheel" />
      </div>
    )
  }

  if (notFound || !contest) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className={cn(
            'max-w-md w-full text-center',
            'bg-white rounded-super p-8 sm:p-12',
            'shadow-kawaii'
          )}
        >
          <AlertCircle className="w-16 h-16 mx-auto text-pink-400 mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Contest Not Available
          </h1>
          <p className="text-gray-500 mb-6">
            This contest is no longer active.
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push('/')}
            className={cn(
              'px-8 py-3 rounded-kawaii',
              'bg-gradient-to-r from-pink-500 to-purple-500',
              'text-white font-bold'
            )}
          >
            Back to Home
          </motion.button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <span className="text-5xl">{contest.icon}</span>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mt-4">
            {contest.name}
          </h1>
          <p className="text-gray-600 mt-2">
            Spin the wheel to see how many mystery boxes you&apos;ll win! 🎁
          </p>
        </motion.div>

        {/* Wheel Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className={cn(
            'relative bg-white/80 backdrop-blur-sm rounded-super',
            'shadow-kawaii p-8 sm:p-12',
            'flex flex-col items-center'
          )}
        >
          <Wheel
            contest={contest}
            onSpinComplete={handleSpinComplete}
            hasSpun={gameState.hasSpun}
            boxesToOpen={gameState.wheelResult}
            onOpenBoxes={handleOpenBoxes}
          />
        </motion.div>

        {/* Continue Button (only for 0 result) */}
        {spinResult === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-center mt-8"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleContinue}
              className={cn(
                'px-12 py-4 rounded-full',
                'text-white font-bold text-xl',
                'shadow-kawaii hover:shadow-kawaii-hover',
                'transition-all duration-300',
                'flex items-center gap-3 mx-auto',
                spinResult === 0 
                  ? 'bg-gradient-to-r from-gray-400 to-gray-500'
                  : `bg-gradient-to-r ${contest.color}`
              )}
            >
              <>
                Better Luck Next Time! 🍀
                <ArrowRight size={24} />
              </>
            </motion.button>
          </motion.div>
        )}

        {/* Info Cards */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 gap-4 mt-8"
        >
          <InfoCard
            emoji="🎯"
            title="Wheel Range"
            value={`${contest.wheelRange.min} - ${contest.wheelRange.max}`}
          />
          <InfoCard
            emoji="🎁"
            title="Products/Box"
            value={contest.productsPerBox.toString()}
          />
        </motion.div>
      </div>
    </div>
  )
}

function InfoCard({ emoji, title, value }: { emoji: string; title: string; value: string }) {
  return (
    <div className={cn(
      'bg-white/80 backdrop-blur-sm rounded-kawaii p-4',
      'shadow-soft text-center'
    )}>
      <span className="text-2xl">{emoji}</span>
      <p className="text-sm text-gray-500 mt-1">{title}</p>
      <p className="text-xl font-bold text-gray-800">{value}</p>
    </div>
  )
}

