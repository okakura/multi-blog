// Enhanced session tracking hook with comprehensive analytics
import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { analyticsService } from '@/data/services/analyticsService'
import { sessionApiService } from '@/data/services/sessionApi'

interface UseAnalyticsOptions {
  trackContent?: boolean
  contentId?: string
  contentType?: 'post' | 'page' | 'category'
  contentTitle?: string
}

/**
 * Enhanced hook for session tracking with comprehensive user behavior analytics
 */
export const useAnalytics = (options: UseAnalyticsOptions = {}) => {
  const location = useLocation()
  const previousPathRef = useRef<string>('')
  const {
    trackContent = false,
    contentId,
    contentType = 'page',
    contentTitle,
  } = options

  // Initialize session and analytics tracking
  useEffect(() => {
    const initializeTracking = async () => {
      // Initialize session tracking
      await sessionApiService.initialize()
      const sessionId = sessionApiService.getCurrentSessionId()
      
      if (sessionId) {
        analyticsService.setSessionId(sessionId)
        console.log('🔗 Analytics linked to session:', sessionId)
      }
    }

    initializeTracking()

    // Cleanup on unmount
    return () => {
      // Track final metrics before component unmounts
      if (trackContent && contentId) {
        analyticsService.trackContentMetrics(contentId, contentType, contentTitle)
      }
      sessionApiService.endSession()
    }
  }, [])

  // Handle route changes and page tracking
  useEffect(() => {
    const currentPath = location.pathname

    // If this is a route change (not initial load)
    if (previousPathRef.current && previousPathRef.current !== currentPath) {
      // Track metrics for the previous page
      if (trackContent && contentId) {
        analyticsService.trackContentMetrics(contentId, contentType, contentTitle)
      }
    }

    // Set up tracking for the new page
    analyticsService.resetPageMetrics()
    sessionApiService.trackPageView(currentPath)

    // Start content reading tracking if enabled
    if (trackContent && contentId) {
      analyticsService.startContentReading(contentId)
    }

    previousPathRef.current = currentPath
  }, [location.pathname, trackContent, contentId, contentType, contentTitle])

  // Utility functions for manual tracking
  const trackSearch = (query: string, resultsCount: number, noResults?: boolean) => {
    analyticsService.trackSearch(query, resultsCount, noResults)
  }

  const trackSearchClick = (query: string, clickedResult: string, position: number) => {
    analyticsService.trackSearchResultClick(query, clickedResult, position)
  }

  const trackContentMetrics = () => {
    if (contentId) {
      analyticsService.trackContentMetrics(contentId, contentType, contentTitle)
    }
  }

  return {
    sessionId: sessionApiService.getCurrentSessionId(),
    isSessionActive: sessionApiService.isSessionActive(),
    trackSearch,
    trackSearchClick,
    trackContentMetrics,
  }
}
