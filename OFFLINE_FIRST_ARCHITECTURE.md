# 🚀 Offline-First Budget Tracker Architecture
## Production-Ready Implementation Guide

---

## 📊 Executive Summary

This document provides a **production-ready architecture** for upgrading your budget tracker to a **lightning-fast, offline-first, mobile-optimized** application that works seamlessly on Vercel free tier with 10-15 concurrent users.

**Key Improvements:**
- ⚡ **Instant UI updates** (0ms perceived latency)
- 📱 **True offline support** with background sync
- 🔄 **Zero duplicate entries** with idempotency
- 🎯 **Mobile-optimized** (low memory footprint)
- 🔒 **Safe concurrent operations**
- 💰 **Vercel free tier compatible**

---

## 🏗️ Overall Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      MOBILE CLIENT                           │
├─────────────────────────────────────────────────────────────┤
│  UI Layer (React)                                           │
│    ↓ Instant Updates                                        │
│  Optimistic State Manager (Zustand/Jotai)                  │
│    ↓ Read/Write                                             │
│  Local Storage Layer (IndexedDB via Dexie.js)              │
│    - Expenses (indexed by id, date, syncStatus)            │
│    - Sync Queue (pending operations)                        │
│    - Last Sync Timestamp                                    │
│    ↓ Background Sync                                        │
│  Sync Service Worker                                        │
│    - Queue management                                       │
│    - Retry logic with exponential backoff                   │
│    - Conflict detection                                     │
└─────────────────────────────────────────────────────────────┘
                           │
                    HTTPS + JWT
                           │
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                   VERCEL EDGE/SERVERLESS                     │
├─────────────────────────────────────────────────────────────┤
│  API Routes (Next.js)                                       │
│    - Idempotency middleware (Redis/Upstash)                │
│    - Rate limiting (per-user)                               │
│    - Request deduplication                                  │
│    ↓                                                         │
│  Business Logic                                             │
│    - Validation                                             │
│    - Conflict resolution                                    │
│    - Optimistic lock checking                               │
│    ↓                                                         │
│  Database Layer                                             │
│    - MongoDB with unique indexes                            │
│    - Atomic operations                                      │
│    - Change streams for real-time updates (optional)        │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 Frontend Strategy

### 1. **Local Storage: IndexedDB via Dexie.js**

**Why Dexie.js?**
- ✅ Mobile-optimized (5KB gzipped)
- ✅ Promise-based API (async/await)
- ✅ Powerful querying with indexes
- ✅ TypeScript support
- ✅ Handles 100MB+ data easily
- ✅ Works offline completely

**Schema Design:**

```typescript
// db/schema.ts
import Dexie, { Table } from 'dexie';

export interface LocalExpense {
  id: string;                    // Client-generated UUID
  serverId?: string;             // Server-assigned ID after sync
  userId: string;
  date: Date;
  category: string;
  type: 'personal' | 'shared';
  paymentMethod: string;
  description: string;
  amount: number;
  
  // Sync metadata
  syncStatus: 'pending' | 'syncing' | 'synced' | 'error';
  localCreatedAt: number;        // Timestamp for ordering
  localUpdatedAt: number;
  syncAttempts: number;
  lastSyncError?: string;
  version: number;               // For optimistic locking
  idempotencyKey: string;        // Unique per operation
}

export interface SyncQueue {
  id: string;
  operation: 'create' | 'update' | 'delete';
  expenseId: string;
  payload: any;
  idempotencyKey: string;
  attempts: number;
  nextRetryAt: number;
  createdAt: number;
}

export interface SyncMetadata {
  id: string;
  userId: string;
  lastSyncAt: number;
  lastSuccessfulSync: number;
  pendingCount: number;
}

class BudgetDB extends Dexie {
  expenses!: Table<LocalExpense, string>;
  syncQueue!: Table<SyncQueue, string>;
  syncMetadata!: Table<SyncMetadata, string>;

  constructor() {
    super('BudgetTrackerDB');
    
    this.version(1).stores({
      expenses: 'id, serverId, userId, date, syncStatus, localCreatedAt, [userId+date], [userId+syncStatus]',
      syncQueue: 'id, expenseId, nextRetryAt, operation',
      syncMetadata: 'id, userId, lastSyncAt'
    });
  }
}

export const db = new BudgetDB();
```

### 2. **Optimistic UI Pattern**

**Flow:**

