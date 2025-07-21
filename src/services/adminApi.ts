// Admin API service for backend integration

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

class AdminApiService {
  private baseUrl = 'http://localhost:3000/admin'

  // Helper to get auth headers
  private getAuthHeaders(domain?: string): HeadersInit {
    const token = localStorage.getItem('auth_token')

    // Map frontend domain names to backend domain names
    const domainMap: Record<string, string> = {
      'tech.blog': 'tech.localhost',
      'lifestyle.blog': 'lifestyle.localhost',
      'business.blog': 'business.localhost',
    }

    const backendDomain = domainMap[domain || 'tech.blog'] || 'tech.localhost'

    const headers: HeadersInit = {
      // Note: Browser cannot set Host header, so we'll use a custom header instead
      'X-Domain': backendDomain,
      'Content-Type': 'application/json',
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
    status?: string
  ): Promise<AdminPostsResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    })

    if (status) {
      params.append('status', status)
    }

    try {
      const response = await fetch(`${this.baseUrl}/posts?${params}`, {
        headers: this.getAuthHeaders(domain),
      })

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
      const response = await fetch(`${this.baseUrl}/posts/${id}`, {
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
    domain?: string
  ): Promise<AdminPost> {
    try {
      const response = await fetch(`${this.baseUrl}/posts`, {
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
    domain?: string
  ): Promise<AdminPost> {
    try {
      const response = await fetch(`${this.baseUrl}/posts/${id}`, {
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
      const response = await fetch(`${this.baseUrl}/posts/${id}`, {
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

  // Get analytics summary
  async getAnalytics(domain?: string): Promise<AnalyticsSummary> {
    try {
      const response = await fetch(`${this.baseUrl}/analytics`, {
        headers: this.getAuthHeaders(domain),
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

  // Get domain settings
  async getDomainSettings(domain?: string) {
    try {
      const response = await fetch(`${this.baseUrl}/domain/settings`, {
        headers: this.getAuthHeaders(domain),
      })

      if (!response.ok) {
        throw new Error(
          `Failed to fetch domain settings: ${response.statusText}`
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
      const response = await fetch(`${this.baseUrl}/domain/settings`, {
        method: 'PUT',
        headers: this.getAuthHeaders(domain),
        body: JSON.stringify(settings),
      })

      if (!response.ok) {
        throw new Error(
          `Failed to update domain settings: ${response.statusText}`
        )
      }

      return await response.json()
    } catch (error) {
      console.error('Error updating domain settings:', error)
      throw error
    }
  }
}

export const adminApiService = new AdminApiService()
