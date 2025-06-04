import { Router, Request, Response } from 'express';
import { ensureTenantAccess } from '../../middleware/tenantAccess';

const router = Router();

// Mock messages data for now - in a real app this would come from a database
const generateMockMessages = (tenantId: number) => [
  {
    id: `msg-${tenantId}-1`,
    title: 'New Customer Inquiry',
    content: 'A customer has asked about product availability and shipping times.',
    sender: 'support@example.com',
    date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    read: false
  },
  {
    id: `msg-${tenantId}-2`,
    title: 'Order Confirmation Required',
    content: 'Order #12345 requires manual confirmation due to payment verification.',
    sender: 'orders@example.com',
    date: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
    read: false
  },
  {
    id: `msg-${tenantId}-3`,
    title: 'Weekly Sales Report',
    content: 'Your weekly sales report is ready for review.',
    sender: 'analytics@example.com',
    date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    read: true
  },
  {
    id: `msg-${tenantId}-4`,
    title: 'Supplier Update',
    content: 'Your supplier has updated their product catalog with new items.',
    sender: 'supplier@example.com',
    date: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(), // 2 days ago
    read: true
  },
  {
    id: `msg-${tenantId}-5`,
    title: 'System Maintenance Notice',
    content: 'Scheduled maintenance will occur this weekend from 2-4 AM.',
    sender: 'system@businessdash.com',
    date: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(), // 3 days ago
    read: false
  }
];

// In-memory storage for tracking read status per tenant (in production this would be in database)
const messageReadStatus: { [tenantId: number]: { [messageId: string]: boolean } } = {};

// Helper to get messages with current read status
const getMessagesWithReadStatus = (tenantId: number) => {
  const messages = generateMockMessages(tenantId);
  const readStatus = messageReadStatus[tenantId] || {};
  
  return messages.map(message => ({
    ...message,
    read: readStatus[message.id] !== undefined ? readStatus[message.id] : message.read
  }));
};

// GET all messages
router.get('/', ensureTenantAccess(), async (req: Request, res: Response) => {
  try {
    console.log('Fetching messages for tenant:', req.tenantId);
    
    // Get messages with current read status
    const messages = getMessagesWithReadStatus(req.tenantId);
    
    console.log(`Generated ${messages.length} mock messages`);
    res.json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ message: "An error occurred" });
  }
});

// GET unread messages count
router.get('/unread-count', ensureTenantAccess(), async (req: Request, res: Response) => {
  try {
    const messages = getMessagesWithReadStatus(req.tenantId);
    const unreadCount = messages.filter(message => !message.read).length;
    
    res.json({ count: unreadCount });
  } catch (error) {
    console.error("Error fetching unread messages count:", error);
    res.status(500).json({ message: "An error occurred" });
  }
});

// PATCH mark message as read
router.patch('/:id/read', ensureTenantAccess(), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Initialize tenant storage if it doesn't exist
    if (!messageReadStatus[req.tenantId]) {
      messageReadStatus[req.tenantId] = {};
    }
    
    // Mark message as read
    messageReadStatus[req.tenantId][id] = true;
    
    console.log(`Marked message ${id} as read for tenant ${req.tenantId}`);
    
    res.json({ message: 'Message marked as read' });
  } catch (error) {
    console.error("Error marking message as read:", error);
    res.status(500).json({ message: "An error occurred" });
  }
});

// POST mark all messages as read
router.post('/mark-all-read', ensureTenantAccess(), async (req: Request, res: Response) => {
  try {
    console.log(`Marking all messages as read for tenant ${req.tenantId}`);
    
    // Initialize tenant storage if it doesn't exist
    if (!messageReadStatus[req.tenantId]) {
      messageReadStatus[req.tenantId] = {};
    }
    
    // Get all messages for this tenant
    const messages = generateMockMessages(req.tenantId);
    let markedCount = 0;
    
    // Mark all messages as read
    messages.forEach(message => {
      const currentStatus = messageReadStatus[req.tenantId][message.id];
      const wasUnread = currentStatus !== undefined ? !currentStatus : !message.read;
      
      if (wasUnread) {
        messageReadStatus[req.tenantId][message.id] = true;
        markedCount++;
      }
    });
    
    console.log(`Marked ${markedCount} messages as read for tenant ${req.tenantId}`);
    
    res.json({ 
      message: 'All messages marked as read',
      count: markedCount
    });
  } catch (error) {
    console.error("Error marking all messages as read:", error);
    res.status(500).json({ message: "An error occurred" });
  }
});

export default router;
