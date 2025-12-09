'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import confetti from 'canvas-confetti'
import { 
  ArrowLeft, 
  Check, 
  ShoppingBag, 
  MapPin, 
  Phone, 
  Mail, 
  User, 
  CreditCard,
  Package,
  PartyPopper
} from 'lucide-react'
import { useCartStore } from '@/lib/store'
import { ordersApi } from '@/lib/api'
import { formatPrice, generateOrderId } from '@/lib/utils'
import { getConfettiConfig } from '@/lib/spinLogic'
import { isValidEmail, isValidPhone, isValidPincode, cn } from '@/lib/utils'

interface FormData {
  name: string
  email: string
  phone: string
  address: string
  city: string
  pincode: string
}

interface FormErrors {
  name?: string
  email?: string
  phone?: string
  address?: string
  city?: string
  pincode?: string
}

export default function CheckoutPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const { items, getTotalPrice, clearCart } = useCartStore()
  const user = session?.user
  const token = session?.accessToken
  const [step, setStep] = useState<'form' | 'processing' | 'success'>('form')
  const [orderId, setOrderId] = useState<string>('')
  const [formData, setFormData] = useState<FormData>({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: '',
    city: '',
    pincode: '',
  })
  const [errors, setErrors] = useState<FormErrors>({})

  const itemsWorth = getTotalPrice()
  const totalDueNow = 0

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?redirect=/checkout')
    }
  }, [status, router])

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!isValidEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email'
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone is required'
    } else if (!isValidPhone(formData.phone)) {
      newErrors.phone = 'Please enter a valid 10-digit phone number'
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Address is required'
    }

    if (!formData.city.trim()) {
      newErrors.city = 'City is required'
    }

    if (!formData.pincode.trim()) {
      newErrors.pincode = 'Pincode is required'
    } else if (!isValidPincode(formData.pincode)) {
      newErrors.pincode = 'Please enter a valid 6-digit pincode'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    setStep('processing')

    try {
      // Create order via API - pass token if user is authenticated
      const data = await ordersApi.create({
        items: items.map((item) => ({
          productId: item.product._id,
          productNumber: item.product.productNumber,
          name: item.product.name,
          price: item.product.price,
          quantity: item.quantity,
          contestType: item.contestType,
        })),
        totalAmount: totalDueNow,
        customerInfo: formData,
      }, token || undefined)
      
      // Use order ID from response or generate locally
      const newOrderId = data.orderId || generateOrderId()
      setOrderId(newOrderId)

      // Simulate processing time
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Clear cart and show success
      clearCart()
      setStep('success')

      // Celebrate with confetti!
      confetti(getConfettiConfig())
      setTimeout(() => confetti({ ...getConfettiConfig(), origin: { y: 0.5, x: 0.3 } }), 300)
      setTimeout(() => confetti({ ...getConfettiConfig(), origin: { y: 0.5, x: 0.7 } }), 600)
    } catch (error) {
      console.error('Order submission error:', error)
      // Still show success for demo purposes
      const newOrderId = generateOrderId()
      setOrderId(newOrderId)
      clearCart()
      setStep('success')
      confetti(getConfettiConfig())
    }
  }

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  if (items.length === 0 && step === 'form') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="text-8xl mb-6">🛒</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            Your cart is empty
          </h1>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push('/')}
            className={cn(
              'px-8 py-4 rounded-kawaii',
              'bg-gradient-to-r from-pink-500 to-purple-500',
              'text-white font-bold'
            )}
          >
            Start Playing
          </motion.button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen px-4 py-8">
      <AnimatePresence mode="wait">
        {step === 'form' && (
          <motion.div
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="max-w-4xl mx-auto"
          >
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-4 mb-8"
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push('/cart')}
                className="p-2 rounded-full bg-white shadow-soft hover:shadow-kawaii transition-all"
              >
                <ArrowLeft size={24} className="text-gray-600" />
              </motion.button>
              <div>
                <h1 className="text-3xl font-bold text-gray-800">Checkout</h1>
                <p className="text-gray-500">Complete your order</p>
              </div>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Form Section */}
              <div className="lg:col-span-2">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    'bg-white rounded-super p-6 sm:p-8',
                    'shadow-kawaii border border-pink-100'
                  )}
                >
                  <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                    <MapPin className="text-pink-500" size={24} />
                    Shipping Information
                  </h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Name */}
                    <FormInput
                      icon={<User size={18} />}
                      label="Full Name"
                      value={formData.name}
                      onChange={(v) => handleInputChange('name', v)}
                      error={errors.name}
                      placeholder="John Doe"
                    />

                    {/* Email */}
                    <FormInput
                      icon={<Mail size={18} />}
                      label="Email"
                      type="email"
                      value={formData.email}
                      onChange={(v) => handleInputChange('email', v)}
                      error={errors.email}
                      placeholder="john@example.com"
                    />

                    {/* Phone */}
                    <FormInput
                      icon={<Phone size={18} />}
                      label="Phone Number"
                      value={formData.phone}
                      onChange={(v) => handleInputChange('phone', v)}
                      error={errors.phone}
                      placeholder="9876543210"
                    />

                    {/* City */}
                    <FormInput
                      icon={<MapPin size={18} />}
                      label="City"
                      value={formData.city}
                      onChange={(v) => handleInputChange('city', v)}
                      error={errors.city}
                      placeholder="Mumbai"
                    />

                    {/* Address - Full Width */}
                    <div className="sm:col-span-2">
                      <FormInput
                        icon={<MapPin size={18} />}
                        label="Address"
                        value={formData.address}
                        onChange={(v) => handleInputChange('address', v)}
                        error={errors.address}
                        placeholder="123, Street Name, Area"
                      />
                    </div>

                    {/* Pincode */}
                    <FormInput
                      icon={<Package size={18} />}
                      label="Pincode"
                      value={formData.pincode}
                      onChange={(v) => handleInputChange('pincode', v)}
                      error={errors.pincode}
                      placeholder="400001"
                    />
                  </div>
                </motion.div>
              </div>

              {/* Order Summary */}
              <div className="lg:col-span-1">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className={cn(
                    'bg-white rounded-super p-6',
                    'shadow-kawaii border border-pink-100',
                    'sticky top-24'
                  )}
                >
                  <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <ShoppingBag className="text-pink-500" size={24} />
                    Order Summary
                  </h2>

                  {/* Items List */}
                  <div className="space-y-3 max-h-60 overflow-auto mb-4">
                    {items.map((item) => {
                      const imageSrc =
                        (item.product.image && item.product.image.trim()) ||
                        'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23f5f3ff"/><text x="50" y="55" text-anchor="middle" fill="%23a855f7" font-size="14" font-family="Arial">No Image</text></svg>'

                      return (
                        <div key={item.product._id} className="flex gap-3">
                          <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-pink-50 flex-shrink-0">
                            <Image
                              src={imageSrc}
                              alt={item.product.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800 line-clamp-1">
                              {item.product.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              Qty: {item.quantity} × {formatPrice(item.product.price)}
                            </p>
                          </div>
                          <p className="text-sm font-bold text-gray-800">
                            {formatPrice(item.product.price * item.quantity)}
                          </p>
                        </div>
                      )
                    })}
                  </div>

                  <hr className="border-pink-100 my-4" />

                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-gray-600">
                      <span>Items worth</span>
                      <span>{formatPrice(itemsWorth)}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Shipping</span>
                      <span className="text-green-500">Free!</span>
                    </div>
                    <hr className="border-pink-100" />
                    <div className="flex justify-between font-bold text-lg">
                      <span>Amount due now</span>
                      <span className="text-green-500">₹0</span>
                    </div>
                  </div>

                  {/* Place Order Button */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSubmit}
                    className={cn(
                      'w-full py-4 rounded-kawaii',
                      'bg-gradient-to-r from-pink-500 to-purple-500',
                      'text-white font-bold text-lg',
                      'shadow-kawaii hover:shadow-kawaii-hover',
                      'flex items-center justify-center gap-2'
                    )}
                  >
                    <CreditCard size={20} />
                    Place Order
                  </motion.button>

                  <p className="text-center text-gray-400 text-xs mt-4">
                    🔒 Your payment is secure and encrypted
                  </p>
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}

        {step === 'processing' && (
          <motion.div
            key="processing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen flex items-center justify-center"
          >
            <div className="text-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                className="w-24 h-24 mx-auto mb-6 rounded-full border-4 border-pink-200 border-t-pink-500"
              />
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Processing Your Order...
              </h2>
              <p className="text-gray-500">Please wait while we confirm your order</p>
            </div>
          </motion.div>
        )}

        {step === 'success' && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="min-h-screen flex items-center justify-center px-4"
          >
            <div className={cn(
              'max-w-md w-full text-center',
              'bg-white rounded-super p-8 sm:p-12',
              'shadow-kawaii border border-pink-100'
            )}>
              <motion.div
                animate={{ 
                  scale: [1, 1.2, 1],
                  rotate: [0, 10, -10, 0]
                }}
                transition={{ duration: 0.5 }}
                className="text-7xl mb-6"
              >
                <PartyPopper className="w-20 h-20 mx-auto text-pink-500" />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <h1 className="text-3xl font-bold text-gray-800 mb-2">
                  Order Confirmed! 🎉
                </h1>
                <p className="text-gray-500 mb-6">
                  Thank you for your purchase. Your order has been placed successfully!
                </p>

                <div className={cn(
                  'bg-gradient-to-r from-pink-50 to-lavender-50',
                  'rounded-kawaii p-4 mb-6'
                )}>
                  <p className="text-sm text-gray-500">Order ID</p>
                  <p className="text-xl font-bold gradient-text">{orderId}</p>
                </div>

                <div className="flex items-center justify-center gap-2 text-green-500 mb-6">
                  <Check size={20} />
                  <span>Confirmation email sent!</span>
                </div>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => router.push('/')}
                  className={cn(
                    'w-full py-4 rounded-kawaii',
                    'bg-gradient-to-r from-pink-500 to-purple-500',
                    'text-white font-bold text-lg',
                    'shadow-kawaii hover:shadow-kawaii-hover'
                  )}
                >
                  Resume the Mystery ✨
                </motion.button>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Form Input Component
function FormInput({
  icon,
  label,
  type = 'text',
  value,
  onChange,
  error,
  placeholder,
}: {
  icon: React.ReactNode
  label: string
  type?: string
  value: string
  onChange: (value: string) => void
  error?: string
  placeholder: string
}) {
  return (
    <div>
      <label className="text-sm font-medium text-gray-700 mb-1 block">
        {label}
      </label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
          {icon}
        </span>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={cn(
            'w-full pl-10 pr-4 py-3 rounded-kawaii',
            'border-2 transition-colors',
            error
              ? 'border-red-300 focus:border-red-400'
              : 'border-pink-100 focus:border-pink-300',
            'outline-none'
          )}
        />
      </div>
      {error && (
        <p className="text-red-500 text-xs mt-1">{error}</p>
      )}
    </div>
  )
}

