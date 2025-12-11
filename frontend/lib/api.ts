// API Client for communicating with backend

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5000/api'
console.log('API_URL:', API_URL) // Debug log

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
  headers?: Record<string, string>
  token?: string
}

// Get token from localStorage (client-side only)
const getStoredToken = (type: 'user' | 'admin' = 'user'): string | null => {
  if (typeof window === 'undefined') return null

  try {
    const storeName = type === 'admin' ? 'mystrix-admin' : 'mystrix-auth'
    const stored = localStorage.getItem(storeName)
    if (stored) {
      const parsed = JSON.parse(stored)
      return type === 'admin' ? parsed.state?.adminToken : parsed.state?.token
    }
  } catch {
    // Ignore parse errors
  }
  return null
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, headers = {}, token } = options

  const config: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  }

  // Add authorization header if token provided
  if (token) {
    (config.headers as Record<string, string>)['Authorization'] = `Bearer ${token}`
  }

  if (body) {
    config.body = JSON.stringify(body)
  }

  const response = await fetch(`${API_URL}${endpoint}`, config)

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }))
    throw new Error(error.error || error.message || `HTTP error! status: ${response.status}`)
  }

  return response.json()
}

// Authenticated request helper
async function authRequest<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const token = options.token || getStoredToken('user')
  return request<T>(endpoint, { ...options, token: token || undefined })
}

// Admin authenticated request helper
async function adminRequest<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const token = options.token || getStoredToken('admin')
  return request<T>(endpoint, { ...options, token: token || undefined })
}

// Auth API
export const authApi = {
  // User signup
  signup: (data: SignupData) =>
    request<AuthResponse>('/auth/signup', {
      method: 'POST',
      body: data,
    }),

  // User login
  login: (data: LoginData) =>
    request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: data,
    }),

  // User logout (stateless; client clears token)
  logout: (token: string) =>
    authRequest<{ message: string }>('/auth/logout', {
      method: 'POST',
      token,
    }),

  // Get current user profile
  getProfile: (token: string) =>
    authRequest<{ user: User }>('/auth/me', { token }),

  // Update user profile
  updateProfile: (data: UpdateProfileData, token: string) =>
    authRequest<{ message: string; user: User }>('/auth/profile', {
      method: 'PUT',
      body: data,
      token,
    }),

  // Admin login
  adminLogin: (data: AdminLoginData) =>
    request<AdminAuthResponse>('/auth/admin/login', {
      method: 'POST',
      body: data,
    }),

  // Verify admin token
  verifyAdmin: (token: string) =>
    adminRequest<{ valid: boolean; admin?: { email: string } }>('/auth/admin/verify', { token }),
}

