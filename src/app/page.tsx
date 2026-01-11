import { verifyAuth } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function Home() {
  // Check if user is authenticated
  const auth = await verifyAuth();

  if (auth) {
    // User is authenticated, redirect to dashboard
    redirect('/dashboard');
  } else {
    // User is not authenticated, redirect to login
    redirect('/login');
  }
}
