# Webhook & Real-time Notification System

This document describes the comprehensive webhook and real-time notification system implemented for the Business Intelligence Dashboard.

## 🚀 Overview

The system provides:
- **Webhook endpoints** for receiving data from external systems (Shopify, payment processors, etc.)
- **Real-time notifications** using Socket.IO for instant dashboard updates
- **Notification management** with read/dismiss functionality
- **Activity logging** for audit trails
- **Tenant isolation** for multi-client support

## 📡 Webhook Endpoints

### 1. Order Webhook
**Endpoint:** `POST /api/webhooks/orders`

Receives order data from your e-commerce frontend after checkout.

```json
{
  "tenantId": "507f1f77bcf86cd799439011",
  "orderNumber": "ORD-12345",
  "customerName": "John Doe",
  "customerEmail": "john@example.com",
  "amount": 99.99,
  "status": "paid",
  "items": [
    {
      "productId": "prod_123",
      "productName": "Product Name",
      "quantity": 2,
      "price": 49.99
    }
  ],
  "metadata": {
    "source": "shopify-headless",
    "paymentMethod": "stripe"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Order created successfully",
  "orderId": "507f1f77bcf86cd799439012",
  "orderNumber": "ORD-12345"
}
```

### 2. Notification Webhook
**Endpoint:** `POST /api/webhooks/notifications`

Sends custom notifications to the dashboard.

```json
{
  "tenantId": "507f1f77bcf86cd799439011",
  "title": "Low Stock Alert",
  "message": "Product XYZ is running low",
  "type": "warning",
  "priority": "medium",
  "actionUrl": "/products/xyz",
  "actionText": "Manage Stock",
  "metadata": {
    "productId": "xyz",
    "stockLevel": 5
  }
}
```

### 3. Payment Webhook
**Endpoint:** `POST /api/webhooks/payments`

Confirms payment status updates.

```json
{
  "tenantId": "507f1f77bcf86cd799439011",
  "orderId": "507f1f77bcf86cd799439012",
  "orderNumber": "ORD-12345",
  "amount": 99.99,
  "status": "paid",
  "paymentId": "pay_123456",
  "metadata": {
    "paymentMethod": "stripe",
    "transactionId": "txn_789"
  }
}
```

### 4. Health Check
**Endpoint:** `GET /api/webhooks/health`

Returns webhook service status.

## 🔔 Notification API

### Get Notifications
**Endpoint:** `GET /api/notifications`

**Headers:** `x-tenant-id: your-tenant-id`

**Query Parameters:**
- `limit` (default: 50)
- `userId` (optional)
- `includeRead` (default: true)
- `includeDismissed` (default: false)

### Create Notification
**Endpoint:** `POST /api/notifications`

**Headers:** `x-tenant-id: your-tenant-id`

### Update Notification
**Endpoint:** `PATCH /api/notifications/:id`

Mark as read/dismissed:
```json
{
  "isRead": true,
  "isDismissed": false
}
```

### Mark All as Read
**Endpoint:** `POST /api/notifications/mark-all-read`

## 🔄 Real-time Features

### Socket.IO Events

**Client → Server:**
- `join-tenant` - Join tenant-specific room
- `leave-tenant` - Leave tenant room
- `notification-received` - Acknowledge notification

**Server → Client:**
- `new-notification` - New notification received
- `notification-updated` - Notification status changed
- `dashboard-refresh` - Trigger dashboard data refresh
- `notifications-marked-read` - Bulk read status update

### Frontend Integration

```typescript
import { useNotifications } from '@/hooks/use-notifications';

function MyComponent() {
  const {
    notifications,
    unreadCount,
    isConnected,
    markAsRead,
    dismiss,
    markAllAsRead
  } = useNotifications({
    tenantId: 'your-tenant-id',
    enableRealTime: true,
    showToasts: true
  });

  return (
    <NotificationBell
      tenantId="your-tenant-id"
      userId="user-id"
    />
  );
}
```

## 🛠️ Setup & Configuration

### 1. Environment Variables

```env
# MongoDB connection
MONGODB_URI=mongodb://localhost:27017/business-dashboard

# Session secret
SESSION_SECRET=your-session-secret

# Client URL for CORS (production)
CLIENT_URL=https://yourdomain.com

# Optional global webhook security (fallback)
WEBHOOK_SECRET=your-global-webhook-secret
```

### 2. Webhook Settings Configuration

**🎯 New Feature: Per-Tenant Webhook Configuration**

Each tenant can now configure their own webhook settings through the dashboard:

1. **Navigate to Settings → Webhooks** in your dashboard
2. **Enable Webhooks** for your tenant
3. **Configure Endpoint Settings** (orders, notifications, payments)
4. **Generate Webhook Secret** for secure communication
5. **Copy Webhook URLs** for your e-commerce platform

