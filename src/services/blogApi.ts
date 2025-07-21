// Public Blog API service for frontend integration

export interface BlogPost {
  id: number
  title: string
  content: string
  author: string
  category: string
  slug: string
  created_at: string
}

export interface BlogPostSummary {
  id: number
  title: string
  author: string
  category: string
  slug: string
  created_at: string
}

export interface BlogPostsResponse {
  posts: BlogPostSummary[]
  total: number
  page: number
  per_page: number
}

export interface BlogHomeResponse {
  domain: string
  recent_posts: BlogPostSummary[]
  categories: string[]
}

class BlogApiService {
  private baseUrl = 'http://localhost:3000'

  // Helper to get headers with domain mapping
  private getHeaders(domain?: string): HeadersInit {
    // Map frontend domain names to backend domain names
    const domainMap: Record<string, string> = {
      'tech.blog': 'tech.localhost',
      'lifestyle.blog': 'lifestyle.localhost',
      'business.blog': 'business.localhost',
    }

    const backendDomain = domainMap[domain || 'tech.blog'] || 'tech.localhost'

    return {
      'X-Domain': backendDomain,
      'Content-Type': 'application/json',
    }
  }

  // Get homepage data (recent posts)
  async getHomePage(domain?: string): Promise<BlogHomeResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/`, {
        headers: this.getHeaders(domain),
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch homepage: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error fetching homepage:', error)
      throw error
    }
  }

  // Get list of posts
  async getPosts(
    page = 1,
    limit = 10,
    domain?: string,
    category?: string
  ): Promise<BlogPostsResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      per_page: limit.toString(),
    })

    if (category) {
      params.append('category', category)
    }

    try {
      const response = await fetch(`${this.baseUrl}/posts?${params}`, {
        headers: this.getHeaders(domain),
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch posts: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error fetching posts:', error)
      throw error
    }
  }

  // Get single post by slug
  async getPost(slug: string, domain?: string): Promise<BlogPost> {
    try {
      const response = await fetch(`${this.baseUrl}/posts/${slug}`, {
        headers: this.getHeaders(domain),
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

  // Get posts by category
  async getPostsByCategory(
    category: string,
    domain?: string
  ): Promise<BlogPostsResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/category/${category}`, {
        headers: this.getHeaders(domain),
      })

      if (!response.ok) {
        throw new Error(
          `Failed to fetch category posts: ${response.statusText}`
        )
      }

      return await response.json()
    } catch (error) {
      console.error('Error fetching category posts:', error)
      throw error
    }
  }

  // Search posts
  async searchPosts(
    query: string,
    page = 1,
    domain?: string
  ): Promise<BlogPostsResponse> {
    const params = new URLSearchParams({
      q: query,
      page: page.toString(),
    })

    try {
      const response = await fetch(`${this.baseUrl}/search?${params}`, {
        headers: this.getHeaders(domain),
      })

      if (!response.ok) {
        throw new Error(`Failed to search posts: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error searching posts:', error)
      throw error
    }
  }
}

export const blogApiService = new BlogApiService()
