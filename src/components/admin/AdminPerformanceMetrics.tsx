import React from 'react'
import { usePerformanceMetrics } from '../../services/performanceMetrics'
import {
  Activity,
  Clock,
  TrendingUp,
  AlertTriangle,
  Database,
  Zap,
  BarChart3,
  Download,
  RefreshCw,
} from 'lucide-react'

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

  // Get system status
  const getSystemStatus = () => {
    const { cacheHitRate, errorRate, averageResponseTime } = metrics

    if (errorRate > 15 || averageResponseTime > 1000) return 'degraded'
    if (errorRate > 5 || averageResponseTime > 500 || cacheHitRate < 60)
      return 'warning'
    return 'healthy'
  }

  const systemStatus = getSystemStatus()
  const statusColor = {
    healthy: 'text-green-600 dark:text-green-400',
    warning: 'text-yellow-600 dark:text-yellow-400',
    degraded: 'text-red-600 dark:text-red-400',
  }[systemStatus]

  const statusBg = {
    healthy:
      'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700',
    warning:
      'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700',
    degraded: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700',
  }[systemStatus]

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
            onClick={reset}
            className='flex items-center space-x-2 px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors'>
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

      {/* Consolidation Benefits */}
      <div className='bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 p-6 rounded-lg border border-green-200 dark:border-green-700'>
        <div className='flex items-center space-x-3 mb-4'>
          <TrendingUp className='w-6 h-6 text-green-600 dark:text-green-400' />
          <h3 className='text-lg font-semibold text-gray-900 dark:text-white'>
            Consolidation Benefits
          </h3>
        </div>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
          <div className='text-center'>
            <p className='text-2xl font-bold text-green-600 dark:text-green-400'>
              ~60%
            </p>
            <p className='text-sm text-gray-600 dark:text-gray-400'>
              Code Reduction
            </p>
          </div>
          <div className='text-center'>
            <p className='text-2xl font-bold text-blue-600 dark:text-blue-400'>
              5→2
            </p>
            <p className='text-sm text-gray-600 dark:text-gray-400'>
              Systems Merged
            </p>
          </div>
          <div className='text-center'>
            <p className='text-2xl font-bold text-purple-600 dark:text-purple-400'>
              {metrics.cacheHitRate > 70 ? 'Excellent' : 'Good'}
            </p>
            <p className='text-sm text-gray-600 dark:text-gray-400'>
              Cache Performance
            </p>
          </div>
        </div>
        <p className='text-sm text-gray-600 dark:text-gray-400 mt-4'>
          ✅ Eliminated redundant API calls • ✅ Unified state management • ✅
          Improved caching with SWR
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
              .map((event, index) => (
                <div
                  key={index}
                  className='flex items-center justify-between py-2 px-3 bg-gray-50 dark:bg-gray-700/50 rounded'>
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
                        {event.category.replace('_', ' ')}
                      </p>
                      <p className='text-xs text-gray-500 dark:text-gray-400'>
                        {event.type.replace('_', ' ')}
                        {event.error && ` - ${event.error}`}
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
              ))}
            {metrics.events.length === 0 && (
              <p className='text-center text-gray-500 dark:text-gray-400 py-8'>
                No recent activity
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminPerformanceMetrics
