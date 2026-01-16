// hooks/useNetworkAware.ts - Hook for network-aware features
'use client';

import { useEffect, useState } from 'react';

interface NetworkInfo {
  online: boolean;
  effectiveType: '4g' | '3g' | '2g' | 'slow-2g' | 'unknown';
  saveData: boolean;
  downlink?: number;
  rtt?: number;
}

export function useNetworkAware() {
  const [network, setNetwork] = useState<NetworkInfo>({
    online: typeof navigator !== 'undefined' ? navigator.onLine : true,
    effectiveType: '4g',
    saveData: false,
  });

  useEffect(() => {
    // Update online/offline status
    const updateOnlineStatus = () => {
      setNetwork((prev) => ({ ...prev, online: navigator.onLine }));
    };

    // Update connection info
    const updateConnectionInfo = () => {
      if ('connection' in navigator) {
        const conn = (navigator as any).connection;
        setNetwork((prev) => ({
          ...prev,
          effectiveType: conn.effectiveType || '4g',
          saveData: conn.saveData || false,
          downlink: conn.downlink,
          rtt: conn.rtt,
        }));
      }
    };

    // Initial update
    updateConnectionInfo();

    // Listen for changes
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    if ('connection' in navigator) {
      const conn = (navigator as any).connection;
      conn.addEventListener('change', updateConnectionInfo);

      return () => {
        window.removeEventListener('online', updateOnlineStatus);
        window.removeEventListener('offline', updateOnlineStatus);
        conn.removeEventListener('change', updateConnectionInfo);
      };
    }

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  // Derived states
  const isSlow = ['slow-2g', '2g', '3g'].includes(network.effectiveType);
  const shouldReduceData = network.saveData || isSlow;

  return {
    ...network,
    isSlow,
    shouldReduceData,
    isOffline: !network.online,
  };
}

/**
 * Hook to get appropriate page size based on network
 */
export function useNetworkAwarePageSize(
  defaultSize: number = 50
): number {
  const { isSlow, saveData } = useNetworkAware();

  if (isSlow) return 10;
  if (saveData) return 20;
  return defaultSize;
}

/**
 * Hook to determine if heavy features should be loaded
 */
export function useShouldLoadHeavyFeatures(): boolean {
  const { isSlow, saveData, isOffline } = useNetworkAware();
  return !isSlow && !saveData && !isOffline;
}
