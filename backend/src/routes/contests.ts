import { Router, Request, Response } from 'express'
import { body, validationResult } from 'express-validator'
import mongoose from 'mongoose'
import { Contest } from '../models/Contest.js'

const router = Router()

// Helper to check if string is valid MongoDB ObjectId
const isValidObjectId = (id: string): boolean => {
  return mongoose.Types.ObjectId.isValid(id) && new mongoose.Types.ObjectId(id).toString() === id
}

// GET /api/contests - List all contests
router.get('/', async (req: Request, res: Response) => {
  try {
    const showInactive = req.query.showInactive === 'true'
    const query = showInactive ? {} : { isActive: true }
    
    const contests = await Contest.find(query).sort({ price: 1 }).lean()
    
    res.json({ contests })
  } catch (error) {
    console.error('Error fetching contests:', error)
    res.status(500).json({ error: 'Failed to fetch contests' })
  }
})

// GET /api/contests/:id - Get single contest
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    let contest = null
    
    // First try to find by contestId (A, B, C, etc.)
    contest = await Contest.findOne({ contestId: id.toUpperCase() }).lean()
    
    // If not found and id looks like a valid ObjectId, try findById
    if (!contest && isValidObjectId(id)) {
      contest = await Contest.findById(id).lean()
    }
    
    if (!contest) {
      return res.status(404).json({ error: 'Contest not found', contest: null })
    }
    
    res.json({ contest })
  } catch (error) {
    console.error('Error fetching contest:', error)
    res.status(500).json({ error: 'Failed to fetch contest', contest: null })
  }
})

// POST /api/contests - Create contest
router.post(
  '/',
  [
    body('contestId').notEmpty().trim().isLength({ min: 1, max: 10 }),
    body('name').notEmpty().trim(),
    body('price').isFloat({ min: 0 }),
    body('wheelRange.min').isInt({ min: 0 }),
    body('wheelRange.max').isInt({ min: 0 }),
    body('productsPerBox').isInt({ min: 1 }),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
      }
      
      const { contestId, name, price, wheelRange, productsPerBox, description, color, gradient, icon, badge, maxSpinsPerUser } = req.body
      
      // Check if contest ID exists
      const existing = await Contest.findOne({ contestId: contestId.toUpperCase() })
      if (existing) {
        return res.status(409).json({ error: 'Contest with this ID already exists' })
      }
      
      const contest = new Contest({
        contestId: contestId.toUpperCase(),
        name,
        price,
        wheelRange,
        productsPerBox,
        description: description || '',
        color: color || 'from-pink-400 to-pink-500',
        gradient: gradient || 'bg-gradient-to-br from-pink-100 via-pink-50 to-rose-100',
        icon: icon || '🎁',
        badge: badge || '',
        isActive: true,
        maxSpinsPerUser: maxSpinsPerUser || 1,
      })
      
      await contest.save()
      
      res.status(201).json({
        message: 'Contest created successfully',
        contest,
      })
    } catch (error) {
      console.error('Error creating contest:', error)
      res.status(500).json({ error: 'Failed to create contest' })
    }
  }
)

// PUT /api/contests/:id - Update contest
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const updateData = { ...req.body, updatedAt: new Date() }
    delete updateData._id
    
    if (updateData.contestId) {
      updateData.contestId = updateData.contestId.toUpperCase()
    }
    
    let contest = null
    
    // First try by contestId
    contest = await Contest.findOneAndUpdate(
      { contestId: id.toUpperCase() },
      updateData,
      { new: true }
    )
    
    // If not found and valid ObjectId, try by _id
    if (!contest && isValidObjectId(id)) {
      contest = await Contest.findByIdAndUpdate(id, updateData, { new: true })
    }
    
    if (!contest) {
      return res.status(404).json({ error: 'Contest not found' })
    }
    
    res.json({ message: 'Contest updated successfully', contest })
  } catch (error) {
    console.error('Error updating contest:', error)
    res.status(500).json({ error: 'Failed to update contest' })
  }
})

// DELETE /api/contests/:id - Soft delete contest
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    let contest = null
    
    // First try by contestId
    contest = await Contest.findOneAndUpdate(
      { contestId: id.toUpperCase() },
      { isActive: false, updatedAt: new Date() },
      { new: true }
    )
    
    // If not found and valid ObjectId, try by _id
    if (!contest && isValidObjectId(id)) {
      contest = await Contest.findByIdAndUpdate(
        id,
        { isActive: false, updatedAt: new Date() },
        { new: true }
      )
    }
    
    if (!contest) {
      return res.status(404).json({ error: 'Contest not found' })
    }
    
    res.json({ message: 'Contest deactivated successfully' })
  } catch (error) {
    console.error('Error deleting contest:', error)
    res.status(500).json({ error: 'Failed to delete contest' })
  }
})

export default router

