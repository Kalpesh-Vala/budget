'use client';

import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card';
import { Table } from '@/components/common/Table';
import { Input } from '@/components/common/Input';
import { Alert } from '@/components/common/Alert';
import { formatCurrency, getCurrentMonth, formatMonthLong } from '@/utils/formatting';
import { groupExpensesByDayForSummary } from '@/utils/calculations';

interface Expense {
  _id: string;
  date: string;
  category: string;
  type: string;
  description: string;
  amount: number;
}

interface DaySummary {
  date: string;
  day: string;
  descriptions: string[];
  total: number;
}

export default function MonthlySummaryPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [summary, setSummary] = useState<DaySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchExpenses();
  }, [selectedMonth]);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/expenses?month=${selectedMonth}`);
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to fetch expenses');
        return;
      }

      const expenseList = data.expenses || [];
      setExpenses(expenseList);

      // Group by day
      const grouped = groupExpensesByDayForSummary(expenseList);
      setSummary(grouped);
      setError('');
    } catch (err) {
      setError('An error occurred while loading monthly summary');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const monthTotal = summary.reduce((sum, day) => sum + day.total, 0);

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">Monthly Summary</h1>
          <p className="text-gray-600 dark:text-gray-400">Auto-generated from your daily expenses</p>
        </div>

        {error && <Alert type="error" message={error} onClose={() => setError('')} />}

        {/* Month Selector */}
        <Card>
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <label className="font-semibold">Select Month:</label>
            <Input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="max-w-xs"
            />
            <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">
              {formatMonthLong(selectedMonth)}
            </p>
          </div>
        </Card>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <div className="text-center">
              <p className="text-gray-600 dark:text-gray-400 mb-2">Month Total</p>
              <p className="text-4xl font-bold text-blue-600">{formatCurrency(monthTotal)}</p>
            </div>
          </Card>

          <Card>
            <div className="text-center">
              <p className="text-gray-600 dark:text-gray-400 mb-2">Days with Expenses</p>
              <p className="text-4xl font-bold text-green-600">{summary.length}</p>
            </div>
          </Card>

          <Card>
            <div className="text-center">
              <p className="text-gray-600 dark:text-gray-400 mb-2">Average per Day</p>
              <p className="text-4xl font-bold text-purple-600">
                {formatCurrency(summary.length > 0 ? monthTotal / summary.length : 0)}
              </p>
            </div>
          </Card>
        </div>

        {/* Monthly Table */}
        <Card>
          <CardHeader>
            <CardTitle>Daily Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-gray-500">Loading summary...</p>
            ) : summary.length === 0 ? (
              <p className="text-gray-500">No expenses in this month</p>
            ) : (
              <Table
                columns={[
                  { key: 'date', label: 'Date' },
                  { key: 'day', label: 'Day' },
                  {
                    key: 'descriptions',
                    label: 'Combined Description',
                    render: (descriptions) => (
                      <div className="max-w-xs">
                        {descriptions.join(', ')}
                      </div>
                    ),
                  },
                  {
                    key: 'total',
                    label: 'Total Spent',
                    render: (val) => (
                      <span className="font-semibold text-blue-600">{formatCurrency(val)}</span>
                    ),
                  },
                ]}
                data={summary}
              />
            )}
          </CardContent>
        </Card>

        {/* Note */}
        <Card className="bg-blue-50 dark:bg-blue-900">
          <p className="text-gray-700 dark:text-gray-300">
            <strong>Note:</strong> This summary is automatically generated from your daily expenses. No manual input is required.
          </p>
        </Card>
      </div>
    </DashboardLayout>
  );
}
