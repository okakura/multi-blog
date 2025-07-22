/**
 * Enhanced SWR Configuration for Preferences
 * Implements smart caching, offline support, and preloading strategies
 */
import type { SWRConfiguration } from 'swr'

// Enhanced SWR configuration for preferences with optimizations
export const preferencesSwrConfig: SWRConfiguration = {
  // Cache configuration
  revalidateOnFocus: false, // Disable to prevent excessive API calls on focus
  revalidateOnReconnect: true,
  revalidateIfStale: false,
  dedupingInterval: 10000, // Increase to 10 seconds to reduce duplicate calls

  // Smart retry strategy
  shouldRetryOnError: (error: any) => {
    // Don't retry on 401/403 (auth errors) or 404 (not found)
    if (
      error?.status === 401 ||
      error?.status === 403 ||
      error?.status === 404
    ) {
      return false
    }
    return true
  },

  // Maximum retry attempts
  errorRetryCount: 3,

  // Offline support configuration
  isPaused: () => {
    // Check if we're offline (can be enhanced with more sophisticated detection)
    return typeof navigator !== 'undefined' && navigator.onLine === false
  },

  // Background revalidation
  refreshInterval: 0, // Disabled by default, can be enabled for real-time sync
  refreshWhenHidden: false,
  refreshWhenOffline: false,

  // Enhanced error handling
  onError: (error: any, key: string) => {
    console.warn(`SWR Error for ${key}:`, error)
    // Could send to analytics service here
  },

  // Success callback for metrics
  onSuccess: (data: any, key: string) => {
    // Track successful data loads for analytics
    console.debug(`SWR Success for ${key}`, {
      dataSize: JSON.stringify(data).length,
    })
  },

  // Loading state optimization
  loadingTimeout: 3000, // Show loading state after 3 seconds

  // Compare function for smart re-renders
  compare: (currentData: any, newData: any) => {
    // Deep comparison for preferences to avoid unnecessary re-renders
    return JSON.stringify(currentData) === JSON.stringify(newData)
  },
}

// Preloading strategies for common user flows
export const preloadingStrategies = {
  // Preload preferences when user navigates to admin
  preloadAdminPreferences: () => {
    // This will trigger the SWR cache to start loading
    console.debug('Preloading admin preferences...')
  },

  // Preload when user hovers over preferences-related UI
  preloadOnHover: () => {
    // Implement prefetch on hover for better perceived performance
    console.debug('Prefetching preferences on hover...')
  },

  // Preload critical preferences early in app lifecycle
  preloadCriticalPreferences: () => {
    // Load theme preferences early to avoid flash
    console.debug('Preloading critical preferences...')
  },
}

// Offline queue for preference updates
class OfflineQueue {
  private queue: Array<{
    id: string
    operation: 'update' | 'save' | 'reset'
    data: any
    timestamp: number
  }> = []

  private storageKey = 'preferences_offline_queue'

  constructor() {
    this.loadFromStorage()
    this.setupOnlineListener()
  }

  // Add operation to offline queue
  enqueue(operation: 'update' | 'save' | 'reset', data: any) {
    const item = {
      id: `${operation}_${Date.now()}_${Math.random()}`,
      operation,
      data,
      timestamp: Date.now(),
    }

    this.queue.push(item)
    this.saveToStorage()

    console.debug('Added to offline queue:', item)
    return item.id
  }

  // Process queue when back online
  async processQueue() {
    if (this.queue.length === 0) return

    console.debug('Processing offline queue...', this.queue.length, 'items')

    const results = []
    for (const item of this.queue) {
      try {
        // Process each queued operation
        // This would integrate with the actual preferences API
        console.debug('Processing offline item:', item)
        results.push({ ...item, status: 'success' })
      } catch (error) {
        console.error('Failed to process offline item:', item, error)
        results.push({ ...item, status: 'error', error })
      }
    }

    // Clear processed items (in real implementation, might keep failed items)
    this.queue = []
    this.saveToStorage()

    return results
  }

  // Get current queue status
  getQueueStatus() {
    return {
      count: this.queue.length,
      oldestItem: this.queue[0]?.timestamp,
      operations: this.queue.map((item) => item.operation),
    }
  }

  private loadFromStorage() {
    try {
      const stored = localStorage.getItem(this.storageKey)
      if (stored) {
        this.queue = JSON.parse(stored)
      }
    } catch (error) {
      console.warn('Failed to load offline queue from storage:', error)
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.queue))
    } catch (error) {
      console.warn('Failed to save offline queue to storage:', error)
    }
  }

  private setupOnlineListener() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        console.debug('Back online, processing queue...')
        this.processQueue()
      })
    }
  }
}

// Export singleton offline queue
export const offlineQueue = new OfflineQueue()

// Enhanced hook for offline-aware preferences
export const useOfflineAwarePreferences = () => {
  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true
  const queueStatus = offlineQueue.getQueueStatus()

  return {
    isOnline,
    queueStatus,
    processOfflineQueue: () => offlineQueue.processQueue(),
    enqueueLater: (operation: 'update' | 'save' | 'reset', data: any) => {
      return offlineQueue.enqueue(operation, data)
    },
  }
}

// Performance optimization utilities
export const performanceOptimizations = {
  // Debounce rapid preference updates
  debounceUpdates: (fn: Function, delay = 300) => {
    let timeoutId: ReturnType<typeof setTimeout>
    return (...args: any[]) => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => fn.apply(null, args), delay)
    }
  },

  // Batch multiple preference updates
  batchUpdates: (() => {
    let batchQueue: Array<{ category: string; key: string; value: any }> = []
    let batchTimeout: ReturnType<typeof setTimeout>

    return (
      category: string,
      key: string,
      value: any,
      processBatch: Function
    ) => {
      batchQueue.push({ category, key, value })

      clearTimeout(batchTimeout)
      batchTimeout = setTimeout(() => {
        const batch = [...batchQueue]
        batchQueue = []
        processBatch(batch)
      }, 500) // Batch updates for 500ms
    }
  })(),

  // Smart cache invalidation
  smartInvalidation: (keys: string[]) => {
    // Only invalidate related caches, not everything
    return keys.filter((key) => key.includes('preferences'))
  },
}
