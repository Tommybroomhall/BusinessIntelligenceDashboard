import React from 'react';
import { Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { productApi, type Product, type StockLevel } from '../../lib/api';
import { Progress } from '../ui/progress';

export function StockLevelWidget() {
  // Fetch all products to calculate stock level distribution
  const { data: products = [], isLoading } = useQuery({
    queryKey: ['/api/products'],
  });

  // Calculate stock level counts
  const stockLevelCounts = products.reduce(
    (acc, product) => {
      acc[product.stockLevel as StockLevel]++;
      return acc;
    },
    { none: 0, low: 0, good: 0, high: 0 } as Record<StockLevel, number>
  );

  // Calculate percentages
  const total = products.length || 1; // Avoid division by zero
  const stockLevelPercentages = {
    none: Math.round((stockLevelCounts.none / total) * 100),
    low: Math.round((stockLevelCounts.low / total) * 100),
    good: Math.round((stockLevelCounts.good / total) * 100),
    high: Math.round((stockLevelCounts.high / total) * 100),
  };

  // Format level data for display
  const stockLevelData = [
    { level: 'none' as const, label: 'No Stock', count: stockLevelCounts.none, color: 'bg-red-500' },
    { level: 'low' as const, label: 'Low Stock', count: stockLevelCounts.low, color: 'bg-yellow-500' },
    { level: 'good' as const, label: 'Good Stock', count: stockLevelCounts.good, color: 'bg-blue-500' },
    { level: 'high' as const, label: 'High Stock', count: stockLevelCounts.high, color: 'bg-green-500' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Inventory Status</CardTitle>
        <CardDescription>Current stock level distribution of products</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p>Loading stock levels...</p>
        ) : (
          <div className="space-y-4">
            {stockLevelData.map((item) => (
              <div key={item.level} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{item.label}</span>
                  <span className="text-sm text-muted-foreground">
                    {item.count} products ({stockLevelPercentages[item.level]}%)
                  </span>
                </div>
                <Progress value={stockLevelPercentages[item.level]} className={item.color} />
              </div>
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Link href="/products" className="text-sm text-blue-500 hover:underline">
          Manage inventory →
        </Link>
      </CardFooter>
    </Card>
  );
} 