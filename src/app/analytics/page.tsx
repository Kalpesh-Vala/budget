'use client';

import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card';
import { Input } from '@/components/common/Input';
import { Alert } from '@/components/common/Alert';
import { formatMonthLong, getCurrentMonth, getPreviousMonths } from '@/utils/formatting';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface Expense {
  _id: string;
  date: string;
  category: string;
  type: string;
  amount: number;
}

const COLORS = [
  '#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981',
  '#06B6D4', '#F97316', '#EF4444', '#6366F1', '#14B8A6',
];

export default function AnalyticsPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [typeData, setTypeData] = useState<any[]>([]);
  const [dailyData, setDailyData] = useState<any[]>([]);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, [selectedMonth]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/expenses?month=${selectedMonth}`);
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to fetch data');
        return;
      }

      const expenseList = data.expenses || [];
      setExpenses(expenseList);
      generateCharts(expenseList);
      setError('');
    } catch (err) {
      setError('An error occurred while loading analytics');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const generateCharts = (expenseList: Expense[]) => {
    // Category-wise breakdown
    const categoryMap: { [key: string]: number } = {};
    expenseList.forEach((exp) => {
      categoryMap[exp.category] = (categoryMap[exp.category] || 0) + exp.amount;
    });
    setCategoryData(Object.entries(categoryMap).map(([name, value]) => ({ name, value })));

    // Personal vs Shared
    const typeMap: { [key: string]: number } = {};
    expenseList.forEach((exp) => {
      typeMap[exp.type] = (typeMap[exp.type] || 0) + exp.amount;
    });
    setTypeData(
      Object.entries(typeMap).map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value,
      }))
    );

    // Daily spending
    const dailyMap: { [key: string]: number } = {};
    expenseList.forEach((exp) => {
      const dateStr = new Date(exp.date).toLocaleDateString('en-IN');
      dailyMap[dateStr] = (dailyMap[dateStr] || 0) + exp.amount;
    });
    setDailyData(
      Object.entries(dailyMap)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([date, total]) => ({ date, total }))
    );

    // Monthly trend (fetch previous months)
    fetchMonthlyTrend();
  };

  const fetchMonthlyTrend = async () => {
    try {
      const months = getPreviousMonths(6);
      const monthlyMap: { [key: string]: number } = {};

      for (const month of months) {
        const res = await fetch(`/api/expenses?month=${month}`);
        const data = await res.json();
        const total = (data.expenses || []).reduce((sum: number, exp: Expense) => sum + exp.amount, 0);
        monthlyMap[month] = total;
      }

      setMonthlyData(
        months
          .reverse()
          .map((month) => ({
            month: formatMonthLong(month),
            total: monthlyMap[month],
          }))
      );
    } catch (err) {
      console.error('Error fetching monthly trend:', err);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <p className="text-gray-500">Loading analytics...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">Analytics</h1>
          <p className="text-gray-600 dark:text-gray-400">Visual insights into your spending patterns</p>
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

        {/* Charts */}
        {expenses.length === 0 ? (
          <Card className="bg-blue-50 dark:bg-blue-900">
            <p className="text-center text-gray-700 dark:text-gray-300">
              No expenses to display. Add some expenses to see analytics!
            </p>
          </Card>
        ) : (
          <>
            {/* Category Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Spending by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ₹${value}`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {categoryData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `₹${value}`} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Personal vs Shared Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Personal vs Shared Expenses</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={typeData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ₹${value}`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {typeData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `₹${value}`} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Daily Spending Bar Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Daily Spending Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dailyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" angle={-45} textAnchor="end" height={80} />
                    <YAxis />
                    <Tooltip formatter={(value) => `₹${value}`} />
                    <Bar dataKey="total" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Monthly Trend Line Chart */}
            {monthlyData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Monthly Spending Trend (Last 6 Months)</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value) => `₹${value}`} />
                      <Legend />
                      <Line type="monotone" dataKey="total" stroke="#8B5CF6" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
