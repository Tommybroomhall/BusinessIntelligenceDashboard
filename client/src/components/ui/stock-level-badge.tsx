import React from 'react';
import { Badge } from './badge';

type StockLevel = 'none' | 'low' | 'good' | 'high';

interface StockLevelBadgeProps {
  level: StockLevel;
}

export function StockLevelBadge({ level }: StockLevelBadgeProps) {
  const getVariant = (level: StockLevel) => {
    switch (level) {
      case 'none':
        return 'destructive';
      case 'low':
        return 'warning';
      case 'good':
        return 'secondary';
      case 'high':
        return 'success';
      default:
        return 'secondary';
    }
  };

  return (
    <Badge variant={getVariant(level)}>
      {level.charAt(0).toUpperCase() + level.slice(1)}
    </Badge>
  );
} 