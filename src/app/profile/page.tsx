'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Alert } from '@/components/common/Alert';
import { useAuth } from '@/hooks/useAuth';

export default function ProfilePage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    await logout();
    router.push('/login');
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">Profile & Settings</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage your account and preferences</p>
        </div>

        {/* User Info */}
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400">Email Address</label>
                <p className="text-lg font-medium">{user?.email}</p>
              </div>

              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400">Account Type</label>
                <p className="text-lg font-medium">Standard</p>
              </div>

              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400">Member Since</label>
                <p className="text-lg font-medium">{new Date().toLocaleDateString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Features Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Features</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 bg-green-50 dark:bg-green-900 rounded">
                <p className="font-semibold text-green-900 dark:text-green-100">✓ Daily Expense Tracking</p>
              </div>
              <div className="p-3 bg-green-50 dark:bg-green-900 rounded">
                <p className="font-semibold text-green-900 dark:text-green-100">✓ Monthly Summaries</p>
              </div>
              <div className="p-3 bg-green-50 dark:bg-green-900 rounded">
                <p className="font-semibold text-green-900 dark:text-green-100">✓ Category Budgeting</p>
              </div>
              <div className="p-3 bg-green-50 dark:bg-green-900 rounded">
                <p className="font-semibold text-green-900 dark:text-green-100">✓ Analytics & Charts</p>
              </div>
              <div className="p-3 bg-green-50 dark:bg-green-900 rounded">
                <p className="font-semibold text-green-900 dark:text-green-100">✓ Fixed Cost Management</p>
              </div>
              <div className="p-3 bg-green-50 dark:bg-green-900 rounded">
                <p className="font-semibold text-green-900 dark:text-green-100">✓ Responsive Design</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security Section */}
        <Card>
          <CardHeader>
            <CardTitle>Security</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-gray-600 dark:text-gray-400">
                Your password is securely hashed using bcrypt. Your auth token is stored in a secure HTTP-only cookie and expires after 7 days of inactivity.
              </p>
              <div className="p-4 bg-blue-50 dark:bg-blue-900 rounded border border-blue-200 dark:border-blue-700">
                <p className="text-sm text-blue-900 dark:text-blue-100">
                  <strong>Note:</strong> If you want to change your password, please contact support or logout and use password recovery if available.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data & Privacy */}
        <Card>
          <CardHeader>
            <CardTitle>Data & Privacy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-gray-600 dark:text-gray-400">
                All your data is stored securely in MongoDB Atlas. We use encryption and follow security best practices to protect your financial information.
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                <li>Your data is only visible to you</li>
                <li>No tracking or analytics on your spending</li>
                <li>All API requests are authenticated</li>
                <li>HTTPS encryption in production</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Logout Section */}
        <Card className="border-red-200 dark:border-red-800">
          <CardHeader>
            <CardTitle className="text-red-600">Logout</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              You'll be logged out and your session will be cleared.
            </p>
            <Button variant="danger" loading={loggingOut} onClick={handleLogout}>
              Logout from Account
            </Button>
          </CardContent>
        </Card>

        {/* Support Info */}
        <Card className="bg-gray-100 dark:bg-gray-700">
          <CardHeader>
            <CardTitle>Need Help?</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 dark:text-gray-300">
              If you have any questions or issues, please check the documentation or contact our support team.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
