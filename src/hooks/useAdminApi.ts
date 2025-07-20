import { useState } from 'react'
import useSWR from 'swr'
import {
  adminApiService,
  type AdminPost,
  type AdminPostsResponse,
  type AnalyticsSummary,
} from '../services/adminApi'

// Helper function for SWR keys
const createAdminCacheKey = {
  posts: (page = 1, limit = 10, domain?: string, status?: string) => [
    'admin-posts',
    page,
    limit,
    domain,
    status,
  ],

  post: (id: number, domain?: string) => ['admin-post', id, domain],

  analytics: (domain?: string) => ['admin-analytics', domain],

  domainSettings: (domain?: string) => ['admin-domain-settings', domain],
}

// Custom fetcher for admin endpoints
const adminFetcher = async (key: any[]) => {
  const [endpoint, ...params] = key

  switch (endpoint) {
    case 'admin-posts':
      const [, page, limit, domain, status] = params
      return adminApiService.getPosts(page, limit, domain, status)

    case 'admin-post':
      const [, id, postDomain] = params
      return adminApiService.getPost(id, postDomain)

    case 'admin-analytics':
      const [, analyticsDomain] = params
      return adminApiService.getAnalytics(analyticsDomain)

    case 'admin-domain-settings':
      const [, settingsDomain] = params
      return adminApiService.getDomainSettings(settingsDomain)

    default:
      throw new Error(`Unknown admin endpoint: ${endpoint}`)
  }
}

// Hook for admin posts list with filtering
export const useAdminPosts = (
  page = 1,
  limit = 10,
  domain?: string,
  status?: string
) => {
  const { data, error, isLoading, mutate } = useSWR<AdminPostsResponse>(
    createAdminCacheKey.posts(page, limit, domain, status),
    adminFetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 5000,
    }
  )

  // Actions
  const createPost = async (postData: any, postDomain?: string) => {
    try {
      const newPost = await adminApiService.createPost(postData, postDomain)
      // Optimistically update the cache
      mutate()
      return newPost
    } catch (error) {
      console.error('Failed to create post:', error)
      throw error
    }
  }

  const updatePost = async (id: number, postData: any, postDomain?: string) => {
    try {
      const updatedPost = await adminApiService.updatePost(
        id,
        postData,
        postDomain
      )
      // Optimistically update the cache
      mutate()
      return updatedPost
    } catch (error) {
      console.error('Failed to update post:', error)
      throw error
    }
  }

  const deletePost = async (id: number, postDomain?: string) => {
    try {
      await adminApiService.deletePost(id, postDomain)
      // Optimistically update the cache
      mutate()
    } catch (error) {
      console.error('Failed to delete post:', error)
      throw error
    }
  }

  return {
    posts: data?.posts || [],
    total: data?.total || 0,
    page: data?.page || 1,
    perPage: data?.per_page || limit,
    loading: isLoading,
    error: error?.message || null,
    mutate,
    createPost,
    updatePost,
    deletePost,
  }
}

// Hook for single admin post
export const useAdminPost = (id: number, domain?: string) => {
  const {
    data: post,
    error,
    isLoading,
    mutate,
  } = useSWR<AdminPost>(
    id ? createAdminCacheKey.post(id, domain) : null,
    adminFetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000,
    }
  )

  return {
    post,
    loading: isLoading,
    error: error?.message || null,
    mutate,
  }
}

// Hook for analytics data
export const useAdminAnalytics = (domain?: string) => {
  const {
    data: analytics,
    error,
    isLoading,
    mutate,
  } = useSWR<AnalyticsSummary>(
    createAdminCacheKey.analytics(domain),
    adminFetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // Cache for 1 minute
    }
  )

  return {
    analytics,
    loading: isLoading,
    error: error?.message || null,
    mutate,
  }
}

// Hook for domain settings
export const useAdminDomainSettings = (domain?: string) => {
  const {
    data: settings,
    error,
    isLoading,
    mutate,
  } = useSWR(createAdminCacheKey.domainSettings(domain), adminFetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 30000,
  })

  const updateSettings = async (newSettings: any, settingsDomain?: string) => {
    try {
      const updatedSettings = await adminApiService.updateDomainSettings(
        newSettings,
        settingsDomain
      )
      mutate()
      return updatedSettings
    } catch (error) {
      console.error('Failed to update domain settings:', error)
      throw error
    }
  }

  return {
    settings,
    loading: isLoading,
    error: error?.message || null,
    mutate,
    updateSettings,
  }
}

// Hook for managing posts with search and filters
export const useAdminPostsManager = () => {
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDomain, setSelectedDomain] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')

  const domain = selectedDomain === 'all' ? undefined : selectedDomain
  const status = selectedStatus === 'all' ? undefined : selectedStatus

  const {
    posts,
    total,
    loading,
    error,
    createPost,
    updatePost,
    deletePost,
    mutate,
  } = useAdminPosts(page, limit, domain, status)

  // Filter posts based on search term (client-side filtering)
  const filteredPosts = posts.filter((post) => {
    if (!searchTerm) return true
    const searchLower = searchTerm.toLowerCase()
    return (
      post.title.toLowerCase().includes(searchLower) ||
      post.author.toLowerCase().includes(searchLower) ||
      post.category.toLowerCase().includes(searchLower)
    )
  })

  const totalPages = Math.ceil(total / limit)

  return {
    // Data
    posts: filteredPosts,
    total,
    page,
    totalPages,
    loading,
    error,

    // Search and filters
    searchTerm,
    setSearchTerm,
    selectedDomain,
    setSelectedDomain,
    selectedStatus,
    setSelectedStatus,

    // Pagination
    setPage,
    nextPage: () => setPage((p) => Math.min(p + 1, totalPages)),
    prevPage: () => setPage((p) => Math.max(p - 1, 1)),

    // Actions
    createPost,
    updatePost,
    deletePost,
    refresh: mutate,
  }
}
