import React from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Filter, CheckCircle } from "lucide-react";

interface FilterOptions {
  type: 'all' | 'messages' | 'stock' | 'orders' | 'notifications';
  status: 'all' | 'unread' | 'read' | 'active' | 'dismissed';
  priority: 'all' | 'low' | 'medium' | 'high' | 'urgent';
  dateRange: 'all' | 'today' | 'week' | 'month';
}

interface UpdatesFilterProps {
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
}

export function UpdatesFilter({ filters, onFiltersChange }: UpdatesFilterProps) {
  const hasActiveFilters = filters.type !== 'all' || 
                          filters.status !== 'all' || 
                          filters.priority !== 'all' || 
                          filters.dateRange !== 'all';

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.type !== 'all') count++;
    if (filters.status !== 'all') count++;
    if (filters.priority !== 'all') count++;
    if (filters.dateRange !== 'all') count++;
    return count;
  };

  const clearAllFilters = () => {
    onFiltersChange({
      type: 'all',
      status: 'all',
      priority: 'all',
      dateRange: 'all'
    });
  };

  const updateFilter = (key: keyof FilterOptions, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="relative">
          <Filter className="mr-2 h-4 w-4" />
          Filter
          {hasActiveFilters && (
            <Badge 
              variant="secondary" 
              className="ml-2 bg-primary text-white h-5 w-5 flex items-center justify-center rounded-full p-0 text-xs"
            >
              {getActiveFilterCount()}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64" align="end">
        <DropdownMenuLabel className="flex items-center justify-between">
          Filter Updates
          {hasActiveFilters && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={clearAllFilters}
              className="h-auto p-1 text-xs"
            >
              Clear All
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {/* Type Filter */}
        <DropdownMenuGroup>
          <DropdownMenuLabel className="text-xs font-medium text-gray-500">Type</DropdownMenuLabel>
          {[
            { value: 'all', label: 'All Types' },
            { value: 'messages', label: 'Messages' },
            { value: 'stock', label: 'Stock Alerts' },
            { value: 'orders', label: 'Orders' },
            { value: 'notifications', label: 'Notifications' }
          ].map((option) => (
            <DropdownMenuItem 
              key={option.value}
              onClick={() => updateFilter('type', option.value)}
              className="flex items-center justify-between"
            >
              {option.label}
              {filters.type === option.value && (
                <CheckCircle className="h-4 w-4 text-primary" />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
        
        <DropdownMenuSeparator />
        
        {/* Status Filter */}
        <DropdownMenuGroup>
          <DropdownMenuLabel className="text-xs font-medium text-gray-500">Status</DropdownMenuLabel>
          {[
            { value: 'all', label: 'All Status' },
            { value: 'unread', label: 'Unread/Active' },
            { value: 'read', label: 'Read/Dismissed' }
          ].map((option) => (
            <DropdownMenuItem 
              key={option.value}
              onClick={() => updateFilter('status', option.value)}
              className="flex items-center justify-between"
            >
              {option.label}
              {filters.status === option.value && (
                <CheckCircle className="h-4 w-4 text-primary" />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
        
        <DropdownMenuSeparator />
        
        {/* Priority Filter */}
        <DropdownMenuGroup>
          <DropdownMenuLabel className="text-xs font-medium text-gray-500">Priority</DropdownMenuLabel>
          {[
            { value: 'all', label: 'All Priorities' },
            { value: 'urgent', label: 'Urgent' },
            { value: 'high', label: 'High' },
            { value: 'medium', label: 'Medium' },
            { value: 'low', label: 'Low' }
          ].map((option) => (
            <DropdownMenuItem 
              key={option.value}
              onClick={() => updateFilter('priority', option.value)}
              className="flex items-center justify-between"
            >
              {option.label}
              {filters.priority === option.value && (
                <CheckCircle className="h-4 w-4 text-primary" />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
        
        <DropdownMenuSeparator />
        
        {/* Date Range Filter */}
        <DropdownMenuGroup>
          <DropdownMenuLabel className="text-xs font-medium text-gray-500">Date Range</DropdownMenuLabel>
          {[
            { value: 'all', label: 'All Time' },
            { value: 'today', label: 'Today' },
            { value: 'week', label: 'This Week' },
            { value: 'month', label: 'This Month' }
          ].map((option) => (
            <DropdownMenuItem 
              key={option.value}
              onClick={() => updateFilter('dateRange', option.value)}
              className="flex items-center justify-between"
            >
              {option.label}
              {filters.dateRange === option.value && (
                <CheckCircle className="h-4 w-4 text-primary" />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 