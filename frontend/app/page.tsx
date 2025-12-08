'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Sparkles, Gift, Star, Heart } from 'lucide-react'
import { ContestCard } from '@/components/ContestCard'
import { CONTESTS, ContestConfig, normalizeContest } from '@/lib/contestConfig'
import { contestsApi } from '@/lib/api'
import { cn } from '@/lib/utils'

export default function HomePage() {
  const [contests, setContests] = useState<ContestConfig[]>(CONTESTS)
  const [isLoading, setIsLoading] = useState(true)
  const [isUsingFallback, setIsUsingFallback] = useState(false)

  useEffect(() => {
    async function fetchContests() {
      try {
        const data = await contestsApi.getAll()
        if (data.contests && data.contests.length > 0) {
          setContests(data.contests.map(normalizeContest))
          setIsUsingFallback(false)
        } else {
          // No active contests in DB - use fallback but hide prices
          setIsUsingFallback(true)
        }
      } catch (error) {
        console.error('Failed to fetch contests, using defaults:', error)
        // Keep using default CONTESTS on error - hide prices
        setIsUsingFallback(true)
      } finally {
        setIsLoading(false)
      }
    }
    fetchContests()
  }, [])
  return (
    <div className="min-h-screen pb-20">
      {/* Hero Section */}
      <section className="relative px-4 pt-8 pb-16 overflow-hidden">
        {/* Floating Decorations */}
        <FloatingElement emoji="⭐" className="top-20 left-[10%]" delay={0} />
        <FloatingElement emoji="🎀" className="top-32 right-[15%]" delay={0.5} />
        <FloatingElement emoji="💖" className="top-48 left-[20%]" delay={1} />
        <FloatingElement emoji="✨" className="top-24 right-[25%]" delay={1.5} />
        <FloatingElement emoji="🌟" className="top-40 left-[5%]" delay={2} />

        <div className="max-w-4xl mx-auto text-center">
          {/* Animated Title */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <motion.div
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
              className="text-6xl sm:text-7xl mb-4"
            >
              🎁
            </motion.div>
            
            <h1 className="text-4xl sm:text-6xl font-extrabold mb-4">
              <span className="gradient-text">mystrix</span>
            </h1>
            
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="text-lg sm:text-xl text-gray-600 mb-2"
            >
              Spin the wheel, unlock mystery boxes, and win amazing surprises! ✨
            </motion.p>
            
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="text-gray-500"
            >
              Every box is a new adventure 🎉
            </motion.p>
          </motion.div>

          {/* Stats Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.5 }}
            className="flex flex-wrap justify-center gap-6 mt-10"
          >
            <StatBadge icon={<Gift size={20} />} value="1000+" label="Boxes Opened" />
            <StatBadge icon={<Star size={20} />} value="500+" label="Happy Winners" />
            <StatBadge icon={<Heart size={20} />} value="200+" label="Unique Products" />
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section className="px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-2xl sm:text-3xl font-bold text-center text-gray-800 mb-8"
          >
            How It Works ✨
          </motion.h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <HowItWorksStep
              number={1}
              emoji="🎰"
              title="Choose & Spin"
              description="Pick a contest and spin the magical wheel!"
              color="from-pink-400 to-rose-400"
              delay={0}
            />
            <HowItWorksStep
              number={2}
              emoji="📦"
              title="Open Boxes"
              description="Tap mystery boxes to reveal your prizes!"
              color="from-purple-400 to-violet-400"
              delay={0.1}
            />
            <HowItWorksStep
              number={3}
              emoji="🎁"
              title="Win Products"
              description="Add amazing products to your cart!"
              color="from-teal-400 to-emerald-400"
              delay={0.2}
            />
          </div>
        </div>
      </section>

      {/* Contest Cards */}
      <section className="px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-4">
              Choose Your Adventure 🚀
            </h2>
            <p className="text-gray-600 max-w-lg mx-auto">
              Select a contest below and start your mystrix journey! 
              Each contest offers unique rewards and excitement.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {isLoading ? (
              // Loading skeleton
              [...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-gradient-to-br from-pink-100 to-purple-100 rounded-super p-8 h-96">
                    <div className="w-16 h-16 bg-pink-200 rounded-full mx-auto mb-4" />
                    <div className="h-6 bg-pink-200 rounded w-3/4 mx-auto mb-3" />
                    <div className="h-8 bg-pink-200 rounded w-1/2 mx-auto mb-4" />
                    <div className="h-4 bg-pink-200 rounded w-full mb-2" />
                    <div className="h-4 bg-pink-200 rounded w-2/3" />
                  </div>
                </div>
              ))
            ) : (
              contests.map((contest, index) => (
                <ContestCard 
                  key={contest.id} 
                  contest={contest} 
                  index={index} 
                  hidePrice={isUsingFallback} 
                  disabled={isUsingFallback}
                />
              ))
            )}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-2xl sm:text-3xl font-bold text-center text-gray-800 mb-8"
          >
            What Our Players Say 💬
          </motion.h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <TestimonialCard
              name="Priya S."
              emoji="👧"
              message="Won 5 amazing skincare products! This is so much fun! 💕"
              delay={0}
            />
            <TestimonialCard
              name="Ananya R."
              emoji="👩"
              message="The surprise element makes shopping so exciting! Love it! ✨"
              delay={0.1}
            />
            <TestimonialCard
              name="Meera K."
              emoji="👱‍♀️"
              message="Best value for money! Got premium products at amazing prices! 🎉"
              delay={0.2}
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 py-16">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className={cn(
            'max-w-2xl mx-auto text-center',
            'bg-gradient-to-br from-pink-100 via-purple-50 to-teal-50',
            'rounded-super p-8 sm:p-12',
            'shadow-kawaii border-2 border-white'
          )}
        >
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="text-5xl mb-4"
          >
            🎰
          </motion.div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-4">
            Ready to Start?
          </h2>
          <p className="text-gray-600 mb-6">
            Your next favorite product is just a spin away! 
            Join thousands of happy winners today.
          </p>
          <motion.a
            href="#contests"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={cn(
              'inline-flex items-center gap-2',
              'px-8 py-4 rounded-full',
              'bg-gradient-to-r from-pink-500 to-purple-500',
              'text-white font-bold text-lg',
              'shadow-lg hover:shadow-xl',
              'transition-all duration-300'
            )}
          >
            <Sparkles size={24} />
            Play Now!
          </motion.a>
        </motion.div>
      </section>
    </div>
  )
}

