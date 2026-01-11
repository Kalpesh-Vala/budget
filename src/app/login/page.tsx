'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Alert } from '@/components/common/Alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card';

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    checkIfLoggedIn();
  }, []);

  const checkIfLoggedIn = async () => {
    try {
      const response = await fetch('/api/auth/me');
      const data = await response.json();

      if (data.authenticated) {
        // User is already logged in, redirect to dashboard
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Auth check error:', error);
    } finally {
      setIsCheckingAuth(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Login failed');
        return;
      }

      setSuccess('Login successful! Redirecting...');
      setTimeout(() => router.push('/dashboard'), 1000);
    } catch (err) {
      setError('An error occurred. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center p-4">
      {isCheckingAuth ? (
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center py-8">
            <p className="text-gray-500">Checking authentication...</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Login to Budget Tracker</CardTitle>
          </CardHeader>
          <CardContent>
            {error && <Alert type="error" message={error} onClose={() => setError('')} />}
            {success && <Alert type="success" message={success} />}

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                type="email"
                name="email"
                placeholder="Email address"
                value={formData.email}
                onChange={handleChange}
                required
              />

              <Input
                type="password"
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                required
              />

              <Button type="submit" fullWidth loading={loading}>
                Login
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-gray-600 dark:text-gray-400">
                Don't have an account?{' '}
                <Link href="/register" className="text-blue-600 hover:underline font-semibold">
                  Register here
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
