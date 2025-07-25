// Admin API service for backend integration
import { API_CONFIG, buildApiUrl } from '@/config/dev'
import type {
  CreateUserRequest,
  UpdateUserRequest,
  User,
  UsersResponse,
} from '@/types'

export interface AdminPost {
  id: number
  title: string
  content: string
  author: string
  category: string
  slug: string
  status: 'published' | 'draft' | 'archived'
  domain_id: number
  domain_name?: string
  views?: number
  created_at: string
  updated_at: string
}

export interface AdminPostsResponse {
  posts: AdminPost[]
  total: number
  page: number
  per_page: number
}

export interface CreatePostRequest {
  title: string
  content: string
  category: string
  slug?: string
  status?: string
}

export interface AnalyticsSummary {
  total_posts: number
  total_views: number
  total_users: number
  active_domains: number
  monthly_views: number
  posts_this_month: number
}

export interface TopPost {
  id: number
  title: string
  slug: string
  views: number
  unique_views: number
}

export interface TopCategory {
  category: string
  views: number
  posts_count: number
}

export interface PeriodStats {
  page_views: number
  unique_visitors: number
  post_views: number
  searches: number
  avg_session_duration: number
}

export interface EnhancedAnalyticsSummary extends AnalyticsSummary {
  comprehensive?: any
  top_posts?: TopPost[]
  top_categories?: TopCategory[]
  current_period?: PeriodStats
  previous_period?: PeriodStats
  overview?: {
    total_sessions: number
    total_page_views: number
    avg_session_duration: number
    bounce_rate: number
    unique_visitors: number
  }
  behavior?: {
    top_clicked_elements: Array<{ element: string; clicks: number }>
    scroll_depth_distribution: Array<{ depth: number; percentage: number }>
    engagement_score_avg: number
  }
  search?: {
    top_queries: Array<{ query: string; count: number; results_avg: number }>
    no_results_rate: number
    search_to_click_rate: number
  }
  content?: {
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
}

export interface TrafficStats {
  daily_stats: Array<{
    date: string
    page_views: number
    unique_visitors: number
    post_views: number
  }>
  hourly_distribution: Array<{
    hour: number
    page_views: number
    unique_visitors: number
  }>
  device_breakdown: {
    mobile: number
    desktop: number
    tablet: number
    unknown: number
  }
}

export interface SearchAnalytics {
  popular_terms: Array<{
    query: string
    count: number
    results_found: boolean
  }>
  search_volume_trend: Array<{
    date: string
    searches: number
  }>
  no_results_queries: Array<{
    query: string
    count: number
    results_found: boolean
  }>
}

export interface ReferrerStats {
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

export interface Domain {
  id: number
  hostname: string
  name: string
  theme_config: any
  categories: any
  created_at: string
  updated_at: string
  posts_count?: number
  active_users?: number
  monthly_views?: number
}

export interface CreateDomainRequest {
  hostname: string
  name: string
  theme_config?: any
  categories?: string[]
}

export interface UpdateDomainRequest {
  hostname?: string
  name?: string
  theme_config?: any
  categories?: string[]
}

class AdminApiService {
  // Helper to build admin API URLs
  private buildUrl(
    endpoint: string,
    params?: Record<string, string | number>,
  ): string {
    // Remove leading slash if present to avoid double slashes
    const cleanEndpoint = endpoint.startsWith('/')
      ? endpoint.slice(1)
      : endpoint
    return buildApiUrl(`/admin/${cleanEndpoint}`, params)
  }

  // Helper to build analytics API URLs
  private buildAnalyticsUrl(
    endpoint: string,
    params?: Record<string, string | number>,
  ): string {
    // Remove leading slash if present to avoid double slashes
    const cleanEndpoint = endpoint.startsWith('/')
      ? endpoint.slice(1)
      : endpoint

    // Use simplified analytics endpoints (no multi prefix)
    return buildApiUrl(`/analytics/${cleanEndpoint}`, params)
  }

  // Helper to get auth headers
  private getAuthHeaders(domain?: string): HeadersInit {
    const token = localStorage.getItem('auth_token')

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }

    // Only set X-Domain header for specific domains, not for 'all'
    if (domain && domain !== 'all') {
      // Map frontend domain names to backend domain names
      const domainMap: Record<string, string> = {
        'tech.blog': 'tech.localhost',
        'lifestyle.blog': 'lifestyle.localhost',
        'business.blog': 'business.localhost',
      }

      const backendDomain = domainMap[domain] || domain // Use domain as-is if not in map
      headers['X-Domain'] = backendDomain
    }

    if (token) {
      headers.Authorization = `Bearer ${token}`
    }

    return headers
  }

