import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { getStorage } from '../../storageFactory';
import { ensureTenantAccess } from '../../middleware/tenantAccess';
import { LeadStatus } from '../../types';

const router = Router();

// Validation schema
const insertLeadSchema = z.object({
  name: z.string(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  company: z.string().optional(),
  source: z.string().optional(),
  status: z.enum(["new", "contacted", "won", "lost"]).optional(),
  value: z.number().optional(),
  notes: z.string().optional(),
  tenantId: z.number().optional(),
});

// Lead status enum
const leadStatusEnum = {
  enumValues: ["new", "contacted", "won", "lost"]
};

// Get all leads
router.get("/", ensureTenantAccess(), async (req: Request, res: Response) => {
  try {
    const storage = await getStorage();
    const leads = await storage.listLeads(req.tenantId);
    res.json(leads);
  } catch (error) {
    console.error("Error listing leads:", error);
    res.status(500).json({ message: "An error occurred" });
  }
});

// Create a new lead
router.post("/", ensureTenantAccess(), async (req: Request, res: Response) => {
  try {
    const storage = await getStorage();

    // Validate lead data
    const validatedLead = insertLeadSchema.parse({
      ...req.body,
      tenantId: req.tenantId,
    });

    // Create lead
    const newLead = await storage.createLead(validatedLead);

    // Log activity
    await storage.logActivity({
      tenantId: req.tenantId,
      userId: req.session.userId,
      activityType: "lead_created",
      description: `New lead ${newLead.name} created`,
      entityType: "lead",
      entityId: newLead.id,
      metadata: { leadId: newLead.id, source: newLead.source },
    });

    res.status(201).json(newLead);
  } catch (error) {
    console.error("Error creating lead:", error);
    if (error.name === "ZodError") {
      return res.status(400).json({ message: "Invalid data", errors: error.errors });
    }
    res.status(500).json({ message: "An error occurred" });
  }
});

// Update lead status
router.patch("/:id/status", ensureTenantAccess(), async (req: Request, res: Response) => {
  try {
    const storage = await getStorage();
    const leadId = parseInt(req.params.id);
    const { status } = req.body;

    if (!leadId || !status) {
      return res.status(400).json({ message: "Lead ID and status are required" });
    }

    // Validate status
    if (!leadStatusEnum.enumValues.includes(status as LeadStatus)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const updatedLead = await storage.updateLeadStatus(leadId, req.tenantId, status);
    if (!updatedLead) {
      return res.status(404).json({ message: "Lead not found" });
    }

    // Log activity
    await storage.logActivity({
      tenantId: req.tenantId,
      userId: req.session.userId,
      activityType: "lead_status_updated",
      description: `Lead ${updatedLead.name} status updated to ${status}`,
      entityType: "lead",
      entityId: updatedLead.id,
      metadata: { leadId: updatedLead.id, status },
    });

    res.json(updatedLead);
  } catch (error) {
    console.error("Error updating lead status:", error);
    res.status(500).json({ message: "An error occurred" });
  }
});

export default router;
