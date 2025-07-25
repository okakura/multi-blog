import {
  analyticsDataAtom,
  chartColorsAtom,
  deviceBreakdownAtom,
  effectiveThemeAtom,
  errorAtom,
  formattedContentAtom,
  formattedOverviewAtom,
  formattedReferrerDataAtom,
  formattedSearchAtom,
  formattedSearchTermsAtom,
  formattedTopPostsAtom,
  formattersAtom,
  isLoadingAtom,
  navigationActionsAtom,
  pieChartColorsAtom,
  referrerDataAtom,
  refreshDataAtom,
  searchDataAtom,
  selectedPeriodAtom,
  themeStylesAtom,
  trafficDataAtom,
} from '@state/atoms/analytics'
import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

// =============================================================================
// DATA HOOKS
// =============================================================================

export const useAnalyticsPeriod = () => {
  return useAtom(selectedPeriodAtom)
}

export const useAnalyticsData = () => {
  return useAtomValue(analyticsDataAtom)
}

export const useTrafficData = () => {
  return useAtomValue(trafficDataAtom)
}

export const useSearchData = () => {
  return useAtomValue(searchDataAtom)
}

export const useReferrerData = () => {
  return useAtomValue(referrerDataAtom)
}

export const useAnalyticsLoading = () => {
  return useAtomValue(isLoadingAtom)
}

export const useAnalyticsError = () => {
  return useAtomValue(errorAtom)
}

// =============================================================================
// FORMATTED DATA HOOKS
// =============================================================================

export const useFormattedOverview = () => {
  return useAtomValue(formattedOverviewAtom)
}

export const useFormattedSearch = () => {
  return useAtomValue(formattedSearchAtom)
}

export const useFormattedContent = () => {
  return useAtomValue(formattedContentAtom)
}

export const useFormattedTopPosts = () => {
  return useAtomValue(formattedTopPostsAtom)
}

export const useFormattedSearchTerms = () => {
  return useAtomValue(formattedSearchTermsAtom)
}

export const useFormattedReferrerData = () => {
  return useAtomValue(formattedReferrerDataAtom)
}

export const useDeviceBreakdown = () => {
  return useAtomValue(deviceBreakdownAtom)
}

// =============================================================================
// THEME HOOKS
// =============================================================================

export const useAnalyticsTheme = () => {
  return useAtomValue(effectiveThemeAtom)
}

export const useThemeStyles = () => {
  return useAtomValue(themeStylesAtom)
}

export const useChartColors = () => {
  return useAtomValue(chartColorsAtom)
}

export const usePieChartColors = () => {
  return useAtomValue(pieChartColorsAtom)
}

// =============================================================================
// UTILITY HOOKS
// =============================================================================

export const useAnalyticsFormatters = () => {
  return useAtomValue(formattersAtom)
}

// =============================================================================
// ACTION HOOKS
// =============================================================================

export const useRefreshAnalytics = () => {
  return useSetAtom(refreshDataAtom)
}

export const useAnalyticsNavigation = () => {
  const navigate = useNavigate()
  const routes = useAtomValue(navigationActionsAtom)

  return useCallback(
    (action: 'admin' | 'posts' | { type: 'post'; id: number }) => {
      if (action === 'admin') {
        navigate(routes.toAdmin())
      } else if (action === 'posts') {
        navigate(routes.toPosts())
      } else if (action.type === 'post') {
        navigate(routes.toPost(action.id))
      }
    },
    [navigate, routes],
  )
}

// =============================================================================
// COMBINED HOOKS FOR CONVENIENCE
// =============================================================================

export const useAnalyticsState = () => {
  const data = useAnalyticsData()
  const trafficData = useTrafficData()
  const searchData = useSearchData()
  const referrerData = useReferrerData()
  const isLoading = useAnalyticsLoading()
  const error = useAnalyticsError()
  const refresh = useRefreshAnalytics()

  return {
    data,
    trafficData,
    searchData,
    referrerData,
    isLoading,
    error,
    refresh,
  }
}

export const useAnalyticsUI = () => {
  const themeStyles = useThemeStyles()
  const chartColors = useChartColors()
  const pieChartColors = usePieChartColors()
  const formatters = useAnalyticsFormatters()
  const navigate = useAnalyticsNavigation()

  return {
    themeStyles,
    chartColors,
    pieChartColors,
    formatters,
    navigate,
  }
}
