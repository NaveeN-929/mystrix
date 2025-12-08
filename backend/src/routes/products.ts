import { Router, Request, Response } from 'express'
import { body, validationResult, query } from 'express-validator'
import { Product } from '../models/Product.js'

const router = Router()

// GET /api/products - List all products
router.get('/', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 50
    const category = req.query.category as string
    const search = req.query.search as string
    
    const query: Record<string, unknown> = { isActive: true }
    
    if (category) {
      query.category = category
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
    const { count = 5 } = req.body
    
    const products = await Product.aggregate([
      { $match: { isActive: true, stock: { $gt: 0 } } },
      { $sample: { size: Math.min(count, 50) } },
    ])
    
    // If not enough products, generate mock ones
    if (products.length < count) {
      const mockProducts = Array.from(
        { length: count - products.length },
        (_, idx) => ({
          _id: `mock-${idx}-${Date.now()}`,
          productNumber: 100 + idx,
          name: `Mystery Product #${100 + idx}`,
          description: 'A wonderful surprise waiting for you!',
          image: `https://picsum.photos/seed/mock${idx + Date.now()}/400/400`,
          price: Math.floor(Math.random() * 500) + 100,
          category: ['Beauty', 'Fashion', 'Electronics', 'Home', 'Accessories'][
            Math.floor(Math.random() * 5)
          ],
          stock: 10,
        })
      )
      products.push(...mockProducts)
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
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
      }
      
      const { productNumber, name, description, image, price, category, stock } = req.body
      
      // Check if product number exists
      const existing = await Product.findOne({ productNumber })
      if (existing) {
        return res.status(409).json({ error: 'Product with this number already exists' })
      }
      
      const product = new Product({
        productNumber,
        name,
        description: description || '',
        image: image || `https://picsum.photos/seed/product${productNumber}/400/400`,
        price,
        category: category || 'General',
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
    
    let product = await Product.findByIdAndUpdate(
      id,
      { isActive: false, updatedAt: new Date() },
      { new: true }
    )
    
    if (!product) {
      product = await Product.findOneAndUpdate(
        { productNumber: parseInt(id) },
        { isActive: false, updatedAt: new Date() },
        { new: true }
      )
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