```typescript
// hooks/useExpenses.ts
import { create } from 'zustand';
import { db, LocalExpense } from '@/db/schema';
import { v4 as uuidv4 } from 'uuid';

interface ExpenseStore {
  expenses: LocalExpense[];
  loading: boolean;
  
  // Actions
  addExpense: (expense: Omit<LocalExpense, 'id' | 'syncStatus' | 'localCreatedAt' | 'localUpdatedAt' | 'syncAttempts' | 'version' | 'idempotencyKey'>) => Promise<void>;
  updateExpense: (id: string, updates: Partial<LocalExpense>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  loadExpenses: (userId: string, month?: string) => Promise<void>;
  syncPendingExpenses: () => Promise<void>;
}

export const useExpenses = create<ExpenseStore>((set, get) => ({
  expenses: [],
  loading: false,

  // INSTANT UI UPDATE - No waiting for backend
  addExpense: async (expenseData) => {
    const idempotencyKey = uuidv4();
    const newExpense: LocalExpense = {
      id: uuidv4(),
      ...expenseData,
      syncStatus: 'pending',
      localCreatedAt: Date.now(),
      localUpdatedAt: Date.now(),
      syncAttempts: 0,
      version: 1,
      idempotencyKey,
    };

    // 1. Add to IndexedDB immediately
    await db.expenses.add(newExpense);
    
    // 2. Update UI instantly
    set((state) => ({
      expenses: [newExpense, ...state.expenses].sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      ),
    }));

    // 3. Add to sync queue for background sync
    await db.syncQueue.add({
      id: uuidv4(),
      operation: 'create',
      expenseId: newExpense.id,
      payload: expenseData,
      idempotencyKey,
      attempts: 0,
      nextRetryAt: Date.now(),
      createdAt: Date.now(),
    });

    // 4. Trigger background sync (non-blocking)
    get().syncPendingExpenses().catch(console.error);
  },

  updateExpense: async (id, updates) => {
    const idempotencyKey = uuidv4();
    
    // 1. Update IndexedDB
    await db.expenses.update(id, {
      ...updates,
      syncStatus: 'pending',
      localUpdatedAt: Date.now(),
      version: (await db.expenses.get(id))!.version + 1,
    });

    // 2. Update UI instantly
    set((state) => ({
      expenses: state.expenses.map((exp) =>
        exp.id === id ? { ...exp, ...updates, syncStatus: 'pending' } : exp
      ),
    }));

    // 3. Add to sync queue
    await db.syncQueue.add({
      id: uuidv4(),
      operation: 'update',
      expenseId: id,
      payload: updates,
      idempotencyKey,
      attempts: 0,
      nextRetryAt: Date.now(),
      createdAt: Date.now(),
    });

    // 4. Background sync
    get().syncPendingExpenses().catch(console.error);
  },

  deleteExpense: async (id) => {
    const idempotencyKey = uuidv4();
    
    // 1. Soft delete in IndexedDB (keep for sync)
    await db.expenses.update(id, {
      syncStatus: 'pending',
      localUpdatedAt: Date.now(),
    });

    // 2. Remove from UI instantly
    set((state) => ({
      expenses: state.expenses.filter((exp) => exp.id !== id),
    }));

    // 3. Add to sync queue
    await db.syncQueue.add({
      id: uuidv4(),
      operation: 'delete',
      expenseId: id,
      payload: null,
      idempotencyKey,
      attempts: 0,
      nextRetryAt: Date.now(),
      createdAt: Date.now(),
    });

    // 4. Background sync
    get().syncPendingExpenses().catch(console.error);
  },

  loadExpenses: async (userId, month) => {
    set({ loading: true });
    
    try {
      let query = db.expenses.where('userId').equals(userId);
      
      if (month) {
        const [year, monthNum] = month.split('-').map(Number);
        const startDate = new Date(year, monthNum - 1, 1);
        const endDate = new Date(year, monthNum, 0, 23, 59, 59);
        
        query = query.and(exp => 
          exp.date >= startDate && exp.date <= endDate
        );
      }
      
      const expenses = await query
        .filter(exp => exp.syncStatus !== 'deleted')
        .sortBy('date');
      
      set({ expenses: expenses.reverse(), loading: false });
    } catch (error) {
      console.error('Failed to load expenses:', error);
      set({ loading: false });
    }
  },

  syncPendingExpenses: async () => {
    // Get all pending sync items
    const queueItems = await db.syncQueue
      .where('nextRetryAt')
      .belowOrEqual(Date.now())
      .toArray();

    if (queueItems.length === 0) return;

    // Process each item
    for (const item of queueItems) {
      try {
        const expense = await db.expenses.get(item.expenseId);
        if (!expense) continue;

        // Update status to syncing
        await db.expenses.update(item.expenseId, { syncStatus: 'syncing' });

        // Make API call with idempotency key
        const response = await fetch(`/api/expenses${item.operation === 'update' ? `/${expense.serverId}` : ''}`, {
          method: item.operation === 'create' ? 'POST' : item.operation === 'update' ? 'PUT' : 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'X-Idempotency-Key': item.idempotencyKey,
          },
          body: JSON.stringify(item.payload),
        });

        if (response.ok) {
          const data = await response.json();
          
          // Update with server ID
          if (item.operation === 'create' && data.expense) {
            await db.expenses.update(item.expenseId, {
              serverId: data.expense._id,
              syncStatus: 'synced',
            });
          } else if (item.operation === 'delete') {
            // Permanently delete after successful sync
            await db.expenses.delete(item.expenseId);
          } else {
            await db.expenses.update(item.expenseId, { syncStatus: 'synced' });
          }

          // Remove from sync queue
          await db.syncQueue.delete(item.id);
        } else if (response.status === 409) {
          // Conflict - handle conflict resolution
          const serverData = await response.json();
          await handleConflict(expense, serverData);
          await db.syncQueue.delete(item.id);
        } else {
          // Retry with exponential backoff
          const nextRetry = Date.now() + Math.min(1000 * Math.pow(2, item.attempts), 300000);
          await db.syncQueue.update(item.id, {
            attempts: item.attempts + 1,
            nextRetryAt: nextRetry,
          });
          await db.expenses.update(item.expenseId, {
            syncStatus: 'error',
            lastSyncError: `HTTP ${response.status}`,
          });
        }
      } catch (error) {
        console.error('Sync error:', error);
        // Schedule retry
        const nextRetry = Date.now() + Math.min(1000 * Math.pow(2, item.attempts), 300000);
        await db.syncQueue.update(item.id, {
          attempts: item.attempts + 1,
          nextRetryAt: nextRetry,
        });
        await db.expenses.update(item.expenseId, {
          syncStatus: 'error',
          lastSyncError: error.message,
        });
      }
    }
  },
}));

async function handleConflict(localExpense: LocalExpense, serverData: any) {
  // Last-write-wins strategy with timestamp
  if (localExpense.localUpdatedAt > new Date(serverData.updatedAt).getTime()) {
    // Local is newer - keep local and retry
    await db.expenses.update(localExpense.id, { syncStatus: 'pending' });
  } else {
    // Server is newer - accept server version
    await db.expenses.update(localExpense.id, {
      ...serverData,
      syncStatus: 'synced',
    });
  }
}
```

### 3. **Cache Strategy**

**Multi-Layer Caching:**

```typescript
// utils/cache-manager.ts

export class CacheManager {
  private memoryCache: Map<string, { data: any; expires: number }> = new Map();
  private readonly MEMORY_TTL = 30000; // 30 seconds
  private readonly MAX_MEMORY_ITEMS = 100;

  // Layer 1: Memory cache (fastest)
  getFromMemory(key: string): any | null {
    const item = this.memoryCache.get(key);
    if (item && item.expires > Date.now()) {
      return item.data;
    }
    this.memoryCache.delete(key);
    return null;
  }

  setInMemory(key: string, data: any): void {
    // Evict oldest if at capacity (mobile memory optimization)
    if (this.memoryCache.size >= this.MAX_MEMORY_ITEMS) {
      const firstKey = this.memoryCache.keys().next().value;
      this.memoryCache.delete(firstKey);
    }
    
    this.memoryCache.set(key, {
      data,
      expires: Date.now() + this.MEMORY_TTL,
    });
  }

  // Layer 2: IndexedDB (persistent)
  async getFromDB(key: string): Promise<any | null> {
    const cached = await db.cache.get(key);
    if (cached && cached.expires > Date.now()) {
      // Promote to memory cache
      this.setInMemory(key, cached.data);
      return cached.data;
    }
    return null;
  }

  async setInDB(key: string, data: any, ttl: number = 3600000): Promise<void> {
    await db.cache.put({
      key,
      data,
      expires: Date.now() + ttl,
    });
  }

  // Invalidate cache on mutations
  invalidate(pattern: string): void {
    // Memory cache
    for (const key of this.memoryCache.keys()) {
      if (key.includes(pattern)) {
        this.memoryCache.delete(key);
      }
    }
    
    // DB cache (async)
    db.cache
      .where('key')
      .startsWith(pattern)
      .delete()
      .catch(console.error);
  }

  // Clear old entries (run periodically)
  async cleanup(): void {
    const now = Date.now();
    await db.cache.where('expires').below(now).delete();
    
    for (const [key, item] of this.memoryCache.entries()) {
      if (item.expires < now) {
        this.memoryCache.delete(key);
      }
    }
  }
}

export const cacheManager = new CacheManager();

// Cleanup every 5 minutes
if (typeof window !== 'undefined') {
  setInterval(() => cacheManager.cleanup(), 300000);
}
```

---

## 🔧 Backend Strategy

### 1. **API Design with Idempotency**

```typescript
// middleware/idempotency.ts
import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

// Use Upstash Redis (Vercel-friendly, free tier available)
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL!,
  token: process.env.UPSTASH_REDIS_TOKEN!,
});

export async function withIdempotency(
  request: NextRequest,
  handler: (req: NextRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  const idempotencyKey = request.headers.get('X-Idempotency-Key');
  
  // Only enforce for POST/PUT/DELETE
  if (!['POST', 'PUT', 'DELETE'].includes(request.method)) {
    return handler(request);
  }

  if (!idempotencyKey) {
    return NextResponse.json(
      { error: 'X-Idempotency-Key header is required' },
      { status: 400 }
    );
  }

  // Check if we've seen this request before
  const cachedResponse = await redis.get(`idempotency:${idempotencyKey}`);
  
  if (cachedResponse) {
    // Return cached response (deduplication)
    return NextResponse.json(cachedResponse, {
      status: 200,
      headers: { 'X-Idempotent-Replay': 'true' },
    });
  }

  // Execute handler
  const response = await handler(request);
  
  // Cache successful responses for 24 hours
  if (response.status >= 200 && response.status < 300) {
    const responseData = await response.json();
    await redis.setex(
      `idempotency:${idempotencyKey}`,
      86400, // 24 hours
      responseData
    );
    return NextResponse.json(responseData, { status: response.status });
  }

  return response;
}
```

### 2. **Deduplication Logic**

```typescript
// app/api/expenses/route.ts (Updated POST)
import { connectDB } from '@/lib/db/connection';
import Expense from '@/lib/models/Expense';
import { withIdempotency } from '@/middleware/idempotency';
import { protectApiRoute } from '@/lib/api-protection';

export async function POST(request: NextRequest) {
  return withIdempotency(request, async (req) => {
    const protection = protectApiRoute(req);
    if (!protection.authenticated) {
      return protection.response!;
    }

    await connectDB();

    const data = await req.json();
    const idempotencyKey = req.headers.get('X-Idempotency-Key')!;

    // Check for duplicate by idempotency key
    const existingExpense = await Expense.findOne({
      userId: protection.userId,
      idempotencyKey,
    });

    if (existingExpense) {
      // Already created - return existing
      return NextResponse.json(
        { message: 'Expense already exists', expense: existingExpense },
        { 
          status: 200,
          headers: { 'X-Duplicate-Detected': 'true' }
        }
      );
    }

    // Validate
    if (!data.date || !data.category || !data.amount || data.amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid expense data' },
        { status: 400 }
      );
    }

    // Create with idempotency key
    const expense = new Expense({
      userId: protection.userId,
      ...data,
      idempotencyKey,
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await expense.save();

    // Invalidate cache
    await invalidateUserCache(protection.userId);

    return NextResponse.json(
      { message: 'Expense created', expense },
      { status: 201 }
    );
  });
}
```

### 3. **Optimistic Locking for Updates**

```typescript
// app/api/expenses/[id]/route.ts (Updated PUT)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withIdempotency(request, async (req) => {
    const protection = protectApiRoute(req);
    if (!protection.authenticated) {
      return protection.response!;
    }

    await connectDB();

    const data = await req.json();
    const { version, ...updates } = data;

    // Find expense with version check (optimistic locking)
    const expense = await Expense.findOne({
      _id: params.id,
      userId: protection.userId,
    });

    if (!expense) {
      return NextResponse.json(
        { error: 'Expense not found' },
        { status: 404 }
      );
    }

    // Version conflict detection
    if (version && expense.version !== version) {
      return NextResponse.json(
        { 
          error: 'Conflict detected',
          serverVersion: expense.version,
          serverData: expense,
        },
        { status: 409 }
      );
    }

    // Update with version increment
    const updatedExpense = await Expense.findOneAndUpdate(
      { 
        _id: params.id,
        userId: protection.userId,
        version: expense.version, // Ensure version hasn't changed
      },
      {
        ...updates,
        version: expense.version + 1,
        updatedAt: new Date(),
      },
      { new: true }
    );

    if (!updatedExpense) {
      // Someone else updated it
      return NextResponse.json(
        { error: 'Conflict - expense was modified' },
        { status: 409 }
      );
    }

    await invalidateUserCache(protection.userId);

    return NextResponse.json(
      { message: 'Expense updated', expense: updatedExpense },
      { status: 200 }
    );
  });
}
```

### 4. **Database Indexes for Concurrency**

```typescript
// lib/models/Expense.ts (Updated schema)
const ExpenseSchema = new Schema<IExpense>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    category: {
      type: String,
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['personal', 'shared'],
      required: true,
    },
    paymentMethod: {
      type: String,
      enum: ['UPI', 'Cash', 'Card', 'Bank'],
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    // NEW: Idempotency support
    idempotencyKey: {
      type: String,
      required: true,
      index: true,
    },
    // NEW: Optimistic locking
    version: {
      type: Number,
      default: 1,
    },
    // Timestamps
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  }
);

// CRITICAL: Unique compound index for deduplication
ExpenseSchema.index(
  { userId: 1, idempotencyKey: 1 },
  { unique: true }
);

// Compound index for common queries
ExpenseSchema.index({ userId: 1, date: -1 });
ExpenseSchema.index({ userId: 1, category: 1, date: -1 });
```

---

## 🔄 Sync Mechanism

### 1. **Background Sync with Service Worker**

```typescript
// public/sw.js
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-expenses') {
    event.waitUntil(syncExpenses());
  }
});

async function syncExpenses() {
  // This will be handled by the app's sync service
  const clients = await self.clients.matchAll();
  clients.forEach(client => {
    client.postMessage({
      type: 'TRIGGER_SYNC',
    });
  });
}

// Periodic background sync (for PWA)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'sync-expenses-periodic') {
    event.waitUntil(syncExpenses());
  }
});
```

### 2. **Smart Sync Service**

```typescript
// services/sync-service.ts
export class SyncService {
  private syncing = false;
  private syncInterval: NodeJS.Timeout | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      // Listen for online/offline events
      window.addEventListener('online', () => this.triggerSync());
      window.addEventListener('focus', () => this.triggerSync());
      
      // Periodic sync every 30 seconds when online
      this.startPeriodicSync();
      
      // Listen for service worker messages
      navigator.serviceWorker?.addEventListener('message', (event) => {
        if (event.data.type === 'TRIGGER_SYNC') {
          this.triggerSync();
        }
      });
    }
  }

  startPeriodicSync() {
    this.syncInterval = setInterval(() => {
      if (navigator.onLine && !document.hidden) {
        this.triggerSync();
      }
    }, 30000); // 30 seconds
  }

  async triggerSync() {
    if (this.syncing) return; // Prevent concurrent syncs

    this.syncing = true;
    try {
      const pendingCount = await db.syncQueue.count();
      if (pendingCount > 0) {
        await useExpenses.getState().syncPendingExpenses();
        
        // Update sync metadata
        await db.syncMetadata.put({
          id: 'main',
          userId: getCurrentUserId(),
          lastSyncAt: Date.now(),
          lastSuccessfulSync: Date.now(),
          pendingCount: await db.syncQueue.count(),
        });
      }
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      this.syncing = false;
    }
  }

  async getPendingCount(): Promise<number> {
    return await db.syncQueue.count();
  }

  async getLastSyncTime(): Promise<number | null> {
    const metadata = await db.syncMetadata.get('main');
    return metadata?.lastSuccessfulSync || null;
  }

  destroy() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
  }
}

export const syncService = new SyncService();
```

### 3. **Retry Logic with Exponential Backoff**

```typescript
// utils/retry.ts
export class RetryManager {
  private readonly MAX_ATTEMPTS = 5;
  private readonly BASE_DELAY = 1000; // 1 second
  private readonly MAX_DELAY = 300000; // 5 minutes

  calculateDelay(attempts: number): number {
    // Exponential backoff: 1s, 2s, 4s, 8s, 16s, ... (capped at 5min)
    const delay = this.BASE_DELAY * Math.pow(2, attempts);
    return Math.min(delay, this.MAX_DELAY);
  }

  shouldRetry(attempts: number, error: any): boolean {
    if (attempts >= this.MAX_ATTEMPTS) return false;

    // Don't retry client errors (4xx except 409, 429)
    if (error.status >= 400 && error.status < 500) {
      if (error.status === 409 || error.status === 429) return true;
      return false; // Invalid data, don't retry
    }

    // Retry server errors (5xx)
    if (error.status >= 500) return true;

    // Retry network errors
    if (error.message?.includes('network') || error.message?.includes('fetch')) {
      return true;
    }

    return false;
  }

  async executeWithRetry<T>(
    fn: () => Promise<T>,
    attempts: number = 0
  ): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      if (this.shouldRetry(attempts, error)) {
        const delay = this.calculateDelay(attempts);
        await this.sleep(delay);
        return this.executeWithRetry(fn, attempts + 1);
      }
      throw error;
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const retryManager = new RetryManager();
```

---

## 🔒 Concurrency Control

### 1. **Rate Limiting**

```typescript
// middleware/rate-limit.ts
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL!,
  token: process.env.UPSTASH_REDIS_TOKEN!,
});

export async function rateLimit(
  userId: string,
  maxRequests: number = 100,
  windowSeconds: number = 60
): Promise<{ allowed: boolean; remaining: number }> {
  const key = `rate-limit:${userId}:${Math.floor(Date.now() / (windowSeconds * 1000))}`;
  
  const current = await redis.incr(key);
  
  if (current === 1) {
    await redis.expire(key, windowSeconds);
  }

  return {
    allowed: current <= maxRequests,
    remaining: Math.max(0, maxRequests - current),
  };
}

// Usage in API route
export async function POST(request: NextRequest) {
  const protection = protectApiRoute(request);
  if (!protection.authenticated) {
    return protection.response!;
  }

  // Rate limit: 100 requests per minute per user
  const limit = await rateLimit(protection.userId, 100, 60);
  
  if (!limit.allowed) {
    return NextResponse.json(
      { error: 'Rate limit exceeded' },
      { 
        status: 429,
        headers: { 'X-RateLimit-Remaining': limit.remaining.toString() }
      }
    );
  }

  // Continue with request...
}
```

### 2. **Request Deduplication**

```typescript
// middleware/deduplicate.ts
export class RequestDeduplicator {
  private pending: Map<string, Promise<any>> = new Map();

  async deduplicate<T>(
    key: string,
    fn: () => Promise<T>
  ): Promise<T> {
    // If same request is in-flight, return existing promise
    if (this.pending.has(key)) {
      return this.pending.get(key)!;
    }

    // Execute and cache promise
    const promise = fn()
      .finally(() => {
        this.pending.delete(key);
      });

    this.pending.set(key, promise);
    return promise;
  }
}

export const deduplicator = new RequestDeduplicator();

// Usage in API client
async function createExpense(data: any) {
  const key = `create-expense:${data.idempotencyKey}`;
  return deduplicator.deduplicate(key, () =>
    fetch('/api/expenses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Idempotency-Key': data.idempotencyKey,
      },
      body: JSON.stringify(data),
    })
  );
}
```

---

## ☁️ Vercel-Specific Optimizations

### 1. **Edge Functions for Authentication**

```typescript
// middleware.ts (Edge runtime)
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const config = {
  matcher: '/api/:path*',
  runtime: 'edge', // Use Edge runtime for fast cold starts
};

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value;
  
  if (!token && !request.nextUrl.pathname.includes('/auth/')) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  return NextResponse.next();
}
```

### 2. **Serverless Function Optimization**

```typescript
// app/api/expenses/route.ts
export const runtime = 'nodejs'; // Use Node.js for MongoDB
export const dynamic = 'force-dynamic'; // No static optimization
export const maxDuration = 10; // Max 10 seconds (Vercel free tier limit)

// Connection pooling (reuse across invocations)
let connectionPromise: Promise<typeof mongoose> | null = null;

export async function connectDBOptimized() {
  if (!connectionPromise) {
    connectionPromise = mongoose.connect(process.env.MONGODB_URI!, {
      maxPoolSize: 10,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 10000,
    });
  }
  return connectionPromise;
}
```

### 3. **Caching Headers**

```typescript
// Aggressive caching for static data
export async function GET(request: NextRequest) {
  const response = await handler(request);
  
  // Cache statistics/aggregates for 5 minutes
  response.headers.set('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
  
  return response;
}
```

---

## 📱 Mobile Performance Best Practices

### 1. **Memory Management**

```typescript
// utils/memory-manager.ts
export class MemoryManager {
  private readonly MAX_EXPENSES_IN_MEMORY = 500;
  private readonly MAX_CACHE_SIZE_MB = 10;

  async pruneOldExpenses() {
    const count = await db.expenses.count();
    
    if (count > this.MAX_EXPENSES_IN_MEMORY) {
      // Keep only last 3 months + pending syncs
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      
      await db.expenses
        .where('date')
        .below(threeMonthsAgo)
        .and(exp => exp.syncStatus === 'synced')
        .delete();
    }
  }

  async cleanupCache() {
    const cacheSize = await this.estimateCacheSize();
    
    if (cacheSize > this.MAX_CACHE_SIZE_MB * 1024 * 1024) {
      // Delete oldest 25% of cache
      const cacheItems = await db.cache.orderBy('expires').toArray();
      const toDelete = Math.floor(cacheItems.length * 0.25);
      const deleteIds = cacheItems.slice(0, toDelete).map(item => item.key);
      await db.cache.bulkDelete(deleteIds);
    }
  }

  private async estimateCacheSize(): Promise<number> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      return estimate.usage || 0;
    }
    return 0;
  }
}

export const memoryManager = new MemoryManager();

// Run cleanup daily
if (typeof window !== 'undefined') {
  setInterval(() => {
    memoryManager.pruneOldExpenses();
    memoryManager.cleanupCache();
  }, 86400000); // 24 hours
}
```

### 2. **Lazy Loading & Code Splitting**

```typescript
// app/expenses/page.tsx
import dynamic from 'next/dynamic';

// Lazy load heavy chart components
const ExpenseChart = dynamic(
  () => import('@/components/charts/ExpenseChart'),
  {
    loading: () => <div>Loading chart...</div>,
    ssr: false, // Don't render on server
  }
);

// Lazy load analytics
const AnalyticsPanel = dynamic(
  () => import('@/components/analytics/AnalyticsPanel'),
  { ssr: false }
);
```

### 3. **Network-Aware Loading**

```typescript
// hooks/useNetworkAware.ts
export function useNetworkAware() {
  const [effectiveType, setEffectiveType] = useState<string>('4g');
  const [saveData, setSaveData] = useState(false);

  useEffect(() => {
    if ('connection' in navigator) {
      const conn = (navigator as any).connection;
      setEffectiveType(conn.effectiveType || '4g');
      setSaveData(conn.saveData || false);

      const handleChange = () => {
        setEffectiveType(conn.effectiveType || '4g');
        setSaveData(conn.saveData || false);
      };

      conn.addEventListener('change', handleChange);
      return () => conn.removeEventListener('change', handleChange);
    }
  }, []);

  return {
    isSlow: effectiveType === 'slow-2g' || effectiveType === '2g' || effectiveType === '3g',
    saveData,
    shouldReduceQuality: saveData || effectiveType === 'slow-2g' || effectiveType === '2g',
  };
}

// Usage
function ExpensesPage() {
  const { isSlow, saveData } = useNetworkAware();

  // Reduce page size on slow connections
  const pageSize = isSlow ? 10 : saveData ? 20 : 50;

  // Skip heavy analytics on slow connections
  const showAnalytics = !isSlow && !saveData;

  return (
    <div>
      <ExpenseList pageSize={pageSize} />
      {showAnalytics && <AnalyticsPanel />}
    </div>
  );
}
```

### 4. **Virtualization for Long Lists**

