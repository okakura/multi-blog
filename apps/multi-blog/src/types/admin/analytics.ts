// Analytics TypeScript types for Admin Dashboard
// Based on API response structures and dashboard requirements

// =============================================================================
// CORE ANALYTICS INTERFACES
// =============================================================================

export interface AnalyticsDashboardData {
  overview: DashboardOverview
  behavior: BehaviorAnalytics
  search: SearchAnalytics
  content: ContentAnalytics
  top_posts?: PostStats[]
  top_categories?: CategoryStats[]
}

export interface DashboardOverview {
  total_sessions: number
  total_page_views: number
  avg_session_duration: number
  bounce_rate: number
  unique_visitors: number
  previous_period?: PreviodStats
  change_percent?: ChangePercent
}

export interface PreviodStats {
  page_views: number
  unique_visitors: number
  post_views: number
  searches: number
  avg_session_duration: number
}

export interface ChangePercent {
  page_views: number
  unique_visitors: number
  post_views: number
  searches: number
}

// =============================================================================
// BEHAVIOR ANALYTICS
// =============================================================================

export interface BehaviorAnalytics {
  top_clicked_elements: ClickedElement[]
  scroll_depth_distribution: ScrollDepthData[]
  engagement_score_avg: number
}

export interface ClickedElement {
  element: string
  clicks: number
}

export interface ScrollDepthData {
  depth: number
  percentage: number
}

// =============================================================================
// SEARCH ANALYTICS
// =============================================================================

export interface SearchAnalytics {
  top_queries: SearchQuery[]
  no_results_rate: number
  search_to_click_rate: number
}

export interface SearchQuery {
  query: string
  count: number
  results_avg: number
}

export interface SearchData {
  popular_terms: SearchTerm[]
  volume_over_time?: SearchVolumeDay[]
}

export interface SearchTerm {
  query: string
  count: number
  results_found: boolean
}

export interface SearchVolumeDay {
  date: string
  searches: number
  unique_searchers: number
}

// =============================================================================
// CONTENT ANALYTICS
// =============================================================================

export interface ContentAnalytics {
  top_content: ContentPerformance[]
  avg_reading_time: number
  content_completion_rate: number
}

export interface ContentPerformance {
  content_id: string
  title: string
  views: number
  avg_reading_time: number
  engagement_score: number
}

export interface PostStats {
  id: number
  title: string
  slug: string
  views: number
  unique_views: number
  category?: string
  created_at?: string
}

export interface CategoryStats {
  category: string
  views: number
  posts_count: number
}

// =============================================================================
// TRAFFIC ANALYTICS
// =============================================================================

export interface TrafficData {
  daily_stats: DayStats[]
  hourly_distribution?: HourStats[]
  device_breakdown: DeviceBreakdown
}

export interface DayStats {
  date: string
  page_views: number
  unique_visitors: number
  post_views: number
}

export interface HourStats {
  hour: number
  page_views: number
  unique_visitors: number
}

export interface DeviceBreakdown {
  mobile: number
  desktop: number
  tablet: number
  unknown: number
}

// =============================================================================
// REFERRER ANALYTICS
// =============================================================================

export interface ReferrerData {
  top_referrers: ReferrerStats[]
  referrer_types: ReferrerTypeBreakdown
}

export interface ReferrerStats {
  referrer: string
  visits: number
  unique_visitors: number
}

export interface ReferrerTypeBreakdown {
  direct: number
  search: number
  social: number
  other: number
}

// =============================================================================
// ADMIN SPECIFIC TYPES
// =============================================================================

export interface AdminAnalyticsOverview extends DashboardOverview {
  active_domains: number
  total_posts: number
  posts_this_month: number
  views_this_month: number
}

export interface AdminTrafficResponse {
  daily_stats: AdminDayStats[]
  hourly_distribution: AdminHourStats[]
  device_breakdown: DeviceBreakdown
}

export interface AdminDayStats extends DayStats {
  sessions?: number
}

export interface AdminHourStats extends HourStats {
  sessions?: number
}

// =============================================================================
// USER BEHAVIOR TRACKING TYPES
// =============================================================================

export interface UserBehaviorEvent {
  type: 'click' | 'scroll' | 'search' | 'read_time' | 'engagement'
  element?: string
  position?: { x: number; y: number }
  scroll_depth?: number
  search_query?: string
  reading_time?: number
  content_id?: string
  engagement_score?: number
  timestamp: string
  session_id: string
  page_path: string
}

export interface SearchEvent {
  query: string
  results_count: number
  clicked_result?: string
  position_clicked?: number
  no_results: boolean
  timestamp: string
  session_id: string
}

export interface ContentMetricsEvent {
  content_id: string
  content_type: 'post' | 'page' | 'category'
  title: string
  reading_time: number
  scroll_percentage: number
  time_on_page: number
  bounce: boolean
  engagement_events: number
  session_id: string
  timestamp: string
}

// =============================================================================
// ANALYTICS QUERY PARAMETERS
// =============================================================================

export interface AnalyticsQuery {
  days?: number
  range?: string
  domain?: string
  start_date?: string
  end_date?: string
}

export interface AnalyticsDateRange {
  start_date: Date
  end_date: Date
  previous_start?: Date
  period_days: number
}

// =============================================================================
// CHART DATA TYPES
// =============================================================================

export interface ChartDataPoint {
  date: string
  page_views: number
  unique_visitors: number
  post_views?: number
}

export interface PieChartData {
  name: string
  value: number
  color?: string
  icon?: React.ComponentType
}

export interface BarChartData {
  name: string
  value: number
  percentage: number
}

// =============================================================================
// ANALYTICS HOOK RETURN TYPES
// =============================================================================

export interface UseAnalyticsDataReturn {
  data: AnalyticsDashboardData | null
  trafficData: TrafficData | null
  searchData: SearchData | null
  referrerData: ReferrerData | null
  isLoading: boolean
  hasError: boolean
  refreshAll: () => void
}

export interface UseAnalyticsReturn {
  sessionId: string | null
  isSessionActive: boolean
  trackSearch: (
    query: string,
    resultsCount: number,
    noResults?: boolean,
  ) => void
  trackSearchClick: (
    query: string,
    clickedResult: string,
    position: number,
  ) => void
  trackContentMetrics: () => void
}

// =============================================================================
// CHART CONFIGURATION TYPES
// =============================================================================

export interface ChartColors {
  primary: string
  secondary: string
  accent: string
  success: string
  danger: string
}

export interface ChartStyling {
  gridColor: string
  axisColor: string
  tooltipBg: string
  tooltipBorder: string
}

export interface ThemeStyles {
  isDark: boolean
  chartGridColor: string
  chartAxisColor: string
  chartTooltipBg: string
  chartTooltipBorder: string
}

// =============================================================================
// FORMATTER FUNCTION TYPES
// =============================================================================

export type FormatDurationFn = (seconds: number) => string
export type FormatPercentageFn = (value: number) => string
export type FormatNumberFn = (num: number) => string

export interface AnalyticsFormatters {
  formatDuration: FormatDurationFn
  formatPercentage: FormatPercentageFn
  formatNumber: FormatNumberFn
}

// =============================================================================
// EXPORT ALL TYPES
// =============================================================================
// All types are already exported above via their interface declarations
