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

// POST /api/products/random - Get random products with weighted distribution
router.post('/random', async (req: Request, res: Response) => {
  try {
    const { count, contestId, wheelResult } = req.body
    const numCount = Number(count) || 1
    const normalizedContestId = (contestId as string | undefined)?.toUpperCase()
    const wheelPosition = Number(wheelResult)

    if (!normalizedContestId) {
      return res.status(400).json({ error: 'contestId is required' })
    }

    const contest = await Contest.findOne({ contestId: normalizedContestId, isActive: true })
    if (!contest) {
      return res.status(404).json({ error: 'Contest not found or inactive' })
    }

    const productsPerBox = contest.productsPerBox || 1
    const minValueFor1Box = contest.minValueFor1Box || 0
    const minValueFor2Boxes = contest.minValueFor2Boxes || 0

    // Check if we need to apply minimum value constraints
    let minTotalValue = 0
    let applyValueConstraint = false

    if (wheelPosition === 1 && minValueFor1Box > 0) {
      minTotalValue = minValueFor1Box
      applyValueConstraint = true
      console.log(`Applying min value constraint for 1 box: ₹${minValueFor1Box}`)
    } else if (wheelPosition === 2 && minValueFor2Boxes > 0) {
      minTotalValue = minValueFor2Boxes
      applyValueConstraint = true
      console.log(`Applying min value constraint for 2 boxes: ₹${minValueFor2Boxes}`)
    }

    // Define weighted distribution based on contest price
    // Default to the 299 distribution
    let distribution = {
      Common: 60,
      Empty: 10,
      Uncommon: 25,
      Rare: 4,
      Jackpot: 1
    }

    if (contest.price === 100) {
      distribution = { Common: 65, Empty: 20, Uncommon: 12, Rare: 2.5, Jackpot: 0.5 }
    } else if (contest.price === 299) {
      distribution = { Common: 60, Empty: 10, Uncommon: 25, Rare: 4, Jackpot: 1 }
    } else if (contest.price === 499) {
      distribution = { Common: 55, Empty: 8, Uncommon: 28, Rare: 7, Jackpot: 2 }
    }

    const boxes: any[][] = []
    const allProducts: any[] = []

    if (applyValueConstraint) {
      // Special handling for wheel positions 1 and 2 with value constraints
      if (wheelPosition === 1) {
        // For 1 box, find products that meet the minimum C2C value
        const minValuePerBox = minTotalValue

        const boxContents: any[] = []
        const rarityOrder = ['Jackpot', 'Rare', 'Uncommon', 'Common']
        
        for (const rarity of rarityOrder) {
          const candidateProducts = await Product.aggregate([
            {
              $match: {
                contestId: normalizedContestId,
                rarity: rarity,
                isActive: true,
                stock: { $gt: 0 },
                c2c: { $gte: minValuePerBox }
              }
            },
            { $sample: { size: productsPerBox } }
          ])

          if (candidateProducts.length > 0) {
            boxContents.push(...candidateProducts)
            allProducts.push(...candidateProducts)
            console.log(`Selected ${rarity} products for 1 box with min C2C value ₹${minValuePerBox}`)
            break
          }
        }

        // If no products meet the exact minimum, select highest C2C value products
        if (boxContents.length === 0) {
          console.log(`No products meet min C2C value ₹${minValuePerBox}, selecting highest C2C value products`)
          const highValueProducts = await Product.aggregate([
            {
              $match: {
                contestId: normalizedContestId,
                isActive: true,
                stock: { $gt: 0 }
              }
            },
            { $sort: { c2c: -1 } },
            { $limit: productsPerBox }
          ])
          
          if (highValueProducts.length > 0) {
            boxContents.push(...highValueProducts)
            allProducts.push(...highValueProducts)
          }
        }

        boxes.push(boxContents)

      } else if (wheelPosition === 2) {
        // For 2 boxes, ensure the total C2C value of all products meets the minimum
        console.log(`Selecting products for 2 boxes with total min C2C value ₹${minTotalValue}`)
        
        const totalProductsNeeded = numCount * productsPerBox
        let selectedProducts: any[] = []
        
        // Strategy: Find the best combination of products that meets minimum C2C with minimal overage
        // First, get all available products sorted by C2C value
        const allAvailableProducts = await Product.aggregate([
          {
            $match: {
              contestId: normalizedContestId,
              isActive: true,
              stock: { $gt: 0 }
            }
          },
          { $sort: { c2c: -1 } } // Sort by C2C descending for better value products first
        ])

        if (allAvailableProducts.length === 0) {
          console.log('No products available for contest')
          boxes.push([])
          boxes.push([])
        } else {
          // Find the best combination that meets the minimum requirement
          let bestCombination: any[] = []
          let bestTotalValue = 0

          // Try different combinations starting with higher value products
          // For 2 products, try combinations that meet the minimum with least excess
          const maxProductsToTry = Math.min(allAvailableProducts.length, 10) // Limit for performance

          for (let i = 0; i < maxProductsToTry; i++) {
            for (let j = i + 1; j < maxProductsToTry; j++) {
              const combination = [allAvailableProducts[i], allAvailableProducts[j]]
              const totalValue = combination.reduce((sum, p) => sum + p.c2c, 0)
              
              if (totalValue >= minTotalValue) {
                // If this is our first valid combination or it's closer to the minimum
                if (bestCombination.length === 0 || 
                    (totalValue < bestTotalValue || bestTotalValue < minTotalValue)) {
                  bestCombination = combination
                  bestTotalValue = totalValue
                  
                  // If we found a combination very close to minimum, use it
                  if (totalValue <= minTotalValue * 1.2) { // Within 20% of minimum
                    break
                  }
                }
              }
            }
            if (bestCombination.length > 0 && bestTotalValue <= minTotalValue * 1.2) {
              break
            }
          }

          // If no good 2-product combination found, select products that meet minimum
          if (bestCombination.length === 0) {
            console.log('No optimal 2-product combination found, selecting products to meet minimum')
            let currentValue = 0
            for (const product of allAvailableProducts) {
              selectedProducts.push(product)
              currentValue += product.c2c
              if (currentValue >= minTotalValue && selectedProducts.length >= totalProductsNeeded) {
                break
              }
            }
          } else {
            selectedProducts = bestCombination
          }

          const finalTotalValue = selectedProducts.reduce((sum, p) => sum + p.c2c, 0)
          
          // Ensure we have exactly the number of products needed
          while (selectedProducts.length < totalProductsNeeded && allAvailableProducts.length > selectedProducts.length) {
            const usedIds = selectedProducts.map(p => p._id.toString())
            const nextProduct = allAvailableProducts.find(p => !usedIds.includes(p._id.toString()))
            if (nextProduct) {
              selectedProducts.push(nextProduct)
            } else {
              break
            }
          }

          // Distribute products across the 2 boxes
          const shuffledProducts = selectedProducts.sort(() => Math.random() - 0.5)
          const box1Contents = shuffledProducts.slice(0, productsPerBox)
          const box2Contents = shuffledProducts.slice(productsPerBox, productsPerBox * 2)

          boxes.push(box1Contents)
          boxes.push(box2Contents)
          allProducts.push(...selectedProducts)

          console.log(`Selected products for 2 boxes with total C2C value ₹${finalTotalValue} (min required: ₹${minTotalValue})`)
        }
      }
    } else {
      // Normal random distribution logic for other wheel positions
      for (let i = 0; i < numCount; i++) {
        const boxContents: any[] = []
        let selectedRarity: string | null = null

        const random = Math.random() * 100

        if (numCount === 1) {
          selectedRarity = 'Uncommon'
        } else {
          let cumulative = 0
          if (random < (cumulative += distribution.Jackpot)) {
            selectedRarity = 'Jackpot'
          } else if (random < (cumulative += distribution.Rare)) {
            selectedRarity = 'Rare'
          } else if (random < (cumulative += distribution.Uncommon)) {
            selectedRarity = 'Uncommon'
          } else if (random < (cumulative += distribution.Common)) {
            selectedRarity = 'Common'
          } else {
            selectedRarity = null // Empty box
          }
        }

        if (selectedRarity) {
          console.log(`Picking products for box ${i + 1}/${numCount}. Rarity: ${selectedRarity}, Contest: ${normalizedContestId}`);
          // Pick productsPerBox items of this rarity
          let rarityProducts = await Product.aggregate([
            {
              $match: {
                contestId: normalizedContestId,
                rarity: selectedRarity,
                isActive: true,
                stock: { $gt: 0 }
              }
            },
            { $sample: { size: productsPerBox } }
          ])

          // If numCount === 1 and we specifically want Uncommon, but none found in contest,
          // search globally as a last resort "irrespective of contest"
          if (numCount === 1 && selectedRarity === 'Uncommon' && rarityProducts.length === 0) {
            console.log(`No Uncommon products in ${normalizedContestId}. Searching globally...`);
            rarityProducts = await Product.aggregate([
              {
                $match: {
                  rarity: 'Uncommon',
                  isActive: true,
                  stock: { $gt: 0 }
                }
              },
              { $sample: { size: productsPerBox } }
            ])
          }

          if (rarityProducts.length > 0) {
            boxContents.push(...rarityProducts)
            allProducts.push(...rarityProducts)

            // If we didn't find enough of that rarity (and not in the global fallback case), 
            // fill with any products from contest
            if (boxContents.length < productsPerBox) {
              const fillCount = productsPerBox - boxContents.length
              const fillProducts = await Product.aggregate([
                {
                  $match: {
                    contestId: normalizedContestId,
                    isActive: true,
                    stock: { $gt: 0 },
                    _id: { $nin: boxContents.map(p => p._id) }
                  }
                },
                { $sample: { size: fillCount } }
              ])
              boxContents.push(...fillProducts)
              allProducts.push(...fillProducts)
            }
          } else {
            // Fallback: Pick any random products if this rarity is empty in DB
            const fallbackProducts = await Product.aggregate([
              { $match: { contestId: normalizedContestId, isActive: true, stock: { $gt: 0 } } },
              { $sample: { size: productsPerBox } }
            ])
            boxContents.push(...fallbackProducts)
            allProducts.push(...fallbackProducts)
          }
        }

        boxes.push(boxContents)
      }
    }

    // For wheel positions 1 and 2, skip empty box logic to ensure value is provided
    if (!applyValueConstraint) {
      // Guarantee at least one empty box if numCount > 1 to enhance user experience
      // This ensures the "Better luck next time" screen is shown at least once in multi-box reveals
      if (numCount > 1 && boxes.every(b => b.length > 0)) {
        const forceEmptyIndex = Math.floor(Math.random() * numCount);
        const removedProducts = boxes[forceEmptyIndex];
        boxes[forceEmptyIndex] = [];

        // Update allProducts accordingly for backward compatibility
        removedProducts.forEach(removed => {
          const productIndex = allProducts.findIndex(p => p._id.toString() === removed._id.toString());
          if (productIndex !== -1) {
            allProducts.splice(productIndex, 1);
          }
        });
      }
    }

    res.json({
      products: allProducts, // for backward compatibility
      boxes: boxes
    })
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
    body('c2c').isFloat({ min: 0 }),
    body('rarity').isIn(['Common', 'Uncommon', 'Rare', 'Jackpot']),
    body('contestId').notEmpty().isString().trim(),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
      }

      const { productNumber, name, description, image, price, c2c, rarity, contestId, stock } = req.body
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
        c2c,
        rarity,
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

