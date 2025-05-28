import { Router, Request, Response } from 'express';
import { z } from 'zod';
import * as bcrypt from 'bcryptjs';
import { getStorage } from '../../storageFactory';
import { authenticateJWT } from '../../services/auth';
import { ensureTenantAccess } from '../../middleware/tenantAccess';

const router = Router();

// Validation schema
const insertUserSchema = z.object({
  email: z.string().email(),
  name: z.string(),
  passwordHash: z.string(),
  role: z.enum(["admin", "editor", "viewer"]),
  isActive: z.boolean().optional(),
  tenantId: z.number().optional(),
});

// Get all users
router.get("/", authenticateJWT, ensureTenantAccess(), async (req: Request, res: Response) => {
  try {
    const storage = await getStorage();
    const users = await storage.listUsers(req.tenantId);
    // Remove passwordHash from users
    const sanitizedUsers = users.map(user => {
      const { passwordHash, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });
    res.json(sanitizedUsers);
  } catch (error) {
    console.error("Error listing users:", error);
    res.status(500).json({ message: "An error occurred" });
  }
});

// Create a new user
router.post("/", ensureTenantAccess(), async (req: Request, res: Response) => {
  try {
    const storage = await getStorage();

    // Validate request body
    const validatedData = insertUserSchema.parse(req.body);

    // Check if email already exists
    const existingUser = await storage.getUserByEmail(validatedData.email);
    if (existingUser) {
      return res.status(400).json({ message: "Email already in use" });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(validatedData.passwordHash, 10);

    // Create user with hashed password
    const newUser = await storage.createUser({
      ...validatedData,
      passwordHash,
      tenantId: req.tenantId,
    });

    // Remove passwordHash from response
    const { passwordHash: _, ...userWithoutPassword } = newUser;
    res.status(201).json(userWithoutPassword);
  } catch (error) {
    console.error("Error creating user:", error);
    if (error.name === "ZodError") {
      return res.status(400).json({ message: "Invalid data", errors: error.errors });
    }
    res.status(500).json({ message: "An error occurred" });
  }
});

export default router;
