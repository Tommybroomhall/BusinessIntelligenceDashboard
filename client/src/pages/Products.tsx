import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productApi, type Product, type StockLevel } from '../lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { StockLevelBadge } from '../components/ui/stock-level-badge';
import { StockLevelSelector } from '../components/ui/stock-level-selector';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { formatCurrency } from '../lib/utils';

export default function ProductsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<string>('all');
  const queryClient = useQueryClient();

  // Fetch all products
  const { data: products = [], isLoading } = useQuery({
    queryKey: ['/api/products'],
    select: (data: Product[]) => data.sort((a, b) => a.name.localeCompare(b.name))
  });

  // Fetch stock levels
  const { data: stockLevels = [] } = useQuery({
    queryKey: ['/api/products/stock-levels']
  });

  // Mutation for updating stock level
  const updateStockLevel = useMutation({
    mutationFn: ({ productId, stockLevel }: { productId: number, stockLevel: StockLevel }) => 
      productApi.updateStockLevel(productId, stockLevel),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
    }
  });

  // Filter products based on search term and active tab
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (product.category && product.category.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (activeTab === 'all') return matchesSearch;
    return matchesSearch && product.stockLevel === activeTab;
  });

  // Handle stock level update
  const handleStockLevelUpdate = async (productId: number, newLevel: StockLevel) => {
    await updateStockLevel.mutateAsync({ productId, stockLevel: newLevel });
  };

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Product Management</h1>
        <p className="text-gray-500">Manage your products and inventory levels</p>
      </div>

      <div className="mb-6 flex justify-between items-center">
        <Input 
          placeholder="Search products..." 
          value={searchTerm} 
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
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
                      <TableHead>Product Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Stock Level</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-4">
                          No products found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredProducts.map((product) => (
                        <TableRow key={product.id}>
                          <TableCell className="font-medium">{product.name}</TableCell>
                          <TableCell>{product.category || '-'}</TableCell>
                          <TableCell>{formatCurrency(product.price)}</TableCell>
                          <TableCell>
                            <StockLevelBadge level={product.stockLevel as StockLevel} />
                          </TableCell>
                          <TableCell>
                            <StockLevelSelector 
                              productId={product.id}
                              currentLevel={product.stockLevel as StockLevel}
                              onUpdate={(newLevel) => handleStockLevelUpdate(product.id, newLevel)}
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
    </div>
  );
} 