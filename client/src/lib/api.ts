import { apiRequest } from './queryClient';

export type StockLevel = 'none' | 'low' | 'good' | 'high';

export interface Product {
  id: number;
  tenantId: number;
  name: string;
  description?: string;
  price: number;
  category?: string;
  imageUrl?: string;
  stockLevel: StockLevel;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

// Product API
export const productApi = {
  /**
   * Fetch all products
   */
  getAll: async (): Promise<Product[]> => {
    const res = await apiRequest('GET', '/api/products');
    return res.json();
  },

  /**
   * Fetch a product by ID
   */
  getById: async (id: number): Promise<Product> => {
    const res = await apiRequest('GET', `/api/products/${id}`);
    return res.json();
  },

  /**
   * Create a new product
   */
  create: async (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> => {
    const res = await apiRequest('POST', '/api/products', product);
    return res.json();
  },

  /**
   * Update a product
   */
  update: async (id: number, product: Partial<Product>): Promise<Product> => {
    const res = await apiRequest('PATCH', `/api/products/${id}`, product);
    return res.json();
  },

  /**
   * Update a product's stock level
   */
  updateStockLevel: async (id: number, stockLevel: StockLevel): Promise<Product> => {
    const res = await apiRequest('PATCH', `/api/products/${id}/stock-level`, { stockLevel });
    return res.json();
  },

  /**
   * Get all available stock levels
   */
  getStockLevels: async (): Promise<StockLevel[]> => {
    const res = await apiRequest('GET', '/api/products/stock-levels');
    return res.json();
  },

  /**
   * Get products by stock level
   */
  getByStockLevel: async (stockLevel: StockLevel): Promise<Product[]> => {
    const res = await apiRequest('GET', `/api/products/by-stock-level/${stockLevel}`);
    return res.json();
  }
}; 