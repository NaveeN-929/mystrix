'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import confetti from 'canvas-confetti'
import { Sparkles, Volume2, VolumeX } from 'lucide-react'
import { WHEEL_COLORS, WHEEL_TEXT_COLORS, ContestConfig } from '@/lib/contestConfig'
import { calculateSpin } from '@/lib/spinLogic'
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
  const [showWheel, setShowWheel] = useState(true)
  const [showResult, setShowResult] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const blastAudioRef = useRef<HTMLAudioElement | null>(null)
  const failAudioRef = useRef<HTMLAudioElement | null>(null)

  const { min, max } = contest.wheelRange
  const segments = Array.from({ length: max - min + 1 }, (_, i) => min + i)
  const segmentAngle = 360 / segments.length

  // Create audio elements for sounds
  useEffect(() => {
    audioRef.current = new Audio('/sounds/spin.mp3')
    audioRef.current.volume = 0.5
    
    // Try to load confetti sound, fallback to box-open2 for celebration effect
    const blastAudio = new Audio('/sounds/confetti.mp3')
    blastAudio.volume = 0.7
    blastAudio.onerror = () => {
      // Fallback to box-open2 if confetti.mp3 doesn't exist
      blastAudioRef.current = new Audio('/sounds/box-open2.mp3')
      blastAudioRef.current.volume = 0.7
    }
    blastAudioRef.current = blastAudio
    
    // Sound for when result is 0 (no win)
    failAudioRef.current = new Audio('/sounds/spinfail.mp3')
    failAudioRef.current.volume = 0.6
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
      if (blastAudioRef.current) {
        blastAudioRef.current.pause()
        blastAudioRef.current = null
      }
      if (failAudioRef.current) {
        failAudioRef.current.pause()
        failAudioRef.current = null
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
      
      // Hide wheel and show result with blast effect
      setShowWheel(false)
      setTimeout(() => {
        setShowResult(true)
        
        // Play appropriate sound based on result
        if (soundEnabled) {
          if (finalResult > 0 && blastAudioRef.current) {
            // Play celebration sound for wins
            blastAudioRef.current.currentTime = 0
            blastAudioRef.current.play().catch(() => {})
          } else if (finalResult === 0 && failAudioRef.current) {
            // Play different sound for no win
            failAudioRef.current.currentTime = 0
            failAudioRef.current.play().catch(() => {})
          }
        }
        
        // Only trigger blast confetti for wins (result > 0)
        if (finalResult > 0) {
          // Trigger massive blast confetti effect
          const triggerBlast = () => {
            // Center explosion burst
            confetti({
              particleCount: 150,
              spread: 100,
              origin: { y: 0.5, x: 0.5 },
              colors: ['#FFD700', '#FFA500', '#FF8C00', '#FFDF00', '#F4C430'],
              startVelocity: 45,
              gravity: 0.8,
              scalar: 1.2,
              ticks: 200,
            })
            
            // Left burst
            confetti({
              particleCount: 80,
              angle: 60,
              spread: 55,
              origin: { x: 0.2, y: 0.6 },
              colors: ['#FFD700', '#FFA500', '#FF8C00', '#FFDF00', '#F4C430'],
              startVelocity: 40,
              gravity: 0.9,
            })
            
            // Right burst
            confetti({
              particleCount: 80,
              angle: 120,
              spread: 55,
              origin: { x: 0.8, y: 0.6 },
              colors: ['#FFD700', '#FFA500', '#FF8C00', '#FFDF00', '#F4C430'],
              startVelocity: 40,
              gravity: 0.9,
            })
            
            // Top burst
            confetti({
              particleCount: 60,
              angle: 270,
              spread: 70,
              origin: { x: 0.5, y: 0.3 },
              colors: ['#FFD700', '#FFA500', '#FF8C00', '#FFDF00', '#F4C430'],
              startVelocity: 35,
              gravity: 1.2,
            })
          }
          
          // Fire multiple bursts for dramatic effect
          triggerBlast()
          setTimeout(triggerBlast, 200)
          setTimeout(triggerBlast, 400)
        }
      }, 500)

      // Callback with result
      setTimeout(() => {
        onSpinComplete(finalResult)
      }, 2500)
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

      <AnimatePresence mode="wait">
        {/* Wheel Container - Animated out after spin */}
        {showWheel && (
          <motion.div 
            className="wheel-container relative mb-8"
            initial={{ opacity: 1, scale: 1 }}
            exit={{ 
              opacity: 0, 
              scale: 0.3, 
              rotate: 180,
              filter: 'blur(10px)'
            }}
            transition={{ duration: 0.6, ease: 'easeInOut' }}
          >
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
          </motion.div>
        )}

        {/* Result Display - Different for Win vs No Win */}
        {showResult && result !== null && result > 0 && (
          <motion.div
            key="result-win"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ 
              type: 'spring', 
              stiffness: 200, 
              damping: 15,
              duration: 0.8 
            }}
            className="mb-8 text-center relative"
          >
            {/* Glow effect behind the number */}
            <motion.div
              className="absolute inset-0 rounded-full blur-3xl"
              style={{
                background: 'radial-gradient(circle, rgba(255,215,0,0.6) 0%, rgba(255,165,0,0.3) 50%, transparent 70%)',
              }}
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.6, 1, 0.6],
              }}
              transition={{
                repeat: Infinity,
                duration: 2,
                ease: 'easeInOut',
              }}
            />
            
            <motion.p 
              className="text-2xl text-gray-600 mb-4 relative z-10"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              🎊 You won 🎊
            </motion.p>
            
            <motion.div
              animate={{ 
                scale: [1, 1.1, 1],
                textShadow: [
                  '0 0 20px rgba(255,215,0,0.8), 0 0 40px rgba(255,165,0,0.6), 0 0 60px rgba(255,140,0,0.4)',
                  '0 0 30px rgba(255,215,0,1), 0 0 60px rgba(255,165,0,0.8), 0 0 90px rgba(255,140,0,0.6)',
                  '0 0 20px rgba(255,215,0,0.8), 0 0 40px rgba(255,165,0,0.6), 0 0 60px rgba(255,140,0,0.4)',
                ]
              }}
              transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
              className="relative z-10"
              style={{
                fontSize: '8rem',
                fontWeight: '900',
                background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 25%, #FFD700 50%, #FF8C00 75%, #FFD700 100%)',
                backgroundSize: '200% 200%',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                filter: 'drop-shadow(0 4px 8px rgba(255,165,0,0.5))',
                fontFamily: 'Quicksand, sans-serif',
              }}
            >
              {result}
            </motion.div>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-3xl font-bold mt-2 relative z-10"
              style={{
                background: 'linear-gradient(135deg, #FFD700, #FFA500)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              {result === 1 ? 'Box' : 'Boxes'}! ✨
            </motion.p>
            
            {/* Sparkle particles around the number */}
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute text-2xl"
                style={{
                  top: '50%',
                  left: '50%',
                }}
                initial={{ opacity: 0, scale: 0 }}
                animate={{
                  opacity: [0, 1, 0],
                  scale: [0.5, 1.2, 0.5],
                  x: [0, Math.cos((i * 45 * Math.PI) / 180) * 120],
                  y: [0, Math.sin((i * 45 * Math.PI) / 180) * 120],
                }}
                transition={{
                  repeat: Infinity,
                  duration: 2,
                  delay: i * 0.15,
                  ease: 'easeOut',
                }}
              >
                ⭐
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* No Win Display - Different styling for 0 */}
        {showResult && result === 0 && (
          <motion.div
            key="result-lose"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ 
              type: 'spring', 
              stiffness: 200, 
              damping: 15,
              duration: 0.8 
            }}
            className="mb-8 text-center relative"
          >
            <motion.p 
              className="text-2xl text-gray-500 mb-4 relative z-10"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              Oh no...
            </motion.p>
            
            <motion.div
              animate={{ 
                scale: [1, 1.05, 1],
              }}
              transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
              className="relative z-10"
              style={{
                fontSize: '6rem',
                fontWeight: '900',
                background: 'linear-gradient(135deg, #9CA3AF 0%, #6B7280 50%, #9CA3AF 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                filter: 'drop-shadow(0 4px 8px rgba(107,114,128,0.3))',
                fontFamily: 'Quicksand, sans-serif',
              }}
            >
              0
            </motion.div>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-2xl font-medium mt-2 text-gray-500 relative z-10"
            >
              Better luck next time! 🍀
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

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

