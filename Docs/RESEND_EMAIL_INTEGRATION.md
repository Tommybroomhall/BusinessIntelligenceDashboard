# Resend Email Integration Documentation

## Overview

The Resend Email integration provides comprehensive email sending and management capabilities for the BusinessDash application. This integration allows users to configure Resend as their email service provider through a user-friendly settings interface and provides robust API endpoints for email operations.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Installation & Setup](#installation--setup)
3. [Configuration](#configuration)
4. [API Endpoints](#api-endpoints)
5. [Database Schema](#database-schema)
6. [Frontend Components](#frontend-components)
7. [Usage Examples](#usage-examples)
8. [Error Handling](#error-handling)
9. [Security Considerations](#security-considerations)
10. [Troubleshooting](#troubleshooting)

## Architecture Overview

The Resend integration follows a modular architecture with clear separation of concerns:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend UI   │    │   Backend API   │    │   Resend API    │
│   (Settings)    │◄──►│   (Express)     │◄──►│   (External)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       
         │                       │                       
         ▼                       ▼                       
┌─────────────────┐    ┌─────────────────┐              
│   React State   │    │   MongoDB       │              
│   Management    │    │   Database      │              
└─────────────────┘    └─────────────────┘              
```

### Key Components:

- **Frontend Settings UI**: React-based configuration interface
- **Backend API Routes**: Express.js endpoints for email operations
- **Email Service**: Abstraction layer for Resend API interactions
- **Database Models**: MongoDB schemas for email storage and configuration
- **Settings Integration**: Seamless integration with existing settings system

## Installation & Setup

### Prerequisites

- Node.js (v16 or higher)
- MongoDB database
- Resend account and API key
- Existing BusinessDash application

### Dependencies Installed

```bash
npm install resend
```

### File Structure

```
server/
├── models/
│   └── email.ts              # Email MongoDB schema
├── services/
│   └── email.ts              # Resend service implementation
├── routes/
│   └── emails/
│       └── index.ts          # Email API endpoints
└── types/
    └── email.ts              # TypeScript type definitions

client/
└── src/
    └── pages/
        └── Settings/
            └── IntegrationsTab.tsx  # Settings UI component
```

## Configuration

### Environment Variables

Add the following to your `.env` file:

```env
RESEND_API_KEY=re_your_api_key_here
RESEND_FROM_DOMAIN=yourdomain.com
RESEND_FROM_NAME=Your Company Name
```

### Database Configuration

The integration extends the existing `Tenant` model with Resend-specific fields:

```typescript
// Added to tenant schema
resendEnabled: { type: Boolean, default: false },
resendApiKey: { type: String },
resendFromDomain: { type: String },
resendFromName: { type: String }
```

### Settings UI Configuration

The Resend integration card is automatically added to the Integrations tab in Settings. No additional configuration required.

## API Endpoints

### Email Management Endpoints

#### Send Email
```http
POST /api/emails/send
Content-Type: application/json

{
  "to": ["recipient@example.com"],
  "subject": "Email Subject",
  "html": "<h1>Email Content</h1>",
  "text": "Plain text version",
  "cc": ["cc@example.com"],
  "bcc": ["bcc@example.com"],
  "attachments": [
    {
      "filename": "document.pdf",
      "content": "base64-encoded-content"
    }
  ]
}
```

#### Quick Send Email
```http
POST /api/emails/quick-send
Content-Type: application/json

{
  "to": "recipient@example.com",
  "subject": "Quick Email",
  "message": "Simple email message"
}
```

#### List Emails
```http
GET /api/emails?page=1&limit=10&status=sent
```

#### Get Email Details
```http
GET /api/emails/:emailId
```

#### Email Statistics
```http
GET /api/emails/stats/overview
```

### Settings Endpoints

#### Test Resend Connection
```http
POST /api/settings/test-integration
Content-Type: application/json

{
  "integration": "resend"
}
```

## Database Schema

### Email Model

```typescript
interface IEmail {
  _id: ObjectId;
  tenantId: ObjectId;
  resendId?: string;
  
  // Recipients
  to: string[];
  cc?: string[];
  bcc?: string[];
  
  // Content
  subject: string;
  html?: string;
  text?: string;
  
  // Metadata
  from: {
    email: string;
    name?: string;
  };
  
  // Status tracking
  status: 'draft' | 'queued' | 'sent' | 'delivered' | 'bounced' | 'failed';
  
  // Categorization
  category: 'transactional' | 'marketing' | 'notification' | 'other';
  tags?: string[];
  
  // Attachments
  attachments?: Array<{
    filename: string;
    contentType: string;
    size: number;
    resendId?: string;
  }>;
  
  // Tracking
  sentAt?: Date;
  deliveredAt?: Date;
  openedAt?: Date;
  clickedAt?: Date;
  
  // Error handling
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}
```

### Tenant Model Extensions

```typescript
// Added fields to existing Tenant model
interface ITenantResendFields {
  resendEnabled: boolean;
  resendApiKey?: string;
  resendFromDomain?: string;
  resendFromName?: string;
}
```

## Frontend Components

### Settings Integration Card

The Resend integration appears as a card in the Settings → Integrations tab with the following features:

#### UI Elements:
- **Toggle Switch**: Enable/disable the integration
- **API Key Field**: Masked input with visibility toggle and copy button
- **From Domain Field**: Domain configuration with validation
- **From Name Field**: Display name for outgoing emails
- **Test Connection Button**: Validates configuration with Resend API
- **Help Text**: Contextual guidance for each field

#### State Management:
```typescript
const [resendSettings, setResendSettings] = useState({
  enabled: false,
  apiKey: '',
  fromDomain: '',
  fromName: ''
});
```

#### Validation:
- API key format validation (starts with 're_')
- Domain format validation
- Required field validation when enabled
- Real-time connection testing

## Usage Examples

### Basic Email Sending

```typescript
// Send a simple email
const response = await fetch('/api/emails/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    to: ['customer@example.com'],
    subject: 'Order Confirmation',
    html: '<h1>Thank you for your order!</h1>',
    text: 'Thank you for your order!'
  })
});
```

### Email with Attachments

```typescript
// Send email with PDF attachment
const emailData = {
  to: ['customer@example.com'],
  subject: 'Invoice #12345',
  html: '<p>Please find your invoice attached.</p>',
  attachments: [
    {
      filename: 'invoice-12345.pdf',
      content: base64PdfContent,
      contentType: 'application/pdf'
    }
  ]
};

await fetch('/api/emails/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(emailData)
});
```

### Customer Email Integration

```typescript
// Send email to customer from customer management
const sendCustomerEmail = async (customerId: string, emailData: any) => {
  const response = await fetch('/api/emails/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...emailData,
      category: 'transactional',
      tags: ['customer-communication', `customer-${customerId}`]
    })
  });
  
  return response.json();
};
```

## Error Handling

### Common Error Scenarios

#### 1. Invalid API Key
```json
{
  "error": "Resend API error: 401 Unauthorized",
  "code": "INVALID_API_KEY"
}
```

#### 2. Domain Not Verified
```json
{
  "error": "Domain not verified in Resend account",
  "code": "DOMAIN_NOT_VERIFIED"
}
```

#### 3. Rate Limiting
```json
{
  "error": "Rate limit exceeded",
  "code": "RATE_LIMIT_EXCEEDED",
  "retryAfter": 60
}
```

### Error Handling Implementation

```typescript
// Service-level error handling
try {
  const result = await resend.emails.send(emailData);
  return { success: true, data: result };
} catch (error) {
  console.error('Resend API error:', error);
  
  if (error.message.includes('401')) {
    throw new Error('Invalid Resend API key');
  }
  
  if (error.message.includes('429')) {
    throw new Error('Rate limit exceeded');
  }
  
  throw new Error(`Email sending failed: ${error.message}`);
}
```

## Security Considerations

### API Key Protection
- API keys are stored encrypted in MongoDB
- Masked display in UI (shows only first/last characters)
- Secure transmission over HTTPS
- Environment variable fallback for development

### Access Control
- Tenant-based isolation (users can only access their tenant's emails)
- Role-based permissions for email management
- Audit logging for email operations

### Data Privacy
- Email content is stored securely in MongoDB
- Attachment handling with size limits
- GDPR compliance considerations for email storage

### Input Validation
- Email address format validation
- Content sanitization for HTML emails
- File type restrictions for attachments
- Rate limiting on API endpoints

## Troubleshooting

### Common Issues

#### 1. Connection Test Fails
**Symptoms**: "Connection failed" message in settings
**Solutions**:
- Verify API key is correct and active
- Check domain is verified in Resend dashboard
- Ensure network connectivity to Resend API

#### 2. Emails Not Sending
**Symptoms**: Emails stuck in "queued" status
**Solutions**:
- Check Resend account limits and quotas
- Verify sender domain configuration
- Review email content for spam triggers

#### 3. Settings Not Saving
**Symptoms**: Configuration resets after page refresh
**Solutions**:
- Check MongoDB connection
- Verify tenant permissions
- Review browser console for JavaScript errors

### Debug Mode

Enable debug logging by setting:
```env
DEBUG=resend:*
```

### Health Check Endpoint

Monitor integration health:
```http
GET /api/health/resend
```

Response:
```json
{
  "status": "healthy",
  "apiConnection": true,
  "domainVerified": true,
  "lastEmailSent": "2024-01-15T10:30:00Z"
}
```

## Performance Considerations

### Optimization Strategies
- Email queue implementation for bulk sending
- Attachment size limits (10MB default)
- Database indexing on email status and timestamps
- Caching of frequently accessed email templates

### Monitoring
- Email delivery rate tracking
- API response time monitoring
- Error rate alerting
- Storage usage monitoring

## Future Enhancements

### Planned Features
- Email template management system
- Advanced analytics and reporting
- Automated email campaigns
- Webhook integration for delivery status
- Email scheduling functionality
- A/B testing capabilities

### Integration Opportunities
- Customer relationship management
- Order confirmation automation
- Marketing campaign integration
- Support ticket notifications
- User onboarding sequences

---

## Support

For technical support or questions about the Resend integration:

1. Check the troubleshooting section above
2. Review Resend API documentation: https://resend.com/docs
3. Contact the development team
4. Submit issues via the project repository

## Technical Implementation Details

### Service Layer Architecture

The email service follows a clean architecture pattern with dependency injection:

```typescript
// server/services/email.ts
export class EmailService {
  private resend: Resend;
  private tenantId: string;

  constructor(apiKey: string, tenantId: string) {
    this.resend = new Resend(apiKey);
    this.tenantId = tenantId;
  }

  async sendEmail(emailData: EmailRequest): Promise<EmailResponse> {
    // Implementation details
  }

  async testConnection(): Promise<boolean> {
    // Connection validation
  }
}
```

### Database Indexing Strategy

Optimized indexes for email operations:

```javascript
// MongoDB indexes for email collection
db.emails.createIndex({ "tenantId": 1, "status": 1, "createdAt": -1 });
db.emails.createIndex({ "tenantId": 1, "to": 1 });
db.emails.createIndex({ "resendId": 1 }, { unique: true, sparse: true });
db.emails.createIndex({ "sentAt": 1 }, { expireAfterSeconds: 7776000 }); // 90 days
```

### API Route Implementation

Complete route handler example:

```typescript
// server/routes/emails/index.ts
router.post('/send', authenticateToken, async (req, res) => {
  try {
    const { tenantId } = req.user;
    const tenant = await Tenant.findById(tenantId);

    if (!tenant?.resendEnabled || !tenant.resendApiKey) {
      return res.status(400).json({
        error: 'Resend not configured for this tenant'
      });
    }

    const emailService = new EmailService(tenant.resendApiKey, tenantId);
    const result = await emailService.sendEmail(req.body);

    res.json(result);
  } catch (error) {
    console.error('Email send error:', error);
    res.status(500).json({ error: error.message });
  }
});
```

### Frontend State Management

React hook for email operations:

```typescript
// Custom hook for email management
export const useEmailService = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendEmail = useCallback(async (emailData: EmailRequest) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/emails/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailData)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { sendEmail, loading, error };
};
```

### Configuration Management

Settings persistence implementation:

```typescript
// Settings update handler
const updateResendSettings = async (settings: ResendSettings) => {
  const response = await fetch('/api/settings', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      resendEnabled: settings.enabled,
      resendApiKey: settings.apiKey,
      resendFromDomain: settings.fromDomain,
      resendFromName: settings.fromName
    })
  });

  if (!response.ok) {
    throw new Error('Failed to update settings');
  }

  // Update environment variables
  await updateEnvironmentVariables({
    RESEND_API_KEY: settings.apiKey,
    RESEND_FROM_DOMAIN: settings.fromDomain,
    RESEND_FROM_NAME: settings.fromName
  });
};
```

## Testing Strategy

### Unit Tests

Email service unit tests:

```typescript
// tests/services/email.test.ts
describe('EmailService', () => {
  let emailService: EmailService;
  let mockResend: jest.Mocked<Resend>;

  beforeEach(() => {
    mockResend = {
      emails: {
        send: jest.fn()
      }
    } as any;

    emailService = new EmailService('test-key', 'tenant-id');
    (emailService as any).resend = mockResend;
  });

  it('should send email successfully', async () => {
    mockResend.emails.send.mockResolvedValue({
      id: 'email-id',
      from: 'test@example.com',
      to: ['recipient@example.com']
    });

    const result = await emailService.sendEmail({
      to: ['recipient@example.com'],
      subject: 'Test',
      html: '<p>Test</p>'
    });

    expect(result.success).toBe(true);
    expect(mockResend.emails.send).toHaveBeenCalledWith({
      to: ['recipient@example.com'],
      subject: 'Test',
      html: '<p>Test</p>',
      from: 'test@example.com'
    });
  });
});
```

### Integration Tests

API endpoint integration tests:

```typescript
// tests/routes/emails.test.ts
describe('Email API Routes', () => {
  let app: Express;
  let authToken: string;

  beforeAll(async () => {
    app = createTestApp();
    authToken = await getTestAuthToken();
  });

  it('POST /api/emails/send should send email', async () => {
    const emailData = {
      to: ['test@example.com'],
      subject: 'Test Email',
      html: '<p>Test content</p>'
    };

    const response = await request(app)
      .post('/api/emails/send')
      .set('Authorization', `Bearer ${authToken}`)
      .send(emailData)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.emailId).toBeDefined();
  });
});
```

### End-to-End Tests

Playwright tests for settings UI:

```typescript
// tests/e2e/resend-settings.spec.ts
test('should configure Resend settings', async ({ page }) => {
  await page.goto('/settings');
  await page.click('[data-testid="integrations-tab"]');

  // Enable Resend
  await page.click('[data-testid="resend-toggle"]');

  // Fill in settings
  await page.fill('[data-testid="resend-api-key"]', 're_test_key');
  await page.fill('[data-testid="resend-domain"]', 'example.com');
  await page.fill('[data-testid="resend-name"]', 'Test Company');

  // Test connection
  await page.click('[data-testid="resend-test-connection"]');
  await expect(page.locator('[data-testid="connection-status"]')).toContainText('Connected');

  // Save settings
  await page.click('[data-testid="save-settings"]');
  await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
});
```

## Deployment Guide

### Production Deployment Checklist

1. **Environment Variables**
   ```bash
   # Production .env
   RESEND_API_KEY=re_live_api_key_here
   RESEND_FROM_DOMAIN=yourdomain.com
   RESEND_FROM_NAME=Your Company
   ```

2. **Database Migration**
   ```javascript
   // Migration script
   db.tenants.updateMany(
     {},
     {
       $set: {
         resendEnabled: false,
         resendApiKey: null,
         resendFromDomain: null,
         resendFromName: null
       }
     }
   );
   ```

3. **DNS Configuration**
   - Add SPF record: `v=spf1 include:_spf.resend.com ~all`
   - Add DKIM record provided by Resend
   - Verify domain in Resend dashboard

4. **Monitoring Setup**
   ```typescript
   // Health check endpoint
   app.get('/health/resend', async (req, res) => {
     try {
       const resend = new Resend(process.env.RESEND_API_KEY);
       await resend.emails.send({
         from: 'health@yourdomain.com',
         to: 'health@yourdomain.com',
         subject: 'Health Check',
         text: 'System health check'
       });

       res.json({ status: 'healthy' });
     } catch (error) {
       res.status(500).json({ status: 'unhealthy', error: error.message });
     }
   });
   ```

### Docker Configuration

```dockerfile
# Dockerfile additions for Resend
ENV RESEND_API_KEY=""
ENV RESEND_FROM_DOMAIN=""
ENV RESEND_FROM_NAME=""

