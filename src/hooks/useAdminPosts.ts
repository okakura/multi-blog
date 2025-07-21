// Hook for managing admin posts with SWR and API integration

import { useState } from 'react'
import useSWR from 'swr'
import {
  adminApiService,
  type AdminPost,
  type CreatePostRequest,
  type Domain,
  type CreateDomainRequest,
  type UpdateDomainRequest,
} from '../services/adminApi'

// Cache key creator for admin posts
const createAdminCacheKey = {
  posts: (domain: string) => `admin-posts-${domain}`,
  post: (domain: string, id: number) => `admin-post-${domain}-${id}`,
}

export const useAdminPosts = (domain: string = 'all') => {
  const [isCreating, setIsCreating] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Fetch all admin posts
  const {
    data: postsResponse,
    error,
    isLoading,
    mutate,
  } = useSWR<AdminPost[]>(
    createAdminCacheKey.posts(domain),
    async () => {
      if (domain === 'all') {
        // Fetch posts from all domains and combine them
        const domains = ['tech.blog', 'lifestyle.blog', 'business.blog']
        const allPosts: AdminPost[] = []

        for (const d of domains) {
          try {
            const response = await adminApiService.getPosts(1, 100, d)
            if (response.posts) {
              // Add domain info to each post for display
              const postsWithDomain = response.posts.map((post) => ({
                ...post,
                domain_name: d,
              }))
              allPosts.push(...postsWithDomain)
            }
          } catch (err) {
            console.warn(`Failed to fetch posts for domain ${d}:`, err)
          }
        }

        console.log('useAdminPosts all domains response:', allPosts) // Debug log
        return allPosts
      } else {
        // Fetch posts for specific domain
        const response = await adminApiService.getPosts(1, 100, domain)
        console.log('useAdminPosts single domain response:', response) // Debug log
        return response.posts || []
      }
    },
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000, // Cache for 30 seconds
    }
  )

  const posts = Array.isArray(postsResponse) ? postsResponse : []

  // Create a new post
  const createPost = async (
    postData: CreatePostRequest & { domain?: string }
  ) => {
    setIsCreating(true)
    try {
      const newPost = await adminApiService.createPost(
        {
          title: postData.title,
          content: postData.content,
          category: postData.category,
          slug: postData.slug,
          status: postData.status || 'draft',
        },
        postData.domain || domain
      )

      // Optimistically update the cache
      if (posts.length >= 0) {
        mutate([newPost, ...posts], false)
      }

      // Revalidate to ensure consistency
      mutate()

      return newPost
    } catch (error) {
      console.error('Failed to create post:', error)
      throw error
    } finally {
      setIsCreating(false)
    }
  }

  // Update an existing post
  const updatePost = async (
    id: number,
    postData: Partial<CreatePostRequest>
  ) => {
    setIsUpdating(true)
    try {
      const updatedPost = await adminApiService.updatePost(id, postData, domain)

      // Optimistically update the cache
      if (posts.length >= 0) {
        const updatedPosts = posts.map((post) =>
          post.id === id ? updatedPost : post
        )
        mutate(updatedPosts, false)
      }

      // Revalidate to ensure consistency
      mutate()

      return updatedPost
    } catch (error) {
      console.error('Failed to update post:', error)
      throw error
    } finally {
      setIsUpdating(false)
    }
  }

  // Delete a post
  const deletePost = async (id: number) => {
    setIsDeleting(true)
    try {
      await adminApiService.deletePost(id, domain)

      // Optimistically update the cache
      if (posts.length >= 0) {
        const filteredPosts = posts.filter((post) => post.id !== id)
        mutate(filteredPosts, false)
      }

      // Revalidate to ensure consistency
      mutate()
    } catch (error) {
      console.error('Failed to delete post:', error)
      throw error
    } finally {
      setIsDeleting(false)
    }
  }

  // Refresh posts
  const refresh = () => {
    mutate()
  }

  return {
    // Data
    posts: posts || [],

    // Loading states
    isLoading,
    isCreating,
    isUpdating,
    isDeleting,

    // Error state
    error: error?.message || null,

    // Actions
    createPost,
    updatePost,
    deletePost,
    refresh,

    // SWR utilities
    mutate,
  }
}

// Hook for a single admin post
export const useAdminPost = (domain: string, id: number) => {
  const {
    data: post,
    error,
    isLoading,
    mutate,
  } = useSWR<AdminPost>(
    id ? createAdminCacheKey.post(domain, id) : null,
    () => adminApiService.getPost(id, domain),
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // Cache single posts for 1 minute
    }
  )

  return {
    post,
    isLoading,
    error: error?.message || null,
    mutate,
  }
}

// Hook for analytics - enhanced with comprehensive data
export const useAdminAnalytics = (domain: string = 'tech.blog') => {
  const {
    data: analytics,
    error,
    isLoading,
    mutate,
  } = useSWR(
    `admin-analytics-comprehensive-${domain}`,
    async () => {
      // First get the basic analytics (keeping compatibility)
      const basicAnalytics = await adminApiService.getAnalytics(domain)

      // Then try to get the comprehensive analytics data
      try {
        const token = localStorage.getItem('auth_token')
        if (!token) return basicAnalytics

        const response = await fetch(
          `http://localhost:3000/admin/analytics/overview?days=30`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'X-Domain': 'tech.localhost',
              'Content-Type': 'application/json',
            },
          }
        )

        if (response.ok) {
          const comprehensiveData = await response.json()
          // Merge the data for enhanced dashboard experience
          return {
            ...basicAnalytics,
            comprehensive: comprehensiveData,
            top_posts: comprehensiveData.top_posts || [],
            top_categories: comprehensiveData.top_categories || [],
            current_period: comprehensiveData.current_period || null,
            previous_period: comprehensiveData.previous_period || null,
          }
        }
      } catch (err) {
        console.warn('Comprehensive analytics failed, using basic data:', err)
      }

      return basicAnalytics
    },
    {
      revalidateOnFocus: false,
      refreshInterval: 300000, // Refresh every 5 minutes
    }
  )

  return {
    analytics,
    isLoading,
    error: error?.message || null,
    refresh: mutate,
  }
}

// Hook for domain settings
export const useAdminDomainSettings = (domain: string = 'tech.blog') => {
  const [isUpdating, setIsUpdating] = useState(false)

  const {
    data: settings,
    error,
    isLoading,
    mutate,
  } = useSWR(
    `admin-domain-settings-${domain}`,
    () => adminApiService.getDomainSettings(domain),
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
    }
  )

  const updateSettings = async (newSettings: any) => {
    setIsUpdating(true)
    try {
      const updated = await adminApiService.updateDomainSettings(
        newSettings,
        domain
      )
      mutate(updated, false)
      mutate()
      return updated
    } catch (error) {
      console.error('Failed to update domain settings:', error)
      throw error
    } finally {
      setIsUpdating(false)
    }
  }

  return {
    settings,
    isLoading,
    isUpdating,
    error: error?.message || null,
    updateSettings,
    refresh: mutate,
  }
}

// Analytics-specific hooks
export const useAnalyticsOverview = (days = 30) => {
  const { data, error, isLoading, mutate } = useSWR(
    `analytics-overview-${days}`,
    async () => {
      const token = localStorage.getItem('auth_token')
      if (!token) throw new Error('No auth token')

      const response = await fetch(
        `http://localhost:3000/admin/analytics/overview?days=${days}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'X-Domain': 'tech.localhost',
            'Content-Type': 'application/json',
          },
        }
      )

      if (!response.ok) {
        throw new Error(`Analytics overview failed: ${response.status}`)
      }

      return await response.json()
    }
  )

  return {
    overview: data,
    isLoading,
    error: error?.message || null,
    refresh: mutate,
  }
}

export const useTrafficStats = (days = 30) => {
  const { data, error, isLoading, mutate } = useSWR(
    `analytics-traffic-${days}`,
    async () => {
      const token = localStorage.getItem('auth_token')
      if (!token) throw new Error('No auth token')

      const response = await fetch(
        `http://localhost:3000/admin/analytics/traffic?days=${days}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'X-Domain': 'tech.localhost',
            'Content-Type': 'application/json',
          },
        }
      )

      if (!response.ok) {
        throw new Error(`Traffic stats failed: ${response.status}`)
      }

      return await response.json()
    }
  )

  return {
    traffic: data,
    isLoading,
    error: error?.message || null,
    refresh: mutate,
  }
}

export const usePostAnalytics = (days = 30) => {
  const { data, error, isLoading, mutate } = useSWR(
    `analytics-posts-${days}`,
    async () => {
      const token = localStorage.getItem('auth_token')
      if (!token) throw new Error('No auth token')

      const response = await fetch(
        `http://localhost:3000/admin/analytics/posts?days=${days}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'X-Domain': 'tech.localhost',
            'Content-Type': 'application/json',
          },
        }
      )

      if (!response.ok) {
        throw new Error(`Post analytics failed: ${response.status}`)
      }

      return await response.json()
    }
  )

  return {
    postAnalytics: data,
    isLoading,
    error: error?.message || null,
    refresh: mutate,
  }
}

export const useSearchAnalytics = (days = 30) => {
  const { data, error, isLoading, mutate } = useSWR(
    `analytics-search-${days}`,
    async () => {
      const token = localStorage.getItem('auth_token')
      if (!token) throw new Error('No auth token')

      const response = await fetch(
        `http://localhost:3000/admin/analytics/search-terms?days=${days}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'X-Domain': 'tech.localhost',
            'Content-Type': 'application/json',
          },
        }
      )

      if (!response.ok) {
        throw new Error(`Search analytics failed: ${response.status}`)
      }

      return await response.json()
    }
  )

  return {
    searchAnalytics: data,
    isLoading,
    error: error?.message || null,
    refresh: mutate,
  }
}

export const useReferrerStats = (days = 30) => {
  const { data, error, isLoading, mutate } = useSWR(
    `analytics-referrers-${days}`,
    async () => {
      const token = localStorage.getItem('auth_token')
      if (!token) throw new Error('No auth token')

      const response = await fetch(
        `http://localhost:3000/admin/analytics/referrers?days=${days}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'X-Domain': 'tech.localhost',
            'Content-Type': 'application/json',
          },
        }
      )

      if (!response.ok) {
        throw new Error(`Referrer stats failed: ${response.status}`)
      }

      return await response.json()
    }
  )

  return {
    referrerStats: data,
    isLoading,
    error: error?.message || null,
    refresh: mutate,
  }
}

// Domain Management Hooks
export const useAdminDomains = () => {
  const [isCreating, setIsCreating] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const {
    data: domains,
    error,
    isLoading,
    mutate,
  } = useSWR<Domain[]>('admin-domains', () => adminApiService.getDomains(), {
    revalidateOnFocus: false,
    dedupingInterval: 30000, // Cache for 30 seconds
  })

  const createDomain = async (domainData: CreateDomainRequest) => {
    setIsCreating(true)
    try {
      const newDomain = await adminApiService.createDomain(domainData)

      // Optimistically update the cache
      if (domains) {
        mutate([newDomain, ...domains], false)
      }

      // Revalidate to ensure consistency
      mutate()

      return newDomain
    } catch (error) {
      console.error('Failed to create domain:', error)
      throw error
    } finally {
      setIsCreating(false)
    }
  }

  const updateDomain = async (id: number, domainData: UpdateDomainRequest) => {
    setIsUpdating(true)
    try {
      const updatedDomain = await adminApiService.updateDomain(id, domainData)

      // Optimistically update the cache
      if (domains) {
        const updatedDomains = domains.map((domain) =>
          domain.id === id ? updatedDomain : domain
        )
        mutate(updatedDomains, false)
      }

      // Revalidate to ensure consistency
      mutate()

      return updatedDomain
    } catch (error) {
      console.error('Failed to update domain:', error)
      throw error
    } finally {
      setIsUpdating(false)
    }
  }

  const deleteDomain = async (id: number) => {
    setIsDeleting(true)
    try {
      await adminApiService.deleteDomain(id)

      // Optimistically update the cache
      if (domains) {
        const filteredDomains = domains.filter((domain) => domain.id !== id)
        mutate(filteredDomains, false)
      }

      // Revalidate to ensure consistency
      mutate()
    } catch (error) {
      console.error('Failed to delete domain:', error)
      throw error
    } finally {
      setIsDeleting(false)
    }
  }

  return {
    domains: domains || [],
    isLoading,
    isCreating,
    isUpdating,
    isDeleting,
    error: error?.message || null,
    createDomain,
    updateDomain,
    deleteDomain,
    refresh: mutate,
  }
}

export const useAdminDomain = (id: number) => {
  const {
    data: domain,
    error,
    isLoading,
    mutate,
  } = useSWR<Domain>(
    id ? `admin-domain-${id}` : null,
    () => adminApiService.getDomain(id),
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
    }
  )

  return {
    domain,
    isLoading,
    error: error?.message || null,
    refresh: mutate,
  }
}