// Products API
export const productsApi = {
  getAll: (params?: { page?: number; limit?: number; contestId?: string; search?: string }) => {
    const searchParams = new URLSearchParams()
    if (params?.page) searchParams.append('page', params.page.toString())
    if (params?.limit) searchParams.append('limit', params.limit.toString())
    if (params?.contestId) searchParams.append('contestId', params.contestId)
    if (params?.search) searchParams.append('search', params.search)
    return request<{ products: Product[]; pagination: Pagination }>(`/products?${searchParams}`)
  },

  getById: (id: string) => request<{ product: Product }>(`/products/${id}`),

  getRandom: (count: number, contestId: string) =>
    request<{ products: Product[] }>('/products/random', {
      method: 'POST',
      body: { count, contestId },
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

  // Get authenticated user's orders
  getMyOrders: (params?: { page?: number; limit?: number; status?: string }, token?: string) => {
    const searchParams = new URLSearchParams()
    if (params?.page) searchParams.append('page', params.page.toString())
    if (params?.limit) searchParams.append('limit', params.limit.toString())
    if (params?.status) searchParams.append('status', params.status)
    return authRequest<{ orders: Order[]; pagination: Pagination }>(`/orders/my-orders?${searchParams}`, { token })
  },

  getById: (id: string) => request<{ order: Order }>(`/orders/${id}`),

  // Create order (uses auth token if available)
  create: (data: CreateOrderData, token?: string) =>
    authRequest<{ order: Order; orderId: string; message: string }>('/orders', {
      method: 'POST',
      body: data,
      token,
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

// Payments API (Cashfree)
export const paymentsApi = {
  // Create a payment order for spinning the wheel
  createOrder: (data: CreatePaymentOrderData, token?: string) =>
    authRequest<CreatePaymentOrderResponse>('/payments/create-order', {
      method: 'POST',
      body: data,
      token,
    }),

  // Verify payment status
  verifyPayment: (data: VerifyPaymentRequest) =>
    request<VerifyPaymentResponse>('/payments/verify', {
      method: 'POST',
      body: data,
    }),

  // Check if spin is allowed for a payment
  checkSpin: (paymentId: string) =>
    request<CheckSpinResponse>(`/payments/check-spin/${paymentId}`),

  // Mark spin as used after wheel spin
  useSpin: (paymentId: string, wheelResult: number) =>
    request<UseSpinResponse>('/payments/use-spin', {
      method: 'POST',
      body: { paymentId, wheelResult },
    }),

  // Get payment history (authenticated users)
  getHistory: (params?: { page?: number; limit?: number }, token?: string) => {
    const searchParams = new URLSearchParams()
    if (params?.page) searchParams.append('page', params.page.toString())
    if (params?.limit) searchParams.append('limit', params.limit.toString())
    return authRequest<{ payments: SpinPayment[]; pagination: Pagination }>(`/payments/history?${searchParams}`, { token })
  },
}

// Auth Types
export interface User {
  id: string
  name: string
  email: string
  phone: string
  createdAt?: string
}

export interface UserProfile extends User {
  shippingAddresses?: ShippingAddress[]
}

export interface ShippingAddress {
  _id: string
  name: string
  phone: string
  address: string
  city: string
  pincode: string
  isDefault?: boolean
}

export interface AddAddressData {
  name: string
  phone: string
  address: string
  city: string
  pincode: string
  isDefault?: boolean
}

export interface SignupData {
  name: string
  email: string
  phone: string
  password: string
}

export interface LoginData {
  email: string
  password: string
}

export interface AdminLoginData {
  email: string
  password: string
}

export interface UpdateProfileData {
  name?: string
  phone?: string
}

export interface AuthResponse {
  message: string
  user: User
  token: string
}

export interface AdminAuthResponse {
  message: string
  admin: {
    email: string
  }
  token: string
}

// Product Types
export interface Product {
  _id: string
  productNumber: number
  name: string
  description: string
  image: string
  price: number
  contestId: string
  category?: string
  stock: number
  isActive?: boolean
}

export interface Order {
  _id: string
  orderId: string
  userId?: string
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
  contestId: string
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

// Payment Types (Cashfree)
export interface CreatePaymentOrderData {
  contestId: string
  customerInfo: {
    name: string
    email: string
    phone: string
  }
  returnUrl?: string
}

export interface CreatePaymentOrderResponse {
  success: boolean
  key: string
  orderId: string // Razorpay Order ID
  amount: number
  currency: string
  name: string
  description: string
  prefill: {
    name?: string
    email?: string
    contact?: string
  }
  internalOrderId: string
  paymentId: string
}

export interface VerifyPaymentRequest {
  razorpay_order_id: string
  razorpay_payment_id: string
  razorpay_signature: string
}

export interface VerifyPaymentResponse {
  success: boolean
  status: 'PENDING' | 'PAID' | 'FAILED' | 'CANCELLED' | 'EXPIRED'
  paymentId?: string
  orderId?: string
  contestId?: string
  spinAllowed?: boolean
  spinUsed?: boolean
  message?: string
}

export interface CheckSpinResponse {
  paymentId: string
  orderId: string
  contestId: string
  status: 'PENDING' | 'PAID' | 'FAILED' | 'CANCELLED' | 'EXPIRED'
  spinAllowed: boolean
  spinUsed: boolean
  wheelResult?: number
}

export interface UseSpinResponse {
  success: boolean
  message: string
  wheelResult: number
}

export interface SpinPayment {
  paymentId: string
  orderId: string
  userId?: string
  contestId: string
  contestName: string
  amount: number
  currency: string
  status: 'PENDING' | 'PAID' | 'FAILED' | 'CANCELLED' | 'EXPIRED'
  spinAllowed: boolean
  spinUsed: boolean
  wheelResult?: number
  customerInfo: {
    name: string
    email: string
    phone: string
  }
  paidAt?: string
  createdAt: string
  updatedAt: string
}

