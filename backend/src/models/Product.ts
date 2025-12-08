import mongoose, { Document, Schema } from 'mongoose'

export interface IProduct extends Document {
  productNumber: number
  name: string
  description: string
  image: string
  price: number
  category: string
  stock: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

const productSchema = new Schema<IProduct>(
  {
    productNumber: {
      type: Number,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      default: '',
      maxlength: 1000,
    },
    image: {
      type: String,
      default: '',
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    category: {
      type: String,
      default: 'General',
      enum: ['Beauty', 'Fashion', 'Electronics', 'Home', 'Toys', 'Accessories', 'General'],
    },
    stock: {
      type: Number,
      default: 0,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
)

// Index for search
productSchema.index({ name: 'text', description: 'text' })

export const Product = mongoose.model<IProduct>('Product', productSchema)

