import React, { createContext, useContext, useEffect, useState } from 'react';
import { CurrencySettings, DEFAULT_CURRENCY } from '../lib/utils';
import { useQuery } from '@tanstack/react-query';

interface CurrencyContextType {
  currencySettings: CurrencySettings;
  isLoading: boolean;
  error: string | null;
  refreshCurrency: () => void;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

interface CurrencyProviderProps {
  children: React.ReactNode;
}

export function CurrencyProvider({ children }: CurrencyProviderProps) {
  const [currencySettings, setCurrencySettings] = useState<CurrencySettings>(DEFAULT_CURRENCY);

  // Fetch tenant information to get currency settings
  const { data: tenant, isLoading, error, refetch } = useQuery({
    queryKey: ['tenant'],
    queryFn: async () => {
      const response = await fetch('/api/tenants');
      if (!response.ok) {
        throw new Error('Failed to fetch tenant information');
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });

  // Update currency settings when tenant data changes
  useEffect(() => {
    if (tenant && tenant.currencyCode && tenant.currencySymbol && tenant.currencyLocale) {
      setCurrencySettings({
        code: tenant.currencyCode,
        symbol: tenant.currencySymbol,
        locale: tenant.currencyLocale,
      });
    }
  }, [tenant]);

  const refreshCurrency = () => {
    refetch();
  };

  const value: CurrencyContextType = {
    currencySettings,
    isLoading,
    error: error?.message || null,
    refreshCurrency,
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency(): CurrencyContextType {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}

// Hook specifically for formatting currency with current settings
export function useCurrencyFormatter() {
  const { currencySettings } = useCurrency();
  
  const formatCurrency = (value: number, options?: Intl.NumberFormatOptions): string => {
    return new Intl.NumberFormat(currencySettings.locale, {
      style: 'currency',
      currency: currencySettings.code,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      ...options
    }).format(value);
  };

  const formatCurrencySymbol = (value: number): string => {
    return `${currencySettings.symbol}${value.toLocaleString(currencySettings.locale, { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })}`;
  };

  return { formatCurrency, formatCurrencySymbol, currencySettings };
} 