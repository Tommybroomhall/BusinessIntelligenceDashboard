import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useCurrencyFormatter } from "@/context/CurrencyContext";

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  imageUrl: string;
  sold: number;
  earnings: number;
}

interface PopularProductsProps {
  products: Product[];
  title?: string;
  isLoading?: boolean;
}

export function PopularProducts({ 
  products, 
  title = "Popular Products",
  isLoading = false
}: PopularProductsProps) {
  const [view, setView] = useState<"sales" | "earnings">("sales");
  const { formatCurrency } = useCurrencyFormatter();
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg font-medium">{title}</CardTitle>
          <Tabs defaultValue="sales">
            <TabsList>
              <TabsTrigger value="sales">Sales</TabsTrigger>
              <TabsTrigger value="earnings">Earnings</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="flex items-center px-2 py-3 rounded-lg animate-pulse">
                <div className="w-12 h-12 bg-gray-300 rounded-md"></div>
                <div className="ml-4 flex-1">
                  <div className="h-4 bg-gray-300 rounded w-3/4 mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
                <div className="text-right">
                  <div className="h-4 bg-gray-300 rounded w-16 mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded w-12"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-medium">{title}</CardTitle>
        <Tabs 
          defaultValue="sales" 
          value={view} 
          onValueChange={(v) => setView(v as "sales" | "earnings")}
        >
          <TabsList>
            <TabsTrigger value="sales">Sales</TabsTrigger>
            <TabsTrigger value="earnings">Earnings</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {products.map((product) => (
            <div key={product.id} className="flex items-center px-2 py-3 hover:bg-gray-50 rounded-lg">
              <img 
                src={product.imageUrl} 
                alt={product.name} 
                className="w-12 h-12 object-cover rounded-md"
              />
              <div className="ml-4 flex-1">
                <h4 className="text-sm font-medium text-gray-900">{product.name}</h4>
                <p className="text-xs text-gray-500">{product.category}</p>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900">
                  {view === "sales" 
                    ? `${product.sold.toLocaleString()} sold` 
                    : formatCurrency(product.earnings)
                  }
                </div>
                <div className="text-xs text-green-600">
                  {product.sold > 0 ? 'Popular' : 'No sales'}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-6 text-center">
          <Button>
            View All Products
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
