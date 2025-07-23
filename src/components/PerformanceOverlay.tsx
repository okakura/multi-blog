import { Activity, Clock, Eye, EyeOff, Gauge, Wifi, Zap } from 'lucide-react'
import { useEffect, useState } from 'react'
import { isPerformanceOverlayEnabled } from '../utils/performanceOverlay'

interface PerformanceMetrics {
  pageLoadTime: number
  renderTime: number
  memoryUsage: number
  connectionType: string
  navigationTiming: {
    domContentLoaded: number
    firstPaint: number
    firstContentfulPaint: number
    largestContentfulPaint: number
    firstInputDelay: number
  }
  resourceMetrics: {
    totalResources: number
    totalSize: number
    totalDuration: number
  }
}

const PerformanceOverlay: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false)
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null)
  const [isCollapsed, setIsCollapsed] = useState(false)

  useEffect(() => {
    // Show overlay in development or if performance flag is set
    const showOverlay = isPerformanceOverlayEnabled()
    
    setIsVisible(showOverlay)

    if (showOverlay) {
      collectMetrics()
      
      // Update metrics periodically
      const interval = setInterval(collectMetrics, 2000)
      return () => clearInterval(interval)
    }
  }, [])

  const collectMetrics = () => {
    if (!window.performance) return

    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    const paint = performance.getEntriesByType('paint')
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[]
    
    // Calculate metrics
    const pageLoadTime = navigation ? navigation.loadEventEnd - navigation.fetchStart : 0
    const renderTime = navigation ? navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart : 0
    
    // Memory usage (if available)
    const memory = (performance as any).memory
    const memoryUsage = memory ? memory.usedJSHeapSize / 1024 / 1024 : 0 // MB
    
    // Connection info
    const connection = (navigator as any).connection
    const connectionType = connection ? connection.effectiveType || connection.type || 'unknown' : 'unknown'
    
    // Navigation timing
    const firstPaint = paint.find(p => p.name === 'first-paint')?.startTime || 0
    const firstContentfulPaint = paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0
    
    // LCP and FID (if available)
    let largestContentfulPaint = 0
    let firstInputDelay = 0
    
    // Get LCP
    if ('PerformanceObserver' in window) {
      try {
        new PerformanceObserver((list) => {
          const entries = list.getEntries()
          const lastEntry = entries[entries.length - 1]
          largestContentfulPaint = lastEntry.startTime
        }).observe({ entryTypes: ['largest-contentful-paint'] })
      } catch (e) {
        // PerformanceObserver not supported
      }
    }
    
    // Resource metrics
    const totalSize = resources.reduce((sum, resource) => sum + (resource.transferSize || 0), 0)
    const totalDuration = resources.reduce((sum, resource) => sum + resource.duration, 0)
    
    setMetrics({
      pageLoadTime: Math.round(pageLoadTime),
      renderTime: Math.round(renderTime),
      memoryUsage: Math.round(memoryUsage * 100) / 100,
      connectionType,
      navigationTiming: {
        domContentLoaded: Math.round(navigation?.domContentLoadedEventEnd - navigation?.fetchStart || 0),
        firstPaint: Math.round(firstPaint),
        firstContentfulPaint: Math.round(firstContentfulPaint),
        largestContentfulPaint: Math.round(largestContentfulPaint),
        firstInputDelay: Math.round(firstInputDelay)
      },
      resourceMetrics: {
        totalResources: resources.length,
        totalSize: Math.round(totalSize / 1024), // KB
        totalDuration: Math.round(totalDuration)
      }
    })
  }

  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`
    return `${(ms / 1000).toFixed(1)}s`
  }

  const formatSize = (kb: number) => {
    if (kb < 1024) return `${kb}KB`
    return `${(kb / 1024).toFixed(1)}MB`
  }

  const getPerformanceColor = (value: number, thresholds: { good: number; fair: number }) => {
    if (value <= thresholds.good) return 'text-green-500'
    if (value <= thresholds.fair) return 'text-yellow-500'
    return 'text-red-500'
  }

  if (!isVisible || !metrics) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 font-mono text-xs">
      <div className="bg-black/90 backdrop-blur-sm text-white rounded-lg shadow-2xl border border-gray-700 max-w-sm">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-gray-700">
          <div className="flex items-center space-x-2">
            <Gauge className="w-4 h-4 text-blue-400" />
            <span className="font-semibold">Performance</span>
          </div>
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1 hover:bg-gray-700 rounded transition-colors">
              {isCollapsed ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            </button>
            <button
              onClick={() => setIsVisible(false)}
              className="p-1 hover:bg-gray-700 rounded transition-colors text-gray-400 hover:text-white">
              ×
            </button>
          </div>
        </div>

        {!isCollapsed && (
          <div className="p-3 space-y-3">
            {/* Core Metrics */}
            <div className="space-y-2">
              <h4 className="text-blue-300 font-semibold mb-2">Core Metrics</h4>
              
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <Clock className="w-3 h-3 text-gray-400" />
                  <span>Page Load</span>
                </div>
                <span className={getPerformanceColor(metrics.pageLoadTime, { good: 1000, fair: 3000 })}>
                  {formatTime(metrics.pageLoadTime)}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <Zap className="w-3 h-3 text-gray-400" />
                  <span>DOM Ready</span>
                </div>
                <span className={getPerformanceColor(metrics.navigationTiming.domContentLoaded, { good: 800, fair: 1500 })}>
                  {formatTime(metrics.navigationTiming.domContentLoaded)}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <Activity className="w-3 h-3 text-gray-400" />
                  <span>Memory</span>
                </div>
                <span className={getPerformanceColor(metrics.memoryUsage, { good: 50, fair: 100 })}>
                  {metrics.memoryUsage}MB
                </span>
              </div>

              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <Wifi className="w-3 h-3 text-gray-400" />
                  <span>Connection</span>
                </div>
                <span className="text-gray-300">{metrics.connectionType}</span>
              </div>
            </div>

            {/* Paint Metrics */}
            <div className="space-y-2 border-t border-gray-700 pt-3">
              <h4 className="text-green-300 font-semibold mb-2">Paint Metrics</h4>
              
              {metrics.navigationTiming.firstPaint > 0 && (
                <div className="flex justify-between items-center">
                  <span>First Paint</span>
                  <span className={getPerformanceColor(metrics.navigationTiming.firstPaint, { good: 1000, fair: 2000 })}>
                    {formatTime(metrics.navigationTiming.firstPaint)}
                  </span>
                </div>
              )}

              {metrics.navigationTiming.firstContentfulPaint > 0 && (
                <div className="flex justify-between items-center">
                  <span>FCP</span>
                  <span className={getPerformanceColor(metrics.navigationTiming.firstContentfulPaint, { good: 1500, fair: 2500 })}>
                    {formatTime(metrics.navigationTiming.firstContentfulPaint)}
                  </span>
                </div>
              )}

              {metrics.navigationTiming.largestContentfulPaint > 0 && (
                <div className="flex justify-between items-center">
                  <span>LCP</span>
                  <span className={getPerformanceColor(metrics.navigationTiming.largestContentfulPaint, { good: 2500, fair: 4000 })}>
                    {formatTime(metrics.navigationTiming.largestContentfulPaint)}
                  </span>
                </div>
              )}
            </div>

            {/* Resource Metrics */}
            <div className="space-y-2 border-t border-gray-700 pt-3">
              <h4 className="text-purple-300 font-semibold mb-2">Resources</h4>
              
              <div className="flex justify-between items-center">
                <span>Total Resources</span>
                <span className="text-gray-300">{metrics.resourceMetrics.totalResources}</span>
              </div>

              <div className="flex justify-between items-center">
                <span>Total Size</span>
                <span className={getPerformanceColor(metrics.resourceMetrics.totalSize, { good: 500, fair: 1000 })}>
                  {formatSize(metrics.resourceMetrics.totalSize)}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span>Load Duration</span>
                <span className={getPerformanceColor(metrics.resourceMetrics.totalDuration, { good: 2000, fair: 5000 })}>
                  {formatTime(metrics.resourceMetrics.totalDuration)}
                </span>
              </div>
            </div>

            {/* Performance Score */}
            <div className="border-t border-gray-700 pt-3">
              <div className="flex justify-between items-center">
                <span className="font-semibold">Score</span>
                <span className={`font-bold ${
                  metrics.pageLoadTime <= 1000 && metrics.navigationTiming.firstContentfulPaint <= 1500 
                    ? 'text-green-400' 
                    : metrics.pageLoadTime <= 3000 && metrics.navigationTiming.firstContentfulPaint <= 2500
                    ? 'text-yellow-400'
                    : 'text-red-400'
                }`}>
                  {metrics.pageLoadTime <= 1000 && metrics.navigationTiming.firstContentfulPaint <= 1500 
                    ? 'GOOD' 
                    : metrics.pageLoadTime <= 3000 && metrics.navigationTiming.firstContentfulPaint <= 2500
                    ? 'FAIR'
                    : 'POOR'
                  }
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Toggle button when collapsed */}
      {isCollapsed && (
        <button
          onClick={() => setIsCollapsed(false)}
          className="mt-2 bg-black/90 backdrop-blur-sm text-white p-2 rounded-lg border border-gray-700 hover:bg-gray-800 transition-colors">
          <Gauge className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}

export default PerformanceOverlay
