import { Request, Response, NextFunction } from 'express'
import jwt, { SignOptions, Secret } from 'jsonwebtoken'
import User, { IUser } from '../models/User.js'

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: IUser
      isAdmin?: boolean
    }
  }
}

interface JwtPayload {
  userId: string
  email: string
  iat: number
  exp: number
}

// Get JWT secret from environment
const getJwtSecret = (): Secret => {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new Error('JWT_SECRET is not defined in environment variables')
  }
  return secret
}

// Generate JWT Token
export const generateToken = (userId: string, email: string): string => {
  const options: SignOptions = {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  }
  return jwt.sign({ userId, email }, getJwtSecret(), options)
}

// Verify JWT Token
export const verifyToken = (token: string): JwtPayload => {
  return jwt.verify(token, getJwtSecret()) as JwtPayload
}

// User Authentication Middleware
export const authenticateUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Access denied. No token provided.' })
      return
    }

    const token = authHeader.split(' ')[1]
    
    // Verify token
    const decoded = verifyToken(token)
    
    // Get user from database
    const user = await User.findById(decoded.userId)
    
    if (!user || !user.isActive) {
      res.status(401).json({ error: 'Invalid token or user not found.' })
      return
    }

    // Attach user to request
    req.user = user
    next()
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ error: 'Token expired. Please login again.' })
      return
    }
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ error: 'Invalid token.' })
      return
    }
    res.status(500).json({ error: 'Authentication failed.' })
  }
}

// Optional User Authentication (doesn't fail if no token)
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      next()
      return
    }

    const token = authHeader.split(' ')[1]
    const decoded = verifyToken(token)
    const user = await User.findById(decoded.userId)
    
    if (user && user.isActive) {
      req.user = user
    }
    
    next()
  } catch {
    // Continue without authentication
    next()
  }
}

// Admin Authentication Middleware
export const authenticateAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Access denied. No admin token provided.' })
      return
    }

    const token = authHeader.split(' ')[1]
    
    // Verify admin token
    const decoded = jwt.verify(token, getJwtSecret()) as { isAdmin: boolean; email: string }
    
    if (!decoded.isAdmin) {
      res.status(403).json({ error: 'Access denied. Admin privileges required.' })
      return
    }

    req.isAdmin = true
    next()
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ error: 'Admin session expired. Please login again.' })
      return
    }
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ error: 'Invalid admin token.' })
      return
    }
    res.status(500).json({ error: 'Admin authentication failed.' })
  }
}

// Generate Admin Token
export const generateAdminToken = (email: string): string => {
  const options: SignOptions = {
    expiresIn: process.env.ADMIN_TOKEN_EXPIRES_IN || '24h'
  }
  return jwt.sign({ email, isAdmin: true }, getJwtSecret(), options)
}
