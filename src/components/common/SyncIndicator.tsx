// components/common/SyncIndicator.tsx - UI component showing sync status
'use client';

import { useEffect, useState } from 'react';
import { syncService } from '@/services/sync-service';
import { useExpenseStore } from '@/stores/expense-store';

export function SyncIndicator() {
  const [syncStatus, setSyncStatus] = useState<{
    syncing: boolean;
    pendingCount: number;
    lastSync: number | null;
    hasErrors: boolean;
  }>({
    syncing: false,
    pendingCount: 0,
    lastSync: null,
    hasErrors: false,
  });

  const pendingSyncCount = useExpenseStore((state) => state.pendingSyncCount);

  useEffect(() => {
    // Update sync status periodically
    const updateStatus = async () => {
      const status = await syncService.getSyncStatus();
      setSyncStatus(status);
    };

    updateStatus();
    const interval = setInterval(updateStatus, 5000); // Every 5 seconds

    return () => clearInterval(interval);
  }, []);

  // Don't show if nothing to sync and no errors
  if (pendingSyncCount === 0 && !syncStatus.hasErrors) {
    return null;
  }

  const handleRetry = async () => {
    await syncService.retryFailedSyncs();
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div
        className={`rounded-lg shadow-lg px-4 py-3 max-w-sm ${
          syncStatus.hasErrors
            ? 'bg-red-500 text-white'
            : syncStatus.syncing
            ? 'bg-blue-500 text-white'
            : 'bg-gray-800 text-gray-100'
        }`}
      >
        <div className="flex items-center gap-3">
          {/* Icon */}
          <div className="flex-shrink-0">
            {syncStatus.syncing ? (
              <svg
                className="animate-spin h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            ) : syncStatus.hasErrors ? (
              <svg
                className="h-5 w-5"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg
                className="h-5 w-5"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            )}
          </div>

          {/* Message */}
          <div className="flex-1 min-w-0">
            {syncStatus.syncing ? (
              <p className="text-sm font-medium">Syncing changes...</p>
            ) : syncStatus.hasErrors ? (
              <div>
                <p className="text-sm font-medium">Sync failed</p>
                <p className="text-xs opacity-90 mt-1">
                  {pendingSyncCount} item{pendingSyncCount !== 1 ? 's' : ''} pending
                </p>
              </div>
            ) : (
              <div>
                <p className="text-sm font-medium">
                  {pendingSyncCount} pending
                </p>
                {syncStatus.lastSync && (
                  <p className="text-xs opacity-75 mt-1">
                    Last synced {formatTimeSince(syncStatus.lastSync)}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Retry button for errors */}
          {syncStatus.hasErrors && (
            <button
              onClick={handleRetry}
              className="flex-shrink-0 px-3 py-1 text-xs font-medium bg-white text-red-600 rounded hover:bg-red-50 transition-colors"
            >
              Retry
            </button>
          )}
        </div>

        {/* Offline indicator */}
        {!navigator.onLine && (
          <div className="mt-2 pt-2 border-t border-white/20">
            <p className="text-xs opacity-90">
              📡 Offline - Changes will sync when online
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function formatTimeSince(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}
