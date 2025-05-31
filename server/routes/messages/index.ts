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

// GET all messages
router.get('/', ensureTenantAccess(), async (req: Request, res: Response) => {
  try {
    console.log('Fetching messages for tenant:', req.tenantId);
    
    // Generate mock messages for this tenant
    const messages = generateMockMessages(req.tenantId);
    
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
    const messages = generateMockMessages(req.tenantId);
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
    
    // In a real app, this would update the database
    console.log(`Marking message ${id} as read for tenant ${req.tenantId}`);
    
    res.json({ message: 'Message marked as read' });
  } catch (error) {
    console.error("Error marking message as read:", error);
    res.status(500).json({ message: "An error occurred" });
  }
});

export default router;
