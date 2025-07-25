// Enhanced session tracking hook with comprehensive analytics integration
import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { analyticsService } from '@/data/services/analyticsService'
import { sessionApiService } from '@/data/services/sessionApi'

/**
 * Hook to automatically track user sessions and comprehensive analytics
 */
export const useSessionTracking = () => {
  const location = useLocation()

  useEffect(() => {
    // Initialize session tracking when the app loads
    const initializeSession = async () => {
      await sessionApiService.initialize()
      const sessionId = sessionApiService.getCurrentSessionId()
      
      if (sessionId) {
        analyticsService.setSessionId(sessionId)
        console.log('🔗 Enhanced session tracking initialized:', sessionId)
      }
    }

    initializeSession()

    // Cleanup on unmount
    return () => {
      sessionApiService.endSession()
    }
  }, [])

  // Track page views and reset analytics for new pages
  useEffect(() => {
    // Track page view in session
    sessionApiService.trackPageView(location.pathname)
    
    // Reset analytics metrics for new page
    analyticsService.resetPageMetrics()
    
    console.log('📊 Page analytics reset for:', location.pathname)
  }, [location.pathname])

  return {
    sessionId: sessionApiService.getCurrentSessionId(),
    isSessionActive: sessionApiService.isSessionActive(),
  }
}
