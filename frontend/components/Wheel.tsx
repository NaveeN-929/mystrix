'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import confetti from 'canvas-confetti'
import { Sparkles, Volume2, VolumeX } from 'lucide-react'
import { WHEEL_COLORS, WHEEL_TEXT_COLORS, ContestConfig } from '@/lib/contestConfig'
import { calculateSpin, getConfettiConfig } from '@/lib/spinLogic'
import { cn } from '@/lib/utils'

interface WheelProps {
  contest: ContestConfig
  onSpinComplete: (result: number) => void
  hasSpun?: boolean
}

export function Wheel({ contest, onSpinComplete, hasSpun = false }: WheelProps) {
  const [isSpinning, setIsSpinning] = useState(false)
  const [rotation, setRotation] = useState(0)
  const [result, setResult] = useState<number | null>(null)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const { min, max } = contest.wheelRange
  const segments = Array.from({ length: max - min + 1 }, (_, i) => min + i)
  const segmentAngle = 360 / segments.length

  // Create audio element for spin sound
  useEffect(() => {
    audioRef.current = new Audio('/sounds/spin.mp3')
    audioRef.current.volume = 0.5
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [])

  const handleSpin = useCallback(() => {
    if (isSpinning || hasSpun || result !== null) return

    setIsSpinning(true)
    setResult(null)

    // Play sound
    if (soundEnabled && audioRef.current) {
      audioRef.current.currentTime = 0
      audioRef.current.play().catch(() => {})
    }

    const spinResult = calculateSpin(segments, rotation)
    const finalResult = spinResult.value
    setRotation(spinResult.rotation)

    // Wait for spin to complete
    setTimeout(() => {
      setIsSpinning(false)
      setResult(finalResult)
      
      // Trigger confetti only if won boxes (not 0)
      if (finalResult > 0) {
        confetti(getConfettiConfig())
        confetti({
          ...getConfettiConfig(),
          origin: { y: 0.7, x: 0.3 },
        })
        confetti({
          ...getConfettiConfig(),
          origin: { y: 0.7, x: 0.7 },
        })
      }

      // Callback with result
      setTimeout(() => {
        onSpinComplete(finalResult)
      }, 1500)
    }, 4000)
  }, [isSpinning, hasSpun, result, rotation, segments, soundEnabled, onSpinComplete])

  return (
    <div className="flex flex-col items-center">
      {/* Sound Toggle */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setSoundEnabled(!soundEnabled)}
        className="absolute top-4 right-4 p-2 rounded-full bg-white/80 shadow-md"
      >
        {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
      </motion.button>

      {/* Wheel Container */}
      <div className="wheel-container relative mb-8">
        {/* Pointer */}
        <div className="wheel-pointer">
          <svg width="40" height="50" viewBox="0 0 40 50">
            <defs>
              <linearGradient id="pointerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FF69B4" />
                <stop offset="100%" stopColor="#FF1493" />
              </linearGradient>
              <filter id="pointerShadow">
                <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#FF69B4" floodOpacity="0.5"/>
              </filter>
            </defs>
            <polygon 
              points="20,50 0,0 40,0" 
              fill="url(#pointerGrad)"
              filter="url(#pointerShadow)"
            />
            <circle cx="20" cy="10" r="5" fill="white" />
          </svg>
        </div>

        {/* Wheel */}
        <motion.svg
          width="320"
          height="320"
          viewBox="0 0 320 320"
          style={{ rotate: rotation }}
          animate={{ rotate: rotation }}
          transition={{
            duration: 4,
            ease: [0.17, 0.67, 0.12, 0.99],
          }}
          className="wheel"
        >
          <defs>
            <filter id="wheelShadow">
              <feDropShadow dx="0" dy="8" stdDeviation="12" floodColor="#FFB6C1" floodOpacity="0.4"/>
            </filter>
            {/* Gradients for each segment */}
            {segments.map((_, i) => (
              <linearGradient
                key={`grad-${i}`}
                id={`segGrad-${i}`}
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <stop offset="0%" stopColor={WHEEL_COLORS[i % WHEEL_COLORS.length]} />
                <stop offset="100%" stopColor={adjustColor(WHEEL_COLORS[i % WHEEL_COLORS.length], -20)} />
              </linearGradient>
            ))}
          </defs>

          {/* Outer Ring */}
          <circle
            cx="160"
            cy="160"
            r="155"
            fill="none"
            stroke="url(#pointerGrad)"
            strokeWidth="8"
            filter="url(#wheelShadow)"
          />

          {/* Segments */}
          <g filter="url(#wheelShadow)">
            {segments.map((segment, i) => {
              const startAngle = i * segmentAngle - 90
              const endAngle = startAngle + segmentAngle
              const path = describeArc(160, 160, 145, startAngle, endAngle)
              const textAngle = startAngle + segmentAngle / 2
              const textRadius = 100

              return (
                <g key={segment}>
                  <path
                    d={path}
                    fill={`url(#segGrad-${i})`}
                    stroke="white"
                    strokeWidth="2"
                  />
                  <text
                    x={160 + textRadius * Math.cos((textAngle * Math.PI) / 180)}
                    y={160 + textRadius * Math.sin((textAngle * Math.PI) / 180)}
                    fill={WHEEL_TEXT_COLORS[i % WHEEL_TEXT_COLORS.length]}
                    fontSize="28"
                    fontWeight="bold"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    style={{ fontFamily: 'Quicksand, sans-serif' }}
                  >
                    {segment}
                  </text>
                </g>
              )
            })}
          </g>

          {/* Center Circle */}
          <circle cx="160" cy="160" r="35" fill="white" />
          <circle cx="160" cy="160" r="30" fill="url(#pointerGrad)" />
          <text
            x="160"
            y="165"
            fill="white"
            fontSize="24"
            textAnchor="middle"
            dominantBaseline="middle"
          >
            🎁
          </text>
        </motion.svg>
      </div>

      {/* Result Display */}
      {result !== null && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="mb-6 text-center"
        >
          <p className="text-2xl text-gray-600 mb-2">You won</p>
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ repeat: 3, duration: 0.3 }}
            className="text-6xl font-bold gradient-text"
          >
            {result} {result === 1 ? 'Box' : 'Boxes'}! 🎉
          </motion.div>
        </motion.div>
      )}

      {/* Spin Button */}
      <motion.button
        whileHover={{ scale: isSpinning || hasSpun ? 1 : 1.05 }}
        whileTap={{ scale: isSpinning || hasSpun ? 1 : 0.95 }}
        onClick={handleSpin}
        disabled={isSpinning || hasSpun}
        className={cn(
          'px-12 py-4 rounded-full',
          'text-white font-bold text-xl',
          'shadow-kawaii hover:shadow-kawaii-hover',
          'transition-all duration-300',
          'flex items-center gap-3',
          isSpinning || hasSpun
            ? 'bg-gray-300 cursor-not-allowed'
            : `bg-gradient-to-r ${contest.color} shine`
        )}
      >
        <Sparkles size={24} className={isSpinning ? 'animate-spin' : ''} />
        {isSpinning ? 'Spinning...' : hasSpun ? 'Already Spun!' : 'SPIN NOW!'}
      </motion.button>
    </div>
  )
}

// Helper function to create arc path
function describeArc(
  x: number,
  y: number,
  radius: number,
  startAngle: number,
  endAngle: number
): string {
  const start = polarToCartesian(x, y, radius, endAngle)
  const end = polarToCartesian(x, y, radius, startAngle)
  const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1

  return [
    'M', x, y,
    'L', start.x, start.y,
    'A', radius, radius, 0, largeArcFlag, 0, end.x, end.y,
    'Z',
  ].join(' ')
}

function polarToCartesian(
  centerX: number,
  centerY: number,
  radius: number,
  angleInDegrees: number
) {
  const angleInRadians = (angleInDegrees * Math.PI) / 180
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  }
}

function adjustColor(color: string, amount: number): string {
  const hex = color.replace('#', '')
  const num = parseInt(hex, 16)
  const r = Math.min(255, Math.max(0, (num >> 16) + amount))
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + amount))
  const b = Math.min(255, Math.max(0, (num & 0x0000ff) + amount))
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
}

