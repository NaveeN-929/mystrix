import { Router, Request, Response } from 'express'
import { body, validationResult } from 'express-validator'
import crypto from 'crypto'
import Razorpay from 'razorpay'
import { SpinPayment } from '../models/SpinPayment.js'
import { Contest } from '../models/Contest.js'
import { optionalAuth } from '../middleware/auth.js'

const router = Router()

// Razorpay Configuration
const KEY_ID = process.env.RAZORPAY_KEY_ID
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET

console.log('Razorpay Config:', { keyId: KEY_ID, hasSecret: !!KEY_SECRET })

const razorpay = new Razorpay({
  key_id: KEY_ID,
  key_secret: KEY_SECRET,
})

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

      const { contestId, customerInfo } = req.body
      const userId = req.user ? req.user._id.toString() : undefined

      if (!isRazorpayConfigured()) {
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

      // Create spin payment record first
      const spinPayment = new SpinPayment({
        userId,
        contestId: contest.contestId,
        contestName: contest.name,
        amount: contest.price,
        customerInfo: {
          name: customerInfo.name,
          email: customerInfo.email,
          phone: customerInfo.phone.replace(/\s/g, ''),
        },
      })

      // Save to get the orderId (MS...)
      await spinPayment.save()

      // Create Razorpay Order
      const options = {
        amount: Math.round(contest.price * 100), // amount in paise
        currency: 'INR',
        receipt: spinPayment.orderId,
        notes: {
          paymentId: spinPayment.paymentId, // SPIN-xxx
          contestId: contest.contestId,
        },
      }

      const order = await razorpay.orders.create(options)

      // Update spin payment with Razorpay Order ID
      spinPayment.razorpayOrderId = order.id
      await spinPayment.save()

      res.status(201).json({
        success: true,
        key: KEY_ID,
        orderId: order.id, // Razorpay Order ID (starts with order_)
        amount: order.amount,
        currency: order.currency,
        name: 'Mystrix',
        description: `Payment for ${contest.name}`,
        prefill: {
          name: customerInfo.name,
          email: customerInfo.email,
          contact: customerInfo.phone,
        },
        internalOrderId: spinPayment.orderId, // MS...
        paymentId: spinPayment.paymentId, // SPIN...
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
        contestId: spinPayment.contestId,
        spinAllowed: true
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
      await spinPayment.save()

      res.json({
        success: true,
        message: 'Spin recorded successfully',
        wheelResult,
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
