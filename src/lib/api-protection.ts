import { NextRequest, NextResponse } from 'next/server';
import * as jwt from 'jsonwebtoken';

/**
 * API Route Protection - Middleware for API routes
 * Verify JWT and return user info or error
 */
export function protectApiRoute(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value;

  if (!token) {
    return {
      authenticated: false,
      userId: null,
      response: NextResponse.json(
        { error: 'Unauthorized - No token provided' },
        { status: 401 }
      ),
    };
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;

    return {
      authenticated: true,
      userId: payload.userId,
      response: null,
    };
  } catch (error) {
    return {
      authenticated: false,
      userId: null,
      response: NextResponse.json(
        { error: 'Unauthorized - Invalid token' },
        { status: 401 }
      ),
    };
  }
}
