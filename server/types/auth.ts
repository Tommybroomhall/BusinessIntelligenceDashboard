import { Request } from 'express';

// JWT payload interface
export interface JwtPayload {
  id: string;
  email: string;
  name: string;
  role: string;
  tenantId: number;
  iat?: number;
  exp?: number;
}

// Extend Express Request to include the user property
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
      tenantId?: number;
    }
  }
} 