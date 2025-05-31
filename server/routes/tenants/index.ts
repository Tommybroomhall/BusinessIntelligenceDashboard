import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { getStorage } from '../../storageFactory';
import { ensureTenantAccess } from '../../middleware/tenantAccess';
import { SupportedCurrencies } from '../../models';

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
  currencyCode: z.enum(SupportedCurrencies as [string, ...string[]]).optional(),
  currencySymbol: z.string().min(1).max(5).optional(),
  currencyLocale: z.string().regex(/^[a-z]{2}(-[A-Z]{2})?$/).optional(),
});

// Validation schema for updates (allows partial updates)
const updateTenantSchema = insertTenantSchema.partial();

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
    // Validate the request body
    const validationResult = updateTenantSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ 
        message: "Invalid data provided", 
        errors: validationResult.error.errors 
      });
    }

    const storage = await getStorage();
    const tenant = await storage.getTenant(req.tenantId);
    if (!tenant) {
      return res.status(404).json({ message: "Tenant not found" });
    }

    // Update only allowed fields
    const allowedFields = ["name", "email", "phone", "address", "website", "logoUrl", "primaryColor", "currencyCode", "currencySymbol", "currencyLocale"];
    const updateData = Object.keys(validationResult.data)
      .filter(key => allowedFields.includes(key))
      .reduce((obj, key) => {
        obj[key] = validationResult.data[key];
        return obj;
      }, {});

    // Validate currency consistency
    if (updateData.currencyCode || updateData.currencySymbol || updateData.currencyLocale) {
      // If any currency field is being updated, validate that they work together
      const newCurrencyCode = updateData.currencyCode || tenant.currencyCode;
      const newCurrencySymbol = updateData.currencySymbol || tenant.currencySymbol;
      const newCurrencyLocale = updateData.currencyLocale || tenant.currencyLocale;

      // Test if the currency settings work with Intl.NumberFormat
      try {
        new Intl.NumberFormat(newCurrencyLocale, {
          style: 'currency',
          currency: newCurrencyCode
        }).format(100);
      } catch (error) {
        return res.status(400).json({ 
          message: "Invalid currency configuration", 
          details: `Currency code '${newCurrencyCode}' is not compatible with locale '${newCurrencyLocale}'`
        });
      }
    }

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
