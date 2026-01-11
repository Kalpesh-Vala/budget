import { verifyAuth } from './auth';
import { redirect } from 'next/navigation';

/**
 * Protect routes - ensure user is authenticated
 * Use in layout or page components
 */
export async function requireAuth() {
  const auth = await verifyAuth();
  
  if (!auth) {
    redirect('/login');
  }
  
  return auth;
}

/**
 * Get current authenticated user ID
 */
export async function getCurrentUserId(): Promise<string | null> {
  const auth = await verifyAuth();
  return auth?.userId || null;
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const auth = await verifyAuth();
  return !!auth;
}
