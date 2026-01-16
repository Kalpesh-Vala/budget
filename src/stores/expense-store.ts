// stores/expense-store.ts - Zustand store with optimistic updates
import { create } from 'zustand';
import { db, LocalExpense, generateUUID, createIdempotencyKey } from '@/db/schema';
import { syncService } from '@/services/sync-service';

interface ExpenseStore {
  expenses: LocalExpense[];
  loading: boolean;
  error: string | null;
  pendingSyncCount: number;

  // Actions
  addExpense: (expense: Omit<LocalExpense, 'id' | 'syncStatus' | 'localCreatedAt' | 'localUpdatedAt' | 'syncAttempts' | 'version' | 'idempotencyKey'>) => Promise<void>;
  updateExpense: (id: string, updates: Partial<LocalExpense>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  loadExpenses: (userId: string, month?: string) => Promise<void>;
  syncPendingExpenses: () => Promise<void>;
  refreshPendingCount: () => Promise<void>;
}

export const useExpenseStore = create<ExpenseStore>((set, get) => ({
  expenses: [],
  loading: false,
  error: null,
  pendingSyncCount: 0,

  /**
   * Add expense with instant UI update
   */
  addExpense: async (expenseData) => {
    const idempotencyKey = createIdempotencyKey();
    const newExpense: LocalExpense = {
      id: generateUUID(),
      ...expenseData,
      syncStatus: 'pending',
      localCreatedAt: Date.now(),
      localUpdatedAt: Date.now(),
      syncAttempts: 0,
      version: 1,
      idempotencyKey,
    };

    try {
      // 1. Save to IndexedDB
      await db.expenses.add(newExpense);

      // 2. Update UI instantly
      set((state) => ({
        expenses: [newExpense, ...state.expenses].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        ),
        error: null,
      }));

      // 3. Add to sync queue
      await db.syncQueue.add({
        id: generateUUID(),
        operation: 'create',
        expenseId: newExpense.id,
        payload: expenseData,
        idempotencyKey,
        attempts: 0,
        nextRetryAt: Date.now(),
        createdAt: Date.now(),
      });

      // 4. Update pending count
      await get().refreshPendingCount();

      // 5. Trigger background sync (non-blocking)
      syncService.triggerSync().catch(console.error);
    } catch (error) {
      console.error('Failed to add expense:', error);
      set({ error: 'Failed to add expense locally' });
      throw error;
    }
  },

  /**
   * Update expense with instant UI update
   */
  updateExpense: async (id, updates) => {
    const idempotencyKey = createIdempotencyKey();

    try {
      const existing = await db.expenses.get(id);
      if (!existing) {
        throw new Error('Expense not found');
      }

      // 1. Update IndexedDB
      await db.expenses.update(id, {
        ...updates,
        syncStatus: 'pending',
        localUpdatedAt: Date.now(),
        version: existing.version + 1,
      });

      // 2. Update UI instantly
      set((state) => ({
        expenses: state.expenses.map((exp) =>
          exp.id === id
            ? { ...exp, ...updates, syncStatus: 'pending', localUpdatedAt: Date.now() }
            : exp
        ),
        error: null,
      }));

      // 3. Add to sync queue
      await db.syncQueue.add({
        id: generateUUID(),
        operation: 'update',
        expenseId: id,
        payload: { ...updates, version: existing.version },
        idempotencyKey,
        attempts: 0,
        nextRetryAt: Date.now(),
        createdAt: Date.now(),
      });

      // 4. Update pending count
      await get().refreshPendingCount();

      // 5. Trigger sync
      syncService.triggerSync().catch(console.error);
    } catch (error) {
      console.error('Failed to update expense:', error);
      set({ error: 'Failed to update expense locally' });
      throw error;
    }
  },

  /**
   * Delete expense with instant UI update
   */
  deleteExpense: async (id) => {
    const idempotencyKey = createIdempotencyKey();

    try {
      // 1. Mark as pending deletion in IndexedDB
      await db.expenses.update(id, {
        syncStatus: 'pending',
        localUpdatedAt: Date.now(),
      });

      // 2. Remove from UI instantly
      set((state) => ({
        expenses: state.expenses.filter((exp) => exp.id !== id),
        error: null,
      }));

      // 3. Add to sync queue
      await db.syncQueue.add({
        id: generateUUID(),
        operation: 'delete',
        expenseId: id,
        payload: null,
        idempotencyKey,
        attempts: 0,
        nextRetryAt: Date.now(),
        createdAt: Date.now(),
      });

      // 4. Update pending count
      await get().refreshPendingCount();

      // 5. Trigger sync
      syncService.triggerSync().catch(console.error);
    } catch (error) {
      console.error('Failed to delete expense:', error);
      set({ error: 'Failed to delete expense locally' });
      throw error;
    }
  },

  /**
   * Load expenses from IndexedDB (with initial server sync if empty)
   */
  loadExpenses: async (userId, month) => {
    set({ loading: true, error: null });

    try {
      // Check if IndexedDB has any expenses for this user
      const existingCount = await db.expenses.where('userId').equals(userId).count();

      // If IndexedDB is empty, fetch from server first (initial sync)
      if (existingCount === 0) {
        console.log('IndexedDB empty - fetching from server...');
        try {
          const response = await fetch(`/api/expenses?userId=${userId}`, {
            credentials: 'include',
          });

          if (response.ok) {
            const data = await response.json();
            const serverExpenses = data.expenses || [];

            // Populate IndexedDB with server data
            for (const serverExpense of serverExpenses) {
              const localExpense: LocalExpense = {
                id: generateUUID(),
                serverId: serverExpense._id,
                userId: serverExpense.userId,
                date: new Date(serverExpense.date),
                category: serverExpense.category,
                type: serverExpense.type,
                paymentMethod: serverExpense.paymentMethod,
                description: serverExpense.description,
                amount: serverExpense.amount,
                syncStatus: 'synced',
                localCreatedAt: new Date(serverExpense.createdAt || serverExpense.date).getTime(),
                localUpdatedAt: new Date(serverExpense.updatedAt || serverExpense.date).getTime(),
                syncAttempts: 0,
                version: serverExpense.version || 1,
                idempotencyKey: serverExpense.idempotencyKey || `server-${serverExpense._id}`,
              };

              await db.expenses.add(localExpense);
            }

            console.log(`✅ Initial sync complete: ${serverExpenses.length} expenses loaded`);
          }
        } catch (fetchError) {
          console.error('Failed to fetch from server:', fetchError);
          // Continue anyway - app will work offline
        }
      }

      // Now load from IndexedDB
      let query = db.expenses.where('userId').equals(userId);

      if (month) {
        const [year, monthNum] = month.split('-').map(Number);
        const startDate = new Date(year, monthNum - 1, 1);
        const endDate = new Date(year, monthNum, 0, 23, 59, 59);

        query = query.and(
          (exp) => exp.date >= startDate && exp.date <= endDate
        );
      }

      const expenses = await query
        .sortBy('date');

      set({
        expenses: expenses.reverse(),
        loading: false,
      });

      // Refresh pending count
      await get().refreshPendingCount();
    } catch (error) {
      console.error('Failed to load expenses:', error);
      set({
        error: 'Failed to load expenses from local storage',
        loading: false,
      });
    }
  },

  /**
   * Sync pending expenses to server
   */
  syncPendingExpenses: async () => {
    try {
      const queueItems = await db.syncQueue
        .where('nextRetryAt')
        .belowOrEqual(Date.now())
        .toArray();

      if (queueItems.length === 0) return;

      // Process each sync item
      for (const item of queueItems) {
        try {
          const expense = await db.expenses.get(item.expenseId);
          if (!expense) {
            // Expense was deleted, remove from queue
            await db.syncQueue.delete(item.id);
            continue;
          }

          // Update to syncing status
          await db.expenses.update(item.expenseId, { syncStatus: 'syncing' });
          set((state) => ({
            expenses: state.expenses.map((exp) =>
              exp.id === item.expenseId ? { ...exp, syncStatus: 'syncing' } : exp
            ),
          }));

          // Determine API endpoint
          let url = '/api/expenses';
          let method = 'POST';

          if (item.operation === 'update' && expense.serverId) {
            url = `/api/expenses/${expense.serverId}`;
            method = 'PUT';
          } else if (item.operation === 'delete' && expense.serverId) {
            url = `/api/expenses/${expense.serverId}`;
            method = 'DELETE';
          }

          // Make API call with idempotency key
          const response = await fetch(url, {
            method,
            headers: {
              'Content-Type': 'application/json',
              'X-Idempotency-Key': item.idempotencyKey,
            },
            credentials: 'include',
            body: method !== 'DELETE' ? JSON.stringify(item.payload) : undefined,
          });

          if (response.ok) {
            const data = await response.json();

            // Handle successful sync
            if (item.operation === 'create' && data.expense) {
              await db.expenses.update(item.expenseId, {
                serverId: data.expense._id,
                syncStatus: 'synced',
                syncAttempts: 0,
                lastSyncError: undefined,
              });
            } else if (item.operation === 'delete') {
              // Permanently delete after successful server deletion
              await db.expenses.delete(item.expenseId);
            } else {
              await db.expenses.update(item.expenseId, {
                syncStatus: 'synced',
                syncAttempts: 0,
                lastSyncError: undefined,
              });
            }

            // Remove from sync queue
            await db.syncQueue.delete(item.id);

            // Update UI
            set((state) => ({
              expenses: state.expenses.map((exp) =>
                exp.id === item.expenseId
                  ? { ...exp, syncStatus: 'synced', serverId: data.expense?._id || exp.serverId }
                  : exp
              ),
            }));
          } else if (response.status === 409) {
            // Conflict - handle conflict resolution
            const serverData = await response.json();
            await handleConflict(item.expenseId, serverData);
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
              syncAttempts: item.attempts + 1,
              lastSyncError: `HTTP ${response.status}`,
            });

            set((state) => ({
              expenses: state.expenses.map((exp) =>
                exp.id === item.expenseId
                  ? { ...exp, syncStatus: 'error', lastSyncError: `HTTP ${response.status}` }
                  : exp
              ),
            }));
          }
        } catch (error: any) {
          console.error('Sync error for item:', item.id, error);

          // Schedule retry
          const nextRetry = Date.now() + Math.min(1000 * Math.pow(2, item.attempts), 300000);
          await db.syncQueue.update(item.id, {
            attempts: item.attempts + 1,
            nextRetryAt: nextRetry,
          });
          await db.expenses.update(item.expenseId, {
            syncStatus: 'error',
            syncAttempts: item.attempts + 1,
            lastSyncError: error.message || 'Network error',
          });

          set((state) => ({
            expenses: state.expenses.map((exp) =>
              exp.id === item.expenseId
                ? { ...exp, syncStatus: 'error', lastSyncError: error.message }
                : exp
            ),
          }));
        }
      }

      // Refresh pending count after sync
      await get().refreshPendingCount();
    } catch (error) {
      console.error('Sync failed:', error);
    }
  },

  /**
   * Refresh pending sync count
   */
  refreshPendingCount: async () => {
    const count = await db.syncQueue.count();
    set({ pendingSyncCount: count });
  },
}));

/**
 * Handle conflict resolution (server version wins for now)
 */
async function handleConflict(expenseId: string, serverData: any): Promise<void> {
  const localExpense = await db.expenses.get(expenseId);
  if (!localExpense) return;

  // Simple strategy: Last-write-wins based on timestamp
  if (localExpense.localUpdatedAt > new Date(serverData.updatedAt).getTime()) {
    // Local is newer - mark for retry
    await db.expenses.update(expenseId, { syncStatus: 'pending' });
  } else {
    // Server is newer - accept server version
    await db.expenses.update(expenseId, {
      ...serverData,
      id: localExpense.id, // Keep local ID
      serverId: serverData._id,
      syncStatus: 'synced',
      syncAttempts: 0,
      lastSyncError: undefined,
    });
  }
}
