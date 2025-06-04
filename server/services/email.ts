import { Resend } from 'resend';
import { Email, IEmail, IEmailRecipient, IEmailAttachment } from '../models/email';
import { getStorage } from '../storageFactory';
import { log } from '../vite';

export interface EmailOptions {
  tenantId: string;
  to: string | string[] | IEmailRecipient[];
  cc?: string | string[] | IEmailRecipient[];
  bcc?: string | string[] | IEmailRecipient[];
  subject: string;
  html?: string;
  text?: string;
  from?: {
    email: string;
    name?: string;
  };
  attachments?: IEmailAttachment[];
  headers?: Record<string, string>;
  tags?: string[];
  category?: 'transactional' | 'marketing' | 'notification' | 'system';
  priority?: 'low' | 'normal' | 'high';
  scheduledAt?: Date;
  relatedTo?: {
    type: 'order' | 'customer' | 'user' | 'notification';
    id: string;
  };
}

export interface EmailSendResult {
  success: boolean;
  emailId?: string;
  resendId?: string;
  messageId?: string;
  error?: {
    code?: string;
    message: string;
    details?: any;
  };
}

export class EmailService {
  private static resendClients: Map<string, Resend> = new Map();

  /**
   * Get or create Resend client for a tenant
   */
  private static async getResendClient(tenantId: string): Promise<Resend | null> {
    try {
      // Check if we already have a client for this tenant
      if (this.resendClients.has(tenantId)) {
        return this.resendClients.get(tenantId)!;
      }

      // Get tenant configuration
      const storage = await getStorage();
      const tenant = await storage.getTenant(tenantId);

      if (!tenant) {
        throw new Error('Tenant not found');
      }

      // Get API key (tenant-specific or global)
      const apiKey = tenant.resendApiKey || process.env.RESEND_API_KEY;

      if (!apiKey) {
        throw new Error('Resend API key not configured');
      }

      // Create and cache the client
      const client = new Resend(apiKey);
      this.resendClients.set(tenantId, client);

      return client;
    } catch (error) {
      log(`Error creating Resend client for tenant ${tenantId}: ${error.message}`, 'email');
      return null;
    }
  }

  /**
   * Normalize recipients to IEmailRecipient format
   */
  private static normalizeRecipients(
    recipients: string | string[] | IEmailRecipient[],
    type: 'to' | 'cc' | 'bcc' = 'to'
  ): IEmailRecipient[] {
    if (!recipients) return [];

    if (typeof recipients === 'string') {
      return [{ email: recipients, type }];
    }

    if (Array.isArray(recipients)) {
      return recipients.map(recipient => {
        if (typeof recipient === 'string') {
          return { email: recipient, type };
        }
        return { ...recipient, type: recipient.type || type };
      });
    }

    return [];
  }

  /**
   * Get tenant email configuration
   */
  private static async getTenantEmailConfig(tenantId: string) {
    try {
      const storage = await getStorage();
      const tenant = await storage.getTenant(tenantId);

      if (!tenant) {
        throw new Error('Tenant not found');
      }

      return {
        fromDomain: tenant.resendFromDomain || process.env.RESEND_FROM_DOMAIN || '',
        fromName: tenant.resendFromName || process.env.RESEND_FROM_NAME || 'BusinessDash',
        apiKey: tenant.resendApiKey || process.env.RESEND_API_KEY || ''
      };
    } catch (error) {
      log(`Error getting tenant email config: ${error.message}`, 'email');
      throw error;
    }
  }

  /**
   * Send an email
   */
  static async sendEmail(options: EmailOptions): Promise<EmailSendResult> {
    try {
      // Get Resend client
      const resend = await this.getResendClient(options.tenantId);
      if (!resend) {
        return {
          success: false,
          error: {
            code: 'CLIENT_ERROR',
            message: 'Failed to initialize Resend client'
          }
        };
      }

      // Get tenant configuration
      const config = await this.getTenantEmailConfig(options.tenantId);

      // Normalize recipients
      const toRecipients = this.normalizeRecipients(options.to, 'to');
      const ccRecipients = this.normalizeRecipients(options.cc || [], 'cc');
      const bccRecipients = this.normalizeRecipients(options.bcc || [], 'bcc');

      if (toRecipients.length === 0) {
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'At least one "to" recipient is required'
          }
        };
      }

      // Determine from address
      let fromEmail: string;
      let fromName: string | undefined;

