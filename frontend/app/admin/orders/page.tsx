'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import {
  ShoppingCart,
  Search,
  Filter,
  ArrowLeft,
  Eye,
  X,
  Package,
  MapPin,
  Phone,
  Mail,
  User,
  Calendar,
  Check,
  Truck,
  Clock,
  ChevronLeft,
  ChevronRight,
  Download,
} from 'lucide-react'
import { cn, formatPrice, formatDate } from '@/lib/utils'
import { ordersApi, Order } from '@/lib/api'


export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

  const statuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled']

  const fetchOrders = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await ordersApi.getAll({
        page: currentPage,
        limit: 10,
        status: statusFilter || undefined,
      })
      setOrders(data.orders || [])
      setTotalPages(data.pagination?.pages || 1)
    } catch (error) {
      console.error('Failed to fetch orders:', error)
      setOrders([])
    } finally {
      setIsLoading(false)
    }
  }, [currentPage, statusFilter])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      await ordersApi.updateStatus(orderId, newStatus)
      
      setOrders(orders.map((order) =>
        order._id === orderId ? { ...order, status: newStatus as Order['status'] } : order
      ))
      
      if (selectedOrder?._id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus as Order['status'] })
      }
    } catch (error) {
      console.error('Failed to update order status:', error)
    }
  }

  const filteredOrders = orders.filter((order) => {
    const matchesSearch = !searchTerm || 
      order.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerInfo.name.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

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
                <ShoppingCart className="text-pink-500" />
                Order Management
              </h1>
              <p className="text-gray-500">
                {orders.length} total orders
              </p>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={cn(
              'px-6 py-3 rounded-kawaii',
              'bg-gradient-to-r from-pink-500 to-purple-500',
              'text-white font-bold',
              'flex items-center gap-2',
              'shadow-kawaii hover:shadow-kawaii-hover'
            )}
          >
            <Download size={20} />
            Export CSV
          </motion.button>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-6">
          {statuses.map((status) => {
            const count = orders.filter((o) => o.status === status).length
            return (
              <motion.button
                key={status}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setStatusFilter(statusFilter === status ? '' : status)}
                className={cn(
                  'p-4 rounded-kawaii text-center transition-all',
                  statusFilter === status
                    ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-kawaii'
                    : 'bg-white shadow-soft hover:shadow-kawaii border border-pink-100'
                )}
              >
                <p className="text-2xl font-bold">{count}</p>
                <p className={cn(
                  'text-sm capitalize',
                  statusFilter === status ? 'text-white/80' : 'text-gray-500'
                )}>
                  {status}
                </p>
              </motion.button>
            )
          })}
        </div>

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
                placeholder="Search by order ID or customer name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={cn(
                  'w-full pl-10 pr-4 py-3 rounded-kawaii',
                  'border-2 border-pink-100 focus:border-pink-300',
                  'outline-none transition-colors'
                )}
              />
            </div>

            {/* Status Filter */}
            <div className="relative sm:w-48">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className={cn(
                  'w-full pl-10 pr-4 py-3 rounded-kawaii appearance-none',
                  'border-2 border-pink-100 focus:border-pink-300',
                  'outline-none transition-colors bg-white capitalize'
                )}
              >
                <option value="">All Status</option>
                {statuses.map((status) => (
                  <option key={status} value={status} className="capitalize">{status}</option>
                ))}
              </select>
            </div>
          </div>
        </motion.div>

        {/* Orders Table */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
              className="w-16 h-16 border-4 border-pink-200 border-t-pink-500 rounded-full"
            />
          </div>
        ) : filteredOrders.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">No orders found</h3>
            <p className="text-gray-500">Orders will appear here when customers place them</p>
          </motion.div>
        ) : (
          <>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                'bg-white rounded-super overflow-hidden',
                'shadow-kawaii border border-pink-100'
              )}
            >
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-gray-500 text-sm bg-pink-50/50">
                      <th className="px-6 py-4 font-medium">Order ID</th>
                      <th className="px-6 py-4 font-medium">Customer</th>
                      <th className="px-6 py-4 font-medium">Items</th>
                      <th className="px-6 py-4 font-medium">Amount</th>
                      <th className="px-6 py-4 font-medium">Status</th>
                      <th className="px-6 py-4 font-medium">Date</th>
                      <th className="px-6 py-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((order, idx) => (
                      <motion.tr
                        key={order._id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="border-t border-pink-100 hover:bg-pink-50/30 transition-colors"
                      >
                        <td className="px-6 py-4 font-medium text-gray-800">
                          {order.orderId}
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-medium text-gray-800">{order.customerInfo.name}</p>
                          <p className="text-sm text-gray-500">{order.customerInfo.phone}</p>
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {order.items.length} item{order.items.length > 1 ? 's' : ''}
                        </td>
                        <td className="px-6 py-4 font-bold text-gray-800">
                          {formatPrice(order.totalAmount)}
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={order.status} />
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {formatDate(order.createdAt)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => setSelectedOrder(order)}
                              className="p-2 rounded-lg text-pink-500 hover:bg-pink-100"
                            >
                              <Eye size={18} />
                            </motion.button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>

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

        {/* Order Detail Modal */}
        <AnimatePresence>
          {selectedOrder && (
            <OrderDetailModal
              order={selectedOrder}
              onClose={() => setSelectedOrder(null)}
              onStatusUpdate={handleStatusUpdate}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

// Status Badge Component
function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; icon: React.ReactNode }> = {
    pending: { bg: 'bg-amber-100 text-amber-700', icon: <Clock size={14} /> },
    confirmed: { bg: 'bg-blue-100 text-blue-700', icon: <Check size={14} /> },
    shipped: { bg: 'bg-purple-100 text-purple-700', icon: <Truck size={14} /> },
    delivered: { bg: 'bg-green-100 text-green-700', icon: <Package size={14} /> },
    cancelled: { bg: 'bg-red-100 text-red-700', icon: <X size={14} /> },
  }

  const { bg, icon } = config[status] || config.pending

  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium capitalize',
      bg
    )}>
      {icon}
      {status}
    </span>
  )
}

