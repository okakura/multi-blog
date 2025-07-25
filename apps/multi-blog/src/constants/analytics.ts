// Analytics constants and configuration
// Centralized configuration for analytics system

export const ANALYTICS_CONSTANTS = {
  PERIOD_OPTIONS: [7, 30, 90] as const,
  MAX_ITEMS_DISPLAY: 5,
  REFRESH_INTERVAL: 60000, // 1 minute
  DEDUPING_INTERVAL: 30000, // 30 seconds
  CHART_COLORS: {
    primary: '#8b5cf6',
    secondary: '#06b6d4',
    accent: '#f59e0b',
    success: '#10b981',
    danger: '#ef4444',
  },
} as const

export type AnalyticsPeriod =
  (typeof ANALYTICS_CONSTANTS.PERIOD_OPTIONS)[number]
