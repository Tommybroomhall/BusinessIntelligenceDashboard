/**
 * Products.tsx - Product Management Page
 *
 * This is the main product management interface for the business intelligence dashboard.
 * It provides functionality to:
 * - View all products in a tabular format with filtering and search capabilities
 * - Manage product stock levels (none, low, good, high)
 * - Add new products via a dialog interface
 * - View detailed product information in a popup dialog
 * - Filter products by stock level using tabs
 * - Search products by name or category
 *
 * Key dependencies:
 * - Uses React Query for data fetching and caching from MongoDB via API endpoints
 * - Integrates with the currency context for price formatting
 * - Relies on custom UI components from the components/ui directory
 * - Uses the productApi from lib/api for backend communication
 * - Implements security measures via sanitizeImageUrl for image handling
 *
 * Data flow:
 * - Fetches products from /api/products endpoint (MongoDB backend)
 * - Fetches stock levels from /api/products/stock-levels endpoint
 * - Updates stock levels via mutations that invalidate the products cache
 * - Supports both MongoDB _id and standard id fields for compatibility
 */

// React core imports for component state management
import React, { useState } from 'react';

// React Query imports for server state management, caching, and mutations
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// API layer imports - productApi handles backend communication, types define data structures
import { productApi, type Product, type StockLevel } from '../lib/api';

// UI component imports - reusable components for consistent design system
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { StockLevelBadge } from '../components/ui/stock-level-badge';
import { StockLevelSelector } from '../components/ui/stock-level-selector';
import { Input } from '../components/ui/input';
// Note: Button import removed as it's not used in this component

// Context imports for global application state (currency formatting)
import { useCurrencyFormatter } from '../context/CurrencyContext';

// Product-specific component imports for dialogs and forms
import { AddProductDialog } from '../components/products/add-product-dialog-new';
import { ProductDetailsDialog } from '../components/products/product-details-dialog';

// Security utility for sanitizing image URLs to prevent XSS attacks
import { sanitizeImageUrl } from '@/lib/security';

/**
 * ProductsPage - Main component for product management interface
 *
 * This component manages the entire product listing, filtering, and interaction flow.
 * It handles both the display of products and the various user interactions like
 * searching, filtering by stock level, and opening product details.
 */
