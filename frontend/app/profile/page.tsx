'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { User, Mail, Phone, Edit2, Save, X, ShoppingBag, LogOut, Wallet } from 'lucide-react'
import { cn } from '@/lib/utils'
import { authApi } from '@/lib/api'

export default function ProfilePage() {
  const router = useRouter()
  const { data: session, status, update } = useSession()
  const user = session?.user
  const token = session?.accessToken

  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
  })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?redirect=/profile')
    }
  }, [status, router])

  // Initialize form data when user loads
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        phone: user.phone || '',
      })
    }
  }, [user])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    setError('')
    setSuccess('')
  }

  const handleSave = async () => {
    if (!token) {
      setError('You must be logged in to update your profile.')
      return
    }

    setError('')
    setSuccess('')
    setIsLoading(true)

    try {
      const response = await authApi.updateProfile(formData, token)
      await update({
        ...session,
        user: {
          ...session?.user,
          ...response.user,
        },
        accessToken: session?.accessToken,
      })
      setSuccess('Profile updated successfully! ✨')
      setIsEditing(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    if (user) {
      setFormData({
        name: user.name,
        phone: user.phone || '',
      })
    }
    setIsEditing(false)
    setError('')
  }

  const handleLogout = () => {
    signOut({ callbackUrl: '/login', redirect: true }).catch((error) => {
      console.error('Sign out failed, forcing redirect', error)
      window.location.href = '/login'
    })
  }

  // Show loading while checking authentication
  if (status === 'loading' || status === 'unauthenticated' || !user) {
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

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex flex-col items-center gap-4"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 mb-4 text-white text-3xl font-bold">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <h1 className="text-3xl font-bold text-gray-800">My Profile</h1>
          <p className="text-gray-500 mt-2">Manage your account information 🎀</p>

          {/* Quick actions */}
          <div className="flex flex-wrap justify-center gap-3">
            <button
              onClick={() => router.push('/orders')}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-kawaii',
                'bg-white border border-pink-200 text-pink-600',
                'shadow-sm hover:bg-pink-50 transition-all duration-200'
              )}
            >
              <ShoppingBag size={16} />
              <span className="text-sm font-semibold">My Orders</span>
            </button>
            <button
              onClick={() => router.push('/wallet')}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-kawaii',
                'bg-white border border-amber-200 text-amber-600',
                'shadow-sm hover:bg-amber-50 transition-all duration-200'
              )}
            >
              <Wallet size={16} />
              <span className="text-sm font-semibold">My Wallet</span>
            </button>
            <button
              onClick={handleLogout}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-kawaii',
                'bg-gradient-to-r from-pink-500 to-purple-500 text-white',
                'shadow-kawaii hover:shadow-kawaii-hover transition-all duration-200'
              )}
            >
              <LogOut size={16} />
              <span className="text-sm font-semibold">Logout</span>
            </button>
          </div>
        </motion.div>

        {/* Wallet Balance Card */}
        {user.walletBalance !== undefined && user.walletBalance > 0 && (
          <Link href="/wallet">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
              transition={{ delay: 0.05 }}
              className={cn(
                'mb-8 bg-amber-50 border-2 border-amber-100 rounded-super p-6',
                'flex items-center justify-between gap-4 shadow-sm hover:shadow-md transition-all cursor-pointer'
              )}
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-amber-500 flex items-center justify-center text-white shadow-soft">
                  <Wallet size={28} />
                </div>
                <div>
                  <p className="text-sm text-amber-600 font-bold uppercase tracking-wider">Available Balance</p>
                  <p className="text-4xl font-black text-amber-700">₹{user.walletBalance}</p>
                </div>
              </div>
              <div className="text-right flex flex-col items-end">
                <p className="text-sm text-amber-500 italic hidden sm:block">Check your wallet history</p>
                <span className="mt-2 text-xs font-black text-white bg-amber-500 px-3 py-1 rounded-full uppercase tracking-widest shadow-sm">View History</span>
              </div>
            </motion.div>
          </Link>
        )}

        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={cn(
            'bg-white/90 backdrop-blur-md rounded-super p-8',
            'shadow-kawaii border border-pink-100'
          )}
        >
          {/* Edit Button */}
          <div className="flex justify-end mb-6">
            {!isEditing ? (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsEditing(true)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-kawaii',
                  'bg-gradient-to-r from-pink-500 to-purple-500',
                  'text-white font-medium'
                )}
              >
                <Edit2 size={16} />
                Edit Profile
              </motion.button>
            ) : (
              <div className="flex gap-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleCancel}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-kawaii',
                    'bg-gray-100 text-gray-600 font-medium'
                  )}
                >
                  <X size={16} />
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSave}
                  disabled={isLoading}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-kawaii',
                    'bg-gradient-to-r from-pink-500 to-purple-500',
                    'text-white font-medium',
                    isLoading && 'opacity-70 cursor-not-allowed'
                  )}
                >
                  <Save size={16} />
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </motion.button>
              </div>
            )}
          </div>

          {/* Success Message */}
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 rounded-kawaii bg-green-50 border border-green-200 text-green-600 text-sm mb-6"
            >
              {success}
            </motion.div>
          )}

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 rounded-kawaii bg-red-50 border border-red-200 text-red-600 text-sm mb-6"
            >
              {error}
            </motion.div>
          )}

          {/* Form Fields */}
          <div className="space-y-6">
            {/* Name Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={cn(
                    'w-full pl-12 pr-4 py-3 rounded-kawaii',
                    'border-2 border-pink-100',
                    isEditing
                      ? 'bg-white focus:border-pink-300'
                      : 'bg-gray-50 cursor-not-allowed',
                    'outline-none transition-all duration-300'
                  )}
                />
              </div>
            </div>

            {/* Email Field (Read Only) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={user.email}
                  disabled
                  className={cn(
                    'w-full pl-12 pr-4 py-3 rounded-kawaii',
                    'border-2 border-pink-100 bg-gray-50',
                    'cursor-not-allowed text-gray-500'
                  )}
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
            </div>

            {/* Phone Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  disabled={!isEditing}
                  maxLength={10}
                  className={cn(
                    'w-full pl-12 pr-4 py-3 rounded-kawaii',
                    'border-2 border-pink-100',
                    isEditing
                      ? 'bg-white focus:border-pink-300'
                      : 'bg-gray-50 cursor-not-allowed',
                    'outline-none transition-all duration-300'
                  )}
                />
              </div>
            </div>
          </div>

          {/* Account Info */}
          <div className="mt-8 pt-6 border-t border-pink-100">
            <h3 className="text-sm font-medium text-gray-500 mb-3">Account Information</h3>
            <div className="text-sm text-gray-600">
              <p>
                Member since:{' '}
                {user && 'createdAt' in user && user.createdAt
                  ? new Date(user.createdAt as string).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })
                  : 'Recently joined'}
              </p>
            </div>
          </div>
        </motion.div>
      </div >
    </div >
  )
}
