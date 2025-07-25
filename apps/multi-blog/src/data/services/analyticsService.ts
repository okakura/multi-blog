// Enhanced analytics service for comprehensive user behavior tracking
import { buildApiUrl } from '@/config/dev'

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

export interface SearchAnalytics {
  query: string
  results_count: number
  clicked_result?: string
  position_clicked?: number
  no_results: boolean
  timestamp: string
  session_id: string
}

export interface ContentMetrics {
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

class AnalyticsService {
  private baseUrl: string
  private currentSessionId: string | null = null
  private pageStartTime: number = Date.now()
  private maxScrollDepth: number = 0
  private engagementEvents: number = 0
  private readingStartTime: number | null = null
  private isReading: boolean = false

  // Scroll depth tracking
  private scrollThresholds = [25, 50, 75, 90, 100]
  private triggeredThresholds = new Set<number>()

  // Reading time tracking
  private lastActivityTime: number = Date.now()
  private totalReadingTime: number = 0
  private readonly READING_THRESHOLD = 30000 // 30 seconds of inactivity stops reading timer

  constructor() {
    this.baseUrl = buildApiUrl('/analytics')
    this.setupBehaviorTracking()
  }

  setSessionId(sessionId: string) {
    this.currentSessionId = sessionId
  }

  private setupBehaviorTracking() {
    // Click tracking with element identification
    document.addEventListener('click', (event) => {
      this.trackClick(event)
    })

    // Scroll depth tracking
    let scrollTimeout: number
    document.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout)
      scrollTimeout = setTimeout(() => {
        this.trackScrollDepth()
      }, 100)
    })

    // Reading time tracking
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.pauseReading()
      } else {
        this.resumeReading()
      }
    })

    // Activity tracking for reading time
    const activityEvents: Array<keyof DocumentEventMap> = [
      'click',
      'scroll',
      'mousemove',
      'keypress',
    ]
    activityEvents.forEach((eventType) => {
      document.addEventListener(eventType, () => {
        this.updateActivity()
      })
    })

    // Page unload tracking
    window.addEventListener('beforeunload', () => {
      this.trackContentMetrics()
    })
  }

  /**
   * Track user clicks with detailed element information
   */
  private trackClick(event: MouseEvent) {
    if (!this.currentSessionId) return

    const target = event.target as HTMLElement
    const elementInfo = this.getElementInfo(target)

    const clickEvent: UserBehaviorEvent = {
      type: 'click',
      element: elementInfo,
      position: { x: event.clientX, y: event.clientY },
      timestamp: new Date().toISOString(),
      session_id: this.currentSessionId,
      page_path: window.location.pathname,
    }

    this.sendEvent(clickEvent)
    this.engagementEvents++
  }

  /**
   * Track scroll depth with milestone tracking
   */
  private trackScrollDepth() {
    if (!this.currentSessionId) return

    const scrollTop = window.pageYOffset || document.documentElement.scrollTop
    const documentHeight = Math.max(
      document.body.scrollHeight,
      document.body.offsetHeight,
      document.documentElement.clientHeight,
      document.documentElement.scrollHeight,
      document.documentElement.offsetHeight,
    )
    const windowHeight = window.innerHeight
    const scrollPercent = Math.round(
      ((scrollTop + windowHeight) / documentHeight) * 100,
    )

    this.maxScrollDepth = Math.max(this.maxScrollDepth, scrollPercent)

    // Track milestone thresholds
    for (const threshold of this.scrollThresholds) {
      if (
        scrollPercent >= threshold &&
        !this.triggeredThresholds.has(threshold)
      ) {
        this.triggeredThresholds.add(threshold)

        const scrollEvent: UserBehaviorEvent = {
          type: 'scroll',
          scroll_depth: threshold,
          timestamp: new Date().toISOString(),
          session_id: this.currentSessionId,
          page_path: window.location.pathname,
        }

        this.sendEvent(scrollEvent)
      }
    }
  }

  /**
   * Track search queries and results
   */
  async trackSearch(
    query: string,
    resultsCount: number,
    noResults: boolean = false,
  ) {
    if (!this.currentSessionId) return

    const searchData: SearchAnalytics = {
      query: query.toLowerCase().trim(),
      results_count: resultsCount,
      no_results: noResults,
      timestamp: new Date().toISOString(),
      session_id: this.currentSessionId,
    }

    try {
      await fetch(`${this.baseUrl}/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(searchData),
      })
    } catch (error) {
      console.error('Failed to track search:', error)
    }
  }

  /**
   * Track search result clicks
   */
  async trackSearchResultClick(
    query: string,
    clickedResult: string,
    position: number,
  ) {
    if (!this.currentSessionId) return

    const searchData: Partial<SearchAnalytics> = {
      query,
      clicked_result: clickedResult,
      position_clicked: position,
      timestamp: new Date().toISOString(),
      session_id: this.currentSessionId,
    }

    try {
      await fetch(`${this.baseUrl}/search-click`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(searchData),
      })
    } catch (error) {
      console.error('Failed to track search click:', error)
    }
  }

  /**
   * Start reading time tracking for content
   */
  startContentReading(contentId: string) {
    this.readingStartTime = Date.now()
    this.isReading = true
    this.lastActivityTime = Date.now()

    console.log('📖 Started reading tracking for:', contentId)
  }

  /**
   * Update activity timestamp (keeps reading timer active)
   */
  private updateActivity() {
    this.lastActivityTime = Date.now()

    // Resume reading if paused
    if (!this.isReading && this.readingStartTime) {
      this.isReading = true
    }
  }

  /**
   * Pause reading time tracking
   */
  private pauseReading() {
    if (this.isReading && this.readingStartTime) {
      const currentTime = Date.now()
      this.totalReadingTime += currentTime - this.readingStartTime
      this.isReading = false
    }
  }

  /**
   * Resume reading time tracking
   */
  private resumeReading() {
    if (this.readingStartTime && !this.isReading) {
      // Check if we haven't been inactive for too long
      const timeSinceActivity = Date.now() - this.lastActivityTime
      if (timeSinceActivity < this.READING_THRESHOLD) {
        this.readingStartTime = Date.now()
        this.isReading = true
      }
    }
  }

  /**
   * Calculate engagement score based on various factors
   */
  private calculateEngagementScore(): number {
    let score = 0

    // Base score from time on page (max 40 points)
    const timeOnPage = Date.now() - this.pageStartTime
    score += Math.min(40, (timeOnPage / 1000 / 60) * 10) // 10 points per minute, max 4 minutes

    // Scroll depth score (max 30 points)
    score += (this.maxScrollDepth / 100) * 30

    // Engagement events score (max 30 points)
    score += Math.min(30, this.engagementEvents * 2)

    return Math.round(score)
  }

  /**
   * Track comprehensive content metrics
   */
  async trackContentMetrics(
    contentId?: string,
    contentType: 'post' | 'page' | 'category' = 'page',
    title?: string,
  ) {
    if (!this.currentSessionId) return

    // Finalize reading time
    this.pauseReading()

    const timeOnPage = Date.now() - this.pageStartTime
    const engagementScore = this.calculateEngagementScore()

    // Consider it a bounce if less than 30 seconds and minimal scroll
    const isBounce = timeOnPage < 30000 && this.maxScrollDepth < 25

    const contentMetrics: ContentMetrics = {
      content_id: contentId || window.location.pathname,
      content_type: contentType,
      title: title || document.title,
      reading_time: Math.round(this.totalReadingTime / 1000), // Convert to seconds
      scroll_percentage: this.maxScrollDepth,
      time_on_page: Math.round(timeOnPage / 1000), // Convert to seconds
      bounce: isBounce,
      engagement_events: this.engagementEvents,
      session_id: this.currentSessionId,
      timestamp: new Date().toISOString(),
    }

    try {
      await fetch(`${this.baseUrl}/content-metrics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contentMetrics),
      })

      console.log('📊 Content metrics tracked:', {
        reading_time: contentMetrics.reading_time,
        scroll_depth: contentMetrics.scroll_percentage,
        engagement_score: engagementScore,
        bounce: isBounce,
      })
    } catch (error) {
      console.error('Failed to track content metrics:', error)
    }
  }

  /**
   * Reset metrics for new page
   */
  resetPageMetrics() {
    this.pageStartTime = Date.now()
    this.maxScrollDepth = 0
    this.engagementEvents = 0
    this.totalReadingTime = 0
    this.readingStartTime = null
    this.isReading = false
    this.triggeredThresholds.clear()
    this.lastActivityTime = Date.now()
  }

  /**
   * Send behavior event to analytics API
   */
  private async sendEvent(event: UserBehaviorEvent) {
    try {
      await fetch(`${this.baseUrl}/behavior`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event),
      })
    } catch (error) {
      console.error('Failed to send behavior event:', error)
    }
  }

  /**
   * Get detailed element information for click tracking
   */
  private getElementInfo(element: HTMLElement): string {
    const tagName = element.tagName.toLowerCase()
    const id = element.id ? `#${element.id}` : ''
    const classes = element.className
      ? `.${element.className.split(' ').join('.')}`
      : ''
    const text = element.textContent?.slice(0, 50) || ''

    // Special handling for links
    if (tagName === 'a') {
      const href = (element as HTMLAnchorElement).href
      return `${tagName}${id}${classes}[href="${href}"]`
    }

    // Special handling for buttons
    if (tagName === 'button' || element.getAttribute('role') === 'button') {
      return `${tagName}${id}${classes}[text="${text}"]`
    }

    return `${tagName}${id}${classes}`
  }
}

// Export singleton instance
export const analyticsService = new AnalyticsService()
