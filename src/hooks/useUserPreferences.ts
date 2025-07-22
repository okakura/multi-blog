import { useEffect } from 'react'
import useSWR, { mutate } from 'swr'
import { adminApiService } from '../services/adminApi'
import { performanceMetrics } from '../services/performanceMetrics'
import type {
  PreferenceCategory,
  PreferenceKey,
  UserPreferences,
} from '../types/preferences'
import { showToast } from '../utils/toast'

// Default preferences
export const defaultPreferences: UserPreferences = {
  appearance: {
    theme: 'system',
    fontSize: 'medium',
    readingWidth: 'medium',
    animations: true,
    compactMode: false,
  },
  content: {
    defaultEditor: 'rich-text',
    autoSaveInterval: 60,
    postsPerPage: 10,
    defaultStatus: 'draft',
    readingMode: 'excerpts',
    imageQuality: 'auto',
  },
  notifications: {
    comments: 'email',
    mentions: 'browser',
    systemUpdates: 'browser',
    weeklyDigest: true,
    timing: 'immediate',
  },
  dashboard: {
    defaultView: 'overview',
    analyticsLevel: 'basic',
    chartType: 'line',
    dateRange: '30-days',
    showAdminMetrics: true,
  },
  localization: {
    language: 'en',
    timezone: 'UTC',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12-hour',
    numberFormat: '1,000.00',
  },
  privacy: {
    profileVisibility: 'public',
    showOnlineStatus: true,
    activityTracking: true,
    sessionTimeout: '1hr',
  },
  accessibility: {
    mobileEditor: 'full',
    touchGestures: true,
    highContrast: false,
    screenReader: false,
    keyboardNav: true,
  },
}

// SWR key for user preferences
const PREFERENCES_KEY = '/admin/profile/preferences'

// Fetcher function for SWR with performance tracking
const fetchPreferences = async (): Promise<UserPreferences> => {
  try {
    const result = await adminApiService.getPreferences()
    return result
  } catch (error) {
    // If user is not authenticated or preferences don't exist, return defaults
    console.warn('Failed to fetch preferences:', error)
    return defaultPreferences
  }
}

// Toast messages for preference changes
const getPreferenceToastMessage = (
  category: PreferenceCategory,
  key: string,
  value: any
): string | null => {
  if (category === 'appearance') {
    if (key === 'theme') return `Theme changed to ${value}`
    if (key === 'fontSize') return `Font size changed to ${value}`
    if (key === 'compactMode')
      return value ? 'Compact mode enabled' : 'Compact mode disabled'
  }
  if (category === 'content') {
    if (key === 'postsPerPage') return `Posts per page: ${value}`
    if (key === 'readingMode') return `Reading mode: ${value}`
  }
  return null
}

