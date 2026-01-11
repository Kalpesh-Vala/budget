'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Alert } from '@/components/common/Alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
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

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          confirmPassword: formData.confirmPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Registration failed');
        return;
      }

      setSuccess('Registration successful! Redirecting to dashboard...');
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
            <CardTitle>Create Account</CardTitle>
          </CardHeader>
          <CardContent>
            {error && <Alert type="error" message={error} onClose={() => setError('')} />}
            {success && <Alert type="success" message={success} />}

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                type="text"
                name="name"
                placeholder="Full name"
                value={formData.name}
                onChange={handleChange}
                required
              />

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
                placeholder="Password (min 6 characters)"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={6}
              />

              <Input
                type="password"
                name="confirmPassword"
                placeholder="Confirm password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />

              <Button type="submit" fullWidth loading={loading}>
                Create Account
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-gray-600 dark:text-gray-400">
                Already have an account?{' '}
                <Link href="/login" className="text-blue-600 hover:underline font-semibold">
                  Login here
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
