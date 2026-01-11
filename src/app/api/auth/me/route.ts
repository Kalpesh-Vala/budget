import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth();

    if (!auth) {
      return NextResponse.json(
        { authenticated: false },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        authenticated: true,
        user: {
          id: auth.userId,
          email: auth.email,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { authenticated: false },
      { status: 200 }
    );
  }
}
