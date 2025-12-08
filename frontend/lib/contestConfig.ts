// Contest Configuration
export interface ContestConfig {
  id: string
  contestId?: string
  _id?: string
  name: string
  price: number
  priceDisplay?: string
  wheelRange: { min: number; max: number }
  productsPerBox: number
  description: string
  color: string
  gradient: string
  icon: string
  badge?: string
  isActive?: boolean
  maxSpinsPerUser?: number
}

// Default contests (used as fallback when API is unavailable)
export const CONTESTS: ContestConfig[] = [
  {
    id: 'A',
    contestId: 'A',
    name: 'Starter Scoop',
    price: 100,
    priceDisplay: '₹100',
    wheelRange: { min: 0, max: 5 },
    productsPerBox: 1,
    description: 'Spin to win 0-5 mystery boxes!',
    color: 'from-pink-400 to-pink-500',
    gradient: 'bg-gradient-to-br from-pink-100 via-pink-50 to-rose-100',
    icon: '🎀',
    badge: 'Popular',
    isActive: true,
    maxSpinsPerUser: 1,
  },
  {
    id: 'B',
    contestId: 'B',
    name: 'Super Scoop',
    price: 299,
    priceDisplay: '₹299',
    wheelRange: { min: 0, max: 10 },
    productsPerBox: 1,
    description: 'Spin to win 0-10 mystery boxes!',
    color: 'from-purple-400 to-purple-500',
    gradient: 'bg-gradient-to-br from-lavender-100 via-purple-50 to-violet-100',
    icon: '🌟',
    badge: 'Best Value',
    isActive: true,
    maxSpinsPerUser: 1,
  },
  {
    id: 'C',
    contestId: 'C',
    name: 'Mega Scoop',
    price: 499,
    priceDisplay: '₹499',
    wheelRange: { min: 1, max: 10 },
    productsPerBox: 2,
    description: 'Double products in each box! Guaranteed win!',
    color: 'from-teal-400 to-emerald-500',
    gradient: 'bg-gradient-to-br from-mint-100 via-teal-50 to-emerald-100',
    icon: '💎',
    badge: 'Premium',
    isActive: true,
    maxSpinsPerUser: 1,
  },
]

export function getContestById(id: string): ContestConfig {
  return CONTESTS.find((c) => c.id === id) || CONTESTS[0]
}

// Helper to convert API contest to ContestConfig
export function normalizeContest(apiContest: any): ContestConfig {
  return {
    id: apiContest.contestId || apiContest.id || apiContest._id,
    contestId: apiContest.contestId,
    _id: apiContest._id,
    name: apiContest.name,
    price: apiContest.price,
    priceDisplay: `₹${apiContest.price}`,
    wheelRange: apiContest.wheelRange,
    productsPerBox: apiContest.productsPerBox,
    description: apiContest.description,
    color: apiContest.color || 'from-pink-400 to-pink-500',
    gradient: apiContest.gradient || 'bg-gradient-to-br from-pink-100 via-pink-50 to-rose-100',
    icon: apiContest.icon || '🎁',
    badge: apiContest.badge,
    isActive: apiContest.isActive,
    maxSpinsPerUser: apiContest.maxSpinsPerUser || 1,
  }
}

export function generateWheelSegments(contest: ContestConfig): number[] {
  const { min, max } = contest.wheelRange
  return Array.from({ length: max - min + 1 }, (_, i) => min + i)
}

// Wheel segment colors for kawaii theme
export const WHEEL_COLORS = [
  '#FFB6C1', // Light pink
  '#E6E6FA', // Lavender
  '#B2F5EA', // Mint
  '#FFDAB9', // Peach
  '#87CEEB', // Sky blue
  '#DDA0DD', // Plum
  '#F0E68C', // Khaki
  '#98FB98', // Pale green
  '#FFE4E1', // Misty rose
  '#E0FFFF', // Light cyan
]

export const WHEEL_TEXT_COLORS = [
  '#C71585', // Medium violet red
  '#663399', // Rebecca purple
  '#20B2AA', // Light sea green
  '#CD853F', // Peru
  '#4682B4', // Steel blue
  '#9932CC', // Dark orchid
  '#BDB76B', // Dark khaki
  '#228B22', // Forest green
  '#DB7093', // Pale violet red
  '#008B8B', // Dark cyan
]

