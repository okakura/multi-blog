import {
  analyticsDataAtom,
  effectiveThemeAtom,
  isLoadingAtom,
  referrerDataAtom,
  searchDataAtom,
  trafficDataAtom,
} from '@state/atoms/analytics'
import { useAnalyticsPeriod } from '@state/hooks/useAnalyticsDashboard'
import { useSetAtom } from 'jotai'
import { useEffect } from 'react'
import { useAllAnalyticsData } from '@/data/hooks/useAnalyticsData'
import { usePreferences } from '@/data/hooks/useUserPreferences'

/**
 * Provider hook that bridges SWR data fetching with Jotai atoms
 * This hook should be used in a high-level component to sync data
 */
export function useAnalyticsDataProvider() {
  const [selectedPeriod] = useAnalyticsPeriod()
  const { data, trafficData, searchData, referrerData, hasError, isLoading } =
    useAllAnalyticsData(selectedPeriod)
  const { preferences } = usePreferences()

  // Get atom setters
  const setAnalyticsData = useSetAtom(analyticsDataAtom)
  const setTrafficData = useSetAtom(trafficDataAtom)
  const setSearchData = useSetAtom(searchDataAtom)
  const setReferrerData = useSetAtom(referrerDataAtom)
  const setIsLoading = useSetAtom(isLoadingAtom)
  const setEffectiveTheme = useSetAtom(effectiveThemeAtom)

  // Sync SWR data with atoms - handle undefined by converting to null
  useEffect(() => {
    setAnalyticsData(data ?? null)
  }, [data, setAnalyticsData])

  useEffect(() => {
    setTrafficData(trafficData ?? null)
  }, [trafficData, setTrafficData])

  useEffect(() => {
    setSearchData(searchData ?? null)
  }, [searchData, setSearchData])

  useEffect(() => {
    setReferrerData(referrerData ?? null)
  }, [referrerData, setReferrerData])

  useEffect(() => {
    setIsLoading(isLoading)
  }, [isLoading, setIsLoading])

  // Sync theme with preferences
  useEffect(() => {
    const themePreference = preferences?.appearance?.theme || 'system'
    let effectiveTheme: 'light' | 'dark' = 'light'

    if (themePreference === 'system') {
      // Check system preference
      effectiveTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
    } else {
      effectiveTheme = themePreference
    }

    setEffectiveTheme(effectiveTheme)
  }, [preferences?.appearance?.theme, setEffectiveTheme])

  // Return minimal interface for debugging
  return {
    isInitialized: !isLoading && data !== undefined,
    period: selectedPeriod,
    hasError,
  }
}
