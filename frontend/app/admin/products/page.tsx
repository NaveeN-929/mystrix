'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import {
  Package,
  Plus,
  Search,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Filter,
  ArrowLeft,
  Save,
  X,
  Upload,
  AlertCircle,
} from 'lucide-react'
import { cn, formatPrice } from '@/lib/utils'
import { productsApi, Product } from '@/lib/api'

interface ProductFormData {
  productNumber: string
  name: string
  description: string
  image: string
  price: string
  category: string
  stock: string
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const categories = ['Beauty', 'Fashion', 'Electronics', 'Home', 'Toys', 'Accessories', 'General']

  const fetchProducts = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await productsApi.getAll({
        page: currentPage,
        limit: 12,
        category: categoryFilter || undefined,
        search: searchTerm || undefined,
      })
      setProducts(data.products || [])
      setTotalPages(data.pagination?.pages || 1)
    } catch {
      setProducts(getMockProducts())
    } finally {
      setIsLoading(false)
    }
  }, [currentPage, categoryFilter, searchTerm])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  const handleDelete = async (productId: string) => {
    try {
      await productsApi.delete(productId)
      setProducts(products.filter((p) => p._id !== productId))
      setDeleteConfirm(null)
    } catch (error) {
      console.error('Failed to delete product:', error)
    }
  }

  const handleSaveProduct = async (formData: ProductFormData) => {
    try {
      const productData = {
        productNumber: parseInt(formData.productNumber),
        name: formData.name,
        description: formData.description,
        image: formData.image || `https://picsum.photos/seed/product${formData.productNumber}/400/400`,
        price: parseFloat(formData.price),
        category: formData.category,
        stock: parseInt(formData.stock),
      }

      if (editingProduct) {
        await productsApi.update(editingProduct._id, productData)
      } else {
        await productsApi.create(productData)
      }
      
      fetchProducts()
      setShowAddModal(false)
      setEditingProduct(null)
    } catch (error) {
      console.error('Failed to save product:', error)
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
                <Package className="text-pink-500" />
                Product Management
              </h1>
              <p className="text-gray-500">
                {products.length} products in inventory
              </p>
            </div>
          </div>

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
            Add Product
          </motion.button>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            'bg-white rounded-super p-6 mb-6',
            'shadow-kawaii border border-pink-100'
          )}
        >
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={cn(
                  'w-full pl-10 pr-4 py-3 rounded-kawaii',
                  'border-2 border-pink-100 focus:border-pink-300',
                  'outline-none transition-colors'
                )}
              />
            </div>

            {/* Category Filter */}
            <div className="relative sm:w-48">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className={cn(
                  'w-full pl-10 pr-4 py-3 rounded-kawaii appearance-none',
                  'border-2 border-pink-100 focus:border-pink-300',
                  'outline-none transition-colors bg-white'
                )}
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>
        </motion.div>

        {/* Products Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
              className="w-16 h-16 border-4 border-pink-200 border-t-pink-500 rounded-full"
            />
          </div>
        ) : products.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">No products found</h3>
            <p className="text-gray-500 mb-6">Start by adding your first product!</p>
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
              Add Product
            </motion.button>
          </motion.div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product, idx) => (
                <motion.div
                  key={product._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className={cn(
                    'bg-white rounded-super overflow-hidden',
                    'shadow-kawaii hover:shadow-kawaii-hover',
                    'border border-pink-100',
                    'transition-all duration-300',
                    !product.isActive && 'opacity-60'
                  )}
                >
                  {/* Image */}
                  <div className="relative aspect-square bg-gradient-to-br from-pink-50 to-lavender-50">
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute top-3 left-3">
                      <span className={cn(
                        'px-2 py-1 rounded-full text-xs font-bold',
                        'bg-gradient-to-r from-pink-400 to-purple-400 text-white'
                      )}>
                        #{product.productNumber}
                      </span>
                    </div>
                    {!product.isActive && (
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                        <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                          Inactive
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-bold text-gray-800 line-clamp-1">
                        {product.name}
                      </h3>
                      <span className={cn(
                        'px-2 py-0.5 rounded-full text-xs font-medium',
                        product.stock > 10 ? 'bg-green-100 text-green-700' :
                        product.stock > 0 ? 'bg-amber-100 text-amber-700' :
                        'bg-red-100 text-red-700'
                      )}>
                        {product.stock} left
                      </span>
                    </div>

                    <p className="text-sm text-gray-500 mb-2">{product.category}</p>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold gradient-text">
                        {formatPrice(product.price)}
                      </span>

                      <div className="flex gap-2">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => setEditingProduct(product)}
                          className="p-2 rounded-lg text-blue-500 hover:bg-blue-50"
                        >
                          <Edit2 size={16} />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => setDeleteConfirm(product._id)}
                          className="p-2 rounded-lg text-red-500 hover:bg-red-50"
                        >
                          <Trash2 size={16} />
                        </motion.button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-center gap-4 mt-8">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className={cn(
                  'p-2 rounded-kawaii',
                  'bg-white border-2 border-pink-200',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
              >
                <ChevronLeft size={20} />
              </motion.button>

              <span className="text-gray-600">
                Page {currentPage} of {totalPages}
              </span>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className={cn(
                  'p-2 rounded-kawaii',
                  'bg-white border-2 border-pink-200',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
              >
                <ChevronRight size={20} />
              </motion.button>
            </div>
          </>
        )}

        {/* Add/Edit Modal */}
        <AnimatePresence>
          {(showAddModal || editingProduct) && (
            <ProductModal
              product={editingProduct}
              categories={categories}
              onClose={() => {
                setShowAddModal(false)
                setEditingProduct(null)
              }}
              onSave={handleSaveProduct}
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
                    Delete Product?
                  </h3>
                  <p className="text-gray-500 mb-6">
                    This action cannot be undone. The product will be permanently removed.
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
                      Delete
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

// Product Modal Component
function ProductModal({
  product,
  categories,
  onClose,
  onSave,
}: {
  product: Product | null
  categories: string[]
  onClose: () => void
  onSave: (data: ProductFormData) => void
}) {
  const [formData, setFormData] = useState<ProductFormData>({
    productNumber: product?.productNumber?.toString() || '',
    name: product?.name || '',
    description: product?.description || '',
    image: product?.image || '',
    price: product?.price?.toString() || '',
    category: product?.category || 'General',
    stock: product?.stock?.toString() || '10',
  })

  const [errors, setErrors] = useState<Partial<ProductFormData>>({})

  const validate = () => {
    const newErrors: Partial<ProductFormData> = {}
    if (!formData.productNumber) newErrors.productNumber = 'Required'
    if (!formData.name) newErrors.name = 'Required'
    if (!formData.price) newErrors.price = 'Required'
    if (!formData.stock) newErrors.stock = 'Required'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = () => {
    if (validate()) {
      onSave(formData)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className={cn(
          'bg-white rounded-super p-6 sm:p-8 max-w-lg w-full max-h-[90vh] overflow-auto',
          'shadow-kawaii-hover'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">
            {product ? 'Edit Product' : 'Add New Product'}
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
                Product Number *
              </label>
              <input
                type="number"
                value={formData.productNumber}
                onChange={(e) => setFormData({ ...formData, productNumber: e.target.value })}
                className={cn(
                  'w-full px-4 py-3 rounded-kawaii border-2',
                  errors.productNumber ? 'border-red-300' : 'border-pink-100 focus:border-pink-300',
                  'outline-none transition-colors'
                )}
                placeholder="1-200"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Stock *
              </label>
              <input
                type="number"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                className={cn(
                  'w-full px-4 py-3 rounded-kawaii border-2',
                  errors.stock ? 'border-red-300' : 'border-pink-100 focus:border-pink-300',
                  'outline-none transition-colors'
                )}
                placeholder="0"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              Product Name *
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
              placeholder="Cute Plush Bunny"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className={cn(
                'w-full px-4 py-3 rounded-kawaii border-2',
                'border-pink-100 focus:border-pink-300',
                'outline-none transition-colors resize-none'
              )}
              placeholder="A lovely mystery product..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
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
                placeholder="299"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
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

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              Image URL
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={formData.image}
                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                className={cn(
                  'flex-1 px-4 py-3 rounded-kawaii border-2',
                  'border-pink-100 focus:border-pink-300',
                  'outline-none transition-colors'
                )}
                placeholder="https://example.com/image.jpg"
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="button"
                className={cn(
                  'px-4 py-3 rounded-kawaii',
                  'bg-pink-100 text-pink-500',
                  'flex items-center gap-2'
                )}
              >
                <Upload size={18} />
              </motion.button>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Leave empty for auto-generated placeholder
            </p>
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
            {product ? 'Update' : 'Create'} Product
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// Mock products for demo
function getMockProducts(): Product[] {
  const categories = ['Beauty', 'Fashion', 'Electronics', 'Home', 'Toys', 'Accessories']
  const names = [
    'Cute Plush Bunny', 'Sparkle Lip Gloss', 'Kawaii Phone Case',
    'Pastel Earbuds', 'Mini LED Mirror', 'Cozy Socks Set',
    'Scented Candle', 'Hair Scrunchies Pack', 'Sticker Collection',
    'Desk Organizer', 'Portable Charger', 'Makeup Brush Set',
  ]

  return Array.from({ length: 12 }, (_, i) => ({
    _id: `product-${i + 1}`,
    productNumber: i + 1,
    name: names[i % names.length],
    description: 'A lovely mystery product that will bring joy to your day!',
    image: `https://picsum.photos/seed/product${i + 1}/400/400`,
    price: Math.floor(Math.random() * 500) + 100,
    category: categories[Math.floor(Math.random() * categories.length)],
    stock: Math.floor(Math.random() * 50) + 1,
    isActive: Math.random() > 0.1,
  }))
}