// Order Detail Modal
function OrderDetailModal({
  order,
  onClose,
  onStatusUpdate,
}: {
  order: Order
  onClose: () => void
  onStatusUpdate: (orderId: string, status: string) => void
}) {
  const statuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled']

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
          'bg-white rounded-super p-6 sm:p-8 max-w-2xl w-full max-h-[90vh] overflow-auto',
          'shadow-kawaii-hover'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              Order Details
            </h2>
            <p className="text-gray-500">{order.orderId}</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <X size={24} className="text-gray-500" />
          </motion.button>
        </div>

        {/* Status Update */}
        <div className={cn(
          'bg-gradient-to-r from-pink-50 to-lavender-50',
          'rounded-kawaii p-4 mb-6'
        )}>
          <p className="text-sm font-medium text-gray-700 mb-2">Update Status</p>
          <div className="flex flex-wrap gap-2">
            {statuses.map((status) => (
              <motion.button
                key={status}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onStatusUpdate(order._id, status)}
                className={cn(
                  'px-4 py-2 rounded-kawaii text-sm font-medium capitalize',
                  order.status === status
                    ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white'
                    : 'bg-white border border-pink-200 text-gray-700 hover:border-pink-400'
                )}
              >
                {status}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Customer Info */}
        <div className={cn(
          'bg-white rounded-kawaii p-4 mb-6',
          'border border-pink-100'
        )}>
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <User size={18} className="text-pink-500" />
            Customer Information
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center gap-2 text-gray-600">
              <User size={16} className="text-gray-400" />
              {order.customerInfo.name}
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Phone size={16} className="text-gray-400" />
              {order.customerInfo.phone}
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Mail size={16} className="text-gray-400" />
              {order.customerInfo.email}
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Calendar size={16} className="text-gray-400" />
              {formatDate(order.createdAt)}
            </div>
            <div className="sm:col-span-2 flex items-start gap-2 text-gray-600">
              <MapPin size={16} className="text-gray-400 mt-0.5" />
              <span>
                {order.customerInfo.address}, {order.customerInfo.city} - {order.customerInfo.pincode}
              </span>
            </div>
          </div>
        </div>

        {/* Order Items */}
        <div className={cn(
          'bg-white rounded-kawaii p-4 mb-6',
          'border border-pink-100'
        )}>
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Package size={18} className="text-pink-500" />
            Order Items
          </h3>
          <div className="space-y-3">
            {order.items.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between py-2 border-b border-pink-50 last:border-0"
              >
                <div>
                  <p className="font-medium text-gray-800">{item.name}</p>
                  <p className="text-sm text-gray-500">
                    #{item.productNumber} • Qty: {item.quantity} • Contest {item.contestType}
                  </p>
                </div>
                <p className="font-bold text-gray-800">
                  {formatPrice(item.price * item.quantity)}
                </p>
              </div>
            ))}
          </div>

          <div className="border-t border-pink-100 mt-4 pt-4">
            <div className="flex justify-between text-gray-600 mb-2">
              <span>Subtotal</span>
              <span>{formatPrice(order.totalAmount)}</span>
            </div>
            <div className="flex justify-between text-gray-600 mb-2">
              <span>Contest Fee (Paid)</span>
              <span className="text-green-500">✓ {formatPrice(order.contestFee || 0)}</span>
            </div>
            <div className="flex justify-between font-bold text-lg text-gray-800">
              <span>Total</span>
              <span className="gradient-text">{formatPrice(order.totalAmount)}</span>
            </div>
          </div>
        </div>

        {/* Close Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onClose}
          className={cn(
            'w-full py-3 rounded-kawaii',
            'bg-gradient-to-r from-pink-500 to-purple-500',
            'text-white font-bold'
          )}
        >
          Close
        </motion.button>
      </motion.div>
    </motion.div>
  )
}


