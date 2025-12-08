// Spin Wheel Logic and Utilities

export interface SpinResult {
  value: number
  rotation: number
  segmentIndex: number
}

/**
 * Calculate the spin result
 * @param segments - Array of segment values
 * @param currentRotation - Current wheel rotation in degrees
 * @returns SpinResult with the winning value and final rotation
 */
export function calculateSpin(
  segments: number[],
  currentRotation: number = 0
): SpinResult {
  const segmentCount = segments.length
  const segmentAngle = 360 / segmentCount
  
  // Random number of full rotations (5-10 spins)
  const fullRotations = Math.floor(Math.random() * 5) + 5
  
  // Random winning segment
  const winningSegmentIndex = Math.floor(Math.random() * segmentCount)
  
  // Calculate the angle to stop at (pointer is at top, so we need to adjust)
  const targetAngle = winningSegmentIndex * segmentAngle + segmentAngle / 2
  
  // Total rotation = full rotations + target angle + offset to center segment under pointer
  const totalRotation = fullRotations * 360 + (360 - targetAngle) + 90
  
  return {
    value: segments[winningSegmentIndex],
    rotation: currentRotation + totalRotation,
    segmentIndex: winningSegmentIndex,
  }
}

/**
 * Generate random product numbers for mystery boxes
 * @param count - Number of product numbers to generate
 * @param maxProductNumber - Maximum product number in inventory
 * @returns Array of unique random product numbers
 */
export function generateRandomProductNumbers(
  count: number,
  maxProductNumber: number = 200
): number[] {
  const numbers: Set<number> = new Set()
  
  while (numbers.size < count) {
    const randomNum = Math.floor(Math.random() * maxProductNumber) + 1
    numbers.add(randomNum)
  }
  
  return Array.from(numbers)
}

/**
 * Easing function for smooth wheel deceleration
 */
export function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

/**
 * Calculate spin duration based on rotation amount
 */
export function calculateSpinDuration(rotation: number): number {
  const baseTime = 4000 // 4 seconds base
  const rotationFactor = rotation / 3600 // Additional time per 10 rotations
  return Math.min(baseTime + rotationFactor * 1000, 8000) // Max 8 seconds
}

/**
 * Generate confetti configuration
 */
export function getConfettiConfig() {
  return {
    particleCount: 150,
    spread: 70,
    origin: { y: 0.6 },
    colors: ['#FFB6C1', '#E6E6FA', '#B2F5EA', '#FFDAB9', '#FF69B4', '#87CEEB'],
    shapes: ['circle', 'square'] as ('circle' | 'square')[],
  }
}

/**
 * Shuffle array using Fisher-Yates algorithm
 */
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

/**
 * Delay utility for animations
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

