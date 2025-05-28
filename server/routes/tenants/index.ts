import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { getStorage } from '../../storageFactory';
import { ensureTenantAccess } from '../../middleware/tenantAccess';

const router = Router();

// Validation schema
const insertTenantSchema = z.object({
  name: z.string(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  website: z.string().optional(),
  logoUrl: z.string().optional(),
  primaryColor: z.string().optional(),
});

// Get current tenant
router.get("/", ensureTenantAccess(), async (req: Request, res: Response) => {
  try {
    const storage = await getStorage();
    const tenant = await storage.getTenant(req.tenantId);
    if (!tenant) {
      return res.status(404).json({ message: "Tenant not found" });
    }
    res.json(tenant);
  } catch (error) {
    console.error("Error fetching tenant:", error);
    res.status(500).json({ message: "An error occurred" });
  }
});

// Update tenant
router.patch("/", ensureTenantAccess(), async (req: Request, res: Response) => {
  try {
    const storage = await getStorage();
    const tenant = await storage.getTenant(req.tenantId);
    if (!tenant) {
      return res.status(404).json({ message: "Tenant not found" });
    }

    // Update only allowed fields
    const allowedFields = ["name", "email", "phone", "address", "website", "logoUrl", "primaryColor"];
    const updateData = Object.keys(req.body)
      .filter(key => allowedFields.includes(key))
      .reduce((obj, key) => {
        obj[key] = req.body[key];
        return obj;
      }, {});

    const updatedTenant = await storage.updateTenant(req.tenantId, updateData);
    res.json(updatedTenant);
  } catch (error) {
    console.error("Error updating tenant:", error);
    res.status(500).json({ message: "An error occurred" });
  }
});

// Update API keys
router.post("/apikeys", ensureTenantAccess(), async (req: Request, res: Response) => {
  try {
    const storage = await getStorage();
    const tenant = await storage.getTenant(req.tenantId);
    if (!tenant) {
      return res.status(404).json({ message: "Tenant not found" });
    }

    const { stripeSecretKey, ga4Key } = req.body;

    const updateData: { stripeSecretKey?: string, ga4Key?: string } = {};
    if (stripeSecretKey) updateData.stripeSecretKey = stripeSecretKey;
    if (ga4Key) updateData.ga4Key = ga4Key;

    const updatedTenant = await storage.updateTenant(req.tenantId, updateData);
    res.json({ message: "API keys updated successfully" });
  } catch (error) {
    console.error("Error updating API keys:", error);
    res.status(500).json({ message: "An error occurred" });
  }
});

export default router;