```typescript
// components/VirtualExpenseList.tsx
import { useVirtualizer } from '@tanstack/react-virtual';

export function VirtualExpenseList({ expenses }: { expenses: Expense[] }) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: expenses.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 60, // Estimated row height
    overscan: 5, // Render 5 extra items for smooth scrolling
  });

  return (
    <div
      ref={parentRef}
      className="h-screen overflow-auto"
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const expense = expenses[virtualRow.index];
          return (
            <div
              key={virtualRow.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              <ExpenseRow expense={expense} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

---

## 🛠️ Recommended Tech Stack

### **Core Stack (Keep Current)**
- ✅ **Next.js 16** - Server & client components
- ✅ **React 19** - UI library
- ✅ **TypeScript** - Type safety
- ✅ **Tailwind CSS** - Styling
- ✅ **MongoDB** - Database
- ✅ **Vercel** - Hosting

### **New Additions**

#### **Client-Side Storage**
```json
{
  "dexie": "^4.0.0",
  "uuid": "^9.0.0"
}
```

#### **State Management**
```json
{
  "zustand": "^4.5.0"  // Lightweight (1KB), perfect for mobile
}
```

#### **Idempotency & Caching**
```json
{
  "@upstash/redis": "^1.28.0"  // Serverless Redis (Vercel-friendly)
}
```

#### **Mobile Optimizations**
```json
{
  "@tanstack/react-virtual": "^3.0.0",  // Virtualization
  "react-intersection-observer": "^9.5.0"  // Lazy loading
}
```

#### **Service Worker**
```json
{
  "workbox-webpack-plugin": "^7.0.0",  // Better than next-pwa
  "workbox-window": "^7.0.0"
}
```

### **Package.json Updates**

```json
{
  "dependencies": {
    "axios": "^1.6.5",
    "bcryptjs": "^2.4.3",
    "date-fns": "^3.3.1",
    "dexie": "^4.0.0",
    "jsonwebtoken": "^9.0.2",
    "mongoose": "^8.0.0",
    "next": "16.1.1",
    "react": "19.2.3",
    "react-dom": "19.2.3",
    "recharts": "^2.10.3",
    "sharp": "^0.34.5",
    "uuid": "^9.0.0",
    "zustand": "^4.5.0",
    "@upstash/redis": "^1.28.0",
    "@tanstack/react-virtual": "^3.0.0",
    "react-intersection-observer": "^9.5.0",
    "workbox-webpack-plugin": "^7.0.0",
    "workbox-window": "^7.0.0"
  }
}
```

---

## 📋 Implementation Checklist

### **Phase 1: Foundation (Week 1)**
- [ ] Install dependencies (Dexie, Zustand, Upstash)
- [ ] Set up IndexedDB schema
- [ ] Create database utility
- [ ] Set up Upstash Redis account
- [ ] Add idempotency keys to Expense model

### **Phase 2: Client-Side Store (Week 2)**
- [ ] Implement Zustand store with optimistic updates
- [ ] Create sync service
- [ ] Add retry logic
- [ ] Implement cache manager

### **Phase 3: Backend Updates (Week 3)**
- [ ] Add idempotency middleware
- [ ] Update expense API routes
- [ ] Add optimistic locking
- [ ] Implement rate limiting
- [ ] Add unique indexes to MongoDB

### **Phase 4: Sync Mechanism (Week 4)**
- [ ] Implement background sync service
- [ ] Add service worker sync
- [ ] Create conflict resolution logic
- [ ] Test offline scenarios

### **Phase 5: Mobile Optimizations (Week 5)**
- [ ] Add memory management
- [ ] Implement virtualization
- [ ] Add network-aware features
- [ ] Optimize bundle size
- [ ] Test on low-end devices

### **Phase 6: Testing & Monitoring (Week 6)**
- [ ] Test concurrent user scenarios
- [ ] Test offline/online transitions
- [ ] Verify no duplicate entries
- [ ] Load testing (10-15 concurrent users)
- [ ] Monitor Vercel function duration
- [ ] Set up error tracking (Sentry)

---

## 🎯 Expected Performance Metrics

### **Before Optimization**
- UI Update Latency: 500-2000ms (network-dependent)
- Offline Support: None
- Duplicate Entries: Possible
- Mobile Performance: Poor on slow networks

### **After Optimization**
- ⚡ UI Update Latency: **0-50ms** (instant)
- 📱 Offline Support: **Full offline capability**
- 🔒 Duplicate Entries: **Zero** (idempotency)
- 🚀 Mobile Performance: **Smooth 60fps**
- 📊 API Response Time: <200ms (p95)
- 💾 Storage Footprint: <10MB (3 months data)
- 🔄 Sync Success Rate: >99%

---

## 🚨 Critical Production Considerations

### **1. Data Consistency**
- Always use idempotency keys
- Implement proper conflict resolution
- Test edge cases (network failures, partial syncs)

### **2. Security**
- Validate all data client and server-side
- Never trust client timestamps
- Implement proper rate limiting
- Use HTTPS only

### **3. Monitoring**
- Track sync success/failure rates
- Monitor IndexedDB storage usage
- Alert on high retry counts
- Track API latencies

### **4. Error Handling**
- Graceful degradation on errors
- Clear user feedback on sync status
- Retry failed syncs automatically
- Log errors for debugging

### **5. Testing**
- Test with 15+ concurrent users
- Simulate poor network conditions
- Test offline scenarios thoroughly
- Verify data integrity after sync

---

## 📚 Additional Resources

- **Dexie.js Docs**: https://dexie.org/
- **Upstash Redis**: https://upstash.com/
- **Workbox**: https://developers.google.com/web/tools/workbox
- **Zustand**: https://github.com/pmndrs/zustand
- **React Virtual**: https://tanstack.com/virtual

---

## 🎉 Next Steps

1. **Review this architecture** with your team
2. **Set up development environment** (Upstash account, etc.)
3. **Start with Phase 1** implementation
4. **Test incrementally** after each phase
5. **Monitor production** metrics closely

This architecture will deliver a **world-class, mobile-first budget tracking experience** that works seamlessly offline, syncs reliably, and scales efficiently on Vercel's free tier.

**Questions? Ready to implement? Let me know which phase you'd like to start with!** 🚀
