'use client';

import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { Alert } from '@/components/common/Alert';
import { formatCurrency, getCurrentMonth, formatMonthLong } from '@/utils/formatting';
import { groupExpensesByCategory, calculateTotal } from '@/utils/calculations';

interface Expense {
  _id: string;
  date: string;
  category: string;
  amount: number;
}

interface MonthlyCost {
  _id: string;
  month: string;
  rent: number;
  electricity: number;
  gas: number;
  maintenance: number;
  other: number;
}

const VARIABLE_CATEGORIES = ['Grocery', 'Breakfast', 'Lunch', 'Dinner', 'Travel', 'Snacks', 'Personal', 'Shared', 'Extras'];
const FIXED_CATEGORIES = ['rent', 'electricity', 'gas', 'maintenance', 'other'];

export default function CategoryBudgetPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [monthlyCost, setMonthlyCost] = useState<MonthlyCost | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [fixedCostsForm, setFixedCostsForm] = useState({
    rent: 0,
    electricity: 0,
    gas: 0,
    maintenance: 0,
    other: 0,
  });

  useEffect(() => {
    fetchData();
  }, [selectedMonth]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch expenses
      const expRes = await fetch(`/api/expenses?month=${selectedMonth}`);
      const expData = await expRes.json();
      if (expRes.ok) {
        setExpenses(expData.expenses || []);
      }

      // Fetch monthly costs
      const costRes = await fetch(`/api/monthly-costs?month=${selectedMonth}`);
      const costData = await costRes.json();
      if (costRes.ok && costData.costs && costData.costs.length > 0) {
        const cost = costData.costs[0];
        setMonthlyCost(cost);
        setFixedCostsForm({
          rent: cost.rent || 0,
          electricity: cost.electricity || 0,
          gas: cost.gas || 0,
          maintenance: cost.maintenance || 0,
          other: cost.other || 0,
        });
      } else {
        setFixedCostsForm({
          rent: 0,
          electricity: 0,
          gas: 0,
          maintenance: 0,
          other: 0,
        });
      }

      setError('');
    } catch (err) {
      setError('Failed to load category budget data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFixedCostChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFixedCostsForm((prev) => ({ ...prev, [name]: parseFloat(value) || 0 }));
  };

  const handleSaveFixedCosts = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/monthly-costs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          month: selectedMonth,
          ...fixedCostsForm,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to save fixed costs');
        return;
      }

      setSuccess('Fixed costs updated successfully');
      setMonthlyCost(data.cost);
    } catch (err) {
      setError('An error occurred');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const variableExpenses = groupExpensesByCategory(expenses);
  const variableTotal = Object.values(variableExpenses).reduce(
    (sum, items) => sum + calculateTotal(items),
    0
  );

  const fixedTotal =
    fixedCostsForm.rent +
    fixedCostsForm.electricity +
    fixedCostsForm.gas +
    fixedCostsForm.maintenance +
    fixedCostsForm.other;

  const grandTotal = variableTotal + fixedTotal;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">Category Budget</h1>
          <p className="text-gray-600 dark:text-gray-400">Track your variable and fixed costs</p>
        </div>

        {error && <Alert type="error" message={error} onClose={() => setError('')} />}
        {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

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
              <p className="text-gray-600 dark:text-gray-400 mb-2">Variable Expenses</p>
              <p className="text-4xl font-bold text-blue-600">{formatCurrency(variableTotal)}</p>
            </div>
          </Card>

          <Card>
            <div className="text-center">
              <p className="text-gray-600 dark:text-gray-400 mb-2">Fixed Costs</p>
              <p className="text-4xl font-bold text-orange-600">{formatCurrency(fixedTotal)}</p>
            </div>
          </Card>

          <Card>
            <div className="text-center">
              <p className="text-gray-600 dark:text-gray-400 mb-2">Grand Total</p>
              <p className="text-4xl font-bold text-red-600">{formatCurrency(grandTotal)}</p>
            </div>
          </Card>
        </div>

        {/* Variable Expenses (Auto-calculated) */}
        <Card>
          <CardHeader>
            <CardTitle>Variable Expenses (Auto-calculated)</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-gray-500">Loading...</p>
            ) : Object.keys(variableExpenses).length === 0 ? (
              <p className="text-gray-500">No variable expenses this month</p>
            ) : (
              <div className="space-y-3">
                {VARIABLE_CATEGORIES.filter((cat) => variableExpenses[cat]).map((cat) => {
                  const items = variableExpenses[cat];
                  const total = calculateTotal(items);
                  return (
                    <div key={cat} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded">
                      <div>
                        <p className="font-medium">{cat}</p>
                        <p className="text-sm text-gray-500">{items.length} transactions</p>
                      </div>
                      <p className="font-semibold text-blue-600">{formatCurrency(total)}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Fixed Costs (User-entered) */}
        <Card>
          <CardHeader>
            <CardTitle>Fixed Monthly Costs</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveFixedCosts} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  type="number"
                  name="rent"
                  label="Rent (₹)"
                  value={fixedCostsForm.rent}
                  onChange={handleFixedCostChange}
                  step="0.01"
                />

                <Input
                  type="number"
                  name="electricity"
                  label="Electricity (₹)"
                  value={fixedCostsForm.electricity}
                  onChange={handleFixedCostChange}
                  step="0.01"
                />

                <Input
                  type="number"
                  name="gas"
                  label="Gas (₹)"
                  value={fixedCostsForm.gas}
                  onChange={handleFixedCostChange}
                  step="0.01"
                />

                <Input
                  type="number"
                  name="maintenance"
                  label="Maintenance (₹)"
                  value={fixedCostsForm.maintenance}
                  onChange={handleFixedCostChange}
                  step="0.01"
                />

                <Input
                  type="number"
                  name="other"
                  label="Other Fixed Costs (₹)"
                  value={fixedCostsForm.other}
                  onChange={handleFixedCostChange}
                  step="0.01"
                />
              </div>

              <Button type="submit" loading={submitting}>
                Save Fixed Costs
              </Button>
            </form>

            {/* Summary */}
            <div className="mt-6 space-y-2 p-4 bg-gray-100 dark:bg-gray-700 rounded">
              <div className="flex justify-between">
                <span>Rent</span>
                <span className="font-semibold">{formatCurrency(fixedCostsForm.rent)}</span>
              </div>
              <div className="flex justify-between">
                <span>Electricity</span>
                <span className="font-semibold">{formatCurrency(fixedCostsForm.electricity)}</span>
              </div>
              <div className="flex justify-between">
                <span>Gas</span>
                <span className="font-semibold">{formatCurrency(fixedCostsForm.gas)}</span>
              </div>
              <div className="flex justify-between">
                <span>Maintenance</span>
                <span className="font-semibold">{formatCurrency(fixedCostsForm.maintenance)}</span>
              </div>
              <div className="flex justify-between">
                <span>Other</span>
                <span className="font-semibold">{formatCurrency(fixedCostsForm.other)}</span>
              </div>
              <div className="border-t border-gray-300 dark:border-gray-600 pt-2 mt-2 flex justify-between font-bold">
                <span>Total Fixed</span>
                <span>{formatCurrency(fixedTotal)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
