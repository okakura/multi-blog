// Development-only performance monitoring service
// Only enabled in development environment for zero production impact
import React from 'react'

interface PerformanceEvent {
  timestamp: number
  type: 'api_call' | 'cache_hit' | 'cache_miss' | 'error' | 'timing'
  category: string
  duration?: number
  error?: string
  url?: string
  method?: string
  status?: number
  details?: Record<string, any>
}

interface PerformanceMetrics {
  totalApiCalls: number
  recentApiCalls: number
  cacheHits: number
  cacheMisses: number
  errors: number
  recentErrors: number
  averageResponseTime: number
  cacheHitRate: number
  errorRate: number
  events: PerformanceEvent[]
  resetTime: number
}

class PerformanceMetricsService {
  private metrics: PerformanceMetrics = {
    totalApiCalls: 0,
    recentApiCalls: 0,
    cacheHits: 0,
    cacheMisses: 0,
    errors: 0,
    recentErrors: 0,
    averageResponseTime: 0,
    cacheHitRate: 0,
    errorRate: 0,
    events: [],
    resetTime: Date.now(),
  }

  private responseTimes: number[] = []
  private readonly maxEvents = 100
  private readonly recentTimeWindow = 24 * 60 * 60 * 1000 // 24 hours

  // Check if we're in development environment
  get isEnabled(): boolean {
    if (typeof window === 'undefined') return false
    return (
      process.env.NODE_ENV === 'development' ||
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1'
    )
  }

  private addEvent(event: PerformanceEvent) {
    if (!this.isEnabled) return

    this.metrics.events.push(event)

    // Keep only the most recent events
    if (this.metrics.events.length > this.maxEvents) {
      this.metrics.events = this.metrics.events.slice(-this.maxEvents)
    }

    this.updateRecentMetrics()
  }

  private updateRecentMetrics() {
    const now = Date.now()
    const recentEvents = this.metrics.events.filter(
      (event) => now - event.timestamp <= this.recentTimeWindow
    )

    this.metrics.recentApiCalls = recentEvents.filter(
      (event) => event.type === 'api_call'
    ).length

    this.metrics.recentErrors = recentEvents.filter(
      (event) => event.type === 'error'
    ).length

    this.metrics.errorRate =
      this.metrics.recentApiCalls > 0
        ? (this.metrics.recentErrors / this.metrics.recentApiCalls) * 100
        : 0
  }

  private updateAverageResponseTime(duration: number) {
    this.responseTimes.push(duration)

    // Keep only recent response times for accuracy
    if (this.responseTimes.length > 1000) {
      this.responseTimes = this.responseTimes.slice(-1000)
    }

    this.metrics.averageResponseTime =
      this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length
  }

  // Enhanced API call tracking with URL, method, and status
  trackApiCall(
    category: string,
    duration: number,
    url?: string,
    method?: string,
    status?: number,
    details?: Record<string, any>
  ) {
    if (!this.isEnabled) return

    this.addEvent({
      timestamp: Date.now(),
      type: 'api_call',
      category,
      duration,
      url,
      method,
      status,
      details,
    })

    this.metrics.totalApiCalls++
    this.updateAverageResponseTime(duration)
  }

  // Track cache performance
  trackCacheHit(category: string, details?: Record<string, any>) {
    if (!this.isEnabled) return

    this.addEvent({
      timestamp: Date.now(),
      type: 'cache_hit',
      category,
      details,
    })

    this.metrics.cacheHits++
    this.updateCacheHitRate()
  }

  trackCacheMiss(category: string, details?: Record<string, any>) {
    if (!this.isEnabled) return

    this.addEvent({
      timestamp: Date.now(),
      type: 'cache_miss',
      category,
      details,
    })

    this.metrics.cacheMisses++
    this.updateCacheHitRate()
  }

  private updateCacheHitRate() {
    const total = this.metrics.cacheHits + this.metrics.cacheMisses
    this.metrics.cacheHitRate =
      total > 0 ? (this.metrics.cacheHits / total) * 100 : 0
  }

