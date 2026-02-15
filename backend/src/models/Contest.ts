import mongoose, { Document, Schema } from 'mongoose'

export interface IContest extends Document {
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
  // Minimum product values for wheel positions 1 and 2
  minValueFor1Box?: number
  minValueFor2Boxes?: number
  createdAt: Date
  updatedAt: Date
}

const contestSchema = new Schema<IContest>(
  {
    contestId: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    wheelRange: {
      min: { type: Number, required: true, min: 0 },
      max: { type: Number, required: true, min: 0 },
    },
    productsPerBox: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },
    description: {
      type: String,
      default: '',
    },
    color: {
      type: String,
      default: 'from-pink-400 to-pink-500',
    },
    gradient: {
      type: String,
      default: 'bg-gradient-to-br from-pink-100 via-pink-50 to-rose-100',
    },
    icon: {
      type: String,
      default: '🎁',
    },
    badge: {
      type: String,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    maxSpinsPerUser: {
      type: Number,
      default: 1,
      min: 1,
    },
    minValueFor1Box: {
      type: Number,
      min: 0,
      default: 0,
    },
    minValueFor2Boxes: {
      type: Number,
      min: 0,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
)

export const Contest = mongoose.model<IContest>('Contest', contestSchema)

