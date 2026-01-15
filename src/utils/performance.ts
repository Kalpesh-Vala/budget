/**
 * Performance optimization utilities for the budget tracker application
 */

// Cache management utilities
export const cacheManager = {
  /**
   * Clear all cache entries for a specific user
   */
  clearUserCache(userId: string) {
    if (typeof window !== 'undefined' && 'caches' in window) {
      caches.keys().then(cacheNames => {
        cacheNames.forEach(cacheName => {
          caches.open(cacheName).then(cache => {
            cache.keys().then(requests => {
              requests.forEach(request => {
                if (request.url.includes(userId)) {
                  cache.delete(request);
                }
              });
            });
          });
        });
      });
    }
  },

  /**
   * Prefetch API data to improve perceived performance
   */
  prefetchData(url: string) {
    if (typeof window !== 'undefined' && 'fetch' in window) {
      return fetch(url, { priority: 'low' }).catch(() => {
        // Silently fail if prefetch fails
      });
    }
  },

  /**
   * Batch API requests to reduce network overhead
   */
  batchRequests(requests: Promise<any>[]) {
    return Promise.all(requests);
  }
};

// Performance measurement utilities
export const performanceUtils = {
  /**
   * Measure API response time
   */
  measureApiTime(label: string) {
    return {
      start: () => performance.mark(`${label}-start`),
      end: () => {
        performance.mark(`${label}-end`);
        try {
          performance.measure(label, `${label}-start`, `${label}-end`);
          const measure = performance.getEntriesByName(label)[0];
          console.log(`${label}: ${measure.duration.toFixed(2)}ms`);
        } catch (e) {
          // Silently fail if performance API not available
        }
      }
    };
  },

  /**
   * Report web vitals
   */
  reportWebVitals(metric: any) {
    if (typeof window !== 'undefined') {
      const body = JSON.stringify(metric);
      // Send to analytics endpoint if needed
      console.log(`Web Vital - ${metric.name}: ${metric.value.toFixed(2)}`);
    }
  }
};

// Request debouncing and throttling
export const requestOptimization = {
  /**
   * Debounce function for search/filter inputs
   */
  debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;
    return function (...args: Parameters<T>) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  },

  /**
   * Throttle function for scroll/resize events
   */
  throttle<T extends (...args: any[]) => any>(func: T, limit: number): (...args: Parameters<T>) => void {
    let inThrottle: boolean;
    return function (...args: Parameters<T>) {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  }
};
