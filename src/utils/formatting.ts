import { format, parse, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';

/**
 * Format currency
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format date as DD/MM/YYYY
 */
export function formatDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, 'dd/MM/yyyy');
}

/**
 * Format date as YYYY-MM (for month comparisons)
 */
export function formatMonth(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, 'yyyy-MM');
}

/**
 * Format date as readable month (January 2024)
 */
export function formatMonthLong(monthStr: string): string {
  const [year, month] = monthStr.split('-');
  const date = new Date(Number(year), Number(month) - 1);
  return format(date, 'MMMM yyyy');
}

/**
 * Get day name from date
 */
export function getDayName(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, 'eeee');
}

/**
 * Get all days in a month
 */
export function getDaysInMonth(monthStr: string): Date[] {
  const [year, month] = monthStr.split('-');
  const date = new Date(Number(year), Number(month) - 1);
  const start = startOfMonth(date);
  const end = endOfMonth(date);
  return eachDayOfInterval({ start, end });
}

/**
 * Get current month in YYYY-MM format
 */
export function getCurrentMonth(): string {
  return format(new Date(), 'yyyy-MM');
}

/**
 * Parse YYYY-MM format to Date
 */
export function parseMonth(monthStr: string): Date {
  const [year, month] = monthStr.split('-');
  return new Date(Number(year), Number(month) - 1);
}

/**
 * Get previous N months
 */
export function getPreviousMonths(count: number): string[] {
  const months: string[] = [];
  const today = new Date();

  for (let i = 0; i < count; i++) {
    const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
    months.push(format(date, 'yyyy-MM'));
  }

  return months;
}
