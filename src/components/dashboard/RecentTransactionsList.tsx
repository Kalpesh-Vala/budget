import React, { memo } from 'react';
import { formatCurrency } from '@/utils/formatting';

interface Expense {
  _id: string;
  category: string;
  amount: number;
  description: string;
  date: string;
}

interface RecentTransactionsListProps {
  transactions: Expense[];
}

// Memoize individual transaction item for better performance
const TransactionItem = memo(({ expense }: { expense: Expense }) => (
  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded">
    <div>
      <p className="font-medium">{expense.description}</p>
      <p className="text-sm text-gray-500">{expense.category}</p>
    </div>
    <p className="font-semibold text-blue-600">{formatCurrency(expense.amount)}</p>
  </div>
));

TransactionItem.displayName = 'TransactionItem';

// Memoize the entire list component
const RecentTransactionsList = memo(({ transactions }: RecentTransactionsListProps) => {
  if (transactions.length === 0) {
    return <p className="text-gray-500 mb-4">No transactions yet</p>;
  }

  return (
    <div className="space-y-3">
      {transactions.map((expense) => (
        <TransactionItem key={expense._id} expense={expense} />
      ))}
    </div>
  );
});

RecentTransactionsList.displayName = 'RecentTransactionsList';

export default RecentTransactionsList;