      if (options.from) {
        fromEmail = options.from.email;
        fromName = options.from.name;
      } else {
        // Use tenant configuration
        if (!config.fromDomain) {
          return {
            success: false,
            error: {
              code: 'CONFIGURATION_ERROR',
              message: 'From domain not configured. Please configure Resend settings.'
            }
          };
        }
        fromEmail = `noreply@${config.fromDomain}`;
        fromName = config.fromName;
      }

      // Create email record in database
      const emailData: Partial<IEmail> = {
        tenantId: options.tenantId,
        from: {
          email: fromEmail,
          name: fromName
        },
        recipients: [...toRecipients, ...ccRecipients, ...bccRecipients],
        subject: options.subject,
        htmlContent: options.html,
        textContent: options.text,
        attachments: options.attachments,
        headers: options.headers,
        status: 'queued',
        tags: options.tags,
        category: options.category || 'transactional',
        priority: options.priority || 'normal',
        scheduledAt: options.scheduledAt,
        relatedTo: options.relatedTo
      };

      const email = new Email(emailData);
      await email.save();

      // Prepare Resend email data
      const resendData: any = {
        from: fromName ? `${fromName} <${fromEmail}>` : fromEmail,
        to: toRecipients.map(r => r.email),
        subject: options.subject,
        headers: options.headers || {}
      };

      if (ccRecipients.length > 0) {
        resendData.cc = ccRecipients.map(r => r.email);
      }

      if (bccRecipients.length > 0) {
        resendData.bcc = bccRecipients.map(r => r.email);
      }

      if (options.html) {
        resendData.html = options.html;
      }

      if (options.text) {
        resendData.text = options.text;
      }

      if (options.attachments && options.attachments.length > 0) {
        resendData.attachments = options.attachments.map(att => ({
          filename: att.filename,
          content: att.content,
          path: att.path
        }));
      }

      if (options.tags && options.tags.length > 0) {
        resendData.tags = options.tags;
      }

      // Send email via Resend
      email.status = 'sending';
      await email.save();

      const result = await resend.emails.send(resendData);

      // Update email record with result
      if (result.data) {
        email.resendId = result.data.id;
        email.status = 'sent';
        email.sentAt = new Date();
      } else {
        email.status = 'failed';
        email.error = {
          code: 'SEND_ERROR',
          message: 'Failed to send email via Resend',
          details: result.error
        };
      }

      await email.save();

      if (result.data) {
        log(`Email sent successfully: ${result.data.id} for tenant ${options.tenantId}`, 'email');
        return {
          success: true,
          emailId: email._id.toString(),
          resendId: result.data.id
        };
      } else {
        log(`Email send failed for tenant ${options.tenantId}: ${result.error?.message}`, 'email');
        return {
          success: false,
          emailId: email._id.toString(),
          error: {
            code: 'SEND_ERROR',
            message: result.error?.message || 'Unknown error',
            details: result.error
          }
        };
      }

    } catch (error) {
      log(`Email service error: ${error.message}`, 'email');
      return {
        success: false,
        error: {
          code: 'SERVICE_ERROR',
          message: error.message,
          details: error
        }
      };
    }
  }

  /**
   * Get email by ID
   */
  static async getEmail(tenantId: string, emailId: string): Promise<IEmail | null> {
    try {
      return await Email.findOne({ _id: emailId, tenantId });
    } catch (error) {
      log(`Error getting email ${emailId}: ${error.message}`, 'email');
      return null;
    }
  }

  /**
   * Get emails for a tenant with pagination
   */
  static async getEmails(
    tenantId: string,
    options: {
      page?: number;
      limit?: number;
      status?: string;
      category?: string;
      search?: string;
    } = {}
  ) {
    try {
      const page = options.page || 1;
      const limit = Math.min(options.limit || 20, 100);
      const skip = (page - 1) * limit;

      const query: any = { tenantId };

      if (options.status) {
        query.status = options.status;
      }

      if (options.category) {
        query.category = options.category;
      }

      if (options.search) {
        query.$or = [
          { subject: { $regex: options.search, $options: 'i' } },
          { 'recipients.email': { $regex: options.search, $options: 'i' } },
          { 'from.email': { $regex: options.search, $options: 'i' } }
        ];
      }

      const [emails, total] = await Promise.all([
        Email.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Email.countDocuments(query)
      ]);

      return {
        emails,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      log(`Error getting emails for tenant ${tenantId}: ${error.message}`, 'email');
      throw error;
    }
  }

  /**
   * Clear cached Resend clients (useful for testing or config changes)
   */
  static clearClients() {
    this.resendClients.clear();
  }
}
