'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card';
import { Alert } from '@/components/common/Alert';
import { Button } from '@/components/common/Button';
import { formatCurrency } from '@/utils/formatting';
import Link from 'next/link';

interface StatData {
  categoryWise: Array<{ _id: string; total: number; count: number }>;
  typeWise: Array<{ _id: string; total: number }>;
  recent: Array<{
    _id: string;
    category: string;
    amount: number;
    description: string;
    date: string;
  }>;
  monthlyTotal: number;
}

// Lazy load chart components
const RecentTransactionsList = dynamic(() => import('@/components/dashboard/RecentTransactionsList'), {
  loading: () => <div className="text-gray-500">Loading transactions...</div>,
  ssr: false,
});

export default function Dashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<StatData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Single combined fetch that checks auth and gets stats in one call
  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Make both requests in parallel
      const [authResponse, statsResponse] = await Promise.all([
        fetch('/api/auth/me', { cache: 'no-store' }),
        fetch('/api/expenses/stats', { cache: 'no-store' }),
      ]);

      // Check authentication
      const authData = await authResponse.json();
      if (!authData.authenticated) {
        router.push('/login');
        return;
      }

      // Get stats
      const statsData = await statsResponse.json();
      if (!statsResponse.ok) {
        setError(statsData.error || 'Failed to fetch dashboard data');
        return;
      }

      setStats(statsData);
      setError('');
    } catch (err) {
      console.error('Dashboard fetch error:', err);
      setError('An error occurred while loading dashboard');
    } finally {
      setLoading(false);
    }
  }, [router]);

  // Memoize computed values to prevent unnecessary recalculations
  const topCategories = useMemo(() => {
    return stats?.categoryWise.slice(0, 5) || [];
  }, [stats?.categoryWise]);

  const expenseTypes = useMemo(() => {
    return stats?.typeWise || [];
  }, [stats?.typeWise]);

  const recentTransactions = useMemo(() => {
    return stats?.recent || [];
  }, [stats?.recent]);

  const handleCloseAlert = useCallback(() => {
    setError('');
  }, []);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <p className="text-gray-500">Loading dashboard...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">Welcome back! Here's your financial overview.</p>
        </div>

        {error && <Alert type="error" message={error} onClose={handleCloseAlert} />}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <div className="text-center">
              <p className="text-gray-600 dark:text-gray-400 mb-2">This Month's Total</p>
              <p className="text-4xl font-bold text-blue-600">{formatCurrency(stats?.monthlyTotal || 0)}</p>
            </div>
          </Card>

          <Card>
            <div className="text-center">
              <p className="text-gray-600 dark:text-gray-400 mb-2">Transactions</p>
              <p className="text-4xl font-bold text-green-600">{recentTransactions.length}</p>
            </div>
          </Card>

          <Card>
            <div className="text-center">
              <p className="text-gray-600 dark:text-gray-400 mb-2">Categories</p>
              <p className="text-4xl font-bold text-purple-600">{topCategories.length}</p>
            </div>
          </Card>
        </div>

        {/* Category Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Top Categories</CardTitle>
            </CardHeader>
            <CardContent>
              {topCategories.length === 0 ? (
                <p className="text-gray-500">No expenses yet</p>
              ) : (
                <div className="space-y-4">
                  {topCategories.map((cat) => (
                    <div key={cat._id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{cat._id}</p>
                        <p className="text-sm text-gray-500">{cat.count} transactions</p>
                      </div>
                      <p className="font-semibold text-blue-600">{formatCurrency(cat.total)}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Expense Types</CardTitle>
            </CardHeader>
            <CardContent>
              {expenseTypes.length === 0 ? (
                <p className="text-gray-500">No expenses yet</p>
              ) : (
                <div className="space-y-4">
                  {expenseTypes.map((type) => (
                    <div key={type._id} className="flex items-center justify-between">
                      <p className="font-medium capitalize">{type._id}</p>
                      <p className="font-semibold text-blue-600">{formatCurrency(type.total)}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Transactions - Lazy loaded */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            {recentTransactions.length === 0 ? (
              <p className="text-gray-500 mb-4">No transactions yet</p>
            ) : (
              <div className="space-y-3">
                {recentTransactions.map((expense) => (
                  <div key={expense._id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded">
                    <div>
                      <p className="font-medium">{expense.description}</p>
                      <p className="text-sm text-gray-500">{expense.category}</p>
                    </div>
                    <p className="font-semibold text-blue-600">{formatCurrency(expense.amount)}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Call to Action */}
        {recentTransactions.length === 0 && (
          <Card className="bg-blue-50 dark:bg-blue-900">
            <div className="text-center">
              <p className="text-gray-700 dark:text-gray-300 mb-4">Start tracking your expenses to see insights</p>
              <Link href="/expenses">
                <Button>Add Your First Expense</Button>
              </Link>
            </div>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
