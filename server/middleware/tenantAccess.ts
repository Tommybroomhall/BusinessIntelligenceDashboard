import { Request, Response } from "express";
import { IStorage } from "../types";
import { getStorage } from "../storageFactory";

// Ensure tenant access middleware
export const ensureTenantAccess = () => async (req: Request, res: Response, next: Function) => {
  try {
    // Initialize storage
    const storage = await getStorage();

    // First check if JWT auth was successful and user data is in req.user
    if (req.user) {
      // JWT user has tenantId already set
      req.tenantId = req.user.tenantId;
      return next();
    }

    // Fallback to session-based auth if JWT is not present

    // Check if user is an environment admin
    if (req.session && req.session.isEnvAdmin) {
      // Skip tenant checks for environment admins - they have full access
      req.user = req.session.adminData;

      // For env admins, always use the first tenant
      const tenants = await storage.listTenants();
      if (tenants && tenants.length > 0) {
        req.tenantId = tenants[0]._id;
      } else {
        // If no tenants exist yet, this might be initial setup
        req.tenantId = 1; // Default tenant ID for setup scenarios
      }

      return next();
    }

    // For development mode, allow access without authentication
    if (process.env.NODE_ENV === 'development' && !req.session?.userId) {
      console.log('Development mode: Bypassing authentication');

      // Get the first tenant from the database
      const tenants = await storage.listTenants();
      if (tenants && tenants.length > 0) {
        const firstTenant = tenants[0];
        console.log(`Using tenant: ${firstTenant.name} (${firstTenant._id})`);

        // Get the first admin user for this tenant
        const users = await storage.listUsers(firstTenant._id);
        const adminUser = users.find(u => u.role === 'admin') || users[0];

        if (adminUser) {
          console.log(`Using user: ${adminUser.name} (${adminUser._id})`);
          req.user = adminUser;
          req.tenantId = firstTenant._id;
          return next();
        }
      }
    }

    // Normal authentication flow with session
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await storage.getUser(req.session.userId);
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // If tenantId is provided in the request, ensure user has access to it
    const tenantId = parseInt(req.params.tenantId) || parseInt(req.body.tenantId);
    if (tenantId && user.tenantId !== tenantId) {
      return res.status(403).json({ message: "Forbidden: You don't have access to this tenant" });
    }

    req.user = user;
    req.tenantId = user.tenantId;
    next();
  } catch (error) {
    console.error("Tenant access middleware error:", error);
    res.status(500).json({ message: "Server error in authentication middleware" });
  }
};
