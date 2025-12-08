'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  Package,
  ShoppingCart,
  Users,
  TrendingUp,
  Gift,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  Plus,
  Settings,
  BarChart3,
  Boxes,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatPrice } from '@/lib/utils'
import { statsApi, DashboardStats } from '@/lib/api'


export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await statsApi.getDashboard()
        setStats(data)
      } catch {
        setStats(getMockStats())
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
          className="w-16 h-16 border-4 border-pink-200 border-t-pink-500 rounded-full"
        />
      </div>
    )
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
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 flex items-center gap-3">
              <Settings className="text-pink-500" />
              Admin Dashboard
            </h1>
            <p className="text-gray-500 mt-1">
              Manage your mystrix store ✨
            </p>
          </div>

          <div className="flex gap-3">
            <Link href="/admin/products">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={cn(
                  'px-4 py-2 rounded-kawaii',
                  'bg-white border-2 border-pink-200',
                  'text-pink-500 font-medium',
                  'flex items-center gap-2',
                  'shadow-soft hover:shadow-kawaii'
                )}
              >
                <Package size={18} />
                Products
              </motion.button>
            </Link>
            <Link href="/admin/orders">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={cn(
                  'px-4 py-2 rounded-kawaii',
                  'bg-gradient-to-r from-pink-500 to-purple-500',
                  'text-white font-medium',
                  'flex items-center gap-2',
                  'shadow-kawaii hover:shadow-kawaii-hover'
                )}
              >
                <ShoppingCart size={18} />
                Orders
              </motion.button>
            </Link>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Revenue"
            value={formatPrice(stats?.totalRevenue || 0)}
            icon={<DollarSign size={24} />}
            trend={12.5}
            color="from-pink-400 to-rose-500"
            delay={0}
          />
          <StatCard
            title="Total Orders"
            value={stats?.totalOrders?.toString() || '0'}
            icon={<ShoppingCart size={24} />}
            trend={8.2}
            color="from-purple-400 to-violet-500"
            delay={0.1}
          />
          <StatCard
            title="Products"
            value={stats?.totalProducts?.toString() || '0'}
            icon={<Boxes size={24} />}
            trend={-2.1}
            color="from-teal-400 to-emerald-500"
            delay={0.2}
          />
          <StatCard
            title="Active Products"
            value={stats?.activeProducts?.toString() || '0'}
            icon={<Gift size={24} />}
            trend={5.4}
            color="from-amber-400 to-orange-500"
            delay={0.3}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Orders */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className={cn(
              'lg:col-span-2 bg-white rounded-super p-6',
              'shadow-kawaii border border-pink-100'
            )}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <BarChart3 className="text-pink-500" size={24} />
                Recent Orders
              </h2>
              <Link href="/admin/orders">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  className="text-pink-500 text-sm font-medium flex items-center gap-1"
                >
                  View All
                  <ArrowUpRight size={16} />
                </motion.button>
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-gray-500 text-sm border-b border-pink-100">
                    <th className="pb-3 font-medium">Order ID</th>
                    <th className="pb-3 font-medium">Customer</th>
                    <th className="pb-3 font-medium">Amount</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {(stats?.recentOrders || getMockOrders()).map((order, idx) => (
                    <motion.tr
                      key={order.orderId}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * idx }}
                      className="border-b border-pink-50 hover:bg-pink-50/50 transition-colors"
                    >
                      <td className="py-4 font-medium text-gray-800">
                        {order.orderId}
                      </td>
                      <td className="py-4 text-gray-600">{order.customerName}</td>
                      <td className="py-4 font-bold text-gray-800">
                        {formatPrice(order.amount)}
                      </td>
                      <td className="py-4">
                        <StatusBadge status={order.status} />
                      </td>
                      <td className="py-4">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          className="p-2 rounded-lg text-pink-500 hover:bg-pink-100"
                        >
                          <Eye size={16} />
                        </motion.button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>

          {/* Quick Actions & Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-6"
          >
            {/* Quick Actions */}
            <div className={cn(
              'bg-white rounded-super p-6',
              'shadow-kawaii border border-pink-100'
            )}>
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <TrendingUp className="text-pink-500" size={24} />
                Quick Actions
              </h2>

              <div className="space-y-3">
                <Link href="/admin/products/new">
                  <motion.button
                    whileHover={{ scale: 1.02, x: 5 }}
                    className={cn(
                      'w-full px-4 py-3 rounded-kawaii',
                      'bg-gradient-to-r from-pink-50 to-lavender-50',
                      'border border-pink-100',
                      'flex items-center gap-3',
                      'text-gray-700 font-medium',
                      'transition-all duration-300'
                    )}
                  >
                    <Plus size={20} className="text-pink-500" />
                    Add New Product
                  </motion.button>
                </Link>
                <Link href="/admin/products">
                  <motion.button
                    whileHover={{ scale: 1.02, x: 5 }}
                    className={cn(
                      'w-full px-4 py-3 rounded-kawaii',
                      'bg-gradient-to-r from-purple-50 to-violet-50',
                      'border border-purple-100',
                      'flex items-center gap-3',
                      'text-gray-700 font-medium',
                      'transition-all duration-300'
                    )}
                  >
                    <Package size={20} className="text-purple-500" />
                    Manage Inventory
                  </motion.button>
                </Link>
                <Link href="/admin/orders">
                  <motion.button
                    whileHover={{ scale: 1.02, x: 5 }}
                    className={cn(
                      'w-full px-4 py-3 rounded-kawaii',
                      'bg-gradient-to-r from-teal-50 to-mint-50',
                      'border border-teal-100',
                      'flex items-center gap-3',
                      'text-gray-700 font-medium',
                      'transition-all duration-300'
                    )}
                  >
                    <ShoppingCart size={20} className="text-teal-500" />
                    Process Orders
                  </motion.button>
                </Link>
              </div>
            </div>

            {/* Order Stats */}
            <div className={cn(
              'bg-white rounded-super p-6',
              'shadow-kawaii border border-pink-100'
            )}>
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Users className="text-pink-500" size={24} />
                Order Status
              </h2>

              <div className="space-y-4">
                <OrderStatBar
                  label="Pending"
                  count={stats?.pendingOrders || 5}
                  total={stats?.totalOrders || 25}
                  color="from-amber-400 to-orange-500"
                />
                <OrderStatBar
                  label="Confirmed"
                  count={Math.floor((stats?.totalOrders || 25) * 0.3)}
                  total={stats?.totalOrders || 25}
                  color="from-blue-400 to-indigo-500"
                />
                <OrderStatBar
                  label="Shipped"
                  count={Math.floor((stats?.totalOrders || 25) * 0.25)}
                  total={stats?.totalOrders || 25}
                  color="from-purple-400 to-violet-500"
                />
                <OrderStatBar
                  label="Delivered"
                  count={stats?.completedOrders || 12}
                  total={stats?.totalOrders || 25}
                  color="from-green-400 to-emerald-500"
                />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Top Products */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className={cn(
            'mt-6 bg-white rounded-super p-6',
            'shadow-kawaii border border-pink-100'
          )}
        >
          <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <Gift className="text-pink-500" size={24} />
            Top Selling Products
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {(stats?.topProducts || getMockTopProducts()).map((product, idx) => (
              <motion.div
                key={product.name}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 * idx }}
                className={cn(
                  'p-4 rounded-kawaii',
                  'bg-gradient-to-br from-pink-50 to-lavender-50',
                  'border border-pink-100'
                )}
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center',
                    'text-white font-bold text-sm',
                    idx === 0 ? 'bg-gradient-to-r from-amber-400 to-orange-500' :
                    idx === 1 ? 'bg-gradient-to-r from-gray-400 to-gray-500' :
                    idx === 2 ? 'bg-gradient-to-r from-amber-600 to-amber-700' :
                    'bg-gradient-to-r from-pink-400 to-rose-500'
                  )}>
                    {idx + 1}
                  </span>
                  <span className="font-medium text-gray-800 line-clamp-1">
                    {product.name}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">{product.sales} sales</span>
                  <span className="font-bold text-gray-800">
                    {formatPrice(product.revenue)}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}

