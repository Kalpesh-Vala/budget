'use client';

import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Select } from '@/components/common/Select';
import { Table } from '@/components/common/Table';
import { Alert } from '@/components/common/Alert';
import { formatCurrency, formatDate, getCurrentMonth, formatMonth } from '@/utils/formatting';
import { calculateTotal, filterExpensesByDate } from '@/utils/calculations';

interface Expense {
  _id: string;
  date: string;
  category: string;
  type: string;
  paymentMethod: string;
  description: string;
  amount: number;
}

const CATEGORIES = [
  'Grocery', 'Breakfast', 'Lunch', 'Dinner', 'Travel', 'Snacks', 'Personal', 'Shared', 'Extras'
];

const PAYMENT_METHODS = ['UPI', 'Cash', 'Card', 'Bank'];

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    category: '',
    type: 'personal',
    paymentMethod: '',
    description: '',
    amount: '',
  });

  useEffect(() => {
    setCurrentPage(1); // Reset to page 1 when month changes
    fetchExpenses(1);
  }, [selectedMonth]);

  const fetchExpenses = async (page: number = 1) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/expenses?month=${selectedMonth}&page=${page}&limit=10`);
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to fetch expenses');
        return;
      }

      setExpenses(data.expenses || []);
      setCurrentPage(data.pagination?.page || 1);
      setTotalPages(data.pagination?.pages || 1);
      setTotalExpenses(data.pagination?.total || 0);
      setError('');
    } catch (err) {
      setError('An error occurred while loading expenses');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.category || !formData.paymentMethod || !formData.description || !formData.amount) {
      setError('All fields are required');
      return;
    }

    setSubmitting(true);

    try {
      const method = editingId ? 'PUT' : 'POST';
      const url = editingId ? `/api/expenses/${editingId}` : '/api/expenses';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: formData.date,
          category: formData.category,
          type: formData.type,
          paymentMethod: formData.paymentMethod,
          description: formData.description,
          amount: parseFloat(formData.amount),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to save expense');
        return;
      }

      setSuccess(editingId ? 'Expense updated successfully' : 'Expense added successfully');
      fetchExpenses();
      resetForm();
    } catch (err) {
      setError('An error occurred');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this expense?')) return;

    try {
      const response = await fetch(`/api/expenses/${id}`, { method: 'DELETE' });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to delete expense');
        return;
      }

      setSuccess('Expense deleted successfully');
      fetchExpenses();
    } catch (err) {
      setError('An error occurred');
      console.error(err);
    }
  };

  const handleEdit = (expense: Expense) => {
    setEditingId(expense._id);
    setFormData({
      date: expense.date.split('T')[0],
      category: expense.category,
      type: expense.type,
      paymentMethod: expense.paymentMethod,
      description: expense.description,
      amount: expense.amount.toString(),
    });
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      date: new Date().toISOString().split('T')[0],
      category: '',
      type: 'personal',
      paymentMethod: '',
      description: '',
      amount: '',
    });
  };

  const todayExpenses = filterExpensesByDate(expenses, new Date(selectedDate));
  const dayTotal = calculateTotal(todayExpenses);

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">Daily Expenses</h1>
          <p className="text-gray-600 dark:text-gray-400">Track and manage your daily spending</p>
        </div>

        {error && <Alert type="error" message={error} onClose={() => setError('')} />}
        {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

        {/* Add/Edit Expense Form */}
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? 'Edit Expense' : 'Add New Expense'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleFormChange}
                  label="Date"
                />

                <Select
                  name="category"
                  value={formData.category}
                  onChange={handleFormChange}
                  label="Category"
                  options={CATEGORIES.map((cat) => ({ value: cat, label: cat }))}
                />

                <Select
                  name="type"
                  value={formData.type}
                  onChange={handleFormChange}
                  label="Type"
                  options={[
                    { value: 'personal', label: 'Personal' },
                    { value: 'shared', label: 'Shared' },
                  ]}
                />

                <Select
                  name="paymentMethod"
                  value={formData.paymentMethod}
                  onChange={handleFormChange}
                  label="Payment Method"
                  options={PAYMENT_METHODS.map((method) => ({ value: method, label: method }))}
                />
              </div>

              <Input
                type="text"
                name="description"
                value={formData.description}
                onChange={handleFormChange}
                label="Description"
                placeholder="e.g., Grocery shopping"
              />

              <Input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleFormChange}
                label="Amount (₹)"
                placeholder="0.00"
                step="0.01"
              />

              <div className="flex gap-2">
                <Button type="submit" loading={submitting}>
                  {editingId ? 'Update Expense' : 'Add Expense'}
                </Button>
                {editingId && (
                  <Button type="button" variant="secondary" onClick={resetForm}>
                    Cancel
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Summary Card */}
        <Card>
          <div className="text-center">
            <p className="text-gray-600 dark:text-gray-400 mb-2">Today's Total</p>
            <p className="text-4xl font-bold text-blue-600">{formatCurrency(dayTotal)}</p>
            <p className="text-sm text-gray-500 mt-2">{todayExpenses.length} transactions</p>
          </div>
        </Card>

        {/* Month Selector */}
        <div className="flex gap-4 items-center">
          <label className="font-semibold">Select Month:</label>
          <Input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
          />
        </div>

        {/* Date Selector for Today's View */}
        <div className="flex gap-4 items-center">
          <label className="font-semibold">Filter by Date:</label>
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>

        {/* Expenses Table */}
        <Card>
          <CardHeader>
            <CardTitle>
              All Expenses {totalExpenses > 0 && `(${totalExpenses} total)`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-gray-500">Loading expenses...</p>
            ) : expenses.length === 0 ? (
              <p className="text-gray-500">No expenses yet. Add one to get started!</p>
            ) : (
              <>
                <Table
                  columns={[
                    { key: 'date', label: 'Date', render: (val) => formatDate(val) },
                    { key: 'category', label: 'Category' },
                    { key: 'type', label: 'Type', render: (val) => val.charAt(0).toUpperCase() + val.slice(1) },
                    { key: 'paymentMethod', label: 'Method' },
                    { key: 'description', label: 'Description' },
                    { key: 'amount', label: 'Amount', render: (val) => formatCurrency(val) },
                    {
                      key: 'actions',
                      label: 'Actions',
                      render: (_, row: Expense) => (
                        <div className="flex gap-2">
                          <Button size="sm" variant="secondary" onClick={() => handleEdit(row)}>
                            Edit
                          </Button>
                          <Button size="sm" variant="danger" onClick={() => handleDelete(row._id)}>
                            Delete
                          </Button>
                        </div>
                      ),
                    },
                  ]}
                  data={expenses}
                />

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="mt-6 flex items-center justify-between">
                    <p className="text-sm text-gray-600">
                      Page {currentPage} of {totalPages} • Showing {expenses.length} of {totalExpenses} expenses
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => fetchExpenses(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        Previous
                      </Button>
                      {/* Page Numbers */}
                      <div className="flex gap-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                          <Button
                            key={page}
                            size="sm"
                            variant={page === currentPage ? 'primary' : 'secondary'}
                            onClick={() => fetchExpenses(page)}
                          >
                            {page}
                          </Button>
                        ))}
                      </div>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => fetchExpenses(currentPage + 1)}
                        disabled={currentPage === totalPages}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
