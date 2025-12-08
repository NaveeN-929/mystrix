'use client'

import { useState, Suspense } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { Mail, Lock, Eye, EyeOff, Heart, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect') || '/'
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const result = await signIn('credentials', {
        redirect: false,
        email: formData.email,
        password: formData.password,
        callbackUrl: redirectTo,
      })

      if (result?.error) {
        setError(result.error)
        return
      }

      // NextAuth returns a url when successful
      const target = result?.url || redirectTo
      router.push(target)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to login')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 mb-4"
          >
            <Heart className="w-8 h-8 text-white" />
          </motion.div>
          <h1 className="text-3xl font-bold text-gray-800">Welcome Back!</h1>
          <p className="text-gray-500 mt-2">Sign in to continue your adventure 🎀</p>
        </div>

        {/* Form Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={cn(
            'bg-white/90 backdrop-blur-md rounded-super p-8',
            'shadow-kawaii border border-pink-100'
          )}
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="you@example.com"
                  className={cn(
                    'w-full pl-12 pr-4 py-3 rounded-kawaii',
                    'border-2 border-pink-100 focus:border-pink-300',
                    'outline-none transition-all duration-300',
                    'placeholder:text-gray-400'
                  )}
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  placeholder="Enter your password"
                  className={cn(
                    'w-full pl-12 pr-12 py-3 rounded-kawaii',
                    'border-2 border-pink-100 focus:border-pink-300',
                    'outline-none transition-all duration-300',
                    'placeholder:text-gray-400'
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-gray-600 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-pink-300 text-pink-500 focus:ring-pink-200"
                />
                Remember me
              </label>
              <button type="button" className="text-pink-500 hover:text-pink-600 font-medium">
                Forgot password?
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-kawaii bg-red-50 border border-red-200 text-red-600 text-sm"
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
                'w-full py-4 rounded-kawaii font-bold text-white',
                'bg-gradient-to-r from-pink-500 to-purple-500',
                'shadow-kawaii hover:shadow-kawaii-hover',
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
                  Signing In...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </motion.button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-pink-100"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">New to mystrix?</span>
            </div>
          </div>

          {/* Sign Up Link */}
          <Link href="/signup">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                'w-full py-3 rounded-kawaii font-medium',
                'bg-gradient-to-r from-pink-50 to-lavender-50',
                'border-2 border-pink-200 text-pink-600',
                'hover:from-pink-100 hover:to-lavender-100',
                'transition-all duration-300'
              )}
            >
              Create an Account
            </motion.button>
          </Link>
        </motion.div>

        {/* Admin Link */}
        <div className="text-center mt-6">
          <Link 
            href="/admin/login" 
            className="text-gray-400 text-sm hover:text-pink-500 transition-colors"
          >
            Admin Login →
          </Link>
        </div>
      </motion.div>
    </div>
  )
}

function LoginFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
        className="w-12 h-12 border-4 border-pink-200 border-t-pink-500 rounded-full"
      />
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginForm />
    </Suspense>
  )
}
