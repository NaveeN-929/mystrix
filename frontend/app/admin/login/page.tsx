'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Mail, Lock, Eye, EyeOff, Shield, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { authApi } from '@/lib/api'
import { useAdminStore } from '@/lib/authStore'

export default function AdminLoginPage() {
  const router = useRouter()
  const { isAdmin, adminLogin } = useAdminStore()
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  // Redirect if already logged in as admin
  useEffect(() => {
    if (isAdmin) {
      router.push('/admin')
    }
  }, [isAdmin, router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const response = await authApi.adminLogin({
        email: formData.email,
        password: formData.password,
      })

      // Store admin data and token
      adminLogin(response.admin.email, response.token)
      
      // Redirect to admin dashboard
      router.push('/admin')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid admin credentials')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-pink-500/20 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 mb-4 shadow-2xl"
          >
            <Shield className="w-10 h-10 text-white" />
          </motion.div>
          <h1 className="text-3xl font-bold text-white">Admin Portal</h1>
          <p className="text-gray-400 mt-2">Secure access to mystrix dashboard 🔐</p>
        </div>

        {/* Form Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={cn(
            'bg-gray-800/80 backdrop-blur-xl rounded-2xl p-8',
            'shadow-2xl border border-gray-700/50'
          )}
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Admin Email
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="admin@mystrix.com"
                  className={cn(
                    'w-full pl-12 pr-4 py-3 rounded-xl',
                    'bg-gray-700/50 border border-gray-600',
                    'text-white placeholder:text-gray-500',
                    'focus:border-purple-500 focus:ring-1 focus:ring-purple-500',
                    'outline-none transition-all duration-300'
                  )}
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Admin Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  placeholder="Enter admin password"
                  className={cn(
                    'w-full pl-12 pr-12 py-3 rounded-xl',
                    'bg-gray-700/50 border border-gray-600',
                    'text-white placeholder:text-gray-500',
                    'focus:border-purple-500 focus:ring-1 focus:ring-purple-500',
                    'outline-none transition-all duration-300'
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-xl bg-red-500/20 border border-red-500/50 text-red-400 text-sm"
              >
                {error}
              </motion.div>
            )}

            {/* Submit Button */}
            <motion.button
              type="submit"
              disabled={isLoading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                'w-full py-4 rounded-xl font-bold text-white',
                'bg-gradient-to-r from-purple-600 to-pink-600',
                'shadow-lg hover:shadow-purple-500/25',
                'transition-all duration-300',
                'flex items-center justify-center gap-2',
                isLoading && 'opacity-70 cursor-not-allowed'
              )}
            >
              {isLoading ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                    className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                  />
                  Authenticating...
                </>
              ) : (
                <>
                  Access Dashboard
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </motion.button>
          </form>

          {/* Security Notice */}
          <div className="mt-6 p-3 rounded-xl bg-purple-500/10 border border-purple-500/30">
            <p className="text-xs text-gray-400 text-center">
              🔒 This is a secure admin area. Unauthorized access attempts will be logged.
            </p>
          </div>
        </motion.div>

        {/* Back to Store Link */}
        <div className="text-center mt-6">
          <Link 
            href="/" 
            className="text-gray-400 text-sm hover:text-purple-400 transition-colors"
          >
            ← Back to Store
          </Link>
        </div>
      </motion.div>
    </div>
  )
}
