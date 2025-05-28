# JWT Authentication Implementation

## Overview

This document outlines the JSON Web Token (JWT) authentication system implemented in the Business Intelligence Dashboard application. The system provides secure, stateless authentication while maintaining backward compatibility with the existing session-based authentication.

## Table of Contents

- [Implementation Architecture](#implementation-architecture)
- [Server-Side Components](#server-side-components)
- [Client-Side Integration](#client-side-integration)
- [Security Features](#security-features)
- [Configuration](#configuration)
- [API Reference](#api-reference)
- [Migration Notes](#migration-notes)

## Implementation Architecture

The JWT authentication system operates as follows:

1. **Login Process**: When a user logs in successfully, the server:
   - Validates credentials
   - Generates a JWT token containing the user's identity and claims
   - Sets the token as an HTTP-only cookie
   - Returns user data in the response

2. **Request Authentication**:
   - For each protected API request, the JWT token is automatically sent as a cookie
   - The server validates the token's signature and expiration
   - If valid, the request proceeds with user data available in `req.user`

3. **Logout Process**:
   - The JWT cookie is cleared by setting an expired cookie
   - Session data is also cleared for backward compatibility

## Server-Side Components

### Authentication Service

Located in `server/services/auth.ts`, this module contains the core JWT functionality:

```typescript
// Key functions in auth.ts
generateToken(user) // Creates a signed JWT with user information
setTokenCookie(res, token) // Sets the JWT as an HTTP-only cookie
authenticateJWT(req, res, next) // Middleware to verify JWT tokens
clearTokenCookie(res) // Removes the JWT cookie during logout
```

### Extended Request Types

Located in `server/types/auth.ts`, this file extends Express types to include JWT payload:

```typescript
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

// Extend Express Request
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
      tenantId?: number;
    }
  }
}
```

### Authentication Routes

The authentication routes in `server/routes.ts` have been updated to:

1. **Login Route** (`POST /api/auth/login`):
   - Validates credentials
   - Generates JWT token with user information
   - Sets token as HTTP-only cookie
   - Returns user data in response

2. **Auth Check Route** (`GET /api/auth/me`):
   - Verifies the JWT token
   - Returns user data if authenticated
   - Refreshes the token if needed
   - Falls back to session-based auth if JWT is not present

3. **Logout Route** (`POST /api/auth/logout`):
   - Clears the JWT cookie
   - Also clears session data for compatibility

### Middleware

The middleware for protected routes has been updated to:

1. **JWT Authentication Middleware** (`authenticateJWT`):
   - Extracts token from cookies
   - Verifies token signature and expiration
   - Adds user data to request object
   - Handles token errors (expired, invalid)

2. **Tenant Access Middleware** (`ensureTenantAccess`):
   - First checks if JWT auth was successful
   - Falls back to session-based auth if needed
   - Ensures user has access to the requested tenant

## Client-Side Integration

### Authentication Context

The `client/src/context/auth-context.tsx` file has been updated to work with JWT:

1. **Auth Check Query**:
   - Sends credentials with requests to include cookies
   - Properly handles JWT-based authentication responses

2. **Login Function**:
   - Sends credentials to the server
   - Includes `credentials: 'include'` to allow cookies
   - Stores user data in state and localStorage as backup

3. **Logout Function**:
   - Calls the logout API to clear JWT cookie on server
   - Clears local user data

## Security Features

The JWT implementation includes several security measures:

1. **HTTP-Only Cookies**:
   - JWTs are stored in HTTP-only cookies, preventing JavaScript access
   - Mitigates XSS (Cross-Site Scripting) attacks

2. **Secure Flag**:
   - In production, cookies are only sent over HTTPS
   - Prevents interception over insecure connections

3. **SameSite Restriction**:
   - Cookies use 'strict' SameSite policy
   - Prevents CSRF (Cross-Site Request Forgery) attacks

4. **Token Expiration**:
   - Tokens have a configurable expiration time (default 24 hours)
   - Limits the window of opportunity for token misuse

5. **Minimal Payload**:
   - Only essential user data is stored in the token
   - Sensitive information like passwords is never included

## Configuration

JWT authentication is configured through environment variables in `.env`:

```
# JWT Configuration
JWT_SECRET=your_random_strong_jwt_secret
JWT_EXPIRES_IN=24h
```

- `JWT_SECRET`: Secret key used to sign tokens (should be long, random, and kept secure)
- `JWT_EXPIRES_IN`: Token lifetime in hours (e.g., '24h' for 24 hours)

## API Reference

### Server-Side Functions

#### `generateToken(user: Partial<IUser>): string`
Generates a signed JWT containing user information.

#### `setTokenCookie(res: Response, token: string): void`
Sets the provided JWT as an HTTP-only cookie in the response.

#### `authenticateJWT(req: Request, res: Response, next: NextFunction): void`
Middleware that verifies the JWT from cookies and adds user data to the request.

#### `clearTokenCookie(res: Response): void`
Clears the JWT cookie by setting an expired cookie.

### Client-Side Functions

#### `login(email: string, password: string): Promise<any>`
Authenticates with the server and handles JWT storage in cookies.

#### `logout(): Promise<void>`
Logs out by clearing JWT cookie and local data.

## Migration Notes

This implementation maintains backward compatibility with the existing session-based authentication:

1. **Dual Authentication**:
   - Both JWT and session data are created on login
   - Authentication middleware first checks for JWT, then falls back to session

2. **Gradual Migration**:
   - Routes can be progressively updated to use `authenticateJWT` middleware
   - Existing routes using `authenticated` middleware continue to work

3. **Session Cleanup**:
   - Session data is still cleaned up during logout
   - Will allow for eventual removal of session dependency

For complete migration, all routes should eventually use `authenticateJWT` instead of the session-based `authenticated` middleware.

## Future Enhancements

Potential future improvements to the JWT authentication system:

1. **Token Refresh**: Implement automatic refresh of tokens before expiration
2. **Revocation Strategy**: Add token blacklisting for immediate revocation
3. **CSRF Protection**: Add additional CSRF tokens for sensitive operations
4. **Role-Based Middleware**: Create specialized middleware for role-based access control 