# Install dependencies
RUN npm install resend
```

### Load Balancer Configuration

```nginx
# Nginx configuration for email endpoints
location /api/emails {
    proxy_pass http://backend;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_read_timeout 300s;  # Extended timeout for large attachments
    client_max_body_size 25M; # Allow larger email attachments
}
```

---

## Appendix

### A. Complete File Listing

```
BusinessDash/
├── server/
│   ├── models/
│   │   └── email.ts                 # Email MongoDB model
│   ├── services/
│   │   └── email.ts                 # Resend service implementation
│   ├── routes/
│   │   └── emails/
│   │       └── index.ts             # Email API routes
│   ├── types/
│   │   └── email.ts                 # TypeScript interfaces
│   └── middleware/
│       └── emailValidation.ts       # Email validation middleware
├── client/
│   └── src/
│       ├── pages/
│       │   └── Settings/
│       │       └── IntegrationsTab.tsx  # Settings UI
│       ├── hooks/
│       │   └── useEmailService.ts   # Email service hook
│       └── types/
│           └── email.ts             # Frontend type definitions
├── tests/
│   ├── unit/
│   │   └── email.service.test.ts    # Unit tests
│   ├── integration/
│   │   └── email.routes.test.ts     # Integration tests
│   └── e2e/
│       └── resend-settings.spec.ts  # E2E tests
└── docs/
    └── RESEND_EMAIL_INTEGRATION.md  # This documentation
```

### B. Environment Variables Reference

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `RESEND_API_KEY` | Resend API key | Yes | `re_123abc...` |
| `RESEND_FROM_DOMAIN` | Verified sender domain | Yes | `yourdomain.com` |
| `RESEND_FROM_NAME` | Default sender name | No | `Your Company` |
| `EMAIL_QUEUE_ENABLED` | Enable email queue | No | `true` |
| `EMAIL_RATE_LIMIT` | Emails per minute | No | `100` |

### C. API Response Examples

#### Successful Email Send
```json
{
  "success": true,
  "emailId": "507f1f77bcf86cd799439011",
  "resendId": "4ef8ad4b-c0b7-44b5-b5a1-3c0c8c5c9b1a",
  "status": "sent",
  "sentAt": "2024-01-15T10:30:00Z"
}
```

#### Error Response
```json
{
  "success": false,
  "error": "Invalid recipient email address",
  "code": "INVALID_EMAIL",
  "details": {
    "field": "to",
    "value": "invalid-email"
  }
}
```

---

*Last updated: January 2024*
*Version: 1.0.0*