// Helper Components
function FloatingElement({ emoji, className, delay }: { emoji: string; className: string; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ 
        opacity: [0.5, 1, 0.5],
        y: [0, -15, 0]
      }}
      transition={{
        duration: 3,
        repeat: Infinity,
        delay,
      }}
      className={cn('absolute text-2xl sm:text-3xl pointer-events-none', className)}
    >
      {emoji}
    </motion.div>
  )
}

function StatBadge({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      className={cn(
        'flex items-center gap-3 px-5 py-3',
        'bg-white/80 backdrop-blur-sm rounded-kawaii',
        'shadow-soft border border-pink-100'
      )}
    >
      <span className="text-pink-500">{icon}</span>
      <div className="text-left">
        <p className="font-bold text-gray-800">{value}</p>
        <p className="text-xs text-gray-500">{label}</p>
      </div>
    </motion.div>
  )
}

function HowItWorksStep({
  number,
  emoji,
  title,
  description,
  color,
  delay,
}: {
  number: number
  emoji: string
  title: string
  description: string
  color: string
  delay: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.5 }}
      className="relative"
    >
      <div className={cn(
        'bg-white/80 backdrop-blur-sm rounded-super p-6',
        'shadow-kawaii border border-white/50',
        'text-center'
      )}>
        {/* Step Number */}
        <div className={cn(
          'absolute -top-3 left-1/2 -translate-x-1/2',
          'w-8 h-8 rounded-full',
          'flex items-center justify-center',
          'text-white font-bold text-sm',
          `bg-gradient-to-r ${color}`
        )}>
          {number}
        </div>

        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ repeat: Infinity, duration: 2, delay: delay * 2 }}
          className="text-4xl mb-3 mt-2"
        >
          {emoji}
        </motion.div>
        <h3 className="font-bold text-gray-800 mb-2">{title}</h3>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
    </motion.div>
  )
}

function TestimonialCard({
  name,
  emoji,
  message,
  delay,
}: {
  name: string
  emoji: string
  message: string
  delay: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.5 }}
      whileHover={{ y: -5 }}
      className={cn(
        'bg-white/80 backdrop-blur-sm rounded-super p-6',
        'shadow-kawaii border border-white/50'
      )}
    >
      <div className="text-3xl mb-3">{emoji}</div>
      <p className="text-gray-600 mb-4 text-sm italic">&ldquo;{message}&rdquo;</p>
      <p className="font-bold text-pink-500 text-sm">{name}</p>
      <div className="flex gap-1 mt-2">
        {[...Array(5)].map((_, i) => (
          <Star key={i} size={14} className="text-yellow-400 fill-yellow-400" />
        ))}
      </div>
    </motion.div>
  )
}

