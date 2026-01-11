import { NextRequest, NextResponse } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Routes that don't require authentication
const PUBLIC_ROUTES = ['/login', '/register', '/api/auth/login', '/api/auth/register'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('auth-token')?.value;
  const isAuthenticated = !!token && isValidToken(token);

  // Debug logging
  if (pathname === '/dashboard' || pathname === '/login') {
    console.log(`[Middleware] ${pathname} - Token present: ${!!token}, Valid: ${isAuthenticated}`);
  }

  // Allow public routes
  if (PUBLIC_ROUTES.some(route => pathname.startsWith(route))) {
    // If user is already authenticated and tries to access login/register, redirect to dashboard
    if (isAuthenticated && (pathname === '/login' || pathname === '/register')) {
      console.log(`[Middleware] Authenticated user trying to access ${pathname}, redirecting to dashboard`);
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.next();
  }

  // Root path - redirect to dashboard if authenticated, otherwise to login
  if (pathname === '/') {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Protected routes - require authentication
  const protectedRoutes = ['/dashboard', '/expenses', '/analytics', '/profile', '/category-budget', '/monthly-summary', '/api/expenses', '/api/monthly-costs'];
  
  if (protectedRoutes.some(route => pathname.startsWith(route))) {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

// Helper function to validate token - simplified for edge runtime
function isValidToken(token: string): boolean {
  if (!token) return false;
  
  // For edge runtime compatibility, just check if token exists and is not malformed
  // The actual JWT verification will happen on the server side in API routes
  try {
    const parts = token.split('.');
    return parts.length === 3; // JWT has 3 parts: header.payload.signature
  } catch (error) {
    console.log('[Middleware] Token format validation error');
    return false;
  }
}

// Configure which routes to apply middleware to
export const config = {
  matcher: [
    // Match all paths except static files and public assets
    '/((?!_next/static|_next/image|favicon.ico|public|manifest.json|browserconfig.xml).*)',
  ],
};
