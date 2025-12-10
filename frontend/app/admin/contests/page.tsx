'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import {
  Trophy,
  Plus,
  Edit2,
  Trash2,
  ArrowLeft,
  Save,
  X,
  AlertCircle,
  Eye,
  EyeOff,
  Power,
} from 'lucide-react'
import { cn, formatPrice } from '@/lib/utils'
import { contestsApi, Contest } from '@/lib/api'

interface ContestFormData {
  contestId: string
  name: string
  price: string
  wheelMin: string
  wheelMax: string
  productsPerBox: string
  description: string
  color: string
  gradient: string
  icon: string
  badge: string
  maxSpinsPerUser: string
}

export default function AdminContestsPage() {
  const [contests, setContests] = useState<Contest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showInactive, setShowInactive] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingContest, setEditingContest] = useState<Contest | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const fetchContests = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await contestsApi.getAll(showInactive)
      setContests(data.contests || [])
    } catch (error) {
      console.error('Error fetching contests:', error)
      setContests([])
    } finally {
      setIsLoading(false)
    }
  }, [showInactive])

  useEffect(() => {
    fetchContests()
  }, [fetchContests])

  const handleDelete = async (contestId: string) => {
    try {
      await contestsApi.delete(contestId)
      setContests(contests.filter((c) => c._id !== contestId))
      setDeleteConfirm(null)
    } catch (error) {
      console.error('Failed to delete contest:', error)
    }
  }

  const handleReactivate = async (contestId: string) => {
    try {
      await contestsApi.update(contestId, { isActive: true })
      // Refresh contests list
      fetchContests()
    } catch (error) {
      console.error('Failed to reactivate contest:', error)
    }
  }

  const handleSaveContest = async (formData: ContestFormData) => {
    try {
      const contestData = {
        contestId: formData.contestId.toUpperCase(),
        name: formData.name,
        price: parseFloat(formData.price),
        wheelRange: {
          min: parseInt(formData.wheelMin),
          max: parseInt(formData.wheelMax),
        },
        productsPerBox: parseInt(formData.productsPerBox),
        description: formData.description,
        color: formData.color,
        gradient: formData.gradient,
        icon: formData.icon,
        badge: formData.badge,
        maxSpinsPerUser: parseInt(formData.maxSpinsPerUser) || 1,
      }

      if (editingContest) {
        await contestsApi.update(editingContest._id, contestData)
      } else {
        await contestsApi.create(contestData)
      }

      fetchContests()
      setShowAddModal(false)
      setEditingContest(null)
    } catch (error) {
      console.error('Failed to save contest:', error)
    }
  }

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8"
        >
          <div className="flex items-center gap-4">
            <Link href="/admin">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 rounded-full bg-white shadow-soft hover:shadow-kawaii transition-all"
              >
                <ArrowLeft size={24} className="text-gray-600" />
              </motion.button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                <Trophy className="text-pink-500" />
                Contest Management
              </h1>
              <p className="text-gray-500">
                {contests.length} contest{contests.length !== 1 ? 's' : ''} configured
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowInactive(!showInactive)}
              className={cn(
                'px-4 py-2 rounded-kawaii',
                'bg-white border-2 border-pink-200',
                'text-gray-700 font-medium',
                'flex items-center gap-2',
                'shadow-soft hover:shadow-kawaii'
              )}
            >
              {showInactive ? <Eye size={18} /> : <EyeOff size={18} />}
              {showInactive ? 'All' : 'Active Only'}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowAddModal(true)}
              className={cn(
                'px-6 py-3 rounded-kawaii',
                'bg-gradient-to-r from-pink-500 to-purple-500',
                'text-white font-bold',
                'flex items-center gap-2',
                'shadow-kawaii hover:shadow-kawaii-hover'
              )}
            >
              <Plus size={20} />
              Add Contest
            </motion.button>
          </div>
        </motion.div>

        {/* Contests Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
              className="w-16 h-16 border-4 border-pink-200 border-t-pink-500 rounded-full"
            />
          </div>
        ) : contests.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <div className="text-6xl mb-4">🏆</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">No contests found</h3>
            <p className="text-gray-500 mb-6">Start by creating your first contest!</p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              onClick={() => setShowAddModal(true)}
              className={cn(
                'px-6 py-3 rounded-kawaii',
                'bg-gradient-to-r from-pink-500 to-purple-500',
                'text-white font-bold'
              )}
            >
              <Plus size={20} className="inline mr-2" />
              Add Contest
            </motion.button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {contests.map((contest, idx) => (
              <motion.div
                key={contest._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={cn(
                  'bg-white rounded-super overflow-hidden',
                  'shadow-kawaii hover:shadow-kawaii-hover',
                  'border-2 border-pink-100',
                  'transition-all duration-300',
                  !contest.isActive && 'opacity-60'
                )}
              >
                {/* Badge */}
                {contest.badge && (
                  <div className={cn(
                    'absolute top-3 right-3 z-10',
                    'px-3 py-1 rounded-full text-xs font-bold text-white',
                    `bg-gradient-to-r ${contest.color}`
                  )}>
                    ✨ {contest.badge}
                  </div>
                )}

                {!contest.isActive && (
                  <div className="absolute top-3 left-3 z-10">
                    <span className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                      Inactive
                    </span>
                  </div>
                )}

                {/* Content */}
                <div className={cn('p-6', contest.gradient)}>
                  <div className="text-5xl mb-4 text-center">{contest.icon}</div>
                  <h3 className="text-xl font-bold text-gray-800 text-center mb-2">
                    {contest.name}
                  </h3>
                  <div className={cn(
                    'text-3xl font-extrabold text-center mb-4',
                    'bg-gradient-to-r bg-clip-text text-transparent',
                    contest.color
                  )}>
                    {formatPrice(contest.price)}
                  </div>

                  <div className="space-y-2 text-sm text-gray-600 mb-4">
                    <div className="flex justify-between">
                      <span>Wheel Range:</span>
                      <span className="font-medium">{contest.wheelRange.min} - {contest.wheelRange.max}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Products/Box:</span>
                      <span className="font-medium">{contest.productsPerBox}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Max Spins:</span>
                      <span className="font-medium">{contest.maxSpinsPerUser}</span>
                    </div>
                  </div>

                  <p className="text-sm text-gray-500 text-center mb-4">
                    {contest.description}
                  </p>

                  {/* Actions */}
                  <div className="flex gap-2">
                    {!contest.isActive && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleReactivate(contest._id)}
                        className="flex-1 p-2 rounded-kawaii text-green-500 hover:bg-green-50 transition-colors"
                        title="Reactivate Contest"
                      >
                        <Power size={18} className="mx-auto" />
                      </motion.button>
                    )}
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setEditingContest(contest)}
                      className="flex-1 p-2 rounded-kawaii text-blue-500 hover:bg-blue-50 transition-colors"
                      title="Edit Contest"
                    >
                      <Edit2 size={18} className="mx-auto" />
                    </motion.button>
                    {contest.isActive && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setDeleteConfirm(contest._id)}
                        className="flex-1 p-2 rounded-kawaii text-red-500 hover:bg-red-50 transition-colors"
                        title="Deactivate Contest"
                      >
                        <Trash2 size={18} className="mx-auto" />
                      </motion.button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Add/Edit Modal */}
        <AnimatePresence>
          {(showAddModal || editingContest) && (
            <ContestModal
              contest={editingContest}
              onClose={() => {
                setShowAddModal(false)
                setEditingContest(null)
              }}
              onSave={handleSaveContest}
            />
          )}
        </AnimatePresence>

        {/* Delete Confirmation */}
        <AnimatePresence>
          {deleteConfirm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
              onClick={() => setDeleteConfirm(null)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className={cn(
                  'bg-white rounded-super p-6 max-w-sm w-full',
                  'shadow-kawaii-hover'
                )}
              >
                <div className="text-center">
                  <AlertCircle className="w-16 h-16 mx-auto text-red-500 mb-4" />
                  <h3 className="text-xl font-bold text-gray-800 mb-2">
                    Deactivate Contest?
                  </h3>
                  <p className="text-gray-500 mb-6">
                    This will hide the contest from users. You can reactivate it later.
                  </p>
                  <div className="flex gap-3">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setDeleteConfirm(null)}
                      className={cn(
                        'flex-1 py-3 rounded-kawaii',
                        'bg-gray-100 text-gray-700 font-medium'
                      )}
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleDelete(deleteConfirm)}
                      className={cn(
                        'flex-1 py-3 rounded-kawaii',
                        'bg-red-500 text-white font-bold'
                      )}
                    >
                      Deactivate
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

