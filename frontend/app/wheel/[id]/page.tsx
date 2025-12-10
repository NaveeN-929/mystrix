'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { AlertCircle, CreditCard } from 'lucide-react'
import { Wheel } from '@/components/Wheel'
import { ContestConfig, normalizeContest } from '@/lib/contestConfig'
import { contestsApi, paymentsApi } from '@/lib/api'
import { useGameStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import { LoadingSpinner } from '@/components/LoadingSpinner'

interface PaymentInfo {
  paymentId: string
  orderId: string
  contestId: string
  spinAllowed: boolean
  spinUsed: boolean
  wheelResult?: number
}

export default function WheelPage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const [contest, setContest] = useState<ContestConfig | null>(null)
  const [isPageLoading, setIsPageLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [spinResult, setSpinResult] = useState<number | null>(null)
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null)
  const [paymentError, setPaymentError] = useState<string | null>(null)
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(true)
  const { setWheelResult, initializeBoxes, markAsSpun, gameState } = useGameStore()

  // Verify payment on page load
  const verifyPayment = useCallback(async () => {
    const paymentId = searchParams.get('payment_id')
    const orderId = searchParams.get('order_id')
    
    // Also check sessionStorage for pending payment
    let pendingPayment = null
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('pendingPayment')
      if (stored) {
        try {
          pendingPayment = JSON.parse(stored)
        } catch {
          // Ignore parse error
        }
      }
    }

    const effectivePaymentId = paymentId || pendingPayment?.paymentId
    const effectiveOrderId = orderId || pendingPayment?.orderId

    if (!effectiveOrderId && !effectivePaymentId) {
      setPaymentError('No payment information found. Please make a payment first.')
      setIsVerifyingPayment(false)
      return
    }

    try {
      // Verify payment status
      if (effectiveOrderId) {
        const verification = await paymentsApi.verifyPayment(effectiveOrderId)
        
        if (verification.success && verification.status === 'PAID') {
          setPaymentInfo({
            paymentId: verification.paymentId!,
            orderId: verification.orderId!,
            contestId: verification.contestId!,
            spinAllowed: verification.spinAllowed!,
            spinUsed: verification.spinUsed!,
          })

          // Clear pending payment from session storage
          if (typeof window !== 'undefined') {
            sessionStorage.removeItem('pendingPayment')
          }

          // If spin was already used, redirect to boxes or home
          if (verification.spinUsed) {
            setPaymentError('This spin has already been used.')
          }
        } else if (verification.status === 'PENDING') {
          setPaymentError('Payment is still being processed. Please wait or try again.')
        } else {
          setPaymentError('Payment was not completed. Please try again.')
        }
      } else if (effectivePaymentId) {
        // Use check-spin endpoint
        const spinCheck = await paymentsApi.checkSpin(effectivePaymentId)
        
        if (spinCheck.status === 'PAID') {
          setPaymentInfo({
            paymentId: spinCheck.paymentId,
            orderId: spinCheck.orderId,
            contestId: spinCheck.contestId,
            spinAllowed: spinCheck.spinAllowed,
            spinUsed: spinCheck.spinUsed,
            wheelResult: spinCheck.wheelResult,
          })

          // Clear pending payment from session storage
          if (typeof window !== 'undefined') {
            sessionStorage.removeItem('pendingPayment')
          }

          // If spin was already used, show the result
          if (spinCheck.spinUsed && spinCheck.wheelResult !== undefined) {
            setSpinResult(spinCheck.wheelResult)
            setWheelResult(spinCheck.wheelResult)
            markAsSpun()
            if (spinCheck.wheelResult > 0) {
              initializeBoxes(spinCheck.wheelResult)
            }
          }
        } else if (spinCheck.status === 'PENDING') {
          setPaymentError('Payment is still being processed. Please wait or try again.')
        } else {
          setPaymentError('Payment was not completed. Please try again.')
        }
      }
    } catch (error) {
      console.error('Error verifying payment:', error)
      setPaymentError('Failed to verify payment. Please try again.')
    } finally {
      setIsVerifyingPayment(false)
    }
  }, [searchParams, setWheelResult, markAsSpun, initializeBoxes])

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
    verifyPayment()
  }, [params.id, router, verifyPayment])

  useEffect(() => {
    if (gameState.hasSpun && gameState.wheelResult !== null && spinResult === null) {
      setSpinResult(gameState.wheelResult)
    }
  }, [gameState.hasSpun, gameState.wheelResult, spinResult])

  const handleSpinComplete = async (result: number) => {
    setSpinResult(result)
    setWheelResult(result)
    markAsSpun()
    if (result > 0) {
      initializeBoxes(result)
    }

    // Record spin usage on backend
    if (paymentInfo?.paymentId) {
      try {
        await paymentsApi.useSpin(paymentInfo.paymentId, result)
      } catch (error) {
        console.error('Error recording spin:', error)
        // Don't block the user even if recording fails
      }
    }
  }

  const handleLoseContinue = () => {
    router.push('/')
  }

  const handleOpenBoxes = () => {
    if (contest && gameState.wheelResult && gameState.wheelResult > 0) {
      router.push(`/boxes/${contest.id}`)
    }
  }

  const handleGoToContest = () => {
    const contestId = params.id as string
    router.push(`/contest/${contestId}`)
  }

  if (isPageLoading || isVerifyingPayment) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner 
          size="lg" 
          text={isVerifyingPayment ? "Verifying Payment" : "Loading Wheel"} 
        />
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

  // Payment error or no payment - show message
  if (paymentError || !paymentInfo) {
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
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="text-6xl mb-6"
          >
            💳
          </motion.div>
          <AlertCircle className="w-16 h-16 mx-auto text-amber-400 mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Payment Required
          </h1>
          <p className="text-gray-500 mb-6">
            {paymentError || 'Please complete payment to spin the wheel.'}
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleGoToContest}
            className={cn(
              'px-8 py-3 rounded-kawaii',
              'bg-gradient-to-r from-pink-500 to-purple-500',
              'text-white font-bold',
              'flex items-center gap-2 mx-auto'
            )}
          >
            <CreditCard size={20} />
            Make Payment
          </motion.button>
        </motion.div>
      </div>
    )
  }

  // Spin already used - show previous result or redirect
  if (paymentInfo.spinUsed && !gameState.hasSpun) {
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
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="text-6xl mb-6"
          >
            🎡
          </motion.div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Spin Already Used
          </h1>
          <p className="text-gray-500 mb-2">
            You have already used this spin.
          </p>
          {paymentInfo.wheelResult !== undefined && (
            <p className="text-lg font-semibold text-gray-700 mb-6">
              Your result was: <span className="text-pink-500">{paymentInfo.wheelResult} {paymentInfo.wheelResult === 1 ? 'box' : 'boxes'}</span>
            </p>
          )}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {paymentInfo.wheelResult && paymentInfo.wheelResult > 0 && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push(`/boxes/${contest.id}`)}
                className={cn(
                  'px-6 py-3 rounded-kawaii',
                  `bg-gradient-to-r ${contest.color}`,
                  'text-white font-bold'
                )}
              >
                Open Your Boxes
              </motion.button>
            )}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push('/')}
              className={cn(
                'px-6 py-3 rounded-kawaii',
                'bg-gray-100 hover:bg-gray-200',
                'text-gray-700 font-bold'
              )}
            >
              Back to Home
            </motion.button>
          </div>
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
          {paymentInfo && (
            <p className="text-sm text-green-600 mt-2 flex items-center justify-center gap-1">
              <span>✓</span> Payment verified
            </p>
          )}
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
            onLoseContinue={spinResult === 0 ? handleLoseContinue : undefined}
          />
        </motion.div>

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
