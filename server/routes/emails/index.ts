import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { EmailService } from '../../services/email';
import { ensureTenantAccess } from '../../middleware/tenantAccess';
import { log } from '../../vite';

const router = Router();

// Validation schemas
const emailRecipientSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
  type: z.enum(['to', 'cc', 'bcc']).optional()
});

const emailAttachmentSchema = z.object({
  filename: z.string(),
  content: z.string().optional(),
  path: z.string().optional(),
  contentType: z.string().optional(),
  size: z.number().optional()
});

const sendEmailSchema = z.object({
  to: z.union([
    z.string().email(),
    z.array(z.string().email()),
    z.array(emailRecipientSchema)
  ]),
  cc: z.union([
    z.string().email(),
    z.array(z.string().email()),
    z.array(emailRecipientSchema)
  ]).optional(),
  bcc: z.union([
    z.string().email(),
    z.array(z.string().email()),
    z.array(emailRecipientSchema)
  ]).optional(),
  subject: z.string().min(1),
  html: z.string().optional(),
  text: z.string().optional(),
  from: z.object({
    email: z.string().email(),
    name: z.string().optional()
  }).optional(),
  attachments: z.array(emailAttachmentSchema).optional(),
  headers: z.record(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  category: z.enum(['transactional', 'marketing', 'notification', 'system']).optional(),
  priority: z.enum(['low', 'normal', 'high']).optional(),
  scheduledAt: z.string().datetime().optional(),
  relatedTo: z.object({
    type: z.enum(['order', 'customer', 'user', 'notification']),
    id: z.string()
  }).optional()
}).refine(data => data.html || data.text, {
  message: "Either 'html' or 'text' content is required"
});

const getEmailsSchema = z.object({
  page: z.string().transform(val => parseInt(val, 10)).optional(),
  limit: z.string().transform(val => parseInt(val, 10)).optional(),
  status: z.enum(['draft', 'queued', 'sending', 'sent', 'delivered', 'bounced', 'complained', 'failed']).optional(),
  category: z.enum(['transactional', 'marketing', 'notification', 'system']).optional(),
  search: z.string().optional()
});

/**
 * Send an email
 */
router.post('/send', ensureTenantAccess(), async (req: Request, res: Response) => {
  try {
    const validatedData = sendEmailSchema.parse(req.body);
    
    const emailOptions = {
      tenantId: req.tenantId,
      ...validatedData,
      scheduledAt: validatedData.scheduledAt ? new Date(validatedData.scheduledAt) : undefined
    };

    const result = await EmailService.sendEmail(emailOptions);

    if (result.success) {
      log(`Email sent successfully: ${result.resendId} for tenant ${req.tenantId}`, 'email');
      res.json({
        success: true,
        message: 'Email sent successfully',
        data: {
          emailId: result.emailId,
          resendId: result.resendId
        }
      });
    } else {
      log(`Email send failed for tenant ${req.tenantId}: ${result.error?.message}`, 'email');
      res.status(400).json({
        success: false,
        message: result.error?.message || 'Failed to send email',
        error: result.error
      });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email data',
        errors: error.errors
      });
    }

    log(`Error sending email: ${error.message}`, 'email');
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * Get emails with pagination and filtering
 */
router.get('/', ensureTenantAccess(), async (req: Request, res: Response) => {
  try {
    const validatedQuery = getEmailsSchema.parse(req.query);
    
    const result = await EmailService.getEmails(req.tenantId, validatedQuery);

    res.json({
      success: true,
      data: result.emails,
      pagination: result.pagination
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Invalid query parameters',
        errors: error.errors
      });
    }

    log(`Error getting emails for tenant ${req.tenantId}: ${error.message}`, 'email');
    res.status(500).json({
      success: false,
      message: 'Failed to get emails',
      error: error.message
    });
  }
});

/**
 * Get a specific email by ID
 */
router.get('/:emailId', ensureTenantAccess(), async (req: Request, res: Response) => {
  try {
    const { emailId } = req.params;

    const email = await EmailService.getEmail(req.tenantId, emailId);

    if (!email) {
      return res.status(404).json({
        success: false,
        message: 'Email not found'
      });
    }

    res.json({
      success: true,
      data: email
    });
  } catch (error) {
    log(`Error getting email ${req.params.emailId}: ${error.message}`, 'email');
    res.status(500).json({
      success: false,
      message: 'Failed to get email',
      error: error.message
    });
  }
});

/**
 * Send a quick email (simplified endpoint for common use cases)
 */
router.post('/quick-send', ensureTenantAccess(), async (req: Request, res: Response) => {
  try {
    const { to, subject, message, type = 'notification' } = req.body;

    if (!to || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: to, subject, message'
      });
    }

    const emailOptions = {
      tenantId: req.tenantId,
      to,
      subject,
      html: `<p>${message.replace(/\n/g, '<br>')}</p>`,
      text: message,
      category: type as 'transactional' | 'marketing' | 'notification' | 'system'
    };

    const result = await EmailService.sendEmail(emailOptions);

    if (result.success) {
      res.json({
        success: true,
        message: 'Email sent successfully',
        data: {
          emailId: result.emailId,
          resendId: result.resendId
        }
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.error?.message || 'Failed to send email',
        error: result.error
      });
    }
  } catch (error) {
    log(`Error sending quick email: ${error.message}`, 'email');
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * Get email statistics for the tenant
 */
router.get('/stats/overview', ensureTenantAccess(), async (req: Request, res: Response) => {
  try {
    const { Email } = await import('../../models/email');
    
    const [
      totalEmails,
      sentEmails,
      deliveredEmails,
      failedEmails,
      recentEmails
    ] = await Promise.all([
      Email.countDocuments({ tenantId: req.tenantId }),
      Email.countDocuments({ tenantId: req.tenantId, status: 'sent' }),
      Email.countDocuments({ tenantId: req.tenantId, status: 'delivered' }),
      Email.countDocuments({ tenantId: req.tenantId, status: 'failed' }),
      Email.countDocuments({ 
        tenantId: req.tenantId, 
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } 
      })
    ]);

    const deliveryRate = sentEmails > 0 ? (deliveredEmails / sentEmails) * 100 : 0;

    res.json({
      success: true,
      data: {
        totalEmails,
        sentEmails,
        deliveredEmails,
        failedEmails,
        recentEmails,
        deliveryRate: Math.round(deliveryRate * 100) / 100
      }
    });
  } catch (error) {
    log(`Error getting email stats for tenant ${req.tenantId}: ${error.message}`, 'email');
    res.status(500).json({
      success: false,
      message: 'Failed to get email statistics',
      error: error.message
    });
  }
});

export default router;
