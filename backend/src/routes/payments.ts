import { Router, Request, Response } from 'express'
import { body, validationResult } from 'express-validator'
import crypto from 'crypto'
import Razorpay from 'razorpay'
import { SpinPayment } from '../models/SpinPayment.js'
import { WalletTransaction } from '../models/WalletTransaction.js'
import { Contest } from '../models/Contest.js'
import User from '../models/User.js'
import { optionalAuth } from '../middleware/auth.js'

const router = Router()

// Razorpay Configuration
const KEY_ID = process.env.RAZORPAY_KEY_ID
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET

console.log('Razorpay Config:', { keyId: KEY_ID, hasSecret: !!KEY_SECRET })

let razorpay: Razorpay | null = null

try {
  if (KEY_ID && KEY_SECRET) {
    razorpay = new Razorpay({
      key_id: KEY_ID,
      key_secret: KEY_SECRET,
    })
  } else {
    console.warn('⚠️ Razorpay credentials missing. Payments will be disabled.')
  }
} catch (err: unknown) {
  console.error('Failed to initialize Razorpay:', err)
}

// Check if credentials are configured
const isRazorpayConfigured = () => {
  return KEY_ID && KEY_SECRET
}

// POST /api/payments/create-order - Create a new Razorpay order
router.post(
  '/create-order',
  optionalAuth,
  [
    body('contestId').notEmpty().withMessage('Contest ID is required'),
    body('customerInfo.name').notEmpty().trim().withMessage('Name is required'),
    body('customerInfo.email').isEmail().withMessage('Valid email is required'),
    body('customerInfo.phone').notEmpty().withMessage('Phone is required'),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
      }

      const { contestId, customerInfo, useWallet = false } = req.body
      const userId = req.user ? req.user._id.toString() : undefined

      if (!razorpay || !KEY_ID) {
        console.error('Razorpay credentials not configured.')
        return res.status(500).json({
          error: 'Payment gateway not configured. Please contact support.'
        })
      }

      // Get contest details
      const contest = await Contest.findOne({
        contestId: contestId.toUpperCase(),
        isActive: true
      })

      if (!contest) {
        return res.status(404).json({ error: 'Contest not found or not active' })
      }

      let discountAmount = 0
      let finalAmount = contest.price

      // Apply wallet balance if requested
      if (useWallet && req.user) {
        const user = await User.findById(req.user._id)
        if (user && user.walletBalance > 0) {
          discountAmount = Math.min(user.walletBalance, contest.price)
          finalAmount = Math.max(0, contest.price - discountAmount)

          // Deduct from wallet immediately
          user.walletBalance -= discountAmount
          await user.save()

          // Create transaction record
          // We'll update the referenceId once the payment is created below
          console.log(`Applied ₹${discountAmount} discount from wallet for user ${req.user._id}`)
        }
      }

      // Create spin payment record
      const spinPayment = new SpinPayment({
        userId,
        contestId: contest.contestId,
        contestName: contest.name,
        amount: contest.price,
        discountAmount,
        finalAmount,
        customerInfo: {
          name: customerInfo.name,
          email: customerInfo.email,
          phone: customerInfo.phone.replace(/\s/g, ''),
        },
      })

      // If wallet was used, record the transaction now that we have spinPayment.paymentId
      if (discountAmount > 0 && req.user) {
        const user = await User.findById(req.user._id);
        await WalletTransaction.create({
          userId: req.user._id,
          amount: -discountAmount,
          type: 'CONTEST_PAYMENT',
          description: `Used wallet balance for ${contest.name}`,
          referenceId: spinPayment.paymentId,
          balanceAfter: user?.walletBalance || 0
        })
      }

      // If final amount is 0, mark as PAID immediately
      if (finalAmount === 0) {
        spinPayment.status = 'PAID'
        spinPayment.spinAllowed = true
        spinPayment.paidAt = new Date()
        spinPayment.paymentMethod = 'wallet'
        await spinPayment.save()

        return res.status(201).json({
          success: true,
          status: 'PAID',
          internalOrderId: spinPayment.orderId,
          paymentId: spinPayment.paymentId,
          message: 'Payment covered by wallet balance',
          walletBalance: req.user ? (await User.findById(req.user._id))?.walletBalance : undefined
        })
      }

      // Save to get the orderId (MS...)
      await spinPayment.save()

      // Create Razorpay Order
      const options = {
        amount: Math.round(finalAmount * 100), // amount in paise
        currency: 'INR',
        receipt: spinPayment.orderId,
        notes: {
          paymentId: spinPayment.paymentId,
          contestId: contest.contestId,
        },
      }

      if (!razorpay) throw new Error('Razorpay not initialized')
      const order = await razorpay.orders.create(options)

      // Update spin payment with Razorpay Order ID
      spinPayment.razorpayOrderId = order.id
      await spinPayment.save()

      res.status(201).json({
        success: true,
        key: KEY_ID,
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        name: 'Mystrix',
        description: `Payment for ${contest.name}`,
        prefill: {
          name: customerInfo.name,
          email: customerInfo.email,
          contact: customerInfo.phone,
        },
        internalOrderId: spinPayment.orderId,
        paymentId: spinPayment.paymentId,
        discountAmount,
        finalAmount,
        walletBalance: req.user ? (await User.findById(req.user._id))?.walletBalance : undefined
      })

    } catch (error) {
      console.error('Error creating payment order:', error)
      res.status(500).json({ error: 'Failed to create payment order' })
    }
  }
)

