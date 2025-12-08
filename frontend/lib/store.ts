import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Product } from './api'

// Cart Store
export interface CartItem {
  product: Product
  quantity: number
  contestType: string
}

interface CartStore {
  items: CartItem[]
  addItem: (product: Product, contestType: string) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  getTotalItems: () => number
  getTotalPrice: () => number
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      
      addItem: (product, contestType) => {
        set((state) => {
          const existingItem = state.items.find(
            (item) => item.product._id === product._id
          )
          
          if (existingItem) {
            return {
              items: state.items.map((item) =>
                item.product._id === product._id
                  ? { ...item, quantity: item.quantity + 1 }
                  : item
              ),
            }
          }
          
          return {
            items: [...state.items, { product, quantity: 1, contestType }],
          }
        })
      },
      
      removeItem: (productId) => {
        set((state) => ({
          items: state.items.filter((item) => item.product._id !== productId),
        }))
      },
      
      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId)
          return
        }
        
        set((state) => ({
          items: state.items.map((item) =>
            item.product._id === productId ? { ...item, quantity } : item
          ),
        }))
      },
      
      clearCart: () => set({ items: [] }),
      
      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0)
      },
      
      getTotalPrice: () => {
        return get().items.reduce(
          (total, item) => total + item.product.price * item.quantity,
          0
        )
      },
    }),
    {
      name: 'mystery-scoop-cart',
    }
  )
)

// Game Store
export interface GameState {
  currentContest: string | null
  contestPrice: number
  wheelResult: number | null
  revealedProducts: Product[]
  boxStates: ('closed' | 'opening' | 'opened')[]
  hasSpun: boolean
}

interface GameStore {
  gameState: GameState
  setContest: (contest: string, price: number) => void
  setWheelResult: (result: number) => void
  initializeBoxes: (count: number) => void
  openBox: (index: number) => void
  addRevealedProduct: (product: Product) => void
  resetGame: () => void
  markAsSpun: () => void
}

const initialGameState: GameState = {
  currentContest: null,
  contestPrice: 0,
  wheelResult: null,
  revealedProducts: [],
  boxStates: [],
  hasSpun: false,
}

export const useGameStore = create<GameStore>((set) => ({
  gameState: initialGameState,
  
  setContest: (contest, price) => {
    set({
      gameState: {
        ...initialGameState,
        currentContest: contest,
        contestPrice: price,
      },
    })
  },
  
  setWheelResult: (result) => {
    set((state) => ({
      gameState: {
        ...state.gameState,
        wheelResult: result,
      },
    }))
  },
  
  initializeBoxes: (count) => {
    set((state) => ({
      gameState: {
        ...state.gameState,
        boxStates: Array(count).fill('closed'),
      },
    }))
  },
  
  openBox: (index) => {
    set((state) => {
      const newBoxStates = [...state.gameState.boxStates]
      newBoxStates[index] = 'opening'
      
      setTimeout(() => {
        set((s) => {
          const updatedBoxStates = [...s.gameState.boxStates]
          updatedBoxStates[index] = 'opened'
          return {
            gameState: {
              ...s.gameState,
              boxStates: updatedBoxStates,
            },
          }
        })
      }, 800)
      
      return {
        gameState: {
          ...state.gameState,
          boxStates: newBoxStates,
        },
      }
    })
  },
  
  addRevealedProduct: (product) => {
    set((state) => ({
      gameState: {
        ...state.gameState,
        revealedProducts: [...state.gameState.revealedProducts, product],
      },
    }))
  },
  
  resetGame: () => {
    set({ gameState: initialGameState })
  },
  
  markAsSpun: () => {
    set((state) => ({
      gameState: {
        ...state.gameState,
        hasSpun: true,
      },
    }))
  },
}))

