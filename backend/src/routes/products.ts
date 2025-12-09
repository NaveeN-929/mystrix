import { Router, Request, Response } from 'express'
import { body, validationResult } from 'express-validator'
import { Product } from '../models/Product.js'
import { Contest } from '../models/Contest.js'

const router = Router()

// GET /api/products - List all products
router.get('/', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 50
    const contestIdParam = (req.query.contestId as string) || (req.query.category as string)
    const search = req.query.search as string
    
    const query: Record<string, unknown> = { isActive: true }
    
    if (contestIdParam) {
      query.contestId = contestIdParam.toUpperCase()
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ]
    }
    
    const skip = (page - 1) * limit
    
    const [products, total] = await Promise.all([
      Product.find(query)
        .sort({ productNumber: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Product.countDocuments(query),
    ])
    
    res.json({
      products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching products:', error)
    res.status(500).json({ error: 'Failed to fetch products' })
  }
})

// POST /api/products/random - Get random products
router.post('/random', async (req: Request, res: Response) => {
  try {
    const { count = 5, contestId } = req.body
    const normalizedContestId = (contestId as string | undefined)?.toUpperCase()
    
    if (!normalizedContestId) {
      return res.status(400).json({ error: 'contestId is required to fetch products' })
    }
    
    const contestExists = await Contest.findOne({ contestId: normalizedContestId, isActive: true })
    if (!contestExists) {
      return res.status(404).json({ error: 'Contest not found or inactive' })
    }
    
    const products = await Product.aggregate([
      { $match: { isActive: true, stock: { $gt: 0 }, contestId: normalizedContestId } },
      { $sample: { size: Math.min(count, 50) } },
    ])

    if (products.length === 0) {
      return res.status(404).json({ error: 'No products available' })
    }

    res.json({ products })
  } catch (error) {
    console.error('Error fetching random products:', error)
    res.status(500).json({ error: 'Failed to fetch random products' })
  }
})

// GET /api/products/:id - Get single product
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    
    let product = await Product.findById(id).lean()
    
    if (!product) {
      product = await Product.findOne({ productNumber: parseInt(id) }).lean()
    }
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' })
    }
    
    res.json({ product })
  } catch (error) {
    console.error('Error fetching product:', error)
    res.status(500).json({ error: 'Failed to fetch product' })
  }
})

// POST /api/products - Create product
router.post(
  '/',
  [
    body('productNumber').isInt({ min: 1 }),
    body('name').notEmpty().trim(),
    body('price').isFloat({ min: 0 }),
    body('contestId').notEmpty().isString().trim(),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
      }
      
      const { productNumber, name, description, image, price, contestId, stock } = req.body
      const normalizedContestId = (contestId as string).toUpperCase()
      
      const contestExists = await Contest.findOne({ contestId: normalizedContestId })
      if (!contestExists) {
        return res.status(400).json({ error: 'Invalid contestId - contest not found' })
      }
      
      // Check if product number exists
      const existing = await Product.findOne({ productNumber })
      if (existing) {
        return res.status(409).json({ error: 'Product with this number already exists' })
      }
      
      const product = new Product({
        productNumber,
        name,
        description: description || '',
        image: typeof image === 'string' ? image.trim() : '',
        price,
        contestId: normalizedContestId,
        stock: stock || 0,
        isActive: true,
      })
      
      await product.save()
      
      res.status(201).json({
        message: 'Product created successfully',
        product,
      })
    } catch (error) {
      console.error('Error creating product:', error)
      res.status(500).json({ error: 'Failed to create product' })
    }
  }
)

// PUT /api/products/:id - Update product
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const updateData = { ...req.body, updatedAt: new Date() }
    delete updateData._id
    
    if (updateData.contestId) {
      const normalizedContestId = (updateData.contestId as string).toUpperCase()
      const contestExists = await Contest.findOne({ contestId: normalizedContestId })
      if (!contestExists) {
        return res.status(400).json({ error: 'Invalid contestId - contest not found' })
      }
      updateData.contestId = normalizedContestId
    }
    
    let product = await Product.findByIdAndUpdate(id, updateData, { new: true })
    
    if (!product) {
      product = await Product.findOneAndUpdate(
        { productNumber: parseInt(id) },
        updateData,
        { new: true }
      )
    }
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' })
    }
    
    res.json({ message: 'Product updated successfully', product })
  } catch (error) {
    console.error('Error updating product:', error)
    res.status(500).json({ error: 'Failed to update product' })
  }
})

// DELETE /api/products/:id - Soft delete product
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    
    // Try deleting by Mongo _id first
    let product = await Product.findByIdAndDelete(id)
    
    // Fallback: delete by productNumber if _id lookup fails
    if (!product && !Number.isNaN(parseInt(id))) {
      product = await Product.findOneAndDelete({ productNumber: parseInt(id) })
    }
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' })
    }
    
    res.json({ message: 'Product deleted successfully' })
  } catch (error) {
    console.error('Error deleting product:', error)
    res.status(500).json({ error: 'Failed to delete product' })
  }
})

export default router

