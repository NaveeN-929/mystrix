'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Sparkles, Gift, Star } from 'lucide-react'
import { ContestConfig } from '@/lib/contestConfig'
import { cn } from '@/lib/utils'

interface ContestCardProps {
  contest: ContestConfig
  index: number
}

export function ContestCard({ contest, index }: ContestCardProps) {
  const cardContent = (
    <>
      {/* Glow Effect */}
      <div
        className={cn(
          'absolute inset-0 rounded-super blur-xl opacity-0 group-hover:opacity-60',
          'transition-opacity duration-500',
          contest.id === 'A' && 'bg-pink-300',
          contest.id === 'B' && 'bg-purple-300',
          contest.id === 'C' && 'bg-teal-300'
        )}
      />

        {/* Card */}
        <div
          className={cn(
            'relative overflow-hidden',
            'rounded-super p-6 sm:p-8',
            'border-2 border-white/50',
            'shadow-kawaii hover:shadow-kawaii-hover',
            'transition-all duration-300',
            contest.gradient
          )}
        >
          {/* Badge */}
          {contest.badge && (
            <motion.div
              initial={{ rotate: -12, scale: 0 }}
              animate={{ rotate: -12, scale: 1 }}
              transition={{ delay: index * 0.15 + 0.3, type: 'spring' }}
              className={cn(
                'absolute -top-2 -right-2 sm:top-2 sm:right-2',
                'px-3 py-1 rounded-full',
                'text-xs font-bold text-white',
                'shadow-lg',
                `bg-gradient-to-r ${contest.color}`
              )}
            >
              ✨ {contest.badge}
            </motion.div>
          )}

          {/* Icon */}
          <motion.div
            animate={{ 
              rotate: [0, -5, 5, -5, 0],
              y: [0, -5, 0]
            }}
            transition={{ 
              duration: 2, 
              repeat: Infinity, 
              repeatDelay: 1,
              delay: index * 0.3
            }}
            className="text-5xl sm:text-6xl mb-4"
          >
            {contest.icon}
          </motion.div>

          {/* Contest Name */}
          <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">
            {contest.name}
          </h3>

          {/* Price */}
          <div className={cn(
            'text-3xl sm:text-4xl font-extrabold mb-3',
            'bg-gradient-to-r bg-clip-text text-transparent',
            contest.color
          )}>
            {contest.priceDisplay || `₹${contest.price}`}
          </div>

          {/* Description */}
          <p className="text-gray-600 text-sm sm:text-base mb-4">
            {contest.description}
          </p>

          {/* Features */}
          <div className="space-y-2 mb-6">
            <Feature 
              icon={<Star size={16} />} 
              text={`Wheel: ${contest.wheelRange.min}-${contest.wheelRange.max} boxes`} 
            />
            <Feature 
              icon={<Gift size={16} />} 
              text={`${contest.productsPerBox} product${contest.productsPerBox > 1 ? 's' : ''} per box`} 
            />
            <Feature 
              icon={<Sparkles size={16} />} 
              text="Surprise gifts included!" 
            />
          </div>

          {/* CTA Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={cn(
              'w-full py-3 px-6 rounded-kawaii',
              'text-white font-bold text-lg',
              'transition-all duration-300',
              'flex items-center justify-center gap-2',
              `bg-gradient-to-r ${contest.color} shadow-lg hover:shadow-xl`
            )}
          >
            <Sparkles size={20} />
            Play Now
          </motion.button>

          {/* Decorative Elements */}
          <div className="absolute top-4 left-4 opacity-20">
            <Star className="w-8 h-8 text-pink-400 animate-pulse" />
          </div>
          <div className="absolute bottom-4 right-4 opacity-20">
            <Gift className="w-6 h-6 text-purple-400 animate-bounce-slow" />
          </div>
        </div>
    </>
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.15, duration: 0.5 }}
      whileHover={{ y: -10, scale: 1.02 }}
      className="relative group"
    >
      <Link href={`/contest/${contest.id}`}>
        {cardContent}
      </Link>
    </motion.div>
  )
}

function Feature({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-2 text-gray-600 text-sm">
      <span className="text-pink-400">{icon}</span>
      <span>{text}</span>
    </div>
  )
}