  // Enhanced error tracking with URL and status
  trackError(
    category: string,
    error: string,
    details?: Record<string, any>,
    url?: string,
    status?: number
  ) {
    if (!this.isEnabled) return

    this.addEvent({
      timestamp: Date.now(),
      type: 'error',
      category,
      error,
      url,
      status,
      details,
    })

    this.metrics.errors++
  }

  trackTiming(
    category: string,
    duration: number,
    details?: Record<string, any>
  ) {
    if (!this.isEnabled) return

    this.addEvent({
      timestamp: Date.now(),
      type: 'timing',
      category,
      duration,
      details,
    })
  }

  // Automatic fetch wrapper for comprehensive API tracking
  wrapFetchWithMetrics(originalFetch: typeof fetch): typeof fetch {
    if (!this.isEnabled) return originalFetch

    return async (
      input: RequestInfo | URL,
      init?: RequestInit
    ): Promise<Response> => {
      const startTime = Date.now()
      const url = input instanceof Request ? input.url : input.toString()
      const method =
        init?.method || (input instanceof Request ? input.method : 'GET')

      // Categorize API calls based on URL patterns
      let category = 'api_call'
      if (url.includes('/preferences')) category = 'preferences_api'
      else if (url.includes('/posts')) category = 'posts_api'
      else if (url.includes('/analytics')) category = 'analytics_api'
      else if (url.includes('/admin')) category = 'admin_api'

      try {
        const response = await originalFetch(input, init)
        const duration = Date.now() - startTime

        this.trackApiCall(category, duration, url, method, response.status, {
          ok: response.ok,
          statusText: response.statusText,
        })

        if (!response.ok) {
          this.trackError(
            category,
            `HTTP ${response.status}: ${response.statusText}`,
            {
              url,
              method,
              status: response.status,
            }
          )
        }

        return response
      } catch (error) {
        const duration = Date.now() - startTime
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error'

        this.trackError(category, errorMessage, {
          url,
          method,
          duration,
        })

        throw error
      }
    }
  }

  getMetrics(): PerformanceMetrics {
    return { ...this.metrics }
  }

  reset() {
    if (!this.isEnabled) return

    this.metrics = {
      totalApiCalls: 0,
      recentApiCalls: 0,
      cacheHits: 0,
      cacheMisses: 0,
      errors: 0,
      recentErrors: 0,
      averageResponseTime: 0,
      cacheHitRate: 0,
      errorRate: 0,
      events: [],
      resetTime: Date.now(),
    }
    this.responseTimes = []
  }

  exportMetrics() {
    if (!this.isEnabled) return null

    return {
      timestamp: Date.now(),
      metrics: this.getMetrics(),
      environment: {
        userAgent: navigator.userAgent,
        url: window.location.href,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight,
        },
      },
    }
  }
}

// Singleton instance
const performanceMetrics = new PerformanceMetricsService()

// React hook for component usage
export const usePerformanceMetrics = () => {
  const [metrics, setMetrics] = React.useState(performanceMetrics.getMetrics())

  React.useEffect(() => {
    if (!performanceMetrics.isEnabled) return

    const interval = setInterval(() => {
      setMetrics(performanceMetrics.getMetrics())
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  return {
    metrics,
    isEnabled: performanceMetrics.isEnabled,
    trackApiCall: performanceMetrics.trackApiCall.bind(performanceMetrics),
    trackCacheHit: performanceMetrics.trackCacheHit.bind(performanceMetrics),
    trackCacheMiss: performanceMetrics.trackCacheMiss.bind(performanceMetrics),
    trackError: performanceMetrics.trackError.bind(performanceMetrics),
    trackTiming: performanceMetrics.trackTiming.bind(performanceMetrics),
    wrapFetchWithMetrics:
      performanceMetrics.wrapFetchWithMetrics.bind(performanceMetrics),
    reset: performanceMetrics.reset.bind(performanceMetrics),
    exportMetrics: performanceMetrics.exportMetrics.bind(performanceMetrics),
  }
}

// Auto-wrap fetch if in development
if (performanceMetrics.isEnabled && typeof window !== 'undefined') {
  const originalFetch = window.fetch
  window.fetch = performanceMetrics.wrapFetchWithMetrics(originalFetch)
}

// Export both default and named
export { performanceMetrics }
export default performanceMetrics
