import 'express-session';

declare module 'express-session' {
  interface SessionData {
    userId: string | number;
    isEnvAdmin?: boolean;
    adminData?: {
      id: string;
      name: string;
      email: string;
      role: string;
      isEnvAdmin: boolean;
    };
  }
}

declare global {
  namespace Express {
    interface Request {
      user?: any;
      tenantId?: number;
    }
  }
} 