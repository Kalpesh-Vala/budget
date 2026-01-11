import jwt, { JwtPayload } from 'jsonwebtoken';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRY = 7 * 24 * 60 * 60; // 7 days in seconds

export interface TokenPayload extends JwtPayload {
  userId: string;
  email: string;
}

/**
 * Create JWT token and set it in HTTP-only cookie
 */
export async function setAuthCookie(userId: string, email: string) {
  const payload: TokenPayload = {
    userId,
    email,
  };

  const token = jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRY,
  });

  const cookieStore = await cookies();
  cookieStore.set('auth-token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_APP_URL?.startsWith('https'),
    sameSite: 'lax',
    maxAge: JWT_EXPIRY,
    path: '/',
  });

  return token;
}

/**
 * Get token from cookies
 */
export async function getAuthToken(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value;
  return token || null;
}

/**
 * Verify JWT token and return payload
 */
export async function verifyAuth(): Promise<TokenPayload | null> {
  try {
    const token = await getAuthToken();
    if (!token) return null;

    const payload = jwt.verify(token, JWT_SECRET) as TokenPayload;
    return payload;
  } catch (error) {
    return null;
  }
}

/**
 * Clear auth cookie (logout)
 */
export async function clearAuthCookie() {
  const cookieStore = await cookies();
  cookieStore.delete('auth-token');
}
