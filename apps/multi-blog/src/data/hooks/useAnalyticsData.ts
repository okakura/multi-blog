import useSWR from 'swr'
import { buildApiUrl } from '@/config/dev'

// Simple fetcher for analytics endpoints with auth
const analyticsFetcher = async (url: string) => {
  const token = localStorage.getItem('auth_token')
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(url, { headers })
  
  if (!response.ok) {
    throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`)
  }
  
  return response.json()
}

// Types for analytics data
interface AnalyticsDashboardData {
  overview: {
    total_sessions: number
    total_page_views: number
    avg_session_duration: number
    bounce_rate: number
    unique_visitors: number
  }
  behavior: {
    top_clicked_elements: Array<{ element: string; clicks: number }>
    scroll_depth_distribution: Array<{ depth: number; percentage: number }>
    engagement_score_avg: number
  }
  search: {
    top_queries: Array<{ query: string; count: number; results_avg: number }>
    no_results_rate: number
    search_to_click_rate: number
  }
  content: {
    top_content: Array<{
      content_id: string
      title: string
      views: number
      avg_reading_time: number
      engagement_score: number
    }>
    avg_reading_time: number
    content_completion_rate: number
  }
  top_posts?: Array<{
    id: number
    title: string
    slug: string
    views: number
    unique_views: number
  }>
}

interface TrafficData {
  daily_stats: Array<{
    date: string
    page_views: number
    unique_visitors: number
    post_views: number
  }>
  device_breakdown: {
    mobile: number
    desktop: number
    tablet: number
    unknown: number
  }
}

interface SearchData {
  popular_terms: Array<{
    query: string
    count: number
    results_found: boolean
  }>
}

interface ReferrerData {
  top_referrers: Array<{
    referrer: string
    visits: number
    unique_visitors: number
  }>
  referrer_types: {
    direct: number
    search: number
    social: number
    other: number
  }
}

/**
 * SWR hook for fetching analytics dashboard data
 */
export const useAnalyticsDashboard = (selectedPeriod: number) => {
  const { data, error, isLoading, mutate } = useSWR<AnalyticsDashboardData>(
    `analytics-dashboard-${selectedPeriod}`,
    () => analyticsFetcher(buildApiUrl(`/analytics/dashboard?range=${selectedPeriod}d`)),
    {
      refreshInterval: 60000, // Refresh every minute
      revalidateOnFocus: true,
      dedupingInterval: 30000, // Dedupe requests within 30 seconds
    }
  )

  return {
    data,
    error,
    isLoading,
    refresh: mutate,
  }
}

/**
 * SWR hook for fetching traffic data
 */
export const useTrafficData = (selectedPeriod: number) => {
  const { data, error, isLoading, mutate } = useSWR<TrafficData>(
    `analytics-traffic-${selectedPeriod}`,
    () => analyticsFetcher(buildApiUrl(`/analytics/traffic?days=${selectedPeriod}`)),
    {
      refreshInterval: 60000,
      revalidateOnFocus: true,
      dedupingInterval: 30000,
    }
  )

  return {
    data,
    error,
    isLoading,
    refresh: mutate,
  }
}

/**
 * SWR hook for fetching search data
 */
export const useSearchData = (selectedPeriod: number) => {
  const { data, error, isLoading, mutate } = useSWR<SearchData>(
    `analytics-search-${selectedPeriod}`,
    () => analyticsFetcher(buildApiUrl(`/analytics/search-terms?days=${selectedPeriod}`)),
    {
      refreshInterval: 60000,
      revalidateOnFocus: true,
      dedupingInterval: 30000,
    }
  )

  return {
    data,
    error,
    isLoading,
    refresh: mutate,
  }
}

/**
 * SWR hook for fetching referrer data
 */
export const useReferrerData = (selectedPeriod: number) => {
  const { data, error, isLoading, mutate } = useSWR<ReferrerData>(
    `analytics-referrers-${selectedPeriod}`,
    () => analyticsFetcher(buildApiUrl(`/analytics/referrers?days=${selectedPeriod}`)),
    {
      refreshInterval: 60000,
      revalidateOnFocus: true,
      dedupingInterval: 30000,
    }
  )

  return {
    data,
    error,
    isLoading,
    refresh: mutate,
  }
}

/**
 * Combined hook that fetches all analytics data
 */
export const useAllAnalyticsData = (selectedPeriod: number) => {
  const dashboard = useAnalyticsDashboard(selectedPeriod)
  const traffic = useTrafficData(selectedPeriod)
  const search = useSearchData(selectedPeriod)
  const referrer = useReferrerData(selectedPeriod)

  const isLoading = dashboard.isLoading || traffic.isLoading || search.isLoading || referrer.isLoading
  const hasError = dashboard.error || traffic.error || search.error || referrer.error

  const refreshAll = () => {
    dashboard.refresh()
    traffic.refresh()
    search.refresh()
    referrer.refresh()
  }

  return {
    data: dashboard.data,
    trafficData: traffic.data,
    searchData: search.data,
    referrerData: referrer.data,
    isLoading,
    hasError,
    refreshAll,
  }
}
