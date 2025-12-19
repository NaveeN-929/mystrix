import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Shipping Address type
export interface ShippingAddress {
  _id: string
  name: string
  phone: string
  address: string
  city: string
  pincode: string
  isDefault?: boolean
}

// User type
export interface User {
  id: string
  name: string
  email: string
  phone: string
  walletBalance?: number
  createdAt?: string
  shippingAddresses?: ShippingAddress[]
}

// Auth Store for regular users
interface AuthStore {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  hasHydrated: boolean
  login: (user: User, token: string) => void
  logout: () => void
  setLoading: (loading: boolean) => void
  updateUser: (user: Partial<User>) => void
  setHydrated: (hydrated: boolean) => void
}

const AUTH_STORAGE_KEY = 'mystrix-auth'
const ADMIN_STORAGE_KEY = 'mystrix-admin'

// Hard-clear both user and admin persisted auth
export const clearPersistedAuth = () => {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(AUTH_STORAGE_KEY)
    localStorage.removeItem(ADMIN_STORAGE_KEY)
    sessionStorage.removeItem(AUTH_STORAGE_KEY)
    sessionStorage.removeItem(ADMIN_STORAGE_KEY)
  } catch (error) {
    console.error('Error clearing persisted auth:', error)
  }
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      hasHydrated: false,

      login: (user, token) => {
        set({
          user,
          token,
          isAuthenticated: true,
          isLoading: false,
        })
      },

      logout: () => {
        // Clear the state
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        })

        // Explicitly clear persisted storage to ensure complete logout
        clearPersistedAuth()
      },

      setLoading: (loading) => {
        set({ isLoading: loading })
      },

      updateUser: (userData) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...userData } : null,
        }))
      },

      setHydrated: (hydrated) => set({ hasHydrated: hydrated }),
    }),
    {
      name: AUTH_STORAGE_KEY,
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true)
      },
    }
  )
)

// Admin Store - separate from user auth
interface AdminStore {
  isAdmin: boolean
  adminToken: string | null
  adminEmail: string | null
  isLoading: boolean
  adminLogin: (email: string, token: string) => void
  adminLogout: () => void
  setLoading: (loading: boolean) => void
}

export const useAdminStore = create<AdminStore>()(
  persist(
    (set) => ({
      isAdmin: false,
      adminToken: null,
      adminEmail: null,
      isLoading: false,

      adminLogin: (email, token) => {
        set({
          isAdmin: true,
          adminToken: token,
          adminEmail: email,
          isLoading: false,
        })
      },

      adminLogout: () => {
        set({
          isAdmin: false,
          adminToken: null,
          adminEmail: null,
          isLoading: false,
        })

        clearPersistedAuth()
      },

      setLoading: (loading) => {
        set({ isLoading: loading })
      },
    }),
    {
      name: ADMIN_STORAGE_KEY,
      partialize: (state) => ({
        isAdmin: state.isAdmin,
        adminToken: state.adminToken,
        adminEmail: state.adminEmail,
      }),
    }
  )
)
