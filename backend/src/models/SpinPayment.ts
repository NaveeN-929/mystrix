import mongoose, { Document, Schema } from 'mongoose'

export interface ISpinPayment extends Document {
  paymentId: string
  orderId: string // Cashfree order_id
  userId?: string
  contestId: string
  contestName: string
  amount: number
  currency: string
  status: 'PENDING' | 'PAID' | 'FAILED' | 'CANCELLED' | 'EXPIRED'
  paymentMethod?: string
  paymentSessionId?: string
  cfOrderId?: string
  cfPaymentId?: string
  razorpayOrderId?: string
  razorpayPaymentId?: string
  razorpaySignature?: string
  spinAllowed: boolean
  spinUsed: boolean
  wheelResult?: number
  customerInfo: {
    name: string
    email: string
    phone: string
  }
  metadata?: Record<string, unknown>
  paidAt?: Date
  createdAt: Date
  updatedAt: Date
}

const spinPaymentSchema = new Schema<ISpinPayment>(
  {
    paymentId: {
      type: String,
      unique: true,
      index: true,
    },
    orderId: {
      type: String,
      unique: true,
      index: true,
    },
    userId: {
      type: String,
      index: true,
      sparse: true,
    },
    contestId: {
      type: String,
      required: true,
      index: true,
    },
    contestName: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: 'INR',
    },
    status: {
      type: String,
      enum: ['PENDING', 'PAID', 'FAILED', 'CANCELLED', 'EXPIRED'],
      default: 'PENDING',
      index: true,
    },
    paymentMethod: {
      type: String,
    },
    paymentSessionId: {
      type: String,
    },
    cfOrderId: {
      type: String,
    },
    cfPaymentId: {
      type: String,
    },
    razorpayOrderId: {
      type: String,
      index: true,
    },
    razorpayPaymentId: {
      type: String,
    },
    razorpaySignature: {
      type: String,
    },
    spinAllowed: {
      type: Boolean,
      default: false,
    },
    spinUsed: {
      type: Boolean,
      default: false,
    },
    wheelResult: {
      type: Number,
    },
    customerInfo: {
      name: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String, required: true },
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
    paidAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
)

// Generate unique payment ID
function generatePaymentId(): string {
  const timestamp = Date.now().toString(36)
  const randomPart = Math.random().toString(36).substring(2, 8)
  return `SPIN-${timestamp}-${randomPart}`.toUpperCase()
}

// Generate unique order ID for Cashfree
function generateOrderId(): string {
  const timestamp = Date.now().toString(36)
  const randomPart = Math.random().toString(36).substring(2, 10)
  return `MS${timestamp}${randomPart}`.toUpperCase()
}

// Pre-save hook to generate IDs
spinPaymentSchema.pre('save', function (next) {
  if (!this.paymentId) {
    this.paymentId = generatePaymentId()
  }
  if (!this.orderId) {
    this.orderId = generateOrderId()
  }
  next()
})

export const SpinPayment = mongoose.model<ISpinPayment>('SpinPayment', spinPaymentSchema)


