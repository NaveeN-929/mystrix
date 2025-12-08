import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// User type
export interface User {
  id: string
  name: string
  email: string
  phone: string
}

// Auth Store for regular users
interface AuthStore {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (user: User, token: string) => void
  logout: () => void
  setLoading: (loading: boolean) => void
  updateUser: (user: Partial<User>) => void
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      login: (user, token) => {
        set({
          user,
          token,
          isAuthenticated: true,
          isLoading: false,
        })
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        })
      },

      setLoading: (loading) => {
        set({ isLoading: loading })
      },

      updateUser: (userData) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...userData } : null,
        }))
      },
    }),
    {
      name: 'mystrix-auth',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
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
      },

      setLoading: (loading) => {
        set({ isLoading: loading })
      },
    }),
    {
      name: 'mystrix-admin',
      partialize: (state) => ({
        isAdmin: state.isAdmin,
        adminToken: state.adminToken,
        adminEmail: state.adminEmail,
      }),
    }
  )
)
