import { Router, Request, Response } from 'express'
import { body, validationResult } from 'express-validator'
import User from '../models/User.js'
import { authenticateUser } from '../middleware/auth.js'

const router = Router()

// GET /api/user/profile - Get user profile
router.get('/profile', authenticateUser, async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.user!._id)
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }
    
    res.json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        shippingAddresses: user.shippingAddresses,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    })
  } catch (error) {
    console.error('Error fetching user profile:', error)
    res.status(500).json({ error: 'Failed to fetch profile' })
  }
})

// PUT /api/user/profile - Update user profile
router.put(
  '/profile',
  authenticateUser,
  [
    body('name').optional().trim().isLength({ min: 2, max: 50 }),
    body('phone').optional().matches(/^[0-9]{10}$/),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
      }
      
      const { name, phone } = req.body
      const updateData: Record<string, unknown> = {}
      
      if (name) updateData.name = name
      if (phone) updateData.phone = phone
      
      const user = await User.findByIdAndUpdate(
        req.user!._id,
        updateData,
        { new: true }
      )
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' })
      }
      
      res.json({
        message: 'Profile updated successfully',
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          shippingAddresses: user.shippingAddresses,
        },
      })
    } catch (error) {
      console.error('Error updating profile:', error)
      res.status(500).json({ error: 'Failed to update profile' })
    }
  }
)

// GET /api/user/addresses - Get all shipping addresses
router.get('/addresses', authenticateUser, async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.user!._id)
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }
    
    res.json({ addresses: user.shippingAddresses })
  } catch (error) {
    console.error('Error fetching addresses:', error)
    res.status(500).json({ error: 'Failed to fetch addresses' })
  }
})

// POST /api/user/addresses - Add new shipping address
router.post(
  '/addresses',
  authenticateUser,
  [
    body('name').notEmpty().trim(),
    body('phone').notEmpty(),
    body('address').notEmpty().trim(),
    body('city').notEmpty().trim(),
    body('pincode').notEmpty().trim(),
    body('isDefault').optional().isBoolean(),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
      }
      
      const { name, phone, address, city, pincode, isDefault } = req.body
      
      const user = await User.findById(req.user!._id)
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' })
      }
      
      // If this is set as default, remove default from other addresses
      if (isDefault) {
        user.shippingAddresses.forEach(addr => {
          addr.isDefault = false
        })
      }
      
      // Add new address
      user.shippingAddresses.push({
        name,
        phone,
        address,
        city,
        pincode,
        isDefault: isDefault || user.shippingAddresses.length === 0, // First address is default
      })
      
      await user.save()
      
      res.status(201).json({
        message: 'Address added successfully',
        addresses: user.shippingAddresses,
      })
    } catch (error) {
      console.error('Error adding address:', error)
      res.status(500).json({ error: 'Failed to add address' })
    }
  }
)

// PUT /api/user/addresses/:addressId - Update shipping address
router.put(
  '/addresses/:addressId',
  authenticateUser,
  [
    body('name').optional().trim(),
    body('phone').optional(),
    body('address').optional().trim(),
    body('city').optional().trim(),
    body('pincode').optional().trim(),
    body('isDefault').optional().isBoolean(),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
      }
      
      const { addressId } = req.params
      const { name, phone, address, city, pincode, isDefault } = req.body
      
      const user = await User.findById(req.user!._id)
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' })
      }
      
      const addressToUpdate = user.shippingAddresses.find(
        addr => addr._id?.toString() === addressId
      )
      
      if (!addressToUpdate) {
        return res.status(404).json({ error: 'Address not found' })
      }
      
      // If setting as default, remove default from others
      if (isDefault) {
        user.shippingAddresses.forEach(addr => {
          addr.isDefault = false
        })
      }
      
      // Update fields
      if (name !== undefined) addressToUpdate.name = name
      if (phone !== undefined) addressToUpdate.phone = phone
      if (address !== undefined) addressToUpdate.address = address
      if (city !== undefined) addressToUpdate.city = city
      if (pincode !== undefined) addressToUpdate.pincode = pincode
      if (isDefault !== undefined) addressToUpdate.isDefault = isDefault
      
      await user.save()
      
      res.json({
        message: 'Address updated successfully',
        addresses: user.shippingAddresses,
      })
    } catch (error) {
      console.error('Error updating address:', error)
      res.status(500).json({ error: 'Failed to update address' })
    }
  }
)

// DELETE /api/user/addresses/:addressId - Delete shipping address
router.delete('/addresses/:addressId', authenticateUser, async (req: Request, res: Response) => {
  try {
    const { addressId } = req.params
    
    const user = await User.findById(req.user!._id)
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }
    
    const addressIndex = user.shippingAddresses.findIndex(
      addr => addr._id?.toString() === addressId
    )
    
    if (addressIndex === -1) {
      return res.status(404).json({ error: 'Address not found' })
    }
    
    const [addressToDelete] = user.shippingAddresses.splice(addressIndex, 1)
    const wasDefault = addressToDelete?.isDefault
    
    // If deleted address was default, set first remaining address as default
    if (wasDefault && user.shippingAddresses.length > 0) {
      user.shippingAddresses[0].isDefault = true
    }
    
    await user.save()
    
    res.json({
      message: 'Address deleted successfully',
      addresses: user.shippingAddresses,
    })
  } catch (error) {
    console.error('Error deleting address:', error)
    res.status(500).json({ error: 'Failed to delete address' })
  }
})

export default router
