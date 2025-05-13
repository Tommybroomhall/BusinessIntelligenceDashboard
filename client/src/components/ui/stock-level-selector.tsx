import React, { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
import { Button } from './button';
import { useToast } from '@/hooks/use-toast';

type StockLevel = 'none' | 'low' | 'good' | 'high';

interface StockLevelSelectorProps {
  productId: number;
  currentLevel: StockLevel;
  onUpdate: (newLevel: StockLevel) => Promise<void>;
}

export function StockLevelSelector({ productId, currentLevel, onUpdate }: StockLevelSelectorProps) {
  const [level, setLevel] = useState<StockLevel>(currentLevel);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleUpdate = async () => {
    if (level === currentLevel) return;
    
    setIsLoading(true);
    try {
      await onUpdate(level);
      toast({
        title: "Stock level updated",
        description: `Stock level has been set to ${level}`,
        variant: "success",
      });
    } catch (error) {
      console.error("Failed to update stock level:", error);
      toast({
        title: "Update failed",
        description: "Failed to update stock level. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Select value={level} onValueChange={(value) => setLevel(value as StockLevel)}>
        <SelectTrigger className="w-32">
          <SelectValue placeholder="Select level" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">None</SelectItem>
          <SelectItem value="low">Low</SelectItem>
          <SelectItem value="good">Good</SelectItem>
          <SelectItem value="high">High</SelectItem>
        </SelectContent>
      </Select>
      
      <Button 
        variant="outline" 
        size="sm"
        disabled={level === currentLevel || isLoading}
        onClick={handleUpdate}
      >
        {isLoading ? "Updating..." : "Update"}
      </Button>
    </div>
  );
} 