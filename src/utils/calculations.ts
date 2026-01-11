import { parseISO, isSameDay } from 'date-fns';
import { formatMonth } from './formatting';

export interface ExpenseData {
  _id: string;
  date: string | Date;
  category: string;
  type: string;
  amount: number;
  description: string;
  paymentMethod: string;
}

/**
 * Group expenses by date
 */
export function groupExpensesByDate(expenses: ExpenseData[]) {
  const grouped: { [key: string]: ExpenseData[] } = {};

  expenses.forEach((expense) => {
    const date = typeof expense.date === 'string' ? expense.date.split('T')[0] : expense.date.toISOString().split('T')[0];
    
    if (!grouped[date]) {
      grouped[date] = [];
    }
    grouped[date].push(expense);
  });

  return grouped;
}

/**
 * Group expenses by category
 */
export function groupExpensesByCategory(expenses: ExpenseData[]) {
  const grouped: { [key: string]: ExpenseData[] } = {};

  expenses.forEach((expense) => {
    const category = expense.category;
    if (!grouped[category]) {
      grouped[category] = [];
    }
    grouped[category].push(expense);
  });

  return grouped;
}

/**
 * Calculate total expenses
 */
export function calculateTotal(expenses: ExpenseData[]): number {
  return expenses.reduce((sum, expense) => sum + expense.amount, 0);
}

/**
 * Filter expenses by month
 */
export function filterExpensesByMonth(expenses: ExpenseData[], monthStr: string) {
  return expenses.filter((expense) => {
    const expenseMonth = typeof expense.date === 'string' 
      ? formatMonth(expense.date) 
      : formatMonth(expense.date);
    return expenseMonth === monthStr;
  });
}

/**
 * Filter expenses by date
 */
export function filterExpensesByDate(expenses: ExpenseData[], date: Date) {
  return expenses.filter((expense) => {
    const expenseDate = typeof expense.date === 'string' 
      ? parseISO(expense.date) 
      : expense.date as Date;
    return isSameDay(expenseDate, date);
  });
}

/**
 * Filter expenses by type (personal/shared)
 */
export function filterExpensesByType(expenses: ExpenseData[], type: 'personal' | 'shared') {
  return expenses.filter((expense) => expense.type === type);
}

/**
 * Group expenses by day for monthly summary
 */
export function groupExpensesByDayForSummary(expenses: ExpenseData[]) {
  const grouped: {
    [key: string]: {
      date: string;
      day: string;
      descriptions: string[];
      total: number;
    };
  } = {};

  expenses.forEach((expense) => {
    const dateStr = typeof expense.date === 'string' 
      ? expense.date.split('T')[0] 
      : expense.date.toISOString().split('T')[0];
    
    if (!grouped[dateStr]) {
      const date = new Date(dateStr);
      const dayName = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(date);
      
      grouped[dateStr] = {
        date: dateStr,
        day: dayName,
        descriptions: [],
        total: 0,
      };
    }

    grouped[dateStr].descriptions.push(expense.description);
    grouped[dateStr].total += expense.amount;
  });

  return Object.values(grouped).sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}
