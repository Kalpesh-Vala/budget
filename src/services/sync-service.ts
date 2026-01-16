// services/sync-service.ts - Background sync orchestration
import { db } from '@/db/schema';
import { useExpenseStore } from '@/stores/expense-store';

export class SyncService {
  private syncing = false;
  private syncInterval: NodeJS.Timeout | null = null;
  private retryTimeouts: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    if (typeof window !== 'undefined') {
      this.initialize();
    }
  }

  private initialize(): void {
    // Listen for network changes
    window.addEventListener('online', () => {
      console.log('Network online - triggering sync');
      this.triggerSync();
    });

    window.addEventListener('offline', () => {
      console.log('Network offline - pausing sync');
      this.pauseSync();
    });

    // Listen for visibility changes (app comes to foreground)
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && navigator.onLine) {
        this.triggerSync();
      }
    });

    // Start periodic sync
    this.startPeriodicSync();

    // Register service worker sync
    this.registerServiceWorkerSync();

    // Initial sync on load
    if (navigator.onLine) {
      setTimeout(() => this.triggerSync(), 1000);
    }
  }

  /**
   * Start periodic background sync
   */
  startPeriodicSync(): void {
    // Sync every 30 seconds when online and page is visible
    this.syncInterval = setInterval(() => {
      if (navigator.onLine && !document.hidden) {
        this.triggerSync();
      }
    }, 30000);
  }

  /**
   * Pause periodic sync
   */
  pauseSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  /**
   * Resume periodic sync
   */
  resumeSync(): void {
    if (!this.syncInterval) {
      this.startPeriodicSync();
    }
  }

  /**
   * Trigger immediate sync
   */
  async triggerSync(): Promise<void> {
    // Prevent concurrent syncs
    if (this.syncing) {
      console.log('Sync already in progress');
      return;
    }

    // Don't sync if offline
    if (!navigator.onLine) {
      console.log('Cannot sync - offline');
      return;
    }

    this.syncing = true;

    try {
      const pendingCount = await db.syncQueue.count();

      if (pendingCount === 0) {
        console.log('No pending items to sync');
        return;
      }

      console.log(`Starting sync of ${pendingCount} items`);

      // Trigger sync in expense store
      await useExpenseStore.getState().syncPendingExpenses();

      // Update sync metadata
      await this.updateSyncMetadata();

      console.log('Sync completed successfully');
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      this.syncing = false;
    }
  }

  /**
   * Update sync metadata
   */
  private async updateSyncMetadata(): Promise<void> {
    const pendingCount = await db.syncQueue.count();

    await db.syncMetadata.put({
      id: 'main',
      userId: await this.getCurrentUserId(),
      lastSyncAt: Date.now(),
      lastSuccessfulSync: pendingCount === 0 ? Date.now() : (await db.syncMetadata.get('main'))?.lastSuccessfulSync || Date.now(),
      pendingCount,
    });
  }

  /**
   * Get current user ID from auth
   */
  private async getCurrentUserId(): Promise<string> {
    // TODO: Get from auth context/store
    return 'current-user-id';
  }

  /**
   * Register service worker sync event
   */
  private registerServiceWorkerSync(): void {
    if ('serviceWorker' in navigator && 'sync' in ServiceWorkerRegistration.prototype) {
      navigator.serviceWorker.ready.then((registration) => {
        // Register sync event
        return (registration as any).sync.register('sync-expenses');
      }).catch((error) => {
        console.error('Failed to register sync:', error);
      });

      // Listen for messages from service worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data.type === 'TRIGGER_SYNC') {
          this.triggerSync();
        }
      });
    }
  }

  /**
   * Register periodic background sync (PWA)
   */
  async registerPeriodicBackgroundSync(): Promise<void> {
    if ('serviceWorker' in navigator && 'periodicSync' in ServiceWorkerRegistration.prototype) {
      try {
        const registration = await navigator.serviceWorker.ready;
        await (registration as any).periodicSync.register('sync-expenses-periodic', {
          minInterval: 60000, // 1 minute minimum
        });
        console.log('Periodic background sync registered');
      } catch (error) {
        console.error('Failed to register periodic sync:', error);
      }
    }
  }

  /**
   * Get pending sync count
   */
  async getPendingCount(): Promise<number> {
    return await db.syncQueue.count();
  }

  /**
   * Get last sync time
   */
  async getLastSyncTime(): Promise<number | null> {
    const metadata = await db.syncMetadata.get('main');
    return metadata?.lastSuccessfulSync || null;
  }

  /**
   * Get sync status
   */
  async getSyncStatus(): Promise<{
    syncing: boolean;
    pendingCount: number;
    lastSync: number | null;
    hasErrors: boolean;
  }> {
    const pendingCount = await this.getPendingCount();
    const lastSync = await this.getLastSyncTime();
    
    // Check for errors
    const errorCount = await db.expenses
      .where('syncStatus')
      .equals('error')
      .count();

    return {
      syncing: this.syncing,
      pendingCount,
      lastSync,
      hasErrors: errorCount > 0,
    };
  }

  /**
   * Force retry all failed syncs
   */
  async retryFailedSyncs(): Promise<void> {
    await db.syncQueue
      .toCollection()
      .modify((item) => {
        item.nextRetryAt = Date.now();
        item.attempts = 0;
      });

    await db.expenses
      .where('syncStatus')
      .equals('error')
      .modify((expense) => {
        expense.syncStatus = 'pending';
        expense.syncAttempts = 0;
        expense.lastSyncError = undefined;
      });

    await this.triggerSync();
  }

  /**
   * Clean up service on unmount
   */
  destroy(): void {
    this.pauseSync();
    this.retryTimeouts.forEach(timeout => clearTimeout(timeout));
    this.retryTimeouts.clear();
  }
}

// Export singleton
export const syncService = new SyncService();

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    syncService.destroy();
  });
}
