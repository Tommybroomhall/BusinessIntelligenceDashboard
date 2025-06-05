import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Currency settings interface
export interface CurrencySettings {
  code: string;
  symbol: string;
  locale: string;
}

// Default currency settings (fallback to GBP)
export const DEFAULT_CURRENCY: CurrencySettings = {
  code: 'GBP',
  symbol: '£',
  locale: 'en-GB'
};

/**
 * Format a number as currency using the provided currency settings
 * @param value - The number to format as currency
 * @param currencySettings - Currency settings (code, symbol, locale)
 * @param options - Additional Intl.NumberFormat options
 * @returns Formatted currency string
 */
export function formatCurrency(
  value: number,
  currencySettings: CurrencySettings = DEFAULT_CURRENCY,
  options: Intl.NumberFormatOptions = {}
): string {
  return new Intl.NumberFormat(currencySettings.locale, {
    style: 'currency',
    currency: currencySettings.code,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...options
  }).format(value)
}

/**
 * Format a number with just the currency symbol (no currency formatting)
 * @param value - The number to format
 * @param currencySettings - Currency settings
 * @returns Formatted string with currency symbol
 */
export function formatCurrencySymbol(
  value: number,
  currencySettings: CurrencySettings = DEFAULT_CURRENCY
): string {
  return `${currencySettings.symbol}${value.toLocaleString(currencySettings.locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Format a date string
 * @param dateString - The date string to format
 * @returns Formatted date string
 */
export function formatDate(dateString: string): string {
  if (!dateString) return 'N/A';

  const date = new Date(dateString);

  // Check if date is valid
  if (isNaN(date.getTime())) return 'Invalid date';

  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Get the appropriate currency icon component name based on currency code
 * @param currencyCode - The ISO 4217 currency code (e.g., 'USD', 'GBP', 'EUR')
 * @returns The corresponding Lucide icon component name
 */
export function getCurrencyIconName(currencyCode: string): string {
  const currencyIcons: Record<string, string> = {
    USD: 'DollarSign',
    GBP: 'PoundSterling',
    EUR: 'Euro',
    JPY: 'JapaneseYen',
    CAD: 'DollarSign',
    AUD: 'DollarSign',
    CHF: 'SwissFranc',
    CNY: 'JapaneseYen',
    INR: 'IndianRupee',
    KRW: 'JapaneseYen',
    BRL: 'DollarSign',
    MXN: 'DollarSign',
    RUB: 'RussianRuble',
    ZAR: 'DollarSign',
    // Add more currencies as needed
  };

  return currencyIcons[currencyCode.toUpperCase()] || 'DollarSign';
}
