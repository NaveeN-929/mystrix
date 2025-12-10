import { Router, Request, Response } from 'express'
import { body, validationResult } from 'express-validator'
import crypto from 'crypto'
import { SpinPayment } from '../models/SpinPayment.js'
import { Contest } from '../models/Contest.js'
import { optionalAuth } from '../middleware/auth.js'

const router = Router()

// Cashfree API configuration
const CASHFREE_APP_ID = process.env.CASHFREE_APP_ID || ''
const CASHFREE_SECRET_KEY = process.env.CASHFREE_SECRET_KEY || ''
const CASHFREE_API_VERSION = '2023-08-01'
const CASHFREE_ENV = process.env.CASHFREE_ENV || 'sandbox' // 'sandbox' or 'production'

const CASHFREE_BASE_URL = CASHFREE_ENV === 'production'
  ? 'https://api.cashfree.com/pg'
  : 'https://sandbox.cashfree.com/pg'

// Check if credentials are configured
const isCashfreeConfigured = () => {
  return CASHFREE_APP_ID && CASHFREE_SECRET_KEY && 
         CASHFREE_APP_ID !== '' && CASHFREE_SECRET_KEY !== ''
}

// Helper to make Cashfree API requests
async function cashfreeRequest(endpoint: string, method: string, body?: unknown) {
  const url = `${CASHFREE_BASE_URL}${endpoint}`
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-api-version': CASHFREE_API_VERSION,
    'x-client-id': CASHFREE_APP_ID,
    'x-client-secret': CASHFREE_SECRET_KEY,
  }

  const options: RequestInit = {
    method,
    headers,
  }

  if (body) {
    options.body = JSON.stringify(body)
  }

  const response = await fetch(url, options)
  const data = await response.json()

  if (!response.ok) {
    console.error('Cashfree API error:', data)
    throw new Error(data.message || 'Cashfree API error')
  }

  return data
}

// POST /api/payments/create-order - Create a new payment order for spinning
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

      const { contestId, customerInfo, returnUrl } = req.body
      const userId = req.user ? req.user._id.toString() : undefined

      // Check if Cashfree is configured
      if (!isCashfreeConfigured()) {
        console.error('Cashfree credentials not configured. Please set CASHFREE_APP_ID and CASHFREE_SECRET_KEY in .env')
        return res.status(500).json({ 
          error: 'Payment gateway not configured. Please contact support.',
          details: 'Missing Cashfree API credentials'
        })
      }

      // Get contest details - search by contestId field only
      const contest = await Contest.findOne({ 
        contestId: contestId.toUpperCase(),
        isActive: true 
      })

      if (!contest) {
        return res.status(404).json({ error: 'Contest not found or not active' })
      }

      // Create spin payment record
      const spinPayment = new SpinPayment({
        userId,
        contestId: contest.contestId,
        contestName: contest.name,
        amount: contest.price,
        customerInfo: {
          name: customerInfo.name,
          email: customerInfo.email,
          phone: customerInfo.phone.replace(/\s/g, ''), // Remove spaces
        },
      })

      await spinPayment.save()

      // Create Cashfree order
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000'
      const orderPayload = {
        order_id: spinPayment.orderId,
        order_amount: contest.price,
        order_currency: 'INR',
        customer_details: {
          customer_id: userId || `guest_${Date.now()}`,
          customer_name: customerInfo.name,
          customer_email: customerInfo.email,
          customer_phone: customerInfo.phone.replace(/[^0-9]/g, ''), // Only digits
        },
        order_meta: {
          return_url: returnUrl || `${frontendUrl}/wheel/${contestId}?payment_id=${spinPayment.paymentId}&order_id=${spinPayment.orderId}`,
          notify_url: `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/payments/webhook`,
        },
        order_note: `Spin payment for ${contest.name}`,
      }

      const cashfreeOrder = await cashfreeRequest('/orders', 'POST', orderPayload)

      // Update spin payment with Cashfree details
      spinPayment.paymentSessionId = cashfreeOrder.payment_session_id
      spinPayment.cfOrderId = cashfreeOrder.cf_order_id
      await spinPayment.save()

      res.status(201).json({
        success: true,
        paymentId: spinPayment.paymentId,
        orderId: spinPayment.orderId,
        paymentSessionId: cashfreeOrder.payment_session_id,
        orderAmount: contest.price,
        orderCurrency: 'INR',
        contestId: contest.contestId,
        contestName: contest.name,
        cfOrderId: cashfreeOrder.cf_order_id,
      })
    } catch (error) {
      console.error('Error creating payment order:', error)
      res.status(500).json({ error: 'Failed to create payment order' })
    }
  }
)

// GET /api/payments/verify/:orderId - Verify payment status
router.get('/verify/:orderId', async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params

    // Find the spin payment
    const spinPayment = await SpinPayment.findOne({ orderId })

    if (!spinPayment) {
      return res.status(404).json({ error: 'Payment not found' })
    }

    // If already verified, return status
    if (spinPayment.status === 'PAID') {
      return res.json({
        success: true,
        status: 'PAID',
        paymentId: spinPayment.paymentId,
        orderId: spinPayment.orderId,
        contestId: spinPayment.contestId,
        spinAllowed: spinPayment.spinAllowed,
        spinUsed: spinPayment.spinUsed,
      })
    }

    // Verify with Cashfree
    const orderStatus = await cashfreeRequest(`/orders/${orderId}`, 'GET')

    // Update payment status based on Cashfree response
    if (orderStatus.order_status === 'PAID') {
      spinPayment.status = 'PAID'
      spinPayment.spinAllowed = true
      spinPayment.paidAt = new Date()
      
      // Get payment details
      const payments = await cashfreeRequest(`/orders/${orderId}/payments`, 'GET')
      if (payments && payments.length > 0) {
        spinPayment.cfPaymentId = payments[0].cf_payment_id
        spinPayment.paymentMethod = payments[0].payment_group
      }
      
      await spinPayment.save()

      return res.json({
        success: true,
        status: 'PAID',
        paymentId: spinPayment.paymentId,
        orderId: spinPayment.orderId,
        contestId: spinPayment.contestId,
        spinAllowed: true,
        spinUsed: spinPayment.spinUsed,
      })
    } else if (['EXPIRED', 'CANCELLED', 'TERMINATED'].includes(orderStatus.order_status)) {
      spinPayment.status = orderStatus.order_status === 'TERMINATED' ? 'FAILED' : orderStatus.order_status
      await spinPayment.save()

      return res.json({
        success: false,
        status: spinPayment.status,
        message: 'Payment was not completed',
      })
    }

    // Still pending
    res.json({
      success: false,
      status: 'PENDING',
      message: 'Payment is still pending',
    })
  } catch (error) {
    console.error('Error verifying payment:', error)
    res.status(500).json({ error: 'Failed to verify payment' })
  }
})

// POST /api/payments/webhook - Cashfree webhook handler
router.post('/webhook', async (req: Request, res: Response) => {
  try {
    const payload = req.body
    const signature = req.headers['x-webhook-signature'] as string

    // Verify webhook signature
    if (CASHFREE_SECRET_KEY && signature) {
      const rawBody = JSON.stringify(payload)
      const ts = req.headers['x-webhook-timestamp'] as string
      const signedPayload = ts + rawBody
      const expectedSignature = crypto
        .createHmac('sha256', CASHFREE_SECRET_KEY)
        .update(signedPayload)
        .digest('base64')

      if (signature !== expectedSignature) {
        console.error('Invalid webhook signature')
        return res.status(401).json({ error: 'Invalid signature' })
      }
    }

    const { data, type } = payload

    if (type === 'PAYMENT_SUCCESS_WEBHOOK' || type === 'ORDER_PAID') {
      const orderId = data.order?.order_id || data.order_id

      if (!orderId) {
        console.error('No order_id in webhook payload')
        return res.status(400).json({ error: 'Missing order_id' })
      }

      const spinPayment = await SpinPayment.findOne({ orderId })

      if (!spinPayment) {
        console.error('Spin payment not found for order:', orderId)
        return res.status(404).json({ error: 'Payment not found' })
      }

      // Update payment status
      spinPayment.status = 'PAID'
      spinPayment.spinAllowed = true
      spinPayment.paidAt = new Date()
      spinPayment.cfPaymentId = data.payment?.cf_payment_id || data.cf_payment_id
      spinPayment.paymentMethod = data.payment?.payment_group || data.payment_group
      await spinPayment.save()

      console.log(`Payment successful for order ${orderId}`)
    } else if (type === 'PAYMENT_FAILED_WEBHOOK') {
      const orderId = data.order?.order_id || data.order_id

      if (orderId) {
        const spinPayment = await SpinPayment.findOne({ orderId })
        if (spinPayment) {
          spinPayment.status = 'FAILED'
          await spinPayment.save()
        }
      }
    }

    res.json({ success: true })
  } catch (error) {
    console.error('Error processing webhook:', error)
    res.status(500).json({ error: 'Webhook processing failed' })
  }
})

// POST /api/payments/use-spin - Mark spin as used after wheel spin
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

// GET /api/payments/history - Get payment history (for logged-in users)
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