// Contest Modal Component
function ContestModal({
  contest,
  onClose,
  onSave,
}: {
  contest: Contest | null
  onClose: () => void
  onSave: (data: ContestFormData) => void
}) {
  const [formData, setFormData] = useState<ContestFormData>({
    contestId: contest?.contestId || '',
    name: contest?.name || '',
    price: contest?.price?.toString() || '',
    wheelMin: contest?.wheelRange.min?.toString() || '0',
    wheelMax: contest?.wheelRange.max?.toString() || '5',
    productsPerBox: contest?.productsPerBox?.toString() || '1',
    description: contest?.description || '',
    color: contest?.color || 'from-pink-400 to-pink-500',
    gradient: contest?.gradient || 'bg-gradient-to-br from-pink-100 via-pink-50 to-rose-100',
    icon: contest?.icon || '🎁',
    badge: contest?.badge || '',
    maxSpinsPerUser: contest?.maxSpinsPerUser?.toString() || '1',
  })

  const [errors, setErrors] = useState<Partial<ContestFormData>>({})

  const validate = () => {
    const newErrors: Partial<ContestFormData> = {}
    if (!formData.contestId) newErrors.contestId = 'Required'
    if (!formData.name) newErrors.name = 'Required'
    if (!formData.price) newErrors.price = 'Required'
    if (!formData.wheelMin && formData.wheelMin !== '0') newErrors.wheelMin = 'Required'
    if (!formData.wheelMax) newErrors.wheelMax = 'Required'
    if (!formData.productsPerBox) newErrors.productsPerBox = 'Required'
    if (!formData.maxSpinsPerUser) newErrors.maxSpinsPerUser = 'Required'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = () => {
    if (validate()) {
      onSave(formData)
    }
  }

  const colorPresets = [
    { name: 'Pink', value: 'from-pink-400 to-pink-500' },
    { name: 'Purple', value: 'from-purple-400 to-purple-500' },
    { name: 'Teal', value: 'from-teal-400 to-emerald-500' },
    { name: 'Blue', value: 'from-blue-400 to-indigo-500' },
    { name: 'Orange', value: 'from-orange-400 to-amber-500' },
  ]

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className={cn(
          'bg-white rounded-super p-6 sm:p-8 max-w-2xl w-full max-h-[90vh] overflow-auto my-8',
          'shadow-kawaii-hover'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">
            {contest ? 'Edit Contest' : 'Create New Contest'}
          </h2>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <X size={24} className="text-gray-500" />
          </motion.button>
        </div>

        {/* Form */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Contest ID * (A, B, C, etc.)
              </label>
              <input
                type="text"
                value={formData.contestId}
                onChange={(e) => setFormData({ ...formData, contestId: e.target.value.toUpperCase() })}
                disabled={!!contest}
                className={cn(
                  'w-full px-4 py-3 rounded-kawaii border-2 uppercase',
                  errors.contestId ? 'border-red-300' : 'border-pink-100 focus:border-pink-300',
                  contest && 'bg-gray-100 cursor-not-allowed',
                  'outline-none transition-colors'
                )}
                placeholder="A"
                maxLength={10}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Price (₹) *
              </label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className={cn(
                  'w-full px-4 py-3 rounded-kawaii border-2',
                  errors.price ? 'border-red-300' : 'border-pink-100 focus:border-pink-300',
                  'outline-none transition-colors'
                )}
                placeholder="100"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              Contest Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={cn(
                'w-full px-4 py-3 rounded-kawaii border-2',
                errors.name ? 'border-red-300' : 'border-pink-100 focus:border-pink-300',
                'outline-none transition-colors'
              )}
              placeholder="Starter Scoop"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
              className={cn(
                'w-full px-4 py-3 rounded-kawaii border-2',
                'border-pink-100 focus:border-pink-300',
                'outline-none transition-colors resize-none'
              )}
              placeholder="Spin to win amazing prizes!"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Wheel Min *
              </label>
              <input
                type="number"
                value={formData.wheelMin}
                onChange={(e) => setFormData({ ...formData, wheelMin: e.target.value })}
                className={cn(
                  'w-full px-4 py-3 rounded-kawaii border-2',
                  errors.wheelMin ? 'border-red-300' : 'border-pink-100 focus:border-pink-300',
                  'outline-none transition-colors'
                )}
                placeholder="0"
                min="0"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Wheel Max *
              </label>
              <input
                type="number"
                value={formData.wheelMax}
                onChange={(e) => setFormData({ ...formData, wheelMax: e.target.value })}
                className={cn(
                  'w-full px-4 py-3 rounded-kawaii border-2',
                  errors.wheelMax ? 'border-red-300' : 'border-pink-100 focus:border-pink-300',
                  'outline-none transition-colors'
                )}
                placeholder="5"
                min="0"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Products/Box *
              </label>
              <input
                type="number"
                value={formData.productsPerBox}
                onChange={(e) => setFormData({ ...formData, productsPerBox: e.target.value })}
                className={cn(
                  'w-full px-4 py-3 rounded-kawaii border-2',
                  errors.productsPerBox ? 'border-red-300' : 'border-pink-100 focus:border-pink-300',
                  'outline-none transition-colors'
                )}
                placeholder="1"
                min="1"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Icon (Emoji)
              </label>
              <input
                type="text"
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                className={cn(
                  'w-full px-4 py-3 rounded-kawaii border-2 text-3xl text-center',
                  'border-pink-100 focus:border-pink-300',
                  'outline-none transition-colors'
                )}
                placeholder="🎁"
                maxLength={2}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Badge (Optional)
              </label>
              <input
                type="text"
                value={formData.badge}
                onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                className={cn(
                  'w-full px-4 py-3 rounded-kawaii border-2',
                  'border-pink-100 focus:border-pink-300',
                  'outline-none transition-colors'
                )}
                placeholder="Popular"
                maxLength={20}
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              Max Spins Per User *
            </label>
            <input
              type="number"
              value={formData.maxSpinsPerUser}
              onChange={(e) => setFormData({ ...formData, maxSpinsPerUser: e.target.value })}
              className={cn(
                'w-full px-4 py-3 rounded-kawaii border-2',
                errors.maxSpinsPerUser ? 'border-red-300' : 'border-pink-100 focus:border-pink-300',
                'outline-none transition-colors'
              )}
              placeholder="1"
              min="1"
            />
            <p className="text-xs text-gray-400 mt-1">
              Number of times a user can spin the wheel in this contest
            </p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              Color Gradient
            </label>
            <div className="grid grid-cols-3 gap-2 mb-2">
              {colorPresets.map((preset) => (
                <motion.button
                  key={preset.value}
                  type="button"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setFormData({ ...formData, color: preset.value })}
                  className={cn(
                    'px-3 py-2 rounded-kawaii text-sm font-medium',
                    'border-2 transition-all',
                    formData.color === preset.value
                      ? 'border-pink-500 bg-pink-50'
                      : 'border-pink-100 hover:border-pink-300'
                  )}
                >
                  <div className={cn(
                    'h-6 rounded mb-1',
                    `bg-gradient-to-r ${preset.value}`
                  )} />
                  {preset.name}
                </motion.button>
              ))}
            </div>
            <input
              type="text"
              value={formData.color}
              onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              className={cn(
                'w-full px-4 py-3 rounded-kawaii border-2',
                'border-pink-100 focus:border-pink-300',
                'outline-none transition-colors text-sm'
              )}
              placeholder="from-pink-400 to-pink-500"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-8">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClose}
            className={cn(
              'flex-1 py-3 rounded-kawaii',
              'bg-gray-100 text-gray-700 font-medium'
            )}
          >
            Cancel
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSubmit}
            className={cn(
              'flex-1 py-3 rounded-kawaii',
              'bg-gradient-to-r from-pink-500 to-purple-500',
              'text-white font-bold',
              'flex items-center justify-center gap-2'
            )}
          >
            <Save size={18} />
            {contest ? 'Update' : 'Create'} Contest
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  )
}

