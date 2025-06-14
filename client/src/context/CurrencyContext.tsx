import React, { createContext, useContext, useEffect, useState } from 'react';
import { CurrencySettings, DEFAULT_CURRENCY, getCurrencyIconName } from '../lib/utils';
import { useQuery } from '@tanstack/react-query';
import {
  DollarSign,
  PoundSterling,
  Euro,
  JapaneseYen,
  SwissFranc,
  IndianRupee,
  RussianRuble,
} from 'lucide-react';

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
      const response = await fetch('/api/tenant');
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
    } else if (tenant) {
      // Fallback for tenants without currency settings (e.g., older data)
      console.warn('Tenant missing currency settings, using defaults');
      setCurrencySettings(DEFAULT_CURRENCY);
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

  /**
   * Get the appropriate currency icon component based on current currency settings
   * @param className - CSS classes to apply to the icon
   * @returns React component for the currency icon
   */
  const getCurrencyIcon = (className: string = "h-5 w-5"): React.ReactNode => {
    const iconName = getCurrencyIconName(currencySettings.code);
    
    const iconComponents: Record<string, React.ComponentType<{ className?: string }>> = {
      DollarSign,
      PoundSterling,
      Euro,
      JapaneseYen,
      SwissFranc,
      IndianRupee,
      RussianRuble,
    };

    const IconComponent = iconComponents[iconName] || DollarSign;
    return <IconComponent className={className} />;
  };

  return { formatCurrency, formatCurrencySymbol, currencySettings, getCurrencyIcon };
} 