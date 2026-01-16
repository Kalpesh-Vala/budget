// middleware/idempotency.ts - Server-side idempotency middleware
import { NextRequest, NextResponse } from 'next/server';

// Simple in-memory store for development (replace with Upstash Redis in production)
const idempotencyStore = new Map<string, { response: any; timestamp: number }>();

// Clean up old entries every hour
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    const dayAgo = now - 86400000; // 24 hours
    
    for (const [key, value] of idempotencyStore.entries()) {
      if (value.timestamp < dayAgo) {
        idempotencyStore.delete(key);
      }
    }
  }, 3600000); // Every hour
}

/**
 * Idempotency middleware to prevent duplicate operations
 * 
 * Usage:
 * export async function POST(request: NextRequest) {
 *   return withIdempotency(request, async (req) => {
 *     // Your handler code here
 *   });
 * }
 */
export async function withIdempotency(
  request: NextRequest,
  handler: (req: NextRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  const method = request.method;

  // Only enforce idempotency for mutation operations
  if (!['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
    return handler(request);
  }

  const idempotencyKey = request.headers.get('X-Idempotency-Key');

  // Require idempotency key for mutations
  if (!idempotencyKey) {
    return NextResponse.json(
      { error: 'X-Idempotency-Key header is required for mutation operations' },
      { status: 400 }
    );
  }

  // Check if we've seen this request before
  const cached = idempotencyStore.get(idempotencyKey);

  if (cached) {
    console.log(`Idempotent replay for key: ${idempotencyKey}`);
    return NextResponse.json(cached.response, {
      status: 200,
      headers: {
        'X-Idempotent-Replay': 'true',
        'X-Cache': 'HIT',
      },
    });
  }

  // Execute the handler
  try {
    const response = await handler(request);

    // Cache successful responses (2xx status codes)
    if (response.status >= 200 && response.status < 300) {
      // Clone the response to read it
      const clonedResponse = response.clone();
      const responseData = await clonedResponse.json();

      // Store in cache (24 hour TTL)
      idempotencyStore.set(idempotencyKey, {
        response: responseData,
        timestamp: Date.now(),
      });

      return NextResponse.json(responseData, {
        status: response.status,
        headers: {
          'X-Idempotent-Replay': 'false',
        },
      });
    }

    return response;
  } catch (error) {
    console.error('Idempotency middleware error:', error);
    throw error;
  }
}

/**
 * Production version using Upstash Redis (uncomment when ready)
 */
/*
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL!,
  token: process.env.UPSTASH_REDIS_TOKEN!,
});

export async function withIdempotency(
  request: NextRequest,
  handler: (req: NextRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  const method = request.method;

  if (!['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
    return handler(request);
  }

  const idempotencyKey = request.headers.get('X-Idempotency-Key');

  if (!idempotencyKey) {
    return NextResponse.json(
      { error: 'X-Idempotency-Key header is required' },
      { status: 400 }
    );
  }

  // Check Redis cache
  const cacheKey = `idempotency:${idempotencyKey}`;
  const cachedResponse = await redis.get(cacheKey);

  if (cachedResponse) {
    return NextResponse.json(cachedResponse, {
      status: 200,
      headers: { 'X-Idempotent-Replay': 'true' },
    });
  }

  // Execute handler
  const response = await handler(request);

  // Cache successful responses for 24 hours
  if (response.status >= 200 && response.status < 300) {
    const clonedResponse = response.clone();
    const responseData = await clonedResponse.json();
    
    await redis.setex(cacheKey, 86400, responseData);
    
    return NextResponse.json(responseData, {
      status: response.status,
      headers: { 'X-Idempotent-Replay': 'false' },
    });
  }

  return response;
}
*/
