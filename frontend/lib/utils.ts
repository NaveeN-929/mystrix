import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

// Utility for merging Tailwind classes
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Sound effect paths
export const SOUNDS = {
  SPIN: '/sounds/spin.mp3',
  BOX_OPEN: '/sounds/box-open.mp3',
  CONFETTI: '/sounds/confetti.mp3',
  CLICK: '/sounds/click.mp3',
  SUCCESS: '/sounds/success.mp3',
}

// Animation variants for Framer Motion
export const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
}

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
}

export const scaleIn = {
  initial: { opacity: 0, scale: 0.8 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.8 },
}

export const slideInLeft = {
  initial: { opacity: 0, x: -50 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 50 },
}

export const slideInRight = {
  initial: { opacity: 0, x: 50 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -50 },
}

export const bounceIn = {
  initial: { opacity: 0, scale: 0.3 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 15,
    },
  },
  exit: { opacity: 0, scale: 0.3 },
}

export const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
}

export const staggerItem = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
}

// Box opening animation sequence
export const boxOpenSequence = {
  closed: {
    rotateY: 0,
    scale: 1,
  },
  opening: {
    rotateY: 180,
    scale: 1.1,
    transition: {
      duration: 0.8,
      ease: [0.175, 0.885, 0.32, 1.275],
    },
  },
  opened: {
    rotateY: 180,
    scale: 1,
  },
}

// Wheel spin transition
export const wheelSpinTransition = {
  duration: 4,
  ease: [0.17, 0.67, 0.12, 0.99],
}

// Confetti colors matching the kawaii theme
export const confettiColors = [
  '#FFB6C1', // Light pink
  '#E6E6FA', // Lavender
  '#B2F5EA', // Mint
  '#FFDAB9', // Peach
  '#FF69B4', // Hot pink
  '#87CEEB', // Sky blue
  '#DDA0DD', // Plum
  '#F0E68C', // Khaki
]

// Generate random position for floating elements
export function getRandomPosition() {
  return {
    x: Math.random() * 100,
    y: Math.random() * 100,
    delay: Math.random() * 2,
    duration: 2 + Math.random() * 3,
  }
}

// Truncate text with ellipsis
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

// Validate email
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Validate phone (Indian format)
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^[6-9]\d{9}$/
  return phoneRegex.test(phone)
}

// Validate pincode (Indian format)
export function isValidPincode(pincode: string): boolean {
  const pincodeRegex = /^[1-9][0-9]{5}$/
  return pincodeRegex.test(pincode)
}

// Format date
export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(date))
}

// Format price in INR
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(price)
}

// Generate unique order ID
export function generateOrderId(): string {
  const timestamp = Date.now().toString(36)
  const randomPart = Math.random().toString(36).substring(2, 8)
  return `MS-${timestamp}-${randomPart}`.toUpperCase()
}

// Get greeting based on time
export function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good Morning'
  if (hour < 17) return 'Good Afternoon'
  return 'Good Evening'
}

// Local storage helpers
export const storage = {
  get: <T>(key: string, defaultValue: T): T => {
    if (typeof window === 'undefined') return defaultValue
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : defaultValue
    } catch {
      return defaultValue
    }
  },
  set: <T>(key: string, value: T): void => {
    if (typeof window === 'undefined') return
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      console.error('Failed to save to localStorage')
    }
  },
  remove: (key: string): void => {
    if (typeof window === 'undefined') return
    try {
      localStorage.removeItem(key)
    } catch {
      console.error('Failed to remove from localStorage')
    }
  },
}

