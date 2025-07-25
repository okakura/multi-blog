import type { ReactNode } from 'react'
import ChartErrorBoundary from './ChartErrorBoundary'

interface ChartWrapperProps {
  title: string
  children: ReactNode
  isLoading?: boolean
  error?: Error | null
  onRetry?: () => void
  description?: string
  actions?: ReactNode
  className?: string
}

const ChartWrapper = ({
  title,
  children,
  isLoading = false,
  error = null,
  onRetry,
  description,
  actions,
  className = '',
}: ChartWrapperProps) => {
  if (isLoading) {
    return (
      <div
        className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-slate-200 dark:border-gray-700 p-6 ${className}`}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            {title}
          </h3>
          {actions}
        </div>
        {description && (
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
            {description}
          </p>
        )}
        <div className="flex items-center justify-center h-80">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading chart...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div
        className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-slate-200 dark:border-gray-700 p-6 ${className}`}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            {title}
          </h3>
          {actions}
        </div>
        <ChartErrorBoundary fallbackTitle={`${title} Error`} onRetry={onRetry}>
          <div></div>
        </ChartErrorBoundary>
      </div>
    )
  }

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-slate-200 dark:border-gray-700 p-6 ${className}`}
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          {title}
        </h3>
        {actions}
      </div>
      {description && (
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
          {description}
        </p>
      )}
      <ChartErrorBoundary fallbackTitle={`${title} Error`} onRetry={onRetry}>
        {children}
      </ChartErrorBoundary>
    </div>
  )
}

export default ChartWrapper
