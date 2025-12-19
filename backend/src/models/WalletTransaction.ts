import mongoose, { Document, Schema } from 'mongoose'

export interface IWalletTransaction extends Document {
    userId: string
    amount: number
    type: 'REWARD' | 'CONTEST_PAYMENT' | 'REFUND' | 'ADMIN_ADJUSTMENT'
    description: string
    referenceId?: string // PaymentId or SpinPayment ID
    balanceAfter: number
    createdAt: Date
}

const walletTransactionSchema = new Schema<IWalletTransaction>(
    {
        userId: {
            type: String,
            required: true,
            index: true,
        },
        amount: {
            type: Number,
            required: true,
        },
        type: {
            type: String,
            enum: ['REWARD', 'CONTEST_PAYMENT', 'REFUND', 'ADMIN_ADJUSTMENT'],
            required: true,
        },
        description: {
            type: String,
            required: true,
        },
        referenceId: {
            type: String,
        },
        balanceAfter: {
            type: Number,
            required: true,
        },
    },
    {
        timestamps: true,
    }
)

export const WalletTransaction = mongoose.model<IWalletTransaction>('WalletTransaction', walletTransactionSchema)
