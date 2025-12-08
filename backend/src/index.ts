import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import morgan from 'morgan'
import rateLimit from 'express-rate-limit'
import dotenv from 'dotenv'
import mongoose from 'mongoose'

// Routes
import productRoutes from './routes/products.js'
import orderRoutes from './routes/orders.js'
import statsRoutes from './routes/stats.js'
import contestRoutes from './routes/contests.js'

// Load environment variables
dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mystery_scoop'

// Security Middleware
app.use(helmet())
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}))

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests, please try again later.' },
})
app.use('/api/', limiter)

// Body parsing
app.use(express.json({ limit: '10kb' }))
app.use(express.urlencoded({ extended: true }))

// Compression
app.use(compression())

// Logging
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'))
}

// Health check
app.get('/health', (_, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// API Routes
app.use('/api/products', productRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/stats', statsRoutes)
app.use('/api/contests', contestRoutes)

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' })
})

// Error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Error:', err)
  res.status(500).json({ 
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message 
  })
})

// Database connection and server start
async function startServer() {
  try {
    await mongoose.connect(MONGODB_URI)
    console.log('✅ Connected to MongoDB')
    
    // Initialize sample data if needed
    await initializeDatabase()
    
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`)
      console.log(`📦 API available at http://localhost:${PORT}/api`)
    })
  } catch (error) {
    console.error('❌ Failed to start server:', error)
    process.exit(1)
  }
}

// Initialize database with sample products and contests if empty
async function initializeDatabase() {
  const Product = mongoose.model('Product')
  const Contest = mongoose.model('Contest')
  
  // Initialize products
  const productCount = await Product.countDocuments()
  if (productCount === 0) {
    console.log('📝 Initializing database with sample products...')
    const sampleProducts = generateSampleProducts()
    await Product.insertMany(sampleProducts)
    console.log(`✅ Added ${sampleProducts.length} sample products`)
  }
  
  // Initialize contests
  const contestCount = await Contest.countDocuments()
  if (contestCount === 0) {
    console.log('📝 Initializing database with default contests...')
    const defaultContests = generateDefaultContests()
    await Contest.insertMany(defaultContests)
    console.log(`✅ Added ${defaultContests.length} default contests`)
  }
}

function generateSampleProducts() {
  const categories = ['Beauty', 'Fashion', 'Electronics', 'Home', 'Toys', 'Accessories']
  const productNames = [
    'Cute Plush Bunny', 'Sparkle Lip Gloss', 'Kawaii Phone Case',
    'Pastel Earbuds', 'Mini LED Mirror', 'Cozy Socks Set',
    'Scented Candle', 'Hair Scrunchies Pack', 'Sticker Collection',
    'Desk Organizer', 'Portable Charger', 'Makeup Brush Set',
    'Fairy Lights', 'Journal Notebook', 'Skincare Set',
    'Kawaii Mug', 'Soft Blanket', 'Jewelry Box',
    'Nail Art Kit', 'Room Decor Set'
  ]
  
  return Array.from({ length: 50 }, (_, i) => ({
    productNumber: i + 1,
    name: productNames[i % productNames.length] + ` #${i + 1}`,
    description: 'A lovely mystery product that will bring joy to your day! Perfect for gifting or treating yourself.',
    image: `https://picsum.photos/seed/product${i + 1}/400/400`,
    price: Math.floor(Math.random() * 500) + 100,
    category: categories[Math.floor(Math.random() * categories.length)],
    stock: Math.floor(Math.random() * 50) + 10,
    isActive: true,
  }))
}

function generateDefaultContests() {
  return [
    {
      contestId: 'A',
      name: 'Starter Scoop',
      price: 100,
      wheelRange: { min: 0, max: 5 },
      productsPerBox: 1,
      description: 'Spin to win 0-5 mystery boxes!',
      color: 'from-pink-400 to-pink-500',
      gradient: 'bg-gradient-to-br from-pink-100 via-pink-50 to-rose-100',
      icon: '🎀',
      badge: 'Popular',
      isActive: true,
      maxSpinsPerUser: 1,
    },
    {
      contestId: 'B',
      name: 'Super Scoop',
      price: 299,
      wheelRange: { min: 0, max: 10 },
      productsPerBox: 1,
      description: 'Spin to win 0-10 mystery boxes!',
      color: 'from-purple-400 to-purple-500',
      gradient: 'bg-gradient-to-br from-lavender-100 via-purple-50 to-violet-100',
      icon: '🌟',
      badge: 'Best Value',
      isActive: true,
      maxSpinsPerUser: 1,
    },
    {
      contestId: 'C',
      name: 'Mega Scoop',
      price: 499,
      wheelRange: { min: 1, max: 10 },
      productsPerBox: 2,
      description: 'Double products in each box! Guaranteed win!',
      color: 'from-teal-400 to-emerald-500',
      gradient: 'bg-gradient-to-br from-mint-100 via-teal-50 to-emerald-100',
      icon: '💎',
      badge: 'Premium',
      isActive: true,
      maxSpinsPerUser: 1,
    },
  ]
}

startServer()

