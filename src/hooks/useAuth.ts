'use client';

import { useEffect, useState } from 'react';

export interface User {
  id: string;
  email: string;
  name?: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const response = await fetch('/api/auth/me');
      const data = await response.json();

      if (data.authenticated) {
        setAuthenticated(true);
        setUser(data.user);
      } else {
        setAuthenticated(false);
        setUser(null);
      }
    } catch (error) {
      setAuthenticated(false);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setAuthenticated(false);
      setUser(null);
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }

  return { user, loading, authenticated, logout, checkAuth };
}
