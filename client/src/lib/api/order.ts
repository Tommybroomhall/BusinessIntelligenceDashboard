import { apiRequest } from '@/lib/queryClient';

// Order type definition
export interface Order {
  _id?: string;
  id?: string;
  orderNumber: string;
  customerName: string;
  customerEmail?: string;
  amount: number;
  status: OrderStatus;
  createdAt?: string;
  updatedAt?: string;
  date?: string; // For compatibility with some components
}

// Order item type definition
export interface OrderItem {
  _id?: string;
  id?: string;
  orderId: string;
  productId: string;
  productName?: string; // This might be populated by the API
  quantity: number;
  price: number;
}

// Order status type
export type OrderStatus = 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'refunded' | 'canceled';

// Order API
export const orderApi = {
  /**
   * Fetch all orders
   */
  getAll: async (): Promise<Order[]> => {
    try {
      const res = await apiRequest('GET', '/api/orders');
      return res.json();
    } catch (error) {
      console.error('Error fetching orders:', error);
      throw error;
    }
  },

  /**
   * Fetch an order by ID
   */
  getById: async (id: string | number): Promise<Order> => {
    try {
      const res = await apiRequest('GET', `/api/orders/${id}`);
      return res.json();
    } catch (error) {
      console.error('Error fetching order by ID:', error);
      throw error;
    }
  },

  /**
   * Fetch order items for a specific order
   */
  getOrderItems: async (orderId: string | number): Promise<OrderItem[]> => {
    try {
      const res = await apiRequest('GET', `/api/orders/${orderId}/items`);
      return res.json();
    } catch (error) {
      console.error('Error fetching order items:', error);
      throw error;
    }
  },

  /**
   * Update an order's status
   */
  updateStatus: async (id: string | number, status: OrderStatus): Promise<Order> => {
    try {
      const res = await apiRequest('PATCH', `/api/orders/${id}/status`, { status });
      return res.json();
    } catch (error) {
      console.error('Error updating order status:', error);
      throw error;
    }
  }
};
