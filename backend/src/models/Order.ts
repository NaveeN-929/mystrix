import mongoose, { Document, Schema } from 'mongoose'

export interface IOrderItem {
  productId: string
  productNumber: number
  name: string
  price: number
  quantity: number
  contestType: string
}

export interface ICustomerInfo {
  name: string
  phone: string
  email: string
  address: string
  city: string
  pincode: string
}

export interface IOrder extends Document {
  orderId: string
  items: IOrderItem[]
  totalAmount: number
  contestFee: number
  customerInfo: ICustomerInfo
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'
  paymentStatus: 'pending' | 'completed' | 'failed'
  createdAt: Date
  updatedAt: Date
}

const orderItemSchema = new Schema<IOrderItem>(
  {
    productId: { type: String, required: true },
    productNumber: { type: Number, required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
    contestType: { type: String, required: true },
  },
  { _id: false }
)

const customerInfoSchema = new Schema<ICustomerInfo>(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true },
    email: { type: String, default: '' },
    address: { type: String, required: true },
    city: { type: String, default: '' },
    pincode: { type: String, default: '' },
  },
  { _id: false }
)

const orderSchema = new Schema<IOrder>(
  {
    orderId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    items: {
      type: [orderItemSchema],
      required: true,
      validate: {
        validator: (items: IOrderItem[]) => items.length > 0,
        message: 'Order must have at least one item',
      },
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    contestFee: {
      type: Number,
      default: 0,
      min: 0,
    },
    customerInfo: {
      type: customerInfoSchema,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'],
      default: 'pending',
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'completed',
    },
  },
  {
    timestamps: true,
  }
)

// Generate order ID
function generateOrderId(): string {
  const timestamp = Date.now().toString(36)
  const randomPart = Math.random().toString(36).substring(2, 8)
  return `MS-${timestamp}-${randomPart}`.toUpperCase()
}

// Pre-save hook to generate orderId
orderSchema.pre('save', function (next) {
  if (!this.orderId) {
    this.orderId = generateOrderId()
  }
  next()
})

export const Order = mongoose.model<IOrder>('Order', orderSchema)

