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
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax', // Use 'lax' in development for cross-origin
    maxAge: expiryTime,
    path: '/', // Ensure cookie is available for all paths
    // Don't set domain in development to allow localhost
  });
};

/**
 * Clear JWT token cookie
 */
export const clearTokenCookie = (res: Response) => {
  res.cookie('token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
    maxAge: 0, // Expire immediately
    expires: new Date(0), // Set expiry date to past
    path: '/', // Ensure cookie is cleared for all paths
  });
};

/**
 * JWT authentication middleware
 */
export const authenticateJWT = (req: Request, res: Response, next: NextFunction) => {
  // Get token from cookies
  const token = req.cookies?.token;

  // Debug logging for development
  if (process.env.NODE_ENV === 'development') {
    console.log('JWT Auth Debug:', {
      hasCookies: !!req.cookies,
      cookieKeys: req.cookies ? Object.keys(req.cookies) : [],
      hasToken: !!token,
      tokenPreview: token ? `${token.substring(0, 20)}...` : 'none'
    });
  }

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