#### Webhook Settings API

```bash
# Get webhook settings
GET /api/webhooks/settings
Headers: x-tenant-id: your-tenant-id

# Update webhook settings
PATCH /api/webhooks/settings
Headers: x-tenant-id: your-tenant-id
Body: {
  "webhookEnabled": true,
  "webhookEndpoints": {
    "orders": true,
    "notifications": true,
    "payments": true
  },
  "webhookRetryAttempts": 3,
  "webhookTimeoutMs": 30000
}

# Generate new webhook secret
POST /api/webhooks/settings/generate-secret
Headers: x-tenant-id: your-tenant-id

# Test webhook configuration
POST /api/webhooks/settings/test
Headers: x-tenant-id: your-tenant-id
```

### 2. Install Dependencies

```bash
npm install socket.io @types/socket.io socket.io-client
```

### 3. Start the Server

```bash
npm run dev
```

The server will start on port 5000 with Socket.IO enabled.

## 🧪 Testing

### Run Test Script

```bash
npm run ts-node -- scripts/test-webhook-system.ts
```

This tests all webhook endpoints and notification functionality.

### Manual Testing

1. **Test Order Webhook:**
```bash
curl -X POST http://localhost:5000/api/webhooks/orders \
  -H "Content-Type: application/json" \
  -d '{
    "tenantId": "507f1f77bcf86cd799439011",
    "orderNumber": "TEST-001",
    "customerName": "Test Customer",
    "amount": 50.00
  }'
```

2. **Test Notification Webhook:**
```bash
curl -X POST http://localhost:5000/api/webhooks/notifications \
  -H "Content-Type: application/json" \
  -d '{
    "tenantId": "507f1f77bcf86cd799439011",
    "title": "Test Alert",
    "message": "This is a test notification",
    "type": "info"
  }'
```

## 🔐 Security

### Webhook Signature Verification

**🔒 Enhanced Security Features:**

1. **Per-Tenant Secrets**: Each tenant has their own webhook secret
2. **Automatic Verification**: All webhook endpoints verify signatures when secrets are configured
3. **Secure Secret Management**: Secrets are generated using cryptographically secure random bytes
4. **Settings UI**: Easy secret generation and management through the dashboard

### Implementation

**Generate Signature (Client-side):**

```javascript
const crypto = require('crypto');

function generateWebhookSignature(payload, secret) {
  return crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
}

// Usage
const payload = JSON.stringify(orderData);
const signature = generateWebhookSignature(payload, WEBHOOK_SECRET);

// Add to request headers
headers: {
  'X-Webhook-Signature': signature,
  'Content-Type': 'application/json'
}
```

### CORS Configuration

The system is configured for cross-origin requests:
- Development: `http://localhost:5173`, `http://localhost:3000`
- Production: Set `CLIENT_URL` environment variable

## 📊 Monitoring

### Connection Status

The notification bell shows real-time connection status:
- 🟢 Connected (green wifi icon)
- 🔴 Disconnected (red wifi-off icon)

### Error Handling

- Failed webhook requests return appropriate HTTP status codes
- Socket.IO automatically reconnects on connection loss
- Toast notifications show connection errors
- Exponential backoff for retry attempts

## 🎯 Use Cases

### 1. E-commerce Integration

```javascript
// After successful Stripe payment
await DashboardWebhooks.handleCheckoutComplete({
  orderNumber: 'ORD-12345',
  customerName: 'John Doe',
  customerEmail: 'john@example.com',
  total: 99.99,
  items: [...],
  paymentMethod: 'stripe'
});
```

### 2. Inventory Management

```javascript
// Low stock alert
await DashboardWebhooks.sendLowStockAlert({
  id: 'prod_123',
  name: 'Product Name',
  stockLevel: 5,
  lowStockThreshold: 10
});
```

### 3. System Alerts

```javascript
// Maintenance notification
await DashboardWebhooks.sendMaintenanceNotification({
  scheduledTime: '2024-01-15T02:00:00Z',
  estimatedDuration: '2 hours',
  affectedServices: ['payments', 'orders']
});
```

## 🚀 Deployment

### Production Checklist

- [ ] Set `CLIENT_URL` environment variable
- [ ] Configure MongoDB connection string
- [ ] Set secure session secret
- [ ] Enable HTTPS for Socket.IO
- [ ] Configure webhook signature verification
- [ ] Set up monitoring and logging
- [ ] Test webhook endpoints from external systems

### Scaling Considerations

- Use Redis adapter for Socket.IO in multi-server deployments
- Implement webhook queue for high-volume scenarios
- Consider notification batching for performance
- Monitor MongoDB performance with notification queries

## 📚 API Reference

See the complete API documentation in the code comments and TypeScript interfaces for detailed parameter specifications and response formats.