// POST /api/payments/verify - Verify Razorpay Payment Signature
router.post('/verify', async (req: Request, res: Response) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    } = req.body

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: 'Missing payment details' })
    }

    // Find the payment record by Razorpay Order ID
    const spinPayment = await SpinPayment.findOne({ razorpayOrderId: razorpay_order_id })
    if (!spinPayment) {
      return res.status(404).json({ error: 'Payment record not found' })
    }

    // Verify signature
    const text = razorpay_order_id + '|' + razorpay_payment_id
    const generated_signature = crypto
      .createHmac('sha256', KEY_SECRET!)
      .update(text)
      .digest('hex')

    if (generated_signature === razorpay_signature) {
      // Payment successful
      spinPayment.status = 'PAID'
      spinPayment.spinAllowed = true
      spinPayment.paidAt = new Date()
      spinPayment.razorpayPaymentId = razorpay_payment_id
      spinPayment.razorpaySignature = razorpay_signature
      spinPayment.paymentMethod = 'razorpay'

      await spinPayment.save()

      return res.json({
        success: true,
        status: 'PAID',
        paymentId: spinPayment.paymentId,
        orderId: spinPayment.orderId,
        contestId: spinPayment.contestId,
        spinAllowed: true,
        spinUsed: spinPayment.spinUsed || false
      })
    } else {
      // Signature mismatch
      spinPayment.status = 'FAILED'
      await spinPayment.save()
      return res.status(400).json({ error: 'Invalid payment signature' })
    }

  } catch (error) {
    console.error('Error verifying payment:', error)
    res.status(500).json({ error: 'Failed to verify payment' })
  }
})

// POST /api/payments/use-spin - Mark spin as used (Same as before)
router.post(
  '/use-spin',
  optionalAuth,
  [
    body('paymentId').notEmpty().withMessage('Payment ID is required'),
    body('wheelResult').isNumeric().withMessage('Wheel result is required'),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
      }

      const { paymentId, wheelResult } = req.body

      const spinPayment = await SpinPayment.findOne({ paymentId })

      if (!spinPayment) {
        return res.status(404).json({ error: 'Payment not found' })
      }

      if (spinPayment.status !== 'PAID') {
        return res.status(400).json({ error: 'Payment not completed' })
      }

      if (!spinPayment.spinAllowed) {
        return res.status(400).json({ error: 'Spin not allowed for this payment' })
      }

      if (spinPayment.spinUsed) {
        return res.status(400).json({ error: 'Spin already used' })
      }

      spinPayment.spinUsed = true
      spinPayment.wheelResult = wheelResult

      let rewardAmount = 0
      if (wheelResult === 0) {
        // Generate random reward between 10 and 40
        rewardAmount = Math.floor(Math.random() * (40 - 10 + 1)) + 10
        spinPayment.rewardAmount = rewardAmount

        // If user is logged in or payment is linked to a user, add to their wallet
        const effectiveUserId = req.user?._id || spinPayment.userId
        if (effectiveUserId) {
          const user = await User.findById(effectiveUserId)
          if (user) {
            user.walletBalance = (user.walletBalance || 0) + rewardAmount
            await user.save()

            // Create transaction record
            await WalletTransaction.create({
              userId: user._id,
              amount: rewardAmount,
              type: 'REWARD',
              description: `Won reward from 0-box spin in ${spinPayment.contestName}`,
              referenceId: spinPayment.paymentId,
              balanceAfter: user.walletBalance
            })
            console.log(`Rewarded user ${user._id} with ₹${rewardAmount} for 0 spin. New balance: ₹${user.walletBalance}`)
          }
        }
      }

      await spinPayment.save()

      const finalEffectiveUserId = req.user?._id || spinPayment.userId
      let updatedWalletBalance = undefined
      if (finalEffectiveUserId) {
        const dbUser = await User.findById(finalEffectiveUserId)
        updatedWalletBalance = dbUser?.walletBalance
      }

      res.json({
        success: true,
        message: 'Spin recorded successfully',
        wheelResult,
        rewardAmount: rewardAmount > 0 ? rewardAmount : undefined,
        walletBalance: updatedWalletBalance
      })
    } catch (error) {
      console.error('Error using spin:', error)
      res.status(500).json({ error: 'Failed to record spin' })
    }
  }
)

// GET /api/payments/check-spin/:paymentId - Check if spin is allowed
router.get('/check-spin/:paymentId', async (req: Request, res: Response) => {
  try {
    const { paymentId } = req.params

    const spinPayment = await SpinPayment.findOne({ paymentId })

    if (!spinPayment) {
      return res.status(404).json({ error: 'Payment not found' })
    }

    res.json({
      paymentId: spinPayment.paymentId,
      orderId: spinPayment.orderId,
      contestId: spinPayment.contestId,
      status: spinPayment.status,
      spinAllowed: spinPayment.spinAllowed,
      spinUsed: spinPayment.spinUsed,
      wheelResult: spinPayment.wheelResult,
    })
  } catch (error) {
    console.error('Error checking spin:', error)
    res.status(500).json({ error: 'Failed to check spin status' })
  }
})

// GET /api/payments/history - Get payment history
router.get('/history', optionalAuth, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    const userId = req.user._id.toString()
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 20

    const skip = (page - 1) * limit

    const [payments, total] = await Promise.all([
      SpinPayment.find({ userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      SpinPayment.countDocuments({ userId }),
    ])

    res.json({
      payments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching payment history:', error)
    res.status(500).json({ error: 'Failed to fetch payment history' })
  }
})

export default router
