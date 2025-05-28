import { Router, Request, Response } from 'express';
import * as bcrypt from 'bcryptjs';
import { getStorage } from '../../storageFactory';
import { authenticateJWT, generateToken, setTokenCookie, clearTokenCookie } from '../../services/auth';

const router = Router();

// Function to check if a user is an admin from environment variables
const isEnvAdmin = (email: string, password: string): { isAdmin: boolean, adminData?: any } => {
  // Check business owner admin
  if (
    process.env.ADMIN_OWNER_EMAIL &&
    process.env.ADMIN_OWNER_PASSWORD &&
    email === process.env.ADMIN_OWNER_EMAIL &&
    password === process.env.ADMIN_OWNER_PASSWORD
  ) {
    return {
      isAdmin: true,
      adminData: {
        id: 'env_owner_admin',
        name: process.env.ADMIN_OWNER_NAME || 'Business Owner',
        email: process.env.ADMIN_OWNER_EMAIL,
        role: 'admin',
        isEnvAdmin: true
      }
    };
  }

  // Check developer admin
  if (
    process.env.ADMIN_DEV_EMAIL &&
    process.env.ADMIN_DEV_PASSWORD &&
    email === process.env.ADMIN_DEV_EMAIL &&
    password === process.env.ADMIN_DEV_PASSWORD
  ) {
    return {
      isAdmin: true,
      adminData: {
        id: 'env_dev_admin',
        name: process.env.ADMIN_DEV_NAME || 'System Developer',
        email: process.env.ADMIN_DEV_EMAIL,
        role: 'admin',
        isEnvAdmin: true
      }
    };
  }

  return { isAdmin: false };
};

// Login route
router.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    // Initialize storage
    const storage = await getStorage();

    // First check if this is an admin user defined in environment variables
    const { isAdmin, adminData } = isEnvAdmin(email, password);

    if (isAdmin && adminData) {
      // Authenticate as environment admin
      // Keep session for backward compatibility
      req.session.userId = adminData.id;
      req.session.isEnvAdmin = true;
      req.session.adminData = adminData;

      // Get first tenant for reference
      const tenants = await storage.listTenants();
      const tenant = tenants && tenants.length > 0 ? tenants[0] : null;

      // Generate JWT token
      const token = generateToken({
        id: adminData.id,
        email: adminData.email,
        name: adminData.name,
        role: 'admin',
        tenantId: tenant ? tenant._id : 1
      });

      // Set JWT as HTTP-only cookie
      setTokenCookie(res, token);

      return res.json({
        user: adminData,
        tenant
      });
    }

    // If not an environment admin, proceed with regular authentication
    const user = await storage.getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Keep session for backward compatibility
    req.session.userId = user.id;

    // Get tenant info
    const tenant = await storage.getTenant(user.tenantId);

    // Remove sensitive data from user object
    const { passwordHash, ...userWithoutPassword } = user;

    // Generate JWT token
    const token = generateToken(userWithoutPassword);

    // Set JWT as HTTP-only cookie
    setTokenCookie(res, token);

    // Return user info
    res.json({
      user: userWithoutPassword,
      tenant
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "An error occurred during login" });
  }
});

// Logout route
router.post("/logout", (req: Request, res: Response) => {
  // Clear JWT cookie
  clearTokenCookie(res);

  // Also destroy session for backward compatibility
  req.session.destroy((err) => {
    if (err) {
      console.error("Session destruction error:", err);
      // Continue even if session destruction fails
    }
    res.json({ message: "Logged out successfully" });
  });
});

// Get current user route
router.get("/me", authenticateJWT, async (req: Request, res: Response) => {
  try {
    // Initialize storage
    const storage = await getStorage();

    // If JWT authentication was successful, user data is already in req.user
    if (req.user) {
      // Get tenant info
      const tenant = await storage.getTenant(req.user.tenantId);

      return res.json({
        user: req.user,
        tenant
      });
    }

    // Fallback to session-based authentication for backward compatibility
    // Check if the user is an environment admin
    if (req.session?.isEnvAdmin && req.session.adminData) {
      // Get first tenant for reference
      const tenants = await storage.listTenants();
      const tenant = tenants && tenants.length > 0 ? tenants[0] : null;

      return res.json({
        user: req.session.adminData,
        tenant
      });
    }

    // Regular user flow using session (fallback)
    if (req.session?.userId) {
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Get tenant info
      const tenant = await storage.getTenant(user.tenantId);

      // Return user info (excluding sensitive data)
      const { passwordHash, ...userWithoutPassword } = user;

      // Generate a new JWT token to refresh it
      const token = generateToken(userWithoutPassword);
      setTokenCookie(res, token);

      return res.json({
        user: userWithoutPassword,
        tenant
      });
    }

    // If we get here, authentication failed
    return res.status(401).json({ message: "Authentication required" });
  } catch (error) {
    console.error("Auth error:", error);
    res.status(500).json({ message: "An error occurred" });
  }
});

export default router;
