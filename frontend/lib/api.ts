// API Client for communicating with backend

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
  headers?: Record<string, string>
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, headers = {} } = options

  const config: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  }

  if (body) {
    config.body = JSON.stringify(body)
  }

  const response = await fetch(`${API_URL}${endpoint}`, config)

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }))
    throw new Error(error.message || `HTTP error! status: ${response.status}`)
  }

  return response.json()
}

// Products API
export const productsApi = {
  getAll: (params?: { page?: number; limit?: number; category?: string; search?: string }) => {
    const searchParams = new URLSearchParams()
    if (params?.page) searchParams.append('page', params.page.toString())
    if (params?.limit) searchParams.append('limit', params.limit.toString())
    if (params?.category) searchParams.append('category', params.category)
    if (params?.search) searchParams.append('search', params.search)
    return request<{ products: Product[]; pagination: Pagination }>(`/products?${searchParams}`)
  },

  getById: (id: string) => request<{ product: Product }>(`/products/${id}`),

  getRandom: (count: number) => 
    request<{ products: Product[] }>('/products/random', {
      method: 'POST',
      body: { count },
    }),

  create: (data: CreateProductData) => 
    request<{ product: Product; message: string }>('/products', {
      method: 'POST',
      body: data,
    }),

  update: (id: string, data: Partial<CreateProductData>) =>
    request<{ product: Product; message: string }>(`/products/${id}`, {
      method: 'PUT',
      body: data,
    }),

  delete: (id: string) =>
    request<{ message: string }>(`/products/${id}`, {
      method: 'DELETE',
    }),
}

// Orders API
export const ordersApi = {
  getAll: (params?: { page?: number; limit?: number; status?: string }) => {
    const searchParams = new URLSearchParams()
    if (params?.page) searchParams.append('page', params.page.toString())
    if (params?.limit) searchParams.append('limit', params.limit.toString())
    if (params?.status) searchParams.append('status', params.status)
    return request<{ orders: Order[]; pagination: Pagination }>(`/orders?${searchParams}`)
  },

  getById: (id: string) => request<{ order: Order }>(`/orders/${id}`),

  create: (data: CreateOrderData) =>
    request<{ order: Order; orderId: string; message: string }>('/orders', {
      method: 'POST',
      body: data,
    }),

  updateStatus: (id: string, status: string) =>
    request<{ order: Order; message: string }>(`/orders/${id}`, {
      method: 'PATCH',
      body: { status },
    }),

  cancel: (id: string) =>
    request<{ message: string }>(`/orders/${id}`, {
      method: 'DELETE',
    }),
}

// Contests API
export const contestsApi = {
  getAll: (showInactive = false) => {
    const params = showInactive ? '?showInactive=true' : ''
    return request<{ contests: Contest[] }>(`/contests${params}`)
  },

  getById: (id: string) => request<{ contest: Contest }>(`/contests/${id}`),

  create: (data: CreateContestData) =>
    request<{ contest: Contest; message: string }>('/contests', {
      method: 'POST',
      body: data,
    }),

  update: (id: string, data: Partial<CreateContestData>) =>
    request<{ contest: Contest; message: string }>(`/contests/${id}`, {
      method: 'PUT',
      body: data,
    }),

  delete: (id: string) =>
    request<{ message: string }>(`/contests/${id}`, {
      method: 'DELETE',
    }),
}

// Stats API
export const statsApi = {
  getDashboard: () => request<DashboardStats>('/stats'),
}

// Types
export interface Product {
  _id: string
  productNumber: number
  name: string
  description: string
  image: string
  price: number
  category: string
  stock: number
  isActive?: boolean
}

export interface Order {
  _id: string
  orderId: string
  items: OrderItem[]
  totalAmount: number
  contestFee: number
  customerInfo: CustomerInfo
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'
  paymentStatus: 'pending' | 'completed' | 'failed'
  createdAt: string
  updatedAt: string
}

export interface OrderItem {
  productId: string
  productNumber: number
  name: string
  price: number
  quantity: number
  contestType: string
}

export interface CustomerInfo {
  name: string
  phone: string
  email: string
  address: string
  city: string
  pincode: string
}

export interface CreateProductData {
  productNumber: number
  name: string
  description?: string
  image?: string
  price: number
  category?: string
  stock?: number
}

export interface CreateOrderData {
  items: Array<{
    productId: string
    productNumber: number
    name: string
    price: number
    quantity: number
    contestType: string
  }>
  totalAmount: number
  contestFee?: number
  customerInfo: CustomerInfo
}

export interface Pagination {
  page: number
  limit: number
  total: number
  pages: number
}

export interface Contest {
  _id: string
  contestId: string
  name: string
  price: number
  wheelRange: {
    min: number
    max: number
  }
  productsPerBox: number
  description: string
  color: string
  gradient: string
  icon: string
  badge?: string
  isActive: boolean
  maxSpinsPerUser: number
  createdAt: string
  updatedAt: string
}

export interface CreateContestData {
  contestId: string
  name: string
  price: number
  wheelRange: {
    min: number
    max: number
  }
  productsPerBox: number
  description?: string
  color?: string
  gradient?: string
  icon?: string
  badge?: string
  maxSpinsPerUser?: number
  isActive?: boolean
}

export interface DashboardStats {
  totalProducts: number
  activeProducts: number
  totalOrders: number
  pendingOrders: number
  completedOrders: number
  totalRevenue: number
  totalContests?: number
  activeContests?: number
  recentOrders: Array<{
    orderId: string
    customerName: string
    amount: number
    status: string
    createdAt: string
  }>
  topProducts: Array<{
    name: string
    sales: number
    revenue: number
  }>
}