export default function ProductsPage() {
  // Local state for search functionality - filters products by name or category
  const [searchTerm, setSearchTerm] = useState('');

  // Local state for tab-based filtering - determines which stock level to show
  // Values: 'all', 'none', 'low', 'good', 'high'
  const [activeTab, setActiveTab] = useState<string>('all');

  // React Query client for cache invalidation after mutations
  const queryClient = useQueryClient();

  // Currency formatting hook from global context - formats prices according to user's locale/currency
  const { formatCurrency } = useCurrencyFormatter();

  // State management for product details dialog
  // selectedProductId: stores the ID of the product to show in the details dialog
  // dialogOpen: controls whether the product details dialog is visible
  const [selectedProductId, setSelectedProductId] = useState<string | number | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // React Query hook to fetch all products from MongoDB via API
  // This query automatically caches results and handles loading/error states
  const { data: products = [], isLoading, error } = useQuery({
    queryKey: ['/api/products'], // Cache key for React Query
    queryFn: async () => {
      try {
        // Direct fetch to API endpoint with credentials for authentication
        // NOTE: This bypasses the productApi abstraction - consider using productApi.getProducts() for consistency
        const response = await fetch('/api/products', {
          credentials: 'include' // Include cookies for JWT authentication
        });

        const responseData = await response.json();
        return responseData;
      } catch (err) {
        console.error('Error fetching products:', err);
        throw err; // Re-throw to trigger React Query error state
      }
    },
    // Transform the data after fetching - sorts products alphabetically by name
    select: (data: Product[]) => {
      return data && Array.isArray(data)
        ? data.sort((a, b) => a.name.localeCompare(b.name))
        : []; // Fallback to empty array if data is invalid
    }
  });

  // React Query hook to fetch stock level definitions/options
  // NOTE: This data appears to be unused in the component - consider removing if not needed
  // TODO: Verify if stockLevels data is actually used anywhere or can be removed
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { data: stockLevels = [] } = useQuery({
    queryKey: ['/api/products/stock-levels'],
    queryFn: () => productApi.getStockLevels() // Uses the API abstraction layer
  });

  // React Query mutation for updating a product's stock level
  // This handles optimistic updates and cache invalidation
  const updateStockLevel = useMutation({
    // The actual API call to update stock level
    mutationFn: ({ productId, stockLevel }: { productId: string | number, stockLevel: StockLevel }) =>
      productApi.updateStockLevel(productId, stockLevel),
    // On successful update, invalidate the products cache to trigger a refetch
    // This ensures the UI shows the updated stock level immediately
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
    }
  });

  // Computed value that filters products based on both search term and active tab
  // This creates a derived state that updates whenever products, searchTerm, or activeTab changes
  const filteredProducts = Array.isArray(products)
    ? products.filter(product => {
        // Search filter: matches product name or category (case-insensitive)
        const matchesSearch = product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (product.category && product.category.toLowerCase().includes(searchTerm.toLowerCase()));

        // If "all" tab is active, only apply search filter
        if (activeTab === 'all') return matchesSearch;

        // For specific stock level tabs, apply both search and stock level filters
        return matchesSearch && product.stockLevel === activeTab;
      })
    : []; // Fallback to empty array if products is not an array

  /**
   * Event handler for stock level updates
   * Triggers the React Query mutation to update a product's stock level
   *
   * @param productId - The ID of the product to update (supports both MongoDB _id and standard id)
   * @param newLevel - The new stock level to set ('none', 'low', 'good', 'high')
   */
  const handleStockLevelUpdate = async (productId: string | number, newLevel: StockLevel) => {
    await updateStockLevel.mutateAsync({ productId, stockLevel: newLevel });
  };

  return (
    <div className="container mx-auto py-6">
      {/* Page header section with title and description */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Product Management</h1>
        <p className="text-gray-500">Manage your products and inventory levels</p>
      </div>

      {/* Error display section - shows detailed error information when product fetching fails */}
      {/* This helps with debugging API issues and provides transparency to users */}
      {error && (
        <Card className="mb-6 bg-red-50 border-red-200">
          <CardContent className="pt-6">
            <h3 className="font-bold text-red-700 mb-2">Error Loading Products</h3>
            {/* Display raw error object for debugging purposes */}
            <pre className="text-sm bg-white p-4 rounded border overflow-auto max-h-40">
              {JSON.stringify(error, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

      {/* Top action bar with search input and add product button */}
      <div className="mb-6 flex justify-between items-center">
        {/* Search input - filters products by name or category in real-time */}
        <Input
          placeholder="Search products..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)} // Updates searchTerm state on every keystroke
          className="max-w-sm"
        />
        {/* Add Product Dialog - opens a modal for creating new products */}
        {/* This component handles its own state and triggers cache invalidation on success */}
        <AddProductDialog />
      </div>

      {/* Tab-based filtering system for stock levels */}
      {/* Controlled component - activeTab state determines which tab is selected */}
      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        {/* Tab navigation buttons */}
        <TabsList className="mb-4">
          <TabsTrigger value="all">All Products</TabsTrigger>
          <TabsTrigger value="none">No Stock</TabsTrigger>
          <TabsTrigger value="low">Low Stock</TabsTrigger>
          <TabsTrigger value="good">Good Stock</TabsTrigger>
          <TabsTrigger value="high">High Stock</TabsTrigger>
        </TabsList>

        {/* Tab content - shows the same table for all tabs, but with different filtered data */}
        <TabsContent value={activeTab}>
          <Card>
            <CardHeader>
              <CardTitle>Products</CardTitle>
              {/* Dynamic description based on active tab */}
              <CardDescription>
                {activeTab === 'all'
                  ? 'All products in your inventory'
                  : `Products with ${activeTab} stock level`
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Conditional rendering based on loading state */}
              {isLoading ? (
                <p>Loading products...</p>
              ) : (
                <Table>
                  {/* Table header with column definitions */}
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">Image</TableHead>
                      <TableHead>Product Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Stock Level</TableHead>
                      <TableHead>Update Stock Level</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {/* Conditional rendering: empty state vs product rows */}
                    {filteredProducts.length === 0 ? (
                      <TableRow>
                        {/* Empty state message spans all columns */}
                        <TableCell colSpan={6} className="text-center py-4">
                          No products found
                        </TableCell>
                      </TableRow>
                    ) : (
                      /* Map through filtered products to create table rows */
                      filteredProducts.map((product) => (
                        <TableRow
                          key={product.id || product._id} // Support both MongoDB _id and standard id
                          className="cursor-pointer hover:bg-gray-50"
                          onClick={() => {
                            // Click handler to open product details dialog
                            // Handles both MongoDB _id and standard id fields for compatibility
                            const id = product.id || product._id;
                            setSelectedProductId(id !== undefined ? id : null);
                            setDialogOpen(true);
                          }}
                        >
                          {/* Product image cell with fallback placeholder */}
                          <TableCell className="align-middle">
                            <div className="w-12 h-12 flex items-center justify-center bg-gray-100 rounded-lg border border-gray-200 overflow-hidden">
                              {/* IIFE (Immediately Invoked Function Expression) for complex image rendering logic */}
                              {(() => {
                                // Sanitize image URL for security (prevents XSS attacks)
                                const sanitizedUrl = sanitizeImageUrl(product.imageUrl);
                                return sanitizedUrl ? (
                                  // Render actual product image if URL is valid and safe
                                  <img
                                    src={sanitizedUrl}
                                    alt={product.name}
                                    className="object-cover w-12 h-12 rounded-lg"
                                    width={48}
                                    height={48}
                                  />
                                ) : (
                                  // Fallback placeholder icon when no image is available
                                  <div className="w-12 h-12 flex items-center justify-center text-gray-300 bg-gray-50 rounded-lg">
                                    {/* SVG placeholder icon representing an image */}
                                    <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="w-6 h-6">
                                      <rect x="3" y="3" width="18" height="18" rx="4" stroke="currentColor" strokeWidth="2" fill="none" />
                                      <path d="M8 15l2.5-3 2.5 3 3.5-4.5L21 19H3l5-7z" stroke="currentColor" strokeWidth="2" fill="none" />
                                    </svg>
                                  </div>
                                );
                              })()}
                            </div>
                          </TableCell>

                          {/* Product name cell - styled with medium font weight for emphasis */}
                          <TableCell className="font-medium">{product.name}</TableCell>

                          {/* Category cell with fallback to dash if no category */}
                          <TableCell>{product.category || '-'}</TableCell>

                          {/* Price cell - uses currency formatter from context for localization */}
                          <TableCell>{formatCurrency(product.price)}</TableCell>

                          {/* Stock level display - uses custom badge component for visual consistency */}
                          <TableCell>
                            <StockLevelBadge level={product.stockLevel as StockLevel} />
                          </TableCell>

                          {/* Stock level update control - dropdown selector for changing stock levels */}
                          <TableCell>
                            <StockLevelSelector
                              productId={product.id || product._id || ''} // Support both ID formats
                              currentLevel={product.stockLevel as StockLevel}
                              onUpdate={(newLevel) => handleStockLevelUpdate(product.id || product._id || '', newLevel)}
                            />
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Product Details Dialog - Modal for viewing detailed product information */}
      {/* This dialog is controlled by selectedProductId and dialogOpen state */}
      {/* It renders outside the main content flow and overlays the page when open */}
      <ProductDetailsDialog
        productId={selectedProductId} // Pass the selected product ID to fetch details
        open={dialogOpen} // Control dialog visibility
        onOpenChange={setDialogOpen} // Handle dialog close events
      />
    </div>
  );
}