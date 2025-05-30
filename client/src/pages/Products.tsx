import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productApi, type Product, type StockLevel } from '../lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { StockLevelBadge } from '../components/ui/stock-level-badge';
import { StockLevelSelector } from '../components/ui/stock-level-selector';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { useCurrencyFormatter } from '../context/CurrencyContext';
import { AddProductDialog } from '../components/products/add-product-dialog-new';
import { ProductDetailsDialog } from '../components/products/product-details-dialog';
import { sanitizeImageUrl } from '@/lib/security';

export default function ProductsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<string>('all');
  const queryClient = useQueryClient();
  const { formatCurrency } = useCurrencyFormatter();

  // State for product details dialog
  const [selectedProductId, setSelectedProductId] = useState<string | number | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Fetch all products
  const { data: products = [], isLoading, error } = useQuery({
    queryKey: ['/api/products'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/products', {
          credentials: 'include'
        });

        const responseData = await response.json();
        return responseData;
      } catch (err) {
        console.error('Error fetching products:', err);
        throw err;
      }
    },
    select: (data: Product[]) => {
      return data && Array.isArray(data)
        ? data.sort((a, b) => a.name.localeCompare(b.name))
        : [];
    }
  });

  // Fetch stock levels
  const { data: stockLevels = [] } = useQuery({
    queryKey: ['/api/products/stock-levels'],
    queryFn: () => productApi.getStockLevels()
  });

  // Mutation for updating stock level
  const updateStockLevel = useMutation({
    mutationFn: ({ productId, stockLevel }: { productId: string | number, stockLevel: StockLevel }) =>
      productApi.updateStockLevel(productId, stockLevel),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
    }
  });

  // Filter products based on search term and active tab
  const filteredProducts = Array.isArray(products)
    ? products.filter(product => {
        const matchesSearch = product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (product.category && product.category.toLowerCase().includes(searchTerm.toLowerCase()));

        if (activeTab === 'all') return matchesSearch;
        return matchesSearch && product.stockLevel === activeTab;
      })
    : [];

  // Handle stock level update
  const handleStockLevelUpdate = async (productId: string | number, newLevel: StockLevel) => {
    await updateStockLevel.mutateAsync({ productId, stockLevel: newLevel });
  };

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Product Management</h1>
        <p className="text-gray-500">Manage your products and inventory levels</p>
      </div>

      {/* Error Information */}
      {error && (
        <Card className="mb-6 bg-red-50 border-red-200">
          <CardContent className="pt-6">
            <h3 className="font-bold text-red-700 mb-2">Error Loading Products</h3>
            <pre className="text-sm bg-white p-4 rounded border overflow-auto max-h-40">
              {JSON.stringify(error, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

      <div className="mb-6 flex justify-between items-center">
        <Input
          placeholder="Search products..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <AddProductDialog />
      </div>

      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="all">All Products</TabsTrigger>
          <TabsTrigger value="none">No Stock</TabsTrigger>
          <TabsTrigger value="low">Low Stock</TabsTrigger>
          <TabsTrigger value="good">Good Stock</TabsTrigger>
          <TabsTrigger value="high">High Stock</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab}>
          <Card>
            <CardHeader>
              <CardTitle>Products</CardTitle>
              <CardDescription>
                {activeTab === 'all'
                  ? 'All products in your inventory'
                  : `Products with ${activeTab} stock level`
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p>Loading products...</p>
              ) : (
                <Table>
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
                    {filteredProducts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-4">
                          No products found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredProducts.map((product) => (
                        <TableRow
                          key={product.id || product._id}
                          className="cursor-pointer hover:bg-gray-50"
                          onClick={() => {
                            // Ensure we have a valid ID or null
                            const id = product.id || product._id;
                            setSelectedProductId(id !== undefined ? id : null);
                            setDialogOpen(true);
                          }}
                        >
                          <TableCell className="align-middle">
                            <div className="w-12 h-12 flex items-center justify-center bg-gray-100 rounded-lg border border-gray-200 overflow-hidden">
                              {(() => {
                                const sanitizedUrl = sanitizeImageUrl(product.imageUrl);
                                return sanitizedUrl ? (
                                  <img
                                    src={sanitizedUrl}
                                    alt={product.name}
                                    className="object-cover w-12 h-12 rounded-lg"
                                    width={48}
                                    height={48}
                                  />
                                ) : (
                                  <div className="w-12 h-12 flex items-center justify-center text-gray-300 bg-gray-50 rounded-lg">
                                    <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="w-6 h-6">
                                      <rect x="3" y="3" width="18" height="18" rx="4" stroke="currentColor" strokeWidth="2" fill="none" />
                                      <path d="M8 15l2.5-3 2.5 3 3.5-4.5L21 19H3l5-7z" stroke="currentColor" strokeWidth="2" fill="none" />
                                    </svg>
                                  </div>
                                );
                              })()}
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">{product.name}</TableCell>
                          <TableCell>{product.category || '-'}</TableCell>
                          <TableCell>{formatCurrency(product.price)}</TableCell>
                          <TableCell>
                            <StockLevelBadge level={product.stockLevel as StockLevel} />
                          </TableCell>
                          <TableCell>
                            <StockLevelSelector
                              productId={product.id || product._id || ''}
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

      {/* Product Details Dialog */}
      <ProductDetailsDialog
        productId={selectedProductId}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
}