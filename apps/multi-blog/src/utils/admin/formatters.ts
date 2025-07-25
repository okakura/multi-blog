// Analytics utility functions and formatters
// Reusable formatting functions for analytics data

import type { AnalyticsFormatters } from '@/types/admin'

// =============================================================================
// INDIVIDUAL FORMATTER FUNCTIONS
// =============================================================================

/**
 * Format duration in seconds to human-readable format
 * @param seconds - Duration in seconds
 * @returns Formatted string like "2m 30s"
 */
export const formatDuration = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}m ${remainingSeconds}s`
}

/**
 * Format decimal value as percentage
 * @param value - Decimal value (0-1)
 * @returns Formatted percentage like "75%"
 */
export const formatPercentage = (value: number): string =>
  `${Math.round(value * 100)}%`

/**
 * Format large numbers with K/M suffixes
 * @param num - Number to format
 * @returns Formatted string like "1.2K", "2.5M"
 */
export const formatNumber = (num: number): string => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
  return num.toString()
}

/**
 * Format bounce rate as percentage with context
 * @param value - Bounce rate as decimal (0-1)
 * @returns Formatted string with context
 */
export const formatBounceRate = (value: number): string => {
  const percentage = Math.round(value * 100)
  return `${percentage}%`
}

/**
 * Format engagement score with appropriate precision
 * @param score - Engagement score (typically 0-10)
 * @returns Formatted score
 */
export const formatEngagementScore = (score: number): string => {
  return score >= 10 ? Math.round(score).toString() : score.toFixed(1)
}

// =============================================================================
// GROUPED FORMATTERS OBJECT
// =============================================================================

/**
 * Analytics formatters grouped by category
 */
export const analyticsFormatters = {
  // Time-based formatters
  time: {
    duration: formatDuration,
    readingTime: (seconds: number) => `${Math.round(seconds / 60)} min read`,
    sessionDuration: formatDuration,
  },

  // Number formatters
  numbers: {
    compact: formatNumber,
    percentage: formatPercentage,
    bounceRate: formatBounceRate,
    engagement: formatEngagementScore,
    views: formatNumber,
    sessions: formatNumber,
  },

  // Content formatters
  content: {
    title: (title: string, maxLength = 50) =>
      title.length > maxLength ? `${title.slice(0, maxLength)}...` : title,
    category: (category: string) =>
      category.charAt(0).toUpperCase() + category.slice(1),
  },

  // Chart data formatters
  charts: {
    tooltipPercentage: (value: number) => `${value.toFixed(1)}%`,
    axisTick: (value: number) => formatNumber(value),
    pieLabel: (name: string, percent: number) =>
      `${name} ${(percent * 100).toFixed(0)}%`,
  },
}

/**
 * Create analytics formatters object (for backward compatibility)
 * @deprecated Use individual formatter functions or analyticsFormatters object
 */
export const createAnalyticsFormatters = (): AnalyticsFormatters => ({
  formatDuration,
  formatPercentage,
  formatNumber,
})

// =============================================================================
// ANALYTICS DATA HELPERS
// =============================================================================

/**
 * Calculate percentage change between two values
 */
export const calculatePercentageChange = (
  current: number,
  previous: number,
): number => {
  if (previous === 0) return current > 0 ? 100 : 0
  return ((current - previous) / previous) * 100
}

/**
 * Format percentage change with appropriate styling indicators
 */
export const formatPercentageChange = (
  change: number,
): {
  value: string
  isPositive: boolean
  isNegative: boolean
} => {
  const isPositive = change > 0
  const isNegative = change < 0
  const prefix = isPositive ? '+' : ''

  return {
    value: `${prefix}${change.toFixed(1)}%`,
    isPositive,
    isNegative,
  }
}

/**
 * Get trend indicator for analytics metrics
 */
export const getTrendIndicator = (change: number): '↑' | '↓' | '→' => {
  if (change > 2) return '↑'
  if (change < -2) return '↓'
  return '→'
}

/**
 * Determine if a metric is performing well based on type and value
 */
export const getMetricStatus = (
  metricType: 'bounce_rate' | 'engagement' | 'duration' | 'views',
  value: number,
  change?: number,
): 'good' | 'warning' | 'poor' => {
  switch (metricType) {
    case 'bounce_rate':
      // Lower bounce rate is better
      if (value < 0.4) return 'good'
      if (value < 0.7) return 'warning'
      return 'poor'

    case 'engagement':
      // Higher engagement is better (0-10 scale)
      if (value > 7) return 'good'
      if (value > 4) return 'warning'
      return 'poor'

    case 'duration':
      // Longer session duration is better (in seconds)
      if (value > 180) return 'good' // 3+ minutes
      if (value > 60) return 'warning' // 1+ minute
      return 'poor'

    case 'views':
      // More views are better, but also consider trend
      if (change !== undefined && change < -20) return 'poor'
      if (change !== undefined && change > 20) return 'good'
      return 'warning'

    default:
      return 'warning'
  }
}
