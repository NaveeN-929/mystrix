'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  text?: string
}

export function LoadingSpinner({ size = 'md', text }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-16 h-16',
    lg: 'w-24 h-24',
  }

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <motion.div
        className={cn(
          'relative rounded-full',
          sizeClasses[size]
        )}
      >
        {/* Outer Ring */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
          className={cn(
            'absolute inset-0 rounded-full',
            'border-4 border-pink-200',
            'border-t-pink-500 border-r-purple-500'
          )}
        />
        
        {/* Inner Ring */}
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className={cn(
            'absolute inset-2 rounded-full',
            'border-4 border-lavender-200',
            'border-b-lavender-500 border-l-mint-500'
          )}
        />
        
        {/* Center Icon */}
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
          className="absolute inset-0 flex items-center justify-center text-2xl"
        >
          🎁
        </motion.div>
      </motion.div>

      {text && (
        <p className="text-gray-600 font-medium loading-dots">
          {text}
          <span className="inline-flex">
            <span>.</span>
            <span>.</span>
            <span>.</span>
          </span>
        </p>
      )}
    </div>
  )
}

export function PageLoader() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-kawaii">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center"
      >
        <motion.div
          animate={{ 
            y: [0, -20, 0],
            rotate: [0, 10, -10, 0]
          }}
          transition={{ 
            duration: 2, 
            repeat: Infinity,
            ease: 'easeInOut'
          }}
          className="text-8xl mb-6"
        >
          🎁
        </motion.div>
        <h2 className="text-2xl font-bold gradient-text mb-4">
          mystrix
        </h2>
        <div className="flex items-center justify-center gap-2">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{ scale: [1, 1.5, 1] }}
              transition={{ 
                duration: 0.6, 
                repeat: Infinity,
                delay: i * 0.2 
              }}
              className="w-3 h-3 rounded-full bg-pink-400"
            />
          ))}
        </div>
      </motion.div>
    </div>
  )
}

