import { Router, Request, Response } from 'express'
import { body, validationResult } from 'express-validator'
import { Order } from '../models/Order.js'
import { Product } from '../models/Product.js'

const router = Router()

// GET /api/orders - List all orders
router.get('/', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 20
    const status = req.query.status as string
    
    const query: Record<string, unknown> = {}
    
    if (status) {
      query.status = status
    }
    
    const skip = (page - 1) * limit
    
    const [orders, total] = await Promise.all([
      Order.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Order.countDocuments(query),
    ])
    
    res.json({
      orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching orders:', error)
    res.status(500).json({ error: 'Failed to fetch orders' })
  }
})

// GET /api/orders/:id - Get single order
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    
    let order = await Order.findById(id).lean()
    
    if (!order) {
      order = await Order.findOne({ orderId: id }).lean()
    }
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' })
    }
    
    res.json({ order })
  } catch (error) {
    console.error('Error fetching order:', error)
    res.status(500).json({ error: 'Failed to fetch order' })
  }
})

// POST /api/orders - Create order
router.post(
  '/',
  [
    body('items').isArray({ min: 1 }),
    body('customerInfo.name').notEmpty().trim(),
    body('customerInfo.phone').notEmpty(),
    body('customerInfo.address').notEmpty(),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
      }
      
      const { items, totalAmount, customerInfo, contestFee = 0 } = req.body
      
      const order = new Order({
        items,
        totalAmount: totalAmount || 0,
        contestFee,
        customerInfo: {
          name: customerInfo.name,
          phone: customerInfo.phone,
          email: customerInfo.email || '',
          address: customerInfo.address,
          city: customerInfo.city || '',
          pincode: customerInfo.pincode || '',
        },
        status: 'pending',
        paymentStatus: 'completed',
      })
      
      await order.save()
      
      // Update product stock
      for (const item of items) {
        if (item.productNumber) {
          await Product.updateOne(
            { productNumber: item.productNumber, stock: { $gte: item.quantity } },
            { $inc: { stock: -item.quantity } }
          )
        }
      }
      
      res.status(201).json({
        message: 'Order created successfully',
        orderId: order.orderId,
        order,
      })
    } catch (error) {
      console.error('Error creating order:', error)
      res.status(500).json({ error: 'Failed to create order' })
    }
  }
)

// PUT /api/orders/:id - Update order
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { status, paymentStatus } = req.body
    
    const updateData: Record<string, unknown> = { updatedAt: new Date() }
    
    if (status) {
      const validStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled']
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: 'Invalid status' })
      }
      updateData.status = status
    }
    
    if (paymentStatus) {
      const validPaymentStatuses = ['pending', 'completed', 'failed']
      if (!validPaymentStatuses.includes(paymentStatus)) {
        return res.status(400).json({ error: 'Invalid payment status' })
      }
      updateData.paymentStatus = paymentStatus
    }
    
    let order = await Order.findByIdAndUpdate(id, updateData, { new: true })
    
    if (!order) {
      order = await Order.findOneAndUpdate({ orderId: id }, updateData, { new: true })
    }
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' })
    }
    
    res.json({ message: 'Order updated successfully', order })
  } catch (error) {
    console.error('Error updating order:', error)
    res.status(500).json({ error: 'Failed to update order' })
  }
})

// PATCH /api/orders/:id - Update order status
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { status } = req.body
    
    const validStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled']
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' })
    }
    
    let order = await Order.findByIdAndUpdate(
      id,
      { status, updatedAt: new Date() },
      { new: true }
    )
    
    if (!order) {
      order = await Order.findOneAndUpdate(
        { orderId: id },
        { status, updatedAt: new Date() },
        { new: true }
      )
    }
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' })
    }
    
    res.json({ message: 'Order status updated', order })
  } catch (error) {
    console.error('Error updating order status:', error)
    res.status(500).json({ error: 'Failed to update order status' })
  }
})

// DELETE /api/orders/:id - Cancel order
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    
    let order = await Order.findByIdAndUpdate(
      id,
      { status: 'cancelled', updatedAt: new Date() },
      { new: true }
    )
    
    if (!order) {
      order = await Order.findOneAndUpdate(
        { orderId: id },
        { status: 'cancelled', updatedAt: new Date() },
        { new: true }
      )
    }
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' })
    }
    
    res.json({ message: 'Order cancelled successfully' })
  } catch (error) {
    console.error('Error cancelling order:', error)
    res.status(500).json({ error: 'Failed to cancel order' })
  }
})

export default router

