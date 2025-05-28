import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a number as currency
 * @param value - The number to format as currency
 * @param options - Intl.NumberFormat options
 * @returns Formatted currency string
 */
export function formatCurrency(
  value: number,
  options: Intl.NumberFormatOptions = {}
): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...options
  }).format(value)
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
