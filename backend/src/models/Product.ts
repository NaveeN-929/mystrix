import mongoose, { Document, Schema } from 'mongoose'

export interface IProduct extends Document {
  productNumber: number
  name: string
  description: string
  image: string
  price: number // MRP
  c2c: number // Cost to Company
  rarity: 'Common' | 'Uncommon' | 'Rare' | 'Jackpot'
  contestId: string
  stock: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  // Deprecated: kept for backward compatibility with older records
  category?: string
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
    c2c: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    rarity: {
      type: String,
      required: true,
      enum: ['Common', 'Uncommon', 'Rare', 'Jackpot'],
      default: 'Common',
      index: true,
    },
    contestId: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      index: true,
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

