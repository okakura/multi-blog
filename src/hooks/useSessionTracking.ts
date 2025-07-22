// React hook for session tracking
import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { sessionApiService } from '../services/sessionApi'

/**
 * Hook to automatically track user sessions and page views
 */
export const useSessionTracking = () => {
  const location = useLocation()

  useEffect(() => {
    // Initialize session tracking when the app loads
    const initializeSession = async () => {
      await sessionApiService.initialize()
    }

    initializeSession()

    // Cleanup on unmount
    return () => {
      sessionApiService.endSession()
    }
  }, [])

  useEffect(() => {
    // Track page views when location changes
    sessionApiService.trackPageView(location.pathname)
  }, [location.pathname])

  return {
    sessionId: sessionApiService.getCurrentSessionId(),
    isSessionActive: sessionApiService.isSessionActive(),
  }
}
