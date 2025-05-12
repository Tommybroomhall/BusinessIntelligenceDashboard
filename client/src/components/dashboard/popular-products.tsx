import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

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
}

export function PopularProducts({ 
  products, 
  title = "Popular Products" 
}: PopularProductsProps) {
  const [view, setView] = useState<"sales" | "earnings">("sales");
  
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
                    ? `${product.sold} sold` 
                    : `$${product.earnings.toLocaleString()}`
                  }
                </div>
                <div className="text-xs text-green-600">Active</div>
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
