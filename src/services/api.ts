// API service for connecting to the multi-blog backend

export interface ApiPost {
  id: number
  title: string
  content?: string // Make content optional since it's not always returned
  author: string
  category: string
  slug: string
  created_at: string
}

export interface ApiPostsResponse {
  posts: ApiPost[]
  total: number
  page: number
  per_page: number
}

export interface ApiDomain {
  id: number
  hostname: string
  name: string
  theme_config: any
  categories: string[]
}

class ApiService {
  private baseUrl = '/api'

  // Helper to get the appropriate host header based on domain
  private getHostHeader(domain: string): string {
    const domainMap: Record<string, string> = {
      'tech.blog': 'tech.localhost',
      'lifestyle.blog': 'lifestyle.localhost',
      'business.blog': 'business.localhost',
    }
    return domainMap[domain] || 'tech.localhost'
  }

  // Fetch posts for a specific domain
  async getPosts(
    domain: string,
    page = 1,
    limit = 10
  ): Promise<ApiPostsResponse> {
    const hostHeader = this.getHostHeader(domain)

    try {
      const response = await fetch(
        `${this.baseUrl}/posts?page=${page}&limit=${limit}`,
        {
          headers: {
            Host: hostHeader,
            'Content-Type': 'application/json',
          },
        }
      )

      if (!response.ok) {
        throw new Error(`Failed to fetch posts: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error fetching posts:', error)
      throw error
    }
  }

  // Fetch a specific post by slug
  async getPost(domain: string, slug: string): Promise<ApiPost> {
    const hostHeader = this.getHostHeader(domain)

    try {
      const response = await fetch(`${this.baseUrl}/posts/${slug}`, {
        headers: {
          Host: hostHeader,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch post: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error fetching post:', error)
      throw error
    }
  }

  // Search posts
  async searchPosts(domain: string, query: string): Promise<ApiPostsResponse> {
    const hostHeader = this.getHostHeader(domain)

    try {
      const response = await fetch(
        `${this.baseUrl}/search?q=${encodeURIComponent(query)}`,
        {
          headers: {
            Host: hostHeader,
            'Content-Type': 'application/json',
          },
        }
      )

      if (!response.ok) {
        throw new Error(`Failed to search posts: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error searching posts:', error)
      throw error
    }
  }

  // Get posts by category
  async getPostsByCategory(
    domain: string,
    category: string
  ): Promise<ApiPostsResponse> {
    const hostHeader = this.getHostHeader(domain)

    try {
      const response = await fetch(
        `${this.baseUrl}/category/${encodeURIComponent(category)}`,
        {
          headers: {
            Host: hostHeader,
            'Content-Type': 'application/json',
          },
        }
      )

      if (!response.ok) {
        throw new Error(
          `Failed to fetch posts by category: ${response.statusText}`
        )
      }

      return await response.json()
    } catch (error) {
      console.error('Error fetching posts by category:', error)
      throw error
    }
  }

  // Health check
  async healthCheck(): Promise<{ status: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/health`)

      if (!response.ok) {
        throw new Error(`Health check failed: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Health check failed:', error)
      throw error
    }
  }
}

export const apiService = new ApiService()
