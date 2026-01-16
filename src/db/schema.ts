// db/schema.ts - IndexedDB Schema with Dexie.js
import Dexie, { Table } from 'dexie';

/**
 * Local expense with sync metadata
 */
export interface LocalExpense {
  id: string;                    // Client-generated UUID
  serverId?: string;             // Server-assigned ID after sync
  userId: string;
  date: Date;
  category: string;
  type: 'personal' | 'shared';
  paymentMethod: 'UPI' | 'Cash' | 'Card' | 'Bank';
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

/**
 * Queue for pending sync operations
 */
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

/**
 * Sync metadata tracking
 */
export interface SyncMetadata {
  id: string;
  userId: string;
  lastSyncAt: number;
  lastSuccessfulSync: number;
  pendingCount: number;
}

/**
 * Cache storage for API responses
 */
export interface CacheEntry {
  key: string;
  data: any;
  expires: number;
}

/**
 * Main database class
 */
class BudgetDB extends Dexie {
  expenses!: Table<LocalExpense, string>;
  syncQueue!: Table<SyncQueue, string>;
  syncMetadata!: Table<SyncMetadata, string>;
  cache!: Table<CacheEntry, string>;

  constructor() {
    super('BudgetTrackerDB');
    
    this.version(1).stores({
      // Expenses table with compound indexes
      expenses: 'id, serverId, userId, date, syncStatus, localCreatedAt, [userId+date], [userId+syncStatus], idempotencyKey',
      
      // Sync queue with retry scheduling
      syncQueue: 'id, expenseId, nextRetryAt, operation, [nextRetryAt+operation]',
      
      // Sync metadata
      syncMetadata: 'id, userId, lastSyncAt',
      
      // Cache storage
      cache: 'key, expires',
    });
  }

  /**
   * Clear all data (for logout)
   */
  async clearAllData(): Promise<void> {
    await Promise.all([
      this.expenses.clear(),
      this.syncQueue.clear(),
      this.syncMetadata.clear(),
      this.cache.clear(),
    ]);
  }

  /**
   * Get database size estimate
   */
  async getStorageEstimate(): Promise<{ usage: number; quota: number }> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      return {
        usage: estimate.usage || 0,
        quota: estimate.quota || 0,
      };
    }
    return { usage: 0, quota: 0 };
  }
}

// Export singleton instance
export const db = new BudgetDB();

// Utility functions
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function createIdempotencyKey(): string {
  return `${Date.now()}-${generateUUID()}`;
}
