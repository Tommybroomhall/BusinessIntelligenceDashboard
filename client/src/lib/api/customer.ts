import { apiRequest } from '@/lib/queryClient';

// Customer type definition
export interface Customer {
  _id?: string;
  id?: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  status: 'active' | 'inactive';
  createdAt?: string;
  updatedAt?: string;
  tenantId?: number;

  // These fields are calculated from orders and not stored in the database
  totalSpent?: number;
  orderCount?: number;
  lastOrderDate?: string;
}

// Order type definition
export interface Order {
  _id?: string;
  id?: string;
  orderNumber?: string;
  customerName?: string;
  customerEmail?: string;
  amount: number;
  status: string;
  createdAt?: string;
  date?: string;
}

// Customer API
export const customerApi = {
  /**
   * Fetch all customers
   */
  getAll: async (): Promise<Customer[]> => {
    const res = await apiRequest('GET', '/api/customers');
    return res.json();
  },

  /**
   * Fetch a customer by ID
   */
  getById: async (id: string): Promise<Customer> => {
    try {
      const res = await apiRequest('GET', `/api/customers/${id}`);
      return await res.json();
    } catch (error) {
      console.error('Error fetching customer by ID:', error);
      throw error;
    }
  },

  /**
   * Fetch orders for a specific customer
   */
  getOrders: async (customerId: string): Promise<Order[]> => {
    try {
      // Call the real API endpoint to get customer orders
      const res = await apiRequest('GET', `/api/customers/${customerId}/orders`);
      const data = await res.json();

      // Return the orders array from the response
      return data.orders || [];
    } catch (error) {
      console.error('Error fetching customer orders:', error);

      // If there's an error, log it and return an empty array
      console.warn('Falling back to empty orders array due to API error');
      return [];
    }
  },
};