// Helper Components
function StatCard({
  title,
  value,
  icon,
  trend,
  color,
  delay,
}: {
  title: string
  value: string
  icon: React.ReactNode
  trend: number
  color: string
  delay: number
}) {
  const isPositive = trend >= 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      whileHover={{ y: -5 }}
      className={cn(
        'bg-white rounded-super p-6',
        'shadow-kawaii hover:shadow-kawaii-hover',
        'border border-pink-100',
        'transition-all duration-300'
      )}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={cn(
          'w-12 h-12 rounded-kawaii flex items-center justify-center',
          'text-white',
          `bg-gradient-to-r ${color}`
        )}>
          {icon}
        </div>
        <div className={cn(
          'flex items-center gap-1 text-sm font-medium',
          isPositive ? 'text-green-500' : 'text-red-500'
        )}>
          {isPositive ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
          {Math.abs(trend)}%
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
      <p className="text-gray-500 text-sm">{title}</p>
    </motion.div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700',
    confirmed: 'bg-blue-100 text-blue-700',
    shipped: 'bg-purple-100 text-purple-700',
    delivered: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
  }

  return (
    <span className={cn(
      'px-3 py-1 rounded-full text-xs font-medium capitalize',
      colors[status] || colors.pending
    )}>
      {status}
    </span>
  )
}

function OrderStatBar({
  label,
  count,
  total,
  color,
}: {
  label: string
  count: number
  total: number
  color: string
}) {
  const percentage = total > 0 ? (count / total) * 100 : 0

  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-600">{label}</span>
        <span className="font-medium text-gray-800">{count}</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className={cn('h-full rounded-full', `bg-gradient-to-r ${color}`)}
        />
      </div>
    </div>
  )
}

// Mock data functions
function getMockStats(): DashboardStats {
  return {
    totalProducts: 50,
    totalOrders: 127,
    totalRevenue: 89500,
    activeProducts: 45,
    pendingOrders: 18,
    completedOrders: 89,
    recentOrders: getMockOrders(),
    topProducts: getMockTopProducts(),
  }
}

function getMockOrders() {
  return [
    { orderId: 'MS-ABC123', customerName: 'Priya S.', amount: 899, status: 'pending', createdAt: new Date().toISOString() },
    { orderId: 'MS-DEF456', customerName: 'Ananya R.', amount: 1299, status: 'confirmed', createdAt: new Date().toISOString() },
    { orderId: 'MS-GHI789', customerName: 'Meera K.', amount: 599, status: 'shipped', createdAt: new Date().toISOString() },
    { orderId: 'MS-JKL012', customerName: 'Sneha T.', amount: 1599, status: 'delivered', createdAt: new Date().toISOString() },
    { orderId: 'MS-MNO345', customerName: 'Divya P.', amount: 799, status: 'pending', createdAt: new Date().toISOString() },
  ]
}

function getMockTopProducts() {
  return [
    { name: 'Sparkle Lip Gloss', sales: 45, revenue: 22500 },
    { name: 'Kawaii Phone Case', sales: 38, revenue: 19000 },
    { name: 'Cute Plush Bunny', sales: 32, revenue: 16000 },
    { name: 'Pastel Earbuds', sales: 28, revenue: 14000 },
  ]
}

