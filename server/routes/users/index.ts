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

// Validation schema for user updates (allows partial updates)
const updateUserSchema = z.object({
  email: z.string().email().optional(),
  name: z.string().optional(),
  role: z.enum(["admin", "editor", "viewer"]).optional(),
  isActive: z.boolean().optional(),
});

// Validation schema for password change
const changePasswordSchema = z.object({
  currentPassword: z.string(),
  newPassword: z.string().min(6),
});

// Get all users
router.get("/", authenticateJWT, ensureTenantAccess(), async (req: Request, res: Response) => {
  try {
    const storage = await getStorage();
    const users = await storage.listUsers(req.tenantId);
    // Remove passwordHash from users and transform MongoDB documents to plain objects
    const sanitizedUsers = users.map(user => {
      // Handle both plain objects and Mongoose documents
      const userData = user._doc || user;
      const { passwordHash, ...userWithoutPassword } = userData;

      // Ensure we have an id field for the frontend
      return {
        ...userWithoutPassword,
        id: userWithoutPassword._id || userWithoutPassword.id
      };
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

// Update user profile
router.patch("/:id", authenticateJWT, ensureTenantAccess(), async (req: Request, res: Response) => {
  try {
    const storage = await getStorage();
    const userId = req.params.id;

    // Check if this is an environment admin ID (not stored in database)
    if (typeof userId === 'string' && userId.startsWith('env_')) {
      return res.status(400).json({ 
        message: "Environment admin profiles cannot be updated", 
        details: "Environment admins are configured via .env file and cannot be modified through the API. Consider creating a MongoDB user account instead." 
      });
    }

    // Check if user exists and belongs to the same tenant
    const existingUser = await storage.getUser(userId);
    if (!existingUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if the user is updating their own profile or if they're an admin
    const isOwnProfile = req.user?.id?.toString() === userId || req.user?._id?.toString() === userId;
    const isAdmin = req.user?.role === 'admin';

    if (!isOwnProfile && !isAdmin) {
      return res.status(403).json({ message: "You can only update your own profile" });
    }

    // Validate request body
    const validatedData = updateUserSchema.parse(req.body);

    // If email is being changed, check if it's already in use
    if (validatedData.email && validatedData.email !== existingUser.email) {
      const emailExists = await storage.getUserByEmail(validatedData.email);
      if (emailExists) {
        return res.status(400).json({ message: "Email already in use" });
      }
    }

    // Update user
    const updatedUser = await storage.updateUser(userId, validatedData);
    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Remove passwordHash from response
    const { passwordHash: _, ...userWithoutPassword } = updatedUser;
    res.json(userWithoutPassword);
  } catch (error) {
    console.error("Error updating user:", error);
    if (error.name === "ZodError") {
      return res.status(400).json({ message: "Invalid data", errors: error.errors });
    }
    res.status(500).json({ message: "An error occurred" });
  }
});

// Change user password
router.post("/:id/change-password", authenticateJWT, ensureTenantAccess(), async (req: Request, res: Response) => {
  try {
    const storage = await getStorage();
    const userId = req.params.id;

    // Check if this is an environment admin ID (not stored in database)
    if (typeof userId === 'string' && userId.startsWith('env_')) {
      return res.status(400).json({ 
        message: "Environment admin passwords cannot be changed", 
        details: "Environment admin passwords are configured via .env file and cannot be modified through the API. Consider creating a MongoDB user account instead." 
      });
    }

    // Check if user exists
    const existingUser = await storage.getUser(userId);
    if (!existingUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if the user is changing their own password
    const isOwnProfile = req.user?.id?.toString() === userId || req.user?._id?.toString() === userId;

    if (!isOwnProfile) {
      return res.status(403).json({ message: "You can only change your own password" });
    }

    // Validate request body
    const validatedData = changePasswordSchema.parse(req.body);

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(validatedData.currentPassword, existingUser.passwordHash);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(validatedData.newPassword, 10);

    // Update password
    const updatedUser = await storage.updateUser(userId, { passwordHash: newPasswordHash });
    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("Error changing password:", error);
    if (error.name === "ZodError") {
      return res.status(400).json({ message: "Invalid data", errors: error.errors });
    }
    res.status(500).json({ message: "An error occurred" });
  }
});

export default router;
