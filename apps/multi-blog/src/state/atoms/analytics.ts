import { atom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'
import { ANALYTICS_CONSTANTS, type AnalyticsPeriod } from '@/constants'
import type {
  AnalyticsDashboardData,
  ChartColors,
  ReferrerData,
  SearchData,
  ThemeStyles,
  TrafficData,
} from '@/types/admin'
import { analyticsFormatters } from '@/utils'

// =============================================================================
// BASE ATOMS
// =============================================================================

// Period selection - persisted to localStorage
export const selectedPeriodAtom = atomWithStorage<AnalyticsPeriod>(
  'analytics-period',
  30,
)

// Data atoms - updated by data fetching
export const analyticsDataAtom = atom<AnalyticsDashboardData | null>(null)
export const trafficDataAtom = atom<TrafficData | null>(null)
export const searchDataAtom = atom<SearchData | null>(null)
export const referrerDataAtom = atom<ReferrerData | null>(null)

// Loading and error states
export const isLoadingAtom = atom<boolean>(false)
export const errorAtom = atom<Error | null>(null)

// Theme atom - derived from user preferences
export const effectiveThemeAtom = atom<'light' | 'dark'>('light')

// =============================================================================
// DERIVED ATOMS
// =============================================================================

// Chart colors - static but accessible as atom
export const chartColorsAtom = atom<ChartColors>(
  () => ANALYTICS_CONSTANTS.CHART_COLORS,
)

// Pie chart colors derived from main chart colors
export const pieChartColorsAtom = atom((get) => {
  const colors = get(chartColorsAtom)
  return [
    colors.primary,
    colors.secondary,
    colors.accent,
    colors.success,
    colors.danger,
  ]
})

// Theme-dependent styling - memoized based on theme
export const themeStylesAtom = atom<ThemeStyles>((get) => {
  const theme = get(effectiveThemeAtom)
  const isDark = theme === 'dark'

  return {
    isDark,
    chartGridColor: isDark ? '#374151' : '#f1f5f9',
    chartAxisColor: isDark ? '#9ca3af' : '#64748b',
    chartTooltipBg: isDark ? '#1f2937' : '#ffffff',
    chartTooltipBorder: isDark ? '#374151' : '#e2e8f0',
  }
})

// =============================================================================
// FORMATTER ATOMS
// =============================================================================

// Formatters as atoms for easy access and potential future customization
export const formattersAtom = atom(() => ({
  duration: analyticsFormatters.time.duration,
  percentage: analyticsFormatters.numbers.percentage,
  number: analyticsFormatters.numbers.compact,
}))

// =============================================================================
// FORMATTED DATA ATOMS
// =============================================================================

// Formatted overview data - recalculates only when data changes
export const formattedOverviewAtom = atom((get) => {
  const data = get(analyticsDataAtom)
  const formatters = get(formattersAtom)

  if (!data) return null

  return {
    sessions: data.overview.total_sessions.toLocaleString(),
    pageViews: data.overview.total_page_views.toLocaleString(),
    avgDuration: formatters.duration(data.overview.avg_session_duration),
    bounceRate: formatters.percentage(data.overview.bounce_rate),
    engagement: Math.round(data.behavior.engagement_score_avg),
    uniqueVisitors: data.overview.unique_visitors.toLocaleString(),
  }
})

// Formatted search analytics
export const formattedSearchAtom = atom((get) => {
  const data = get(analyticsDataAtom)
  const formatters = get(formattersAtom)

  if (!data) return null

  return {
    noResultsRate: formatters.percentage(data.search.no_results_rate),
    clickRate: formatters.percentage(data.search.search_to_click_rate),
    topQueries: data.search.top_queries.slice(0, 5),
  }
})

// Formatted content analytics
export const formattedContentAtom = atom((get) => {
  const data = get(analyticsDataAtom)
  const formatters = get(formattersAtom)

  if (!data) return null

  return {
    avgReadingTime: formatters.duration(data.content.avg_reading_time),
    completionRate: formatters.percentage(data.content.content_completion_rate),
    topContent: data.content.top_content.slice(0, 5).map((content) => ({
      ...content,
      formattedReadingTime: formatters.duration(content.avg_reading_time),
    })),
  }
})

// =============================================================================
// ACTION ATOMS
// =============================================================================

// Refresh action atom
export const refreshDataAtom = atom(null, async (get, set, _update) => {
  set(isLoadingAtom, true)
  set(errorAtom, null)

  try {
    // This will be implemented to trigger the actual data refresh
    // For now, we'll just reset loading state
    // In the actual implementation, this would call the API
    console.log(
      'Refreshing analytics data for period:',
      get(selectedPeriodAtom),
    )

    // Simulate async operation
    await new Promise((resolve) => setTimeout(resolve, 1000))
  } catch (error) {
    set(errorAtom, error as Error)
  } finally {
    set(isLoadingAtom, false)
  }
})

// Navigation actions atom
export const navigationActionsAtom = atom(() => ({
  toAdmin: () => '/admin',
  toPosts: () => '/admin/posts',
  toPost: (id: number) => `/admin/posts/${id}/edit`,
}))

// =============================================================================
// SELECTOR ATOMS FOR SPECIFIC COMPONENTS
// =============================================================================

// Device breakdown data for pie chart
export const deviceBreakdownAtom = atom((get) => {
  const trafficData = get(trafficDataAtom)
  if (!trafficData) return null

  return [
    {
      name: 'Desktop',
      value: trafficData.device_breakdown.desktop,
    },
    {
      name: 'Mobile',
      value: trafficData.device_breakdown.mobile,
    },
    {
      name: 'Tablet',
      value: trafficData.device_breakdown.tablet,
    },
  ]
})

// Top posts with formatted data
export const formattedTopPostsAtom = atom((get) => {
  const data = get(analyticsDataAtom)
  const formatters = get(formattersAtom)

  if (!data?.top_posts) return null

  return data.top_posts.slice(0, 5).map((post) => ({
    ...post,
    formattedViews: formatters.number(post.views),
    formattedUniqueViews: formatters.number(post.unique_views),
  }))
})

// Popular search terms with formatted data
export const formattedSearchTermsAtom = atom((get) => {
  const searchData = get(searchDataAtom)
  const formatters = get(formattersAtom)

  if (!searchData?.popular_terms) return null

  return searchData.popular_terms.slice(0, 5).map((term) => ({
    ...term,
    formattedCount: formatters.number(term.count),
  }))
})

// Referrer data with formatted counts
export const formattedReferrerDataAtom = atom((get) => {
  const referrerData = get(referrerDataAtom)
  const formatters = get(formattersAtom)

  if (!referrerData) return null

  return {
    types: Object.entries(referrerData.referrer_types).map(([type, count]) => ({
      type: type.replace('_', ' '),
      count: formatters.number(count as number),
      rawCount: count as number,
    })),
    topReferrers: referrerData.top_referrers.slice(0, 5).map((referrer) => ({
      ...referrer,
      formattedVisits: formatters.number(referrer.visits),
    })),
  }
})
