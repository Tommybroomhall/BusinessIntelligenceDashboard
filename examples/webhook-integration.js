/**
 * Example webhook integration for your Shopify headless frontend
 *
 * This file demonstrates how to integrate with the Business Intelligence Dashboard
 * webhook system from your e-commerce frontend.
 *
 * Usage scenarios:
 * 1. After successful checkout/payment
 * 2. Order status updates
 * 3. Custom notifications
 * 4. System alerts
 */

// Configuration
const DASHBOARD_API_URL = 'https://your-dashboard-domain.com'; // Replace with your dashboard URL
const TENANT_ID = 'your-tenant-id'; // Replace with your actual tenant ID
const WEBHOOK_SECRET = 'your-webhook-secret'; // Get this from your dashboard webhook settings

/**
 * Send order data to dashboard after successful checkout
 */
async function sendOrderToDashboard(orderData) {
  try {
    const webhookPayload = {
      tenantId: TENANT_ID,
      orderNumber: orderData.orderNumber,
      customerName: orderData.customer.name,
      customerEmail: orderData.customer.email,
      amount: orderData.total,
      status: 'paid', // or 'pending' depending on payment status
      items: orderData.items.map(item => ({
        productId: item.productId,
        productName: item.name,
        quantity: item.quantity,
        price: item.price
      })),
      metadata: {
        source: 'shopify-headless',
        paymentMethod: orderData.paymentMethod,
        shippingAddress: orderData.shippingAddress,
        timestamp: new Date().toISOString()
      }
    };

    const payload = JSON.stringify(webhookPayload);
    const headers = {
      'Content-Type': 'application/json'
    };

    // Add webhook signature for security if secret is configured
    if (WEBHOOK_SECRET) {
      headers['X-Webhook-Signature'] = generateSignature(payload);
    }

    const response = await fetch(`${DASHBOARD_API_URL}/api/webhooks/orders`, {
      method: 'POST',
      headers,
      body: payload
    });

    if (response.ok) {
      const result = await response.json();
      console.log('Order sent to dashboard successfully:', result);
      return result;
    } else {
      const error = await response.json();
      console.error('Failed to send order to dashboard:', error);
      throw new Error(error.message || 'Failed to send order');
    }
  } catch (error) {
    console.error('Error sending order to dashboard:', error);
    throw error;
  }
}

/**
 * Send payment confirmation to dashboard
 */
async function sendPaymentConfirmation(paymentData) {
  try {
    const webhookPayload = {
      tenantId: TENANT_ID,
      orderId: paymentData.orderId,
      orderNumber: paymentData.orderNumber,
      amount: paymentData.amount,
      status: 'paid',
      paymentId: paymentData.paymentId,
      metadata: {
        paymentMethod: paymentData.method,
        transactionId: paymentData.transactionId,
        timestamp: new Date().toISOString()
      }
    };

    const response = await fetch(`${DASHBOARD_API_URL}/api/webhooks/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(webhookPayload)
    });

    if (response.ok) {
      const result = await response.json();
      console.log('Payment confirmation sent successfully:', result);
      return result;
    } else {
      const error = await response.json();
      console.error('Failed to send payment confirmation:', error);
      throw new Error(error.message || 'Failed to send payment confirmation');
    }
  } catch (error) {
    console.error('Error sending payment confirmation:', error);
    throw error;
  }
}

/**
 * Send custom notification to dashboard
 */
async function sendCustomNotification(notificationData) {
  try {
    const webhookPayload = {
      tenantId: TENANT_ID,
      title: notificationData.title,
      message: notificationData.message,
      type: notificationData.type || 'info', // 'info', 'success', 'warning', 'error', 'order', 'payment', 'system'
      priority: notificationData.priority || 'medium', // 'low', 'medium', 'high', 'urgent'
      actionUrl: notificationData.actionUrl,
      actionText: notificationData.actionText,
      metadata: notificationData.metadata || {}
    };

    const response = await fetch(`${DASHBOARD_API_URL}/api/webhooks/notifications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(webhookPayload)
    });

    if (response.ok) {
      const result = await response.json();
      console.log('Custom notification sent successfully:', result);
      return result;
    } else {
      const error = await response.json();
      console.error('Failed to send custom notification:', error);
      throw new Error(error.message || 'Failed to send notification');
    }
  } catch (error) {
    console.error('Error sending custom notification:', error);
    throw error;
  }
}

/**
 * Example: Complete checkout flow integration
 */
async function handleCheckoutComplete(checkoutData) {
  try {
    console.log('Processing checkout completion...');

    // 1. Send order to dashboard
    await sendOrderToDashboard({
      orderNumber: checkoutData.orderNumber,
      customer: {
        name: checkoutData.customerName,
        email: checkoutData.customerEmail
      },
      total: checkoutData.total,
      items: checkoutData.items,
      paymentMethod: checkoutData.paymentMethod,
      shippingAddress: checkoutData.shippingAddress
    });

    // 2. Send payment confirmation
    await sendPaymentConfirmation({
      orderId: checkoutData.orderId,
      orderNumber: checkoutData.orderNumber,
      amount: checkoutData.total,
      paymentId: checkoutData.paymentId,
      method: checkoutData.paymentMethod,
      transactionId: checkoutData.transactionId
    });

    // 3. Send success notification
    await sendCustomNotification({
      title: 'New Order Received',
      message: `Order ${checkoutData.orderNumber} from ${checkoutData.customerName} for $${checkoutData.total}`,
      type: 'order',
      priority: 'high',
      actionUrl: `/orders/${checkoutData.orderId}`,
      actionText: 'View Order',
      metadata: {
        orderNumber: checkoutData.orderNumber,
        customerName: checkoutData.customerName,
        total: checkoutData.total
      }
    });

    console.log('Checkout completion processed successfully');
  } catch (error) {
    console.error('Error processing checkout completion:', error);

    // Send error notification to dashboard
    try {
      await sendCustomNotification({
        title: 'Checkout Processing Error',
        message: `Failed to process checkout for order ${checkoutData.orderNumber}: ${error.message}`,
        type: 'error',
        priority: 'urgent',
        metadata: {
          error: error.message,
          orderNumber: checkoutData.orderNumber
        }
      });
    } catch (notificationError) {
      console.error('Failed to send error notification:', notificationError);
    }
  }
}

/**
 * Example: Low stock alert
 */
async function sendLowStockAlert(productData) {
  await sendCustomNotification({
    title: 'Low Stock Alert',
    message: `${productData.name} is running low (${productData.stockLevel} remaining)`,
    type: 'warning',
    priority: 'medium',
    actionUrl: `/products/${productData.id}`,
    actionText: 'Manage Stock',
    metadata: {
      productId: productData.id,
      productName: productData.name,
      stockLevel: productData.stockLevel,
      threshold: productData.lowStockThreshold
    }
  });
}

/**
 * Example: System maintenance notification
 */
async function sendMaintenanceNotification(maintenanceData) {
  await sendCustomNotification({
    title: 'Scheduled Maintenance',
    message: `System maintenance scheduled for ${maintenanceData.scheduledTime}`,
    type: 'system',
    priority: 'medium',
    metadata: {
      scheduledTime: maintenanceData.scheduledTime,
      duration: maintenanceData.estimatedDuration,
      affectedServices: maintenanceData.affectedServices
    }
  });
}

/**
 * Utility function to generate webhook signature (optional security measure)
 */
function generateSignature(payload) {
  if (!WEBHOOK_SECRET) return null;

  const crypto = require('crypto');
  return crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(payload)
    .digest('hex');
}

/**
 * Example usage in your checkout process
 */
/*
// After successful Stripe/PayPal payment
stripe.confirmPayment(paymentIntent).then(async (result) => {
  if (result.paymentIntent.status === 'succeeded') {
    await handleCheckoutComplete({
      orderNumber: 'ORD-12345',
      orderId: 'order_id_123',
      customerName: 'John Doe',
      customerEmail: 'john@example.com',
      total: 99.99,
      items: [
        { productId: 'prod_1', name: 'Product 1', quantity: 2, price: 49.99 }
      ],
      paymentMethod: 'stripe',
      paymentId: result.paymentIntent.id,
      transactionId: result.paymentIntent.id,
      shippingAddress: {
        street: '123 Main St',
        city: 'Anytown',
        state: 'CA',
        zip: '12345'
      }
    });
  }
});
*/

// Export functions for use in your application
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    sendOrderToDashboard,
    sendPaymentConfirmation,
    sendCustomNotification,
    handleCheckoutComplete,
    sendLowStockAlert,
    sendMaintenanceNotification
  };
}

// For browser environments
if (typeof window !== 'undefined') {
  window.DashboardWebhooks = {
    sendOrderToDashboard,
    sendPaymentConfirmation,
    sendCustomNotification,
    handleCheckoutComplete,
    sendLowStockAlert,
    sendMaintenanceNotification
  };
}