  // Get all posts for admin
  async getPosts(
    page = 1,
    limit = 10,
    domain?: string,
    status?: string,
  ): Promise<AdminPostsResponse> {
    try {
      const params: Record<string, string | number> = { page, limit }
      if (domain) {
        params.domain = domain
      }

      const response = await fetch(this.buildUrl('/posts', params), {
        headers: this.getAuthHeaders(domain),
      })

      console.log('Admin API request:', {
        url: this.buildUrl('/posts', params),
        params,
        domain,
        headers: this.getAuthHeaders(domain),
      }) // Debug log

      if (!response.ok) {
        throw new Error(`Failed to fetch admin posts: ${response.statusText}`)
      }

      const data = await response.json()
      console.log('Admin API raw response:', data) // Debug log
      console.log('Response is array?', Array.isArray(data)) // Debug log

      // Handle both array response and paginated response
      if (Array.isArray(data)) {
        const result = {
          posts: data,
          total: data.length,
          page,
          per_page: limit,
        }
        console.log('Admin API transformed response:', result) // Debug log
        return result
      }

      console.log('Admin API returning data as-is:', data) // Debug log
      return data
    } catch (error) {
      console.error('Error fetching admin posts:', error)
      throw error
    }
  }

  // Get single post for admin
  async getPost(id: number, domain?: string): Promise<AdminPost> {
    try {
      const response = await fetch(this.buildUrl(`/posts/${id}`), {
        headers: this.getAuthHeaders(domain),
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch admin post: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error fetching admin post:', error)
      throw error
    }
  }

  // Create new post
  async createPost(
    data: CreatePostRequest,
    domain?: string,
  ): Promise<AdminPost> {
    try {
      const response = await fetch(this.buildUrl('/posts'), {
        method: 'POST',
        headers: this.getAuthHeaders(domain),
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error(`Failed to create post: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error creating post:', error)
      throw error
    }
  }

  // Update post
  async updatePost(
    id: number,
    data: Partial<CreatePostRequest>,
    domain?: string,
  ): Promise<AdminPost> {
    try {
      const response = await fetch(this.buildUrl(`/posts/${id}`), {
        method: 'PUT',
        headers: this.getAuthHeaders(domain),
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error(`Failed to update post: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error updating post:', error)
      throw error
    }
  }

  // Delete post
  async deletePost(id: number, domain?: string): Promise<void> {
    try {
      const response = await fetch(this.buildUrl(`/posts/${id}`), {
        method: 'DELETE',
        headers: this.getAuthHeaders(domain),
      })

      if (!response.ok) {
        throw new Error(`Failed to delete post: ${response.statusText}`)
      }
    } catch (error) {
      console.error('Error deleting post:', error)
      throw error
    }
  }

  // Get analytics summary - now uses multi-domain endpoint by default
  async getAnalytics(domain?: string): Promise<AnalyticsSummary> {
    try {
      const params: Record<string, string | number> = {}
      if (domain) {
        params.domain_id = domain
      }

      const response = await fetch(this.buildAnalyticsUrl('overview', params), {
        headers: this.getAuthHeaders(), // No domain header needed for multi-domain endpoint
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch analytics: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error fetching analytics:', error)
      throw error
    }
  }

  // Get analytics overview with days parameter
  async getAnalyticsOverview(days: number = 30, domain?: string): Promise<any> {
    try {
      const params: Record<string, string | number> = { days }
      if (domain) {
        params.domain_id = domain
      }

      const url = this.buildAnalyticsUrl('dashboard', params)
      const response = await fetch(url, {
        headers: this.getAuthHeaders(), // No domain header needed
      })

      if (!response.ok) {
        throw new Error(`Analytics overview failed: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error fetching analytics overview:', error)
      throw error
    }
  }

  // Get traffic analytics
  async getTrafficAnalytics(days: number = 30, domain?: string): Promise<any> {
    try {
      const params: Record<string, string | number> = { days }
      if (domain) {
        params.domain_id = domain
      }

      const url = this.buildAnalyticsUrl('traffic', params)
      const response = await fetch(url, {
        headers: this.getAuthHeaders(),
      })

      if (!response.ok) {
        throw new Error(`Traffic analytics failed: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error fetching traffic analytics:', error)
      throw error
    }
  }

  // Get post analytics
  async getPostAnalytics(days: number = 30, domain?: string): Promise<any> {
    try {
      const params: Record<string, string | number> = { days }
      if (domain) {
        params.domain_id = domain
      }

      const url = this.buildAnalyticsUrl('posts', params)
      const response = await fetch(url, {
        headers: this.getAuthHeaders(),
      })

      if (!response.ok) {
        throw new Error(`Post analytics failed: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error fetching post analytics:', error)
      throw error
    }
  }

  // Get search term analytics
  async getSearchAnalytics(days: number = 30, domain?: string): Promise<any> {
    try {
      const params: Record<string, string | number> = { days }
      if (domain) {
        params.domain_id = domain
      }

      const url = this.buildAnalyticsUrl('search-terms', params)
      const response = await fetch(url, {
        headers: this.getAuthHeaders(),
      })

      if (!response.ok) {
        throw new Error(`Search analytics failed: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error fetching search analytics:', error)
      throw error
    }
  }

  // Get referrer analytics
  async getReferrerAnalytics(days: number = 30, domain?: string): Promise<any> {
    try {
      const params: Record<string, string | number> = { days }
      if (domain) {
        params.domain_id = domain
      }

      const url = this.buildAnalyticsUrl('referrers', params)
      const response = await fetch(url, {
        headers: this.getAuthHeaders(),
      })

      if (!response.ok) {
        throw new Error(`Referrer analytics failed: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error fetching referrer analytics:', error)
      throw error
    }
  }

  // Get domain settings
  async getDomainSettings(domain?: string) {
    try {
      const response = await fetch(this.buildUrl('/domain/settings'), {
        headers: this.getAuthHeaders(domain),
      })

      if (!response.ok) {
        throw new Error(
          `Failed to fetch domain settings: ${response.statusText}`,
        )
      }

      return await response.json()
    } catch (error) {
      console.error('Error fetching domain settings:', error)
      throw error
    }
  }

  // Update domain settings
  async updateDomainSettings(settings: any, domain?: string) {
    try {
      const response = await fetch(this.buildUrl('/domain/settings'), {
        method: 'PUT',
        headers: this.getAuthHeaders(domain),
        body: JSON.stringify(settings),
      })

      if (!response.ok) {
        throw new Error(
          `Failed to update domain settings: ${response.statusText}`,
        )
      }

      return await response.json()
    } catch (error) {
      console.error('Error updating domain settings:', error)
      throw error
    }
  }

  // Domain Management Methods
  async getDomains(): Promise<Domain[]> {
    try {
      const response = await fetch(this.buildUrl('/domains'), {
        headers: this.getAuthHeaders(),
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch domains: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error fetching domains:', error)
      throw error
    }
  }

  async getDomain(id: number): Promise<Domain> {
    try {
      const response = await fetch(this.buildUrl(`/domains/${id}`), {
        headers: this.getAuthHeaders(),
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch domain: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error fetching domain:', error)
      throw error
    }
  }

  async createDomain(data: CreateDomainRequest): Promise<Domain> {
    try {
      const response = await fetch(this.buildUrl('/domains'), {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        if (response.status === 409) {
          throw new Error('Domain hostname already exists')
        }
        throw new Error(`Failed to create domain: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error creating domain:', error)
      throw error
    }
  }

  async updateDomain(id: number, data: UpdateDomainRequest): Promise<Domain> {
    try {
      const response = await fetch(this.buildUrl(`/domains/${id}`), {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        if (response.status === 409) {
          throw new Error('Domain hostname already exists')
        }
        throw new Error(`Failed to update domain: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error updating domain:', error)
      throw error
    }
  }

  async deleteDomain(id: number): Promise<void> {
    try {
      const response = await fetch(this.buildUrl(`/domains/${id}`), {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      })

      if (!response.ok) {
        if (response.status === 409) {
          throw new Error('Cannot delete domain with existing posts')
        }
        throw new Error(`Failed to delete domain: ${response.statusText}`)
      }
    } catch (error) {
      console.error('Error deleting domain:', error)
      throw error
    }
  }

  // User Preferences Methods
  async getPreferences(): Promise<any> {
    try {
      const response = await fetch(this.buildUrl('/profile/preferences'), {
        headers: this.getAuthHeaders(), // No domain context needed for user preferences
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch preferences: ${response.statusText}`)
      }

      const data = await response.json()
      return data.preferences
    } catch (error) {
      console.error('Error fetching preferences:', error)
      throw error
    }
  }

  async savePreferences(preferences: any): Promise<any> {
    try {
      const response = await fetch(this.buildUrl('/profile/preferences'), {
        method: 'PUT',
        headers: this.getAuthHeaders(), // No domain context needed for user preferences
        body: JSON.stringify({ preferences }),
      })

      if (!response.ok) {
        throw new Error(`Failed to save preferences: ${response.statusText}`)
      }

      const data = await response.json()
      return data.preferences
    } catch (error) {
      console.error('Error saving preferences:', error)
      throw error
    }
  }

  // User Management Methods
  async getUsers(page = 1, limit = 20): Promise<UsersResponse> {
    try {
      const response = await fetch(this.buildUrl('users', { page, limit }), {
        headers: this.getAuthHeaders(),
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch users: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error fetching users:', error)
      throw error
    }
  }

  async getUser(id: number): Promise<User> {
    try {
      const response = await fetch(this.buildUrl(`users/${id}`), {
        headers: this.getAuthHeaders(),
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch user: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error fetching user:', error)
      throw error
    }
  }

  async createUser(data: CreateUserRequest): Promise<User> {
    try {
      const response = await fetch(this.buildUrl('users'), {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error(`Failed to create user: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error creating user:', error)
      throw error
    }
  }

  async updateUser(id: number, data: UpdateUserRequest): Promise<User> {
    try {
      const response = await fetch(this.buildUrl(`users/${id}`), {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error(`Failed to update user: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error updating user:', error)
      throw error
    }
  }

  async deleteUser(id: number): Promise<void> {
    try {
      const response = await fetch(this.buildUrl(`users/${id}`), {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      })

      if (!response.ok) {
        throw new Error(`Failed to delete user: ${response.statusText}`)
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      throw error
    }
  }
}

export const adminApiService = new AdminApiService()