export const usePreferences = () => {
  const {
    data: serverPreferences,
    error,
    isLoading,
    mutate: mutatePreferences,
  } = useSWR<UserPreferences>(PREFERENCES_KEY, fetchPreferences, {
    revalidateOnFocus: false, // Disable aggressive focus revalidation
    revalidateOnReconnect: true,
    revalidateIfStale: false,
    dedupingInterval: 5000, // Increase to reduce duplicate calls
    // Remove fallbackData to prevent flash of default content
    onSuccess: (data) => {
      // Track cache hit when data is served from cache
      if (data && !isLoading) {
        performanceMetrics.trackCacheHit('preferences_data', {
          hasData: !!data,
        })
      }
    },
    onError: (error) => {
      performanceMetrics.trackError(
        'preferences_swr',
        error instanceof Error ? error.message : 'SWR error'
      )
    },
  })

  // Merge server preferences with defaults (prevents flash of incorrect content)
  const preferences: UserPreferences = {
    ...defaultPreferences,
    // Only apply server preferences if they exist (prevents flash)
    ...(serverPreferences ? serverPreferences : {}),
    // Deep merge nested objects only if server data exists
    appearance: {
      ...defaultPreferences.appearance,
      ...(serverPreferences?.appearance || {}),
    },
    accessibility: {
      ...defaultPreferences.accessibility,
      ...(serverPreferences?.accessibility || {}),
    },
    content: {
      ...defaultPreferences.content,
      ...(serverPreferences?.content || {}),
    },
    privacy: {
      ...defaultPreferences.privacy,
      ...(serverPreferences?.privacy || {}),
    },
    notifications: {
      ...defaultPreferences.notifications,
      ...(serverPreferences?.notifications || {}),
    },
    dashboard: {
      ...defaultPreferences.dashboard,
      ...(serverPreferences?.dashboard || {}),
    },
    localization: {
      ...defaultPreferences.localization,
      ...(serverPreferences?.localization || {}),
    },
  }

  // Apply theme to document
  useEffect(() => {
    const applyTheme = () => {
      const theme = preferences.appearance.theme
      const root = document.documentElement

      if (theme === 'system') {
        const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        root.classList.toggle('dark', isDark)
      } else {
        root.classList.toggle('dark', theme === 'dark')
      }
    }

    applyTheme()

    // Listen for system theme changes when theme is 'system'
    if (preferences.appearance.theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      mediaQuery.addEventListener('change', applyTheme)
      return () => mediaQuery.removeEventListener('change', applyTheme)
    }
  }, [preferences.appearance.theme])

  // Update a single preference with performance tracking
  const updatePreference = async <T extends PreferenceCategory>(
    category: T,
    key: PreferenceKey<T>,
    value: any
  ) => {
    const startTime = performance.now()

    const newPreferences = {
      ...preferences,
      [category]: {
        ...preferences[category],
        [key]: value,
      },
    }

    // Show toast notification
    const message = getPreferenceToastMessage(category, key as string, value)
    if (message) {
      showToast.info(message)
    }

    // Optimistic update
    await mutatePreferences(newPreferences, false)

    try {
      // Save to server
      await adminApiService.savePreferences(newPreferences)
      await mutatePreferences(newPreferences, true)

      const duration = performance.now() - startTime
      performanceMetrics.trackApiCall(
        'preferences_update',
        duration,
        undefined, // url
        undefined, // method
        undefined, // status
        {
          category,
          key: key as string,
          success: true,
          optimistic: true,
        }
      )

      return true
    } catch (error) {
      const duration = performance.now() - startTime

      performanceMetrics.trackError(
        'preferences_update',
        error instanceof Error ? error.message : 'Update failed',
        { category, key: key as string, duration }
      )

      // Revert on error
      await mutatePreferences()
      showToast.error('Failed to save preference')
      console.error('Failed to save preference:', error)
      return false
    }
  }

  // Save all preferences with performance tracking
  const savePreferences = async (newPreferences: UserPreferences) => {
    const startTime = performance.now()

    try {
      await mutatePreferences(newPreferences, false)
      const savedPreferences = await adminApiService.savePreferences(
        newPreferences
      )
      await mutatePreferences(savedPreferences, true)

      const duration = performance.now() - startTime
      performanceMetrics.trackApiCall(
        'preferences_save_all',
        duration,
        undefined, // url
        undefined, // method
        undefined, // status
        {
          success: true,
          preferenceCount: Object.keys(newPreferences).length,
        }
      )

      showToast.success('Preferences saved successfully')
      return true
    } catch (error) {
      const duration = performance.now() - startTime

      performanceMetrics.trackError(
        'preferences_save_all',
        error instanceof Error ? error.message : 'Save failed',
        { duration }
      )

      await mutatePreferences()
      showToast.error('Failed to save preferences')
      console.error('Failed to save preferences:', error)
      return false
    }
  }

  // Reset a category to defaults with tracking
  const resetCategory = async (category: PreferenceCategory) => {
    const startTime = performance.now()

    const newPreferences = {
      ...preferences,
      [category]: defaultPreferences[category],
    }
    const success = await savePreferences(newPreferences)

    const duration = performance.now() - startTime
    if (success) {
      performanceMetrics.trackTiming('preferences_reset_category', duration, {
        category,
        success: true,
      })
      showToast.info(`${category} preferences reset to defaults`)
    } else {
      performanceMetrics.trackError(
        'preferences_reset_category',
        'Reset failed',
        { category, duration }
      )
    }
    return success
  }

  // Reset all preferences with tracking
  const resetAllPreferences = async () => {
    const startTime = performance.now()

    const success = await savePreferences(defaultPreferences)

    const duration = performance.now() - startTime
    if (success) {
      performanceMetrics.trackTiming('preferences_reset_all', duration, {
        success: true,
      })
      showToast.success('All preferences reset to defaults')
    }
    return success
  }

  // Export preferences with tracking
  const exportPreferences = () => {
    const startTime = performance.now()

    try {
      const data = JSON.stringify(preferences, null, 2)
      const blob = new Blob([data], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `preferences-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      const duration = performance.now() - startTime
      performanceMetrics.trackTiming('preferences_export', duration, {
        success: true,
        dataSize: data.length,
      })

      showToast.success('Preferences exported successfully')
      return true
    } catch (error) {
      const duration = performance.now() - startTime

      performanceMetrics.trackError(
        'preferences_export',
        error instanceof Error ? error.message : 'Export failed',
        { duration }
      )

      showToast.error('Failed to export preferences')
      console.error('Export failed:', error)
      return false
    }
  }

  // Import preferences with tracking
  const importPreferences = async (data: string) => {
    const startTime = performance.now()

    try {
      const imported = JSON.parse(data) as UserPreferences
      const success = await savePreferences(imported)

      const duration = performance.now() - startTime
      if (success) {
        performanceMetrics.trackTiming('preferences_import', duration, {
          success: true,
          dataSize: data.length,
        })
        showToast.success('Preferences imported successfully')
      } else {
        performanceMetrics.trackError(
          'preferences_import',
          'Save failed after import',
          { duration, dataSize: data.length }
        )
      }
      return success
    } catch (error) {
      const duration = performance.now() - startTime

      performanceMetrics.trackError(
        'preferences_import',
        error instanceof Error ? error.message : 'Import failed',
        { duration, dataSize: data.length }
      )

      showToast.error('Failed to import preferences - invalid format')
      console.error('Import failed:', error)
      return false
    }
  }

  // Get a specific preference value
  const getPreference = <T extends PreferenceCategory>(
    category: T,
    key: PreferenceKey<T>
  ) => {
    return preferences[category][key]
  }

  return {
    preferences,
    isLoading,
    error,

    // Preference actions
    updatePreference,
    savePreferences,
    resetCategory,
    resetAllPreferences,
    exportPreferences,
    importPreferences,
    getPreference,

    // SWR utilities
    refreshPreferences: () => mutatePreferences(),
    clearPreferencesCache: () => mutate(PREFERENCES_KEY, undefined, false),
    mutate: mutatePreferences,
  }
}

// Global function to invalidate preferences across the app
export const invalidateUserPreferences = () => {
  return mutate(PREFERENCES_KEY)
}

// Global function to update preferences cache without API call (for immediate UI updates)
export const updatePreferencesCache = (
  updater: (current: UserPreferences) => UserPreferences
) => {
  return mutate(
    PREFERENCES_KEY,
    (currentData) => {
      if (!currentData) return defaultPreferences
      return updater(currentData)
    },
    false
  )
}

// Legacy export for backward compatibility
export const useUserPreferences = usePreferences
