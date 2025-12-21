'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { useSession } from 'next-auth/react'
import { ArrowRight, Sparkles, Gift, Star, AlertCircle, CreditCard, Wallet } from 'lucide-react'
import { ContestConfig, normalizeContest } from '@/lib/contestConfig'
import { contestsApi, paymentsApi } from '@/lib/api'
import { useGameStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { openRazorpayCheckout } from '@/lib/razorpay'
import { useCartStore } from '@/lib/store'

export default function ContestPage() {
  const router = useRouter()
  const params = useParams()
  const { data: session, update } = useSession()
  const user = session?.user
  const token = session?.accessToken

  const [contest, setContest] = useState<ContestConfig | null>(null)
  const [allContests, setAllContests] = useState<ContestConfig[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isPageLoading, setIsPageLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [paymentError, setPaymentError] = useState<string | null>(null)
  const [useWallet, setUseWallet] = useState(false)

  const setContestStore = useGameStore((state) => state.setContest)
  const resetGame = useGameStore((state) => state.resetGame)
  const { walletRewards } = useCartStore()

  const walletBalance = user?.walletBalance || 0
  const finalPrice = useWallet ? Math.max(0, (contest?.price || 0) - walletBalance) : (contest?.price || 0)
  const discountAmount = useWallet ? Math.min(walletBalance, (contest?.price || 0)) : 0

  useEffect(() => {
    async function fetchContest() {
      const contestId = params.id as string
      try {
        // Fetch all active contests for "other contests" section
        const allData = await contestsApi.getAll()
        if (allData.contests && allData.contests.length > 0) {
          setAllContests(allData.contests.map(normalizeContest))
        }

        // Try to fetch specific contest from API
        const data = await contestsApi.getById(contestId)
        if (data.contest && data.contest.isActive !== false) {
          setContest(normalizeContest(data.contest))
        } else {
          // Contest not found or not active
          setNotFound(true)
        }
      } catch (error) {
        // Contest not found in database
        console.error('Failed to fetch contest from API:', error)
        setNotFound(true)
      } finally {
        setIsPageLoading(false)
      }
    }

    // Reset game state when entering a new contest
    resetGame()
    fetchContest()
  }, [params.id, router, resetGame])

  const handleStartGame = async () => {
    if (!contest || isLoading) return

    setIsLoading(true)
    setPaymentError(null)

    try {
      // Use user details if logged in, otherwise use placeholder
      const customerInfo = user
        ? {
          name: user.name || 'Customer',
          email: user.email || 'customer@example.com',
          phone: user.phone || '9999999999',
        }
        : {
          name: 'Customer',
          email: 'customer@example.com',
          phone: '9999999999',
        }

      // Set contest in store
      setContestStore(contest.id, contest.price)

      // 1. Create Order
      const order = await paymentsApi.createOrder(
        {
          contestId: contest.id,
          customerInfo,
          useWallet,
        },
        token || undefined
      )

      // Update session if wallet was used (deduction happens on backend createOrder)
      if (user && discountAmount > 0) {
        const newBalance = order.walletBalance !== undefined
          ? order.walletBalance
          : walletBalance - discountAmount
        await update({ user: { ...user, walletBalance: newBalance } })
      }

      // 1.5 Handle Full Wallet Payment
      if (order.status === 'PAID') {
        router.push(`/wheel/${contest.id}?payment_id=${order.paymentId}`)
        return
      }

      // 2. Open Razorpay Checkout
      const result = await openRazorpayCheckout({
        key: order.key,
        amount: order.amount,
        currency: order.currency,
        name: order.name,
        description: order.description,
        orderId: order.orderId, // Razorpay Order ID
        prefill: order.prefill,
      })

      // 3. Verify Payment
      const verification = await paymentsApi.verifyPayment({
        razorpay_order_id: result.razorpay_order_id,
        razorpay_payment_id: result.razorpay_payment_id,
        razorpay_signature: result.razorpay_signature,
      })

      if (verification.success && verification.status === 'PAID') {
        // Success! Redirect to wheel
        router.push(`/wheel/${contest.id}?payment_id=${order.paymentId}`)
      } else {
        setPaymentError('Payment verification failed. Please contact support.')
        setIsLoading(false)
      }

    } catch (error) {
      console.error('Payment error:', error)
      setPaymentError(
        error instanceof Error ? error.message : 'Something went wrong. Please try again.'
      )
      setIsLoading(false)
    }
  }

  if (isPageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading Contest" />
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
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="text-6xl mb-6"
          >
            😢
          </motion.div>
          <AlertCircle className="w-16 h-16 mx-auto text-pink-400 mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Contest Not Available
          </h1>
          <p className="text-gray-500 mb-6">
            This contest is not currently active or doesn&apos;t exist.
            Please check back later or try another contest.
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push('/')}
            className={cn(
              'px-8 py-3 rounded-kawaii',
              'bg-gradient-to-r from-pink-500 to-purple-500',
              'text-white font-bold',
              'shadow-kawaii hover:shadow-kawaii-hover',
              'transition-all duration-300'
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
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => router.push('/')}
          className={cn(
            'mb-8 flex items-center gap-2',
            'text-gray-600 hover:text-pink-500',
            'transition-colors duration-300'
          )}
        >
          <ArrowRight size={20} className="rotate-180" />
          Back to Contests
        </motion.button>

        {/* Contest Details */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className={cn(
            'rounded-super overflow-hidden',
            'shadow-kawaii border-2 border-white/50',
            contest.gradient
          )}
        >
          {/* Header */}
          <div className="p-8 sm:p-12 text-center">
            <motion.div
              animate={{
                y: [0, -10, 0],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ repeat: Infinity, duration: 3 }}
              className="text-7xl sm:text-8xl mb-6"
            >
              {contest.icon}
            </motion.div>

            <h1 className="text-3xl sm:text-5xl font-extrabold text-gray-800 mb-4">
              {contest.name}
            </h1>

            <div className={cn(
              'inline-block text-4xl sm:text-6xl font-black mb-4',
              'bg-gradient-to-r bg-clip-text text-transparent',
              contest.color
            )}>
              {contest.priceDisplay || `₹${contest.price}`}
            </div>

            <p className="text-lg text-gray-600 max-w-lg mx-auto">
              {contest.description}
            </p>
          </div>

          {/* Features Grid */}
          <div className="bg-white/60 backdrop-blur-sm p-8 sm:p-12">
            <h2 className="text-xl font-bold text-gray-800 mb-6 text-center">
              What You Get ✨
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
              <FeatureCard
                icon={<Star size={28} />}
                title="Wheel Range"
                value={`${contest.wheelRange.min} - ${contest.wheelRange.max}`}
                subtitle="Boxes to Win"
                color={contest.color}
              />
              <FeatureCard
                icon={<Gift size={28} />}
                title="Per Box"
                value={contest.productsPerBox.toString()}
                subtitle={`Product${contest.productsPerBox > 1 ? 's' : ''} Each`}
                color={contest.color}
              />
              <FeatureCard
                icon={<Sparkles size={28} />}
                title="Max Products"
                value={(contest.wheelRange.max * contest.productsPerBox).toString()}
                subtitle="Possible Wins"
                color={contest.color}
              />
            </div>

            {/* How It Works */}
            <div className="bg-white/80 rounded-kawaii p-6 mb-8">
              <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span className="text-xl">📝</span>
                How This Contest Works:
              </h3>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-start gap-3">
                  <span className={cn(
                    'w-6 h-6 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0',
                    `bg-gradient-to-r ${contest.color}`
                  )}>1</span>
                  <span>Pay {contest.priceDisplay || `₹${contest.price}`} securely via UPI, Cards, or Netbanking</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className={cn(
                    'w-6 h-6 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0',
                    `bg-gradient-to-r ${contest.color}`
                  )}>2</span>
                  <span>Spin the wheel to win {contest.wheelRange.min}-{contest.wheelRange.max} mystery boxes</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className={cn(
                    'w-6 h-6 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0',
                    `bg-gradient-to-r ${contest.color}`
                  )}>3</span>
                  <span>
                    Open each box to reveal {contest.productsPerBox} amazing product{contest.productsPerBox > 1 ? 's' : ''}
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className={cn(
                    'w-6 h-6 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0',
                    `bg-gradient-to-r ${contest.color}`
                  )}>4</span>
                  <span>Add products to cart and checkout - products ship to you!</span>
                </li>
              </ul>
            </div>

            {/* Guest Reward Nudge */}
            {!user && walletRewards > 0 && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-amber-50 border-2 border-amber-100 rounded-kawaii p-6 mb-8 flex flex-col sm:flex-row items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-amber-500 flex items-center justify-center text-white">
                    <Wallet size={24} />
                  </div>
                  <div className="text-center sm:text-left">
                    <p className="text-sm text-amber-700 uppercase font-bold tracking-wider">Unclaimed Reward!</p>
                    <p className="text-2xl font-black text-amber-800">₹{walletRewards}</p>
                  </div>
                </div>

                <Link href={`/login?redirect=/contest/${contest.id}`}>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-6 py-2 bg-amber-500 text-white font-bold rounded-full shadow-sm hover:bg-amber-600 transition-colors text-sm"
                  >
                    Login to claim & use!
                  </motion.button>
                </Link>
              </motion.div>
            )}

            {/* Wallet Section */}
            {user && walletBalance > 0 && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-purple-50 border-2 border-purple-100 rounded-kawaii p-6 mb-8 flex flex-col sm:flex-row items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-purple-500 flex items-center justify-center text-white">
                    <Wallet size={24} />
                  </div>
                  <div className="text-center sm:text-left">
                    <p className="text-sm text-gray-500 uppercase font-bold tracking-wider">Your Wallet</p>
                    <p className="text-2xl font-black text-purple-600">₹{walletBalance}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-600">Use balance?</span>
                  <button
                    onClick={() => setUseWallet(!useWallet)}
                    className={cn(
                      'w-14 h-8 rounded-full transition-all duration-300 relative',
                      useWallet ? 'bg-purple-500' : 'bg-gray-200'
                    )}
                  >
                    <motion.div
                      animate={{ x: useWallet ? 24 : 4 }}
                      className="w-6 h-6 rounded-full bg-white absolute top-1"
                    />
                  </button>
                </div>
              </motion.div>
            )}

            {/* Error Message */}
            {paymentError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 border border-red-200 rounded-kawaii p-4 mb-6 text-red-600 text-sm flex items-start gap-2"
              >
                <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
                <span>{paymentError}</span>
              </motion.div>
            )}

            {/* Play Button */}
            <motion.button
              whileHover={{ scale: isLoading ? 1 : 1.02 }}
              whileTap={{ scale: isLoading ? 1 : 0.98 }}
              onClick={handleStartGame}
              disabled={isLoading}
              className={cn(
                'w-full py-5 rounded-kawaii',
                'text-white font-bold text-xl',
                'shadow-lg hover:shadow-xl',
                'transition-all duration-300',
                'flex items-center justify-center gap-3',
                isLoading
                  ? 'bg-gray-300 cursor-wait'
                  : `bg-gradient-to-r ${contest.color} shine`
              )}
            >
              {isLoading ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                  >
                    <Sparkles size={24} />
                  </motion.div>
                  Opening Payment Gateway...
                </>
              ) : (
                <>
                  <CreditCard size={24} />
                  {finalPrice === 0 ? 'Join for FREE!' : `Pay ₹${finalPrice} & Play Now!`}
                  <ArrowRight size={24} />
                </>
              )}
            </motion.button>

            <p className="text-center text-gray-400 text-sm mt-4 flex items-center justify-center gap-2">
              <span className="text-lg">🔒</span>
              Powered by Cashfree • UPI • Cards • Netbanking
            </p>
          </div>
        </motion.div>

        {/* Other Contests */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-12"
        >
          <h3 className="text-lg font-bold text-gray-700 mb-4 text-center">
            Or try another contest:
          </h3>
          <div className="flex flex-wrap justify-center gap-4">
            {allContests.filter(c => c.id !== contest.id).map((c) => (
              <motion.button
                key={c.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push(`/contest/${c.id}`)}
                className={cn(
                  'px-6 py-3 rounded-kawaii',
                  'bg-white shadow-soft hover:shadow-kawaii',
                  'border-2 border-pink-100',
                  'flex items-center gap-2',
                  'transition-all duration-300'
                )}
              >
                <span>{c.icon}</span>
                <span className="font-medium text-gray-700">{c.name}</span>
                <span className={cn(
                  'font-bold bg-gradient-to-r bg-clip-text text-transparent',
                  c.color
                )}>
                  {c.priceDisplay || `₹${c.price}`}
                </span>
              </motion.button>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}

function FeatureCard({
  icon,
  title,
  value,
  subtitle,
  color,
}: {
  icon: React.ReactNode
  title: string
  value: string
  subtitle: string
  color: string
}) {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      className={cn(
        'bg-white/80 rounded-kawaii p-6 text-center',
        'shadow-soft hover:shadow-kawaii',
        'transition-all duration-300'
      )}
    >
      <div className={cn(
        'w-14 h-14 mx-auto mb-3 rounded-full',
        'flex items-center justify-center',
        'text-white',
        `bg-gradient-to-r ${color}`
      )}>
        {icon}
      </div>
      <p className="text-sm text-gray-500">{title}</p>
      <p className="text-3xl font-bold text-gray-800">{value}</p>
      <p className="text-sm text-gray-500">{subtitle}</p>
    </motion.div>
  )
}
