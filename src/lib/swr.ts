import type { SWRConfiguration } from 'swr'
import { apiService } from '../services/api'

// SWR fetcher function that works with our API service
export const fetcher = async (url: string, domain?: string) => {
  // Parse the URL to extract endpoint and parameters
  const urlObj = new URL(url, 'http://localhost')
  const pathname = urlObj.pathname
  const searchParams = urlObj.searchParams

  // Route to appropriate API service method based on endpoint
  if (pathname === '/posts') {
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '10', 10)
    return apiService.getPosts(domain!, page, limit)
  }

  if (pathname.startsWith('/posts/') && pathname !== '/posts/') {
    const slug = pathname.replace('/posts/', '')
    return apiService.getPost(domain!, slug)
  }

  if (pathname === '/search') {
    const query = searchParams.get('q') || ''
    return apiService.searchPosts(domain!, query)
  }

  if (pathname === '/posts/category') {
    const category = searchParams.get('category') || ''
    return apiService.getPostsByCategory(domain!, category)
  }

  throw new Error(`Unknown endpoint: ${pathname}`)
}

// Default SWR configuration
export const swrConfig: SWRConfiguration = {
  fetcher,
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  refreshInterval: 0, // No automatic refresh unless needed
  dedupingInterval: 5000, // Dedupe requests within 5 seconds
  errorRetryCount: 3,
  errorRetryInterval: 1000,
  onError: (error) => {
    console.error('SWR Error:', error)
  },
}

// Helper function to create cache keys
export const createCacheKey = {
  posts: (domain: string, page = 1, limit = 10) => [
    `/posts?page=${page}&limit=${limit}`,
    domain,
  ],

  post: (domain: string, slug: string) => [`/posts/${slug}`, domain],

  search: (domain: string, query: string) => [
    `/search?q=${encodeURIComponent(query)}`,
    domain,
  ],

  postsByCategory: (domain: string, category: string) => [
    `/posts/category?category=${encodeURIComponent(category)}`,
    domain,
  ],
}
