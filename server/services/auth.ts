import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { IUser } from '../types';

// Get JWT secret from environment or use default (only for development)
const JWT_SECRET = process.env.JWT_SECRET || 'business-dash-jwt-secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

/**
 * Generate a JWT token for a user
 */
export const generateToken = (user: Partial<IUser>) => {
  // Create a payload with user data (excluding sensitive information)
  const payload = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    tenantId: user.tenantId
  };

  // Sign and return the token
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

/**
 * Set JWT token as an HTTP-only cookie
 */
export const setTokenCookie = (res: Response, token: string) => {
  // Calculate expiry time in milliseconds for cookie
  const expiryTime = JWT_EXPIRES_IN.includes('h') 
    ? parseInt(JWT_EXPIRES_IN) * 60 * 60 * 1000 // hours to ms
    : 24 * 60 * 60 * 1000; // default 24 hours
  
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: expiryTime
  });
};

/**
 * JWT authentication middleware
 */
export const authenticateJWT = (req: Request, res: Response, next: NextFunction) => {
  // Get token from cookies
  const token = req.cookies?.token;
  
  if (!token) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Add user data to request object
    req.user = decoded;
    
    next();
  } catch (error) {
    // Check if token is expired
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ message: 'Token expired' });
    }
    
    return res.status(401).json({ message: 'Invalid token' });
  }
};

/**
 * Clear JWT cookie on logout
 */
export const clearTokenCookie = (res: Response) => {
  res.cookie('token', '', {
    httpOnly: true,
    expires: new Date(0),
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  });
}; 