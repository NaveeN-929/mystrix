import express, { Request, Response } from 'express'
import { body, validationResult } from 'express-validator'
import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import { generateToken, generateAdminToken, authenticateUser, getJwtSecret } from '../middleware/auth.js'

const router = express.Router()

// Validation middleware
const signupValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('phone')
    .matches(/^[0-9]{10}$/)
    .withMessage('Please provide a valid 10-digit phone number'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
]

const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
]

const adminLoginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
]

// Helper function to handle validation errors
const handleValidationErrors = (req: Request, res: Response): boolean => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    res.status(400).json({ 
      error: 'Validation failed',
      details: errors.array().map(err => err.msg)
    })
    return true
  }
  return false
}

// =====================
// USER ROUTES
// =====================

// POST /api/auth/signup - Register new user
router.post('/signup', signupValidation, async (req: Request, res: Response): Promise<void> => {
  try {
    if (handleValidationErrors(req, res)) return

    const { name, email, phone, password } = req.body

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { phone }] 
    })

    if (existingUser) {
      const field = existingUser.email === email ? 'email' : 'phone number'
      res.status(400).json({ error: `User with this ${field} already exists` })
      return
    }

    // Create new user
    const user = new User({
      name,
      email,
      phone,
      password,
    })

    await user.save()

    // Generate token
    const token = generateToken(user._id.toString(), user.email)

    res.status(201).json({
      message: 'Account created successfully! 🎉',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
      },
      token,
    })
  } catch (error) {
    console.error('Signup error:', error)
    res.status(500).json({ error: 'Failed to create account. Please try again.' })
  }
})

// POST /api/auth/login - User login
router.post('/login', loginValidation, async (req: Request, res: Response): Promise<void> => {
  try {
    if (handleValidationErrors(req, res)) return

    const { email, password } = req.body

    // Find user with password field included
    const user = await User.findOne({ email }).select('+password')

    if (!user) {
      res.status(401).json({ error: 'Invalid email or password' })
      return
    }

    if (!user.isActive) {
      res.status(401).json({ error: 'Your account has been deactivated. Please contact support.' })
      return
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password)

    if (!isPasswordValid) {
      res.status(401).json({ error: 'Invalid email or password' })
      return
    }

    // Generate token
    const token = generateToken(user._id.toString(), user.email)

    res.json({
      message: 'Welcome back! 🎀',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
      },
      token,
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ error: 'Login failed. Please try again.' })
  }
})

// GET /api/auth/me - Get current user profile
router.get('/me', authenticateUser, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user!

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        createdAt: user.createdAt,
      },
    })
  } catch (error) {
    console.error('Get profile error:', error)
    res.status(500).json({ error: 'Failed to get profile.' })
  }
})

// PUT /api/auth/profile - Update user profile
router.put('/profile', authenticateUser, [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('phone')
    .optional()
    .matches(/^[0-9]{10}$/)
    .withMessage('Please provide a valid 10-digit phone number'),
], async (req: Request, res: Response): Promise<void> => {
  try {
    if (handleValidationErrors(req, res)) return

    const user = req.user!
    const { name, phone } = req.body

    // Check if phone is taken by another user
    if (phone && phone !== user.phone) {
      const existingUser = await User.findOne({ phone, _id: { $ne: user._id } })
      if (existingUser) {
        res.status(400).json({ error: 'This phone number is already registered' })
        return
      }
    }

    // Update fields
    if (name) user.name = name
    if (phone) user.phone = phone

    await user.save()

    res.json({
      message: 'Profile updated successfully! ✨',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
      },
    })
  } catch (error) {
    console.error('Update profile error:', error)
    res.status(500).json({ error: 'Failed to update profile.' })
  }
})

// =====================
// ADMIN ROUTES
// =====================

// POST /api/auth/admin/login - Admin login
router.post('/admin/login', adminLoginValidation, async (req: Request, res: Response): Promise<void> => {
  try {
    if (handleValidationErrors(req, res)) return

    const { email, password } = req.body

    // Get admin credentials from environment
    const adminEmail = process.env.ADMIN_EMAIL
    const adminPassword = process.env.ADMIN_PASSWORD

    if (!adminEmail || !adminPassword) {
      console.error('Admin credentials not configured in environment')
      res.status(500).json({ error: 'Admin access not configured' })
      return
    }

    // Verify admin credentials
    if (email !== adminEmail || password !== adminPassword) {
      res.status(401).json({ error: 'Invalid admin credentials' })
      return
    }

    // Generate admin token
    const token = generateAdminToken(email)

    res.json({
      message: 'Admin login successful! 🔐',
      admin: {
        email: adminEmail,
      },
      token,
    })
  } catch (error) {
    console.error('Admin login error:', error)
    res.status(500).json({ error: 'Admin login failed. Please try again.' })
  }
})

// GET /api/auth/admin/verify - Verify admin token
router.get('/admin/verify', async (req: Request, res: Response): Promise<void> => {
  try {
    const authHeader = req.headers.authorization
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ valid: false, error: 'No token provided' })
      return
    }

    const token = authHeader.split(' ')[1]
    
    // Verify the token (will throw if invalid)
    const decoded = jwt.verify(token, getJwtSecret()) as { isAdmin: boolean; email: string }
    
    if (!decoded.isAdmin) {
      res.status(403).json({ valid: false, error: 'Not an admin token' })
      return
    }

    res.json({ 
      valid: true,
      admin: {
        email: decoded.email,
      }
    })
  } catch {
    res.status(401).json({ valid: false, error: 'Invalid or expired token' })
  }
})

export default router
