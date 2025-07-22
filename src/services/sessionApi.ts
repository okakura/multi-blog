// Session tracking API service for real-time analytics
import { buildApiUrl } from '../config/dev'

export interface SessionData {
  id?: string
  user_agent: string
  ip_address?: string
  device_type?: string
  browser?: string
  os?: string
  screen_resolution?: string
  language?: string
  referrer?: string
  started_at?: string
  last_activity?: string
  ended_at?: string
  duration_seconds?: number
}

export interface CreateSessionRequest {
  user_agent: string
  referrer?: string | null
  screen_resolution?: string
  language?: string
}

export interface UpdateSessionRequest {
  last_activity: string
}

export interface EndSessionRequest {
  ended_at: string
}

class SessionApiService {
  private baseUrl: string
  private currentSessionId: string | null = null
  private activityTimer: number | null = null
  private readonly ACTIVITY_INTERVAL = 30000 // Update every 30 seconds
  private readonly SESSION_TIMEOUT = 30 * 60 * 1000 // 30 minutes
  private lastActivityTime: number = Date.now()

  constructor() {
    this.baseUrl = buildApiUrl('/session')
  }

  /**
   * Create a new session
   */
  async createSession(referrer?: string | null): Promise<string | null> {
    try {
      const sessionData: CreateSessionRequest = {
        user_agent: navigator.userAgent,
        referrer: referrer || document.referrer || null,
        screen_resolution: `${screen.width}x${screen.height}`,
        language: navigator.language,
      }

      const response = await fetch(`${this.baseUrl}/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sessionData),
      })

      if (!response.ok) {
        throw new Error(`Failed to create session: ${response.statusText}`)
      }

      const result = await response.json()
      this.currentSessionId = result.session_id
      this.lastActivityTime = Date.now()
      
      // Start activity tracking
      this.startActivityTracking()
      
      // Set up session end on page unload
      this.setupSessionEndHandlers()

      console.log('📊 Session created:', this.currentSessionId)
      return this.currentSessionId
    } catch (error) {
      console.error('Failed to create session:', error)
      return null
    }
  }

  /**
   * Update session activity
   */
  async updateSession(): Promise<void> {
    if (!this.currentSessionId) {
      return
    }

    try {
      await fetch(`${this.baseUrl}/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: this.currentSessionId,
          last_activity: new Date().toISOString(),
        }),
      })

      this.lastActivityTime = Date.now()
    } catch (error) {
      console.error('Failed to update session:', error)
    }
  }

  /**
   * End the current session
   */
  async endSession(): Promise<void> {
    if (!this.currentSessionId) {
      return
    }

    try {
      await fetch(`${this.baseUrl}/end`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: this.currentSessionId,
          ended_at: new Date().toISOString(),
        }),
      })

      console.log('📊 Session ended:', this.currentSessionId)
      this.cleanup()
    } catch (error) {
      console.error('Failed to end session:', error)
      this.cleanup()
    }
  }

  /**
   * Start automatic activity tracking
   */
  private startActivityTracking(): void {
    // Clear any existing timer
    if (this.activityTimer) {
      clearInterval(this.activityTimer)
    }

    // Update session activity periodically
    this.activityTimer = setInterval(() => {
      const timeSinceLastActivity = Date.now() - this.lastActivityTime
      
      // If too much time has passed, end the session
      if (timeSinceLastActivity >= this.SESSION_TIMEOUT) {
        this.endSession()
        return
      }

      // Update activity
      this.updateSession()
    }, this.ACTIVITY_INTERVAL)

    // Track user interactions to update last activity
    const updateActivity = () => {
      this.lastActivityTime = Date.now()
    }

    // Listen for various user interactions
    document.addEventListener('click', updateActivity)
    document.addEventListener('scroll', updateActivity)
    document.addEventListener('keypress', updateActivity)
    document.addEventListener('mousemove', updateActivity)
    
    // Store references for cleanup
    this.userInteractionHandlers = {
      click: updateActivity,
      scroll: updateActivity,
      keypress: updateActivity,
      mousemove: updateActivity,
    }
  }

  private userInteractionHandlers: Record<string, () => void> = {}

  /**
   * Set up handlers to end session on page unload
   */
  private setupSessionEndHandlers(): void {
    const endSessionHandler = () => {
      // Use sendBeacon for reliable session ending on page unload
      if (this.currentSessionId && navigator.sendBeacon) {
        const data = JSON.stringify({
          session_id: this.currentSessionId,
          ended_at: new Date().toISOString(),
        })
        
        navigator.sendBeacon(`${this.baseUrl}/end`, data)
      }
    }

    // Handle different ways the page can be unloaded
    window.addEventListener('beforeunload', endSessionHandler)
    window.addEventListener('unload', endSessionHandler)
    window.addEventListener('pagehide', endSessionHandler)
    
    // Handle visibility changes (tab switching, minimizing)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        // Page is hidden, update activity immediately
        this.updateSession()
      } else {
        // Page is visible again, update last activity
        this.lastActivityTime = Date.now()
      }
    })
  }

  /**
   * Track page navigation
   */
  trackPageView(path: string): void {
    this.lastActivityTime = Date.now()
    console.log('📊 Page view tracked:', path)
  }

  /**
   * Get current session ID
   */
  getCurrentSessionId(): string | null {
    return this.currentSessionId
  }

  /**
   * Check if session is active
   */
  isSessionActive(): boolean {
    return this.currentSessionId !== null
  }

  /**
   * Clean up resources
   */
  private cleanup(): void {
    this.currentSessionId = null
    
    if (this.activityTimer) {
      clearInterval(this.activityTimer)
      this.activityTimer = null
    }

    // Remove event listeners
    Object.entries(this.userInteractionHandlers).forEach(([event, handler]) => {
      document.removeEventListener(event, handler)
    })
    this.userInteractionHandlers = {}
  }

  /**
   * Initialize session tracking
   */
  async initialize(referrer?: string): Promise<void> {
    // Only create session if one doesn't exist
    if (!this.currentSessionId) {
      await this.createSession(referrer)
    }
  }
}

// Export singleton instance
export const sessionApiService = new SessionApiService()
