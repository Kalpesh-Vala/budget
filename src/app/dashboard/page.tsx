'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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

export default function Dashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<StatData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  useEffect(() => {
    // Check authentication first
    checkAuthAndFetchStats();
  }, []);

  const checkAuthAndFetchStats = async () => {
    try {
      // First check if user is authenticated
      const authResponse = await fetch('/api/auth/me');
      const authData = await authResponse.json();

      if (!authData.authenticated) {
        // Not authenticated, redirect to login
        router.push('/login');
        return;
      }

      // User is authenticated, fetch stats
      fetchStats();
    } catch (err) {
      console.error('Auth check error:', err);
      router.push('/login');
    } finally {
      setIsAuthChecking(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/expenses/stats');
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to fetch dashboard data');
        return;
      }

      setStats(data);
      setError('');
    } catch (err) {
      setError('An error occurred while loading dashboard');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (isAuthChecking || loading) {
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

        {error && <Alert type="error" message={error} onClose={() => setError('')} />}

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
              <p className="text-4xl font-bold text-green-600">{stats?.recent.length || 0}</p>
            </div>
          </Card>

          <Card>
            <div className="text-center">
              <p className="text-gray-600 dark:text-gray-400 mb-2">Categories</p>
              <p className="text-4xl font-bold text-purple-600">{stats?.categoryWise.length || 0}</p>
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
              {stats?.categoryWise.length === 0 ? (
                <p className="text-gray-500">No expenses yet</p>
              ) : (
                <div className="space-y-4">
                  {stats?.categoryWise.slice(0, 5).map((cat) => (
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
              {stats?.typeWise.length === 0 ? (
                <p className="text-gray-500">No expenses yet</p>
              ) : (
                <div className="space-y-4">
                  {stats?.typeWise.map((type) => (
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

        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.recent.length === 0 ? (
              <p className="text-gray-500 mb-4">No transactions yet</p>
            ) : (
              <div className="space-y-3">
                {stats?.recent.map((expense) => (
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
        {stats?.recent.length === 0 && (
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
