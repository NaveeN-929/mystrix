import { Router, Request, Response } from 'express'
import { optionalAuth } from '../middleware/auth.js'
import { WalletTransaction } from '../models/WalletTransaction.js'
import User from '../models/User.js'

const router = Router()

// GET /api/wallet/history - Get transaction history for current user
router.get('/history', optionalAuth, async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' })
            return
        }

        const { page = 1, limit = 10 } = req.query
        const skip = (Number(page) - 1) * Number(limit)

        const transactions = await WalletTransaction.find({ userId: req.user._id })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit))

        const total = await WalletTransaction.countDocuments({ userId: req.user._id })

        res.json({
            transactions,
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                pages: Math.ceil(total / Number(limit))
            }
        })
    } catch (error) {
        console.error('Wallet history error:', error)
        res.status(500).json({ error: 'Failed to fetch wallet history' })
    }
})

// GET /api/wallet/balance - Get current balance
router.get('/balance', optionalAuth, async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' })
            return
        }

        const user = await User.findById(req.user._id).select('walletBalance')
        res.json({ balance: user?.walletBalance || 0 })
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch balance' })
    }
})

export default router
