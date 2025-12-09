'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  ArrowLeft,
  Save,
  Package,
  Upload,
  Image as ImageIcon,
  AlertCircle,
  Check,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface FormData {
  productNumber: string
  name: string
  description: string
  image: string
  price: string
  category: string
  stock: string
}

interface FormErrors {
  productNumber?: string
  name?: string
  price?: string
  stock?: string
}

export default function NewProductPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    productNumber: '',
    name: '',
    description: '',
    image: '',
    price: '',
    category: 'General',
    stock: '10',
  })
  const [errors, setErrors] = useState<FormErrors>({})

  const categories = ['Beauty', 'Fashion', 'Electronics', 'Home', 'Toys', 'Accessories', 'General']

  const validate = (): boolean => {
    const newErrors: FormErrors = {}
    
    if (!formData.productNumber) {
      newErrors.productNumber = 'Product number is required'
    } else if (parseInt(formData.productNumber) < 1 || parseInt(formData.productNumber) > 9999) {
      newErrors.productNumber = 'Must be between 1 and 9999'
    }
    
    if (!formData.name.trim()) {
      newErrors.name = 'Product name is required'
    }
    
    if (!formData.price) {
      newErrors.price = 'Price is required'
    } else if (parseFloat(formData.price) <= 0) {
      newErrors.price = 'Price must be greater than 0'
    }
    
    if (!formData.stock) {
      newErrors.stock = 'Stock is required'
    } else if (parseInt(formData.stock) < 0) {
      newErrors.stock = 'Stock cannot be negative'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validate()) return
    
    setIsSubmitting(true)
    
    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productNumber: parseInt(formData.productNumber),
          name: formData.name.trim(),
          description: formData.description.trim(),
          image: formData.image.trim(),
          price: parseFloat(formData.price),
          category: formData.category,
          stock: parseInt(formData.stock),
        }),
      })
      
      if (response.ok) {
        setIsSuccess(true)
        setTimeout(() => {
          router.push('/admin/products')
        }, 1500)
      } else {
        const data = await response.json()
        if (data.error?.includes('already exists')) {
          setErrors({ productNumber: 'This product number is already taken' })
        }
      }
    } catch (error) {
      console.error('Error creating product:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.2 }}
            className={cn(
              'w-24 h-24 mx-auto mb-6 rounded-full',
              'bg-gradient-to-r from-green-400 to-emerald-500',
              'flex items-center justify-center'
            )}
          >
            <Check size={48} className="text-white" />
          </motion.div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Product Created! 🎉
          </h2>
          <p className="text-gray-500">
            Redirecting to products page...
          </p>
        </motion.div>
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
          className="flex items-center gap-4 mb-8"
        >
          <Link href="/admin/products">
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
              <Package className="text-pink-500" />
              Add New Product
            </h1>
            <p className="text-gray-500">
              Create a new product for mystery boxes
            </p>
          </div>
        </motion.div>

        {/* Form */}
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSubmit}
          className={cn(
            'bg-white rounded-super p-6 sm:p-8',
            'shadow-kawaii border border-pink-100'
          )}
        >
          {/* Product Number & Stock */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Product Number *
              </label>
              <input
                type="number"
                value={formData.productNumber}
                onChange={(e) => handleChange('productNumber', e.target.value)}
                className={cn(
                  'w-full px-4 py-3 rounded-kawaii border-2',
                  errors.productNumber ? 'border-red-300' : 'border-pink-100 focus:border-pink-300',
                  'outline-none transition-colors'
                )}
                placeholder="1-9999"
              />
              {errors.productNumber && (
                <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                  <AlertCircle size={12} />
                  {errors.productNumber}
                </p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Stock Quantity *
              </label>
              <input
                type="number"
                value={formData.stock}
                onChange={(e) => handleChange('stock', e.target.value)}
                className={cn(
                  'w-full px-4 py-3 rounded-kawaii border-2',
                  errors.stock ? 'border-red-300' : 'border-pink-100 focus:border-pink-300',
                  'outline-none transition-colors'
                )}
                placeholder="10"
              />
              {errors.stock && (
                <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                  <AlertCircle size={12} />
                  {errors.stock}
                </p>
              )}
            </div>
          </div>

          {/* Product Name */}
          <div className="mb-4">
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              Product Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className={cn(
                'w-full px-4 py-3 rounded-kawaii border-2',
                errors.name ? 'border-red-300' : 'border-pink-100 focus:border-pink-300',
                'outline-none transition-colors'
              )}
              placeholder="e.g., Sparkle Lip Gloss"
            />
            {errors.name && (
              <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                <AlertCircle size={12} />
                {errors.name}
              </p>
            )}
          </div>

          {/* Description */}
          <div className="mb-4">
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={3}
              className={cn(
                'w-full px-4 py-3 rounded-kawaii border-2',
                'border-pink-100 focus:border-pink-300',
                'outline-none transition-colors resize-none'
              )}
              placeholder="A wonderful mystery product that brings joy..."
            />
          </div>

          {/* Price & Category */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Price (₹) *
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => handleChange('price', e.target.value)}
                className={cn(
                  'w-full px-4 py-3 rounded-kawaii border-2',
                  errors.price ? 'border-red-300' : 'border-pink-100 focus:border-pink-300',
                  'outline-none transition-colors'
                )}
                placeholder="299"
              />
              {errors.price && (
                <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                  <AlertCircle size={12} />
                  {errors.price}
                </p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => handleChange('category', e.target.value)}
                className={cn(
                  'w-full px-4 py-3 rounded-kawaii border-2',
                  'border-pink-100 focus:border-pink-300',
                  'outline-none transition-colors bg-white'
                )}
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Image URL */}
          <div className="mb-6">
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              Image URL
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={formData.image}
                onChange={(e) => handleChange('image', e.target.value)}
                className={cn(
                  'flex-1 px-4 py-3 rounded-kawaii border-2',
                  'border-pink-100 focus:border-pink-300',
                  'outline-none transition-colors'
                )}
                placeholder="https://example.com/image.jpg"
              />
              <motion.button
                type="button"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={cn(
                  'px-4 py-3 rounded-kawaii',
                  'bg-pink-100 text-pink-500',
                  'flex items-center gap-2'
                )}
              >
                <Upload size={18} />
              </motion.button>
            </div>
            <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
              <ImageIcon size={12} />
              Optional. Leave empty to keep the product without an image.
            </p>
          </div>

          {/* Image Preview */}
          {formData.image && (
            <div className="mb-6">
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Preview
              </label>
              <div className="relative w-32 h-32 rounded-kawaii overflow-hidden bg-pink-50">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={formData.image}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          )}

          {/* Submit Buttons */}
          <div className="flex gap-3">
            <Link href="/admin/products" className="flex-1">
              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={cn(
                  'w-full py-4 rounded-kawaii',
                  'bg-gray-100 text-gray-700 font-medium'
                )}
              >
                Cancel
              </motion.button>
            </Link>
            <motion.button
              type="submit"
              disabled={isSubmitting}
              whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
              whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
              className={cn(
                'flex-1 py-4 rounded-kawaii',
                'bg-gradient-to-r from-pink-500 to-purple-500',
                'text-white font-bold',
                'flex items-center justify-center gap-2',
                'disabled:opacity-70 disabled:cursor-not-allowed'
              )}
            >
              {isSubmitting ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                    className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                  />
                  Creating...
                </>
              ) : (
                <>
                  <Save size={20} />
                  Create Product
                </>
              )}
            </motion.button>
          </div>
        </motion.form>

        {/* Tips */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className={cn(
            'mt-6 bg-gradient-to-r from-pink-50 to-lavender-50',
            'rounded-kawaii p-4 border border-pink-100'
          )}
        >
          <h3 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
            💡 Tips
          </h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Use unique product numbers (1-200 recommended for mystery boxes)</li>
            <li>• Add clear, attractive product names</li>
            <li>• Set realistic prices based on product value</li>
            <li>• Keep stock updated to avoid overselling</li>
          </ul>
        </motion.div>
      </div>
    </div>
  )
}

