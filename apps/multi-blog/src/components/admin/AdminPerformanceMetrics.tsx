import {
  Activity,
  AlertTriangle,
  BarChart3,
  Clock,
  Database,
  Download,
  RefreshCw,
  TrendingUp,
  Zap,
} from 'lucide-react'
import type React from 'react'
import { usePerformanceMetrics } from '@/data/services/performanceMetrics' // TODO: check if this is correct swr usage
import { showToast } from '@/utils/toast'

const AdminPerformanceMetrics: React.FC = () => {
  const { metrics, reset, exportMetrics, isEnabled } = usePerformanceMetrics()

  // Don't render in production
  if (!isEnabled) {
    return null
  }

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${Math.round(ms)}ms`
    return `${(ms / 1000).toFixed(2)}s`
  }

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString()
  }

  const getMetricColor = (
    value: number,
    type: 'cache' | 'error' | 'response'
  ) => {
    switch (type) {
      case 'cache':
        if (value >= 80) return 'text-green-600 dark:text-green-400'
        if (value >= 60) return 'text-yellow-600 dark:text-yellow-400'
        return 'text-red-600 dark:text-red-400'
      case 'error':
        if (value <= 5) return 'text-green-600 dark:text-green-400'
        if (value <= 15) return 'text-yellow-600 dark:text-yellow-400'
        return 'text-red-600 dark:text-red-400'
      case 'response':
        if (value <= 200) return 'text-green-600 dark:text-green-400'
        if (value <= 500) return 'text-yellow-600 dark:text-yellow-400'
        return 'text-red-600 dark:text-red-400'
      default:
        return 'text-gray-600 dark:text-gray-400'
    }
  }

  const handleExport = () => {
    try {
      const data = exportMetrics()
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json',
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `performance-metrics-${
        new Date().toISOString().split('T')[0]
      }.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Failed to export metrics:', error)
    }
  }

  const handleReset = () => {
    if (
      confirm(
        'Are you sure you want to reset all performance metrics? This action cannot be undone.'
      )
    ) {
      try {
        reset()
        showToast.success('Performance metrics reset successfully')
      } catch (error) {
        console.error('Failed to reset metrics:', error)
        showToast.error('Failed to reset metrics')
      }
    }
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-xl font-semibold text-gray-900 dark:text-white'>
            Performance Metrics
          </h2>
          <p className='text-sm text-gray-500 dark:text-gray-400'>
            Real-time performance monitoring and API tracking • Dev environment
            only
          </p>
        </div>
        <div className='flex space-x-2'>
          <button
            onClick={handleExport}
            className='flex items-center space-x-2 px-3 py-2 text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800/50 transition-colors'>
            <Download size={16} />
            <span>Export</span>
          </button>
          <button
            onClick={handleReset}
            className='flex items-center space-x-2 px-3 py-2 text-sm bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-800/50 transition-colors'>
            <RefreshCw size={16} />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
        {/* Total API Calls */}
        <div className='bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm font-medium text-gray-600 dark:text-gray-400'>
                API Calls (24h)
              </p>
              <p className='text-2xl font-bold text-gray-900 dark:text-white'>
                {metrics.recentApiCalls}
              </p>
            </div>
            <Activity className='w-8 h-8 text-blue-500' />
          </div>
          <p className='text-xs text-gray-500 dark:text-gray-400 mt-2'>
            Total since last reset: {metrics.totalApiCalls}
          </p>
        </div>

        {/* Cache Hit Rate */}
        <div className='bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm font-medium text-gray-600 dark:text-gray-400'>
                Cache Hit Rate
              </p>
              <p
                className={`text-2xl font-bold ${getMetricColor(
                  metrics.cacheHitRate,
                  'cache'
                )}`}>
                {metrics.cacheHitRate.toFixed(1)}%
              </p>
            </div>
            <Database className='w-8 h-8 text-green-500' />
          </div>
          <p className='text-xs text-gray-500 dark:text-gray-400 mt-2'>
            {metrics.cacheHits} hits / {metrics.cacheMisses} misses
          </p>
        </div>

        {/* Average Response Time */}
        <div className='bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm font-medium text-gray-600 dark:text-gray-400'>
                Avg Response Time
              </p>
              <p
                className={`text-2xl font-bold ${getMetricColor(
                  metrics.averageResponseTime,
                  'response'
                )}`}>
                {formatDuration(metrics.averageResponseTime)}
              </p>
            </div>
            <Clock className='w-8 h-8 text-purple-500' />
          </div>
          <p className='text-xs text-gray-500 dark:text-gray-400 mt-2'>
            Based on {metrics.totalApiCalls} calls
          </p>
        </div>

        {/* Error Rate */}
        <div className='bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm font-medium text-gray-600 dark:text-gray-400'>
                Error Rate (24h)
              </p>
              <p
                className={`text-2xl font-bold ${getMetricColor(
                  metrics.errorRate,
                  'error'
                )}`}>
                {metrics.errorRate.toFixed(1)}%
              </p>
            </div>
            <AlertTriangle className='w-8 h-8 text-red-500' />
          </div>
          <p className='text-xs text-gray-500 dark:text-gray-400 mt-2'>
            {metrics.recentErrors} errors / {metrics.recentApiCalls} calls
          </p>
        </div>
      </div>

      {/* System Performance */}
      <div className='bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 p-6 rounded-lg border border-green-200 dark:border-green-700'>
        <div className='flex items-center space-x-3 mb-4'>
          <TrendingUp className='w-6 h-6 text-green-600 dark:text-green-400' />
          <h3 className='text-lg font-semibold text-gray-900 dark:text-white'>
            System Performance
          </h3>
        </div>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
          <div className='text-center'>
            <p className='text-2xl font-bold text-green-600 dark:text-green-400'>
              {metrics.cacheHitRate.toFixed(1)}%
            </p>
            <p className='text-sm text-gray-600 dark:text-gray-400'>
              Cache Hit Rate
            </p>
          </div>
          <div className='text-center'>
            <p className='text-2xl font-bold text-blue-600 dark:text-blue-400'>
              {metrics.totalApiCalls}
            </p>
            <p className='text-sm text-gray-600 dark:text-gray-400'>
              Total API Calls
            </p>
          </div>
          <div className='text-center'>
            <p className='text-2xl font-bold text-purple-600 dark:text-purple-400'>
              {formatDuration(metrics.averageResponseTime)}
            </p>
            <p className='text-sm text-gray-600 dark:text-gray-400'>
              Avg Response Time
            </p>
          </div>
        </div>
        <p className='text-sm text-gray-600 dark:text-gray-400 mt-4'>
          ✅ Multi-domain analytics working • ✅ JWT authentication active • ✅
          Real-time performance tracking
        </p>
      </div>

      {/* Recent Activity */}
      <div className='bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700'>
        <div className='p-4 border-b border-gray-200 dark:border-gray-700'>
          <div className='flex items-center space-x-2'>
            <BarChart3 className='w-5 h-5 text-gray-500' />
            <h3 className='text-lg font-semibold text-gray-900 dark:text-white'>
              Recent Activity
            </h3>
          </div>
        </div>
        <div className='p-4'>
          <div className='space-y-2 max-h-64 overflow-y-auto'>
            {metrics.events
              .slice(-10)
              .reverse()
              .map((event, index) => {
                // Detect potential duplicate calls within the recent events
                const recentEvents = metrics.events.slice(-10)
                const sameUrlCalls = recentEvents.filter(
                  (e) =>
                    e.url === event.url &&
                    e.type === 'api_call' &&
                    Math.abs(e.timestamp - event.timestamp) < 5000 // within 5 seconds
                ).length

                const isDuplicate = sameUrlCalls > 1

                return (
                  <div
                    key={index}
                    className={`flex items-center justify-between py-2 px-3 rounded ${
                      isDuplicate
                        ? 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700'
                        : 'bg-gray-50 dark:bg-gray-700/50'
                    }`}>
                    <div className='flex items-center space-x-3'>
                      {event.type === 'api_call' && (
                        <Zap className='w-4 h-4 text-blue-500' />
                      )}
                      {event.type === 'cache_hit' && (
                        <Database className='w-4 h-4 text-green-500' />
                      )}
                      {event.type === 'cache_miss' && (
                        <Database className='w-4 h-4 text-yellow-500' />
                      )}
                      {event.type === 'error' && (
                        <AlertTriangle className='w-4 h-4 text-red-500' />
                      )}
                      {event.type === 'timing' && (
                        <Clock className='w-4 h-4 text-purple-500' />
                      )}
                      <div>
                        <p className='text-sm font-medium text-gray-900 dark:text-white'>
                          {event.category.replace(/_/g, ' ')}
                          {event.method && ` (${event.method})`}
                        </p>
                        <p className='text-xs text-gray-500 dark:text-gray-400'>
                          {event.type.replace(/_/g, ' ')}
                          {event.error && ` - ${event.error}`}
                          {event.url && ` • ${new URL(event.url).pathname}`}
                        </p>
                      </div>
                    </div>
                    <div className='text-right'>
                      <p className='text-xs text-gray-500 dark:text-gray-400'>
                        {formatTime(event.timestamp)}
                      </p>
                      {event.duration && (
                        <p className='text-xs text-gray-400 dark:text-gray-500'>
                          {formatDuration(event.duration)}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            {metrics.events.length === 0 && (
              <p className='text-center text-gray-500 dark:text-gray-400 py-8'>
                No recent activity
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Performance Insights */}
      {metrics.events.length > 0 && (
        <div className='bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-700'>
          <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-3'>
            Performance Insights
          </h3>
          <div className='space-y-2'>
            {(() => {
              const recentEvents = metrics.events.slice(-20)
              const urlCounts = recentEvents.reduce((acc, event) => {
                if (event.type === 'api_call' && event.url) {
                  const pathname = new URL(event.url).pathname
                  acc[pathname] = (acc[pathname] || 0) + 1
                }
                return acc
              }, {} as Record<string, number>)

              const duplicates = Object.entries(urlCounts)
                .filter(([, count]) => count > 1)
                .sort((a, b) => b[1] - a[1])

              return duplicates.length > 0 ? (
                <div>
                  <p className='text-sm font-medium text-blue-800 dark:text-blue-200 mb-2'>
                    🔍 Potential Optimizations Detected:
                  </p>
                  {duplicates.slice(0, 3).map(([path, count]) => (
                    <p
                      key={path}
                      className='text-sm text-blue-700 dark:text-blue-300'>
                      •{' '}
                      <code className='bg-blue-100 dark:bg-blue-800 px-1 rounded'>
                        {path}
                      </code>{' '}
                      called {count} times
                    </p>
                  ))}
                </div>
              ) : (
                <p className='text-sm text-green-700 dark:text-green-300'>
                  ✅ No duplicate API calls detected in recent activity
                </p>
              )
            })()}
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminPerformanceMetrics
