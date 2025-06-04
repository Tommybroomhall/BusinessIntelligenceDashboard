import { Schema, model, Document, models } from 'mongoose';

export interface IEmailRecipient {
  email: string;
  name?: string;
  type: 'to' | 'cc' | 'bcc';
}

export interface IEmailAttachment {
  filename: string;
  content?: string; // Base64 encoded content
  path?: string; // File path
  contentType?: string;
  size?: number;
}

export interface IEmailTemplate {
  id: string;
  name: string;
  variables?: Record<string, any>;
}

export interface IEmail extends Document {
  // Tenant association
  tenantId: string;
  
  // Email identification
  resendId?: string; // ID from Resend API
  messageId?: string; // Message-ID header
  
  // Sender information
  from: {
    email: string;
    name?: string;
  };
  
  // Recipients
  recipients: IEmailRecipient[];
  
  // Email content
  subject: string;
  htmlContent?: string;
  textContent?: string;
  
  // Template information (if used)
  template?: IEmailTemplate;
  
  // Attachments
  attachments?: IEmailAttachment[];
  
  // Email headers
  headers?: Record<string, string>;
  
  // Delivery status
  status: 'draft' | 'queued' | 'sending' | 'sent' | 'delivered' | 'bounced' | 'complained' | 'failed';
  
  // Tracking information
  sentAt?: Date;
  deliveredAt?: Date;
  openedAt?: Date;
  clickedAt?: Date;
  
  // Error information
  error?: {
    code?: string;
    message?: string;
    details?: any;
  };
  
  // Metadata
  tags?: string[];
  category?: string; // e.g., 'transactional', 'marketing', 'notification'
  priority?: 'low' | 'normal' | 'high';
  
  // Scheduling
  scheduledAt?: Date;
  
  // Related entities
  relatedTo?: {
    type: 'order' | 'customer' | 'user' | 'notification';
    id: string;
  };
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

const emailRecipientSchema = new Schema<IEmailRecipient>({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  name: {
    type: String,
    trim: true,
  },
  type: {
    type: String,
    enum: ['to', 'cc', 'bcc'],
    default: 'to',
  },
}, { _id: false });

const emailAttachmentSchema = new Schema<IEmailAttachment>({
  filename: {
    type: String,
    required: true,
  },
  content: String,
  path: String,
  contentType: String,
  size: Number,
}, { _id: false });

const emailTemplateSchema = new Schema<IEmailTemplate>({
  id: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  variables: {
    type: Schema.Types.Mixed,
    default: {},
  },
}, { _id: false });

const emailSchema = new Schema<IEmail>(
  {
    tenantId: {
      type: String,
      required: true,
      index: true,
    },
    resendId: {
      type: String,
      index: true,
      sparse: true,
    },
    messageId: {
      type: String,
      index: true,
      sparse: true,
    },
    from: {
      email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
      },
      name: {
        type: String,
        trim: true,
      },
    },
    recipients: {
      type: [emailRecipientSchema],
      required: true,
      validate: {
        validator: function(recipients: IEmailRecipient[]) {
          return recipients.length > 0 && recipients.some(r => r.type === 'to');
        },
        message: 'At least one "to" recipient is required',
      },
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    htmlContent: String,
    textContent: String,
    template: emailTemplateSchema,
    attachments: [emailAttachmentSchema],
    headers: {
      type: Schema.Types.Mixed,
      default: {},
    },
    status: {
      type: String,
      enum: ['draft', 'queued', 'sending', 'sent', 'delivered', 'bounced', 'complained', 'failed'],
      default: 'draft',
      index: true,
    },
    sentAt: Date,
    deliveredAt: Date,
    openedAt: Date,
    clickedAt: Date,
    error: {
      code: String,
      message: String,
      details: Schema.Types.Mixed,
    },
    tags: [String],
    category: {
      type: String,
      enum: ['transactional', 'marketing', 'notification', 'system'],
      default: 'transactional',
      index: true,
    },
    priority: {
      type: String,
      enum: ['low', 'normal', 'high'],
      default: 'normal',
    },
    scheduledAt: Date,
    relatedTo: {
      type: {
        type: String,
        enum: ['order', 'customer', 'user', 'notification'],
      },
      id: String,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
emailSchema.index({ tenantId: 1, status: 1 });
emailSchema.index({ tenantId: 1, category: 1 });
emailSchema.index({ tenantId: 1, createdAt: -1 });
emailSchema.index({ 'recipients.email': 1 });
emailSchema.index({ 'relatedTo.type': 1, 'relatedTo.id': 1 });
emailSchema.index({ scheduledAt: 1 }, { sparse: true });

// Check if the model exists before compiling it
export const Email = models.Email || model<IEmail>('Email', emailSchema);
