import { useState, useMemo } from 'react'
import useSWR from 'swr'
import type { Post, DomainType, NewPostForm } from '../types'
import type { ApiPost, ApiPostsResponse } from '../services/api'
import { createCacheKey } from '../lib/swr'

// Convert API post to frontend post format
const convertApiPost = (apiPost: ApiPost): Post => ({
  id: apiPost.id,
  title: apiPost.title,
  author: apiPost.author,
  category: apiPost.category,
  date: new Date(apiPost.created_at).toISOString().split('T')[0],
  excerpt: apiPost.content
    ? apiPost.content.substring(0, 150) + '...'
    : `${apiPost.title} - Click to read more...`, // Use title for excerpt when no content
  content:
    apiPost.content || 'Content will be loaded when you view the full post',
  readTime: `${Math.ceil(
    (apiPost.content?.length || apiPost.title.length * 10) / 200
  )} min read`,
})

export const useApiPosts = (currentDomain: DomainType) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [currentCategory, setCurrentCategory] = useState<string | null>(null)

  // Main posts data with SWR
  const {
    data: postsResponse,
    error: postsError,
    isLoading: postsLoading,
    mutate: mutatePosts,
  } = useSWR<ApiPostsResponse>(createCacheKey.posts(currentDomain), {
    revalidateOnFocus: false,
    dedupingInterval: 10000, // Cache for 10 seconds
  })

  // Search results with SWR (only when there's a search term)
  const {
    data: searchResponse,
    error: searchError,
    isLoading: searchLoading,
  } = useSWR<ApiPostsResponse>(
    searchTerm ? createCacheKey.search(currentDomain, searchTerm) : null,
    {
      revalidateOnFocus: false,
      dedupingInterval: 5000,
    }
  )

  // Category filter with SWR (only when there's a category)
  const {
    data: categoryResponse,
    error: categoryError,
    isLoading: categoryLoading,
  } = useSWR<ApiPostsResponse>(
    currentCategory
      ? createCacheKey.postsByCategory(currentDomain, currentCategory)
      : null,
    {
      revalidateOnFocus: false,
      dedupingInterval: 5000,
    }
  )

  // Determine which data source to use
  const currentResponse = searchTerm
    ? searchResponse
    : currentCategory
    ? categoryResponse
    : postsResponse

  const currentError = searchTerm
    ? searchError
    : currentCategory
    ? categoryError
    : postsError

  const currentLoading = searchTerm
    ? searchLoading
    : currentCategory
    ? categoryLoading
    : postsLoading

  // Convert API posts to frontend format
  const currentPosts = useMemo(() => {
    if (!currentResponse?.posts) return []
    return currentResponse.posts.map(convertApiPost)
  }, [currentResponse])

  // For backwards compatibility, create posts object
  const posts = useMemo(
    () => ({
      [currentDomain]: currentPosts,
    }),
    [currentDomain, currentPosts]
  )

  // Search function that updates search term
  const searchPosts = async (query: string) => {
    if (!query.trim()) {
      setSearchTerm('')
      setCurrentCategory(null)
      return
    }
    setSearchTerm(query)
    setCurrentCategory(null)
  }

  // Category filter function
  const getPostsByCategory = async (category: string) => {
    setCurrentCategory(category)
    setSearchTerm('')
  }

  // Clear filters
  const clearFilters = () => {
    setSearchTerm('')
    setCurrentCategory(null)
  }

  // Add post function (optimistic update)
  const addPost = async (newPostData: NewPostForm) => {
    const optimisticPost: Post = {
      ...newPostData,
      id: Date.now(),
      date: new Date().toISOString().split('T')[0],
      readTime: `${Math.ceil(newPostData.content.length / 200)} min read`,
    }

    // Optimistically update the cache
    if (postsResponse) {
      const optimisticApiPost: ApiPost = {
        id: optimisticPost.id,
        title: optimisticPost.title,
        content: optimisticPost.content,
        author: optimisticPost.author,
        category: optimisticPost.category,
        slug: optimisticPost.title.toLowerCase().replace(/\s+/g, '-'),
        created_at: new Date().toISOString(),
      }

      const updatedResponse: ApiPostsResponse = {
        ...postsResponse,
        posts: [optimisticApiPost, ...postsResponse.posts],
        total: postsResponse.total + 1,
      }

      // Update the cache optimistically
      mutatePosts(updatedResponse, false)

      // TODO: Implement actual API call to create post
      // After successful API call, revalidate the cache
      // mutatePosts()
    }
  }

  // Refresh data
  const refresh = () => {
    mutatePosts()
  }

  return {
    // Data
    posts,
    currentPosts,
    filteredPosts: currentPosts, // SWR handles filtering through different endpoints

    // State
    searchTerm,
    setSearchTerm,
    currentCategory,

    // Loading states
    loading: currentLoading,
    error: currentError?.message || null,

    // Actions
    addPost,
    searchPosts,
    getPostsByCategory,
    clearFilters,
    refresh,

    // SWR specific
    isValidating: currentLoading,
    mutate: mutatePosts,
  }
}

// Hook for fetching a single post
export const useApiPost = (currentDomain: DomainType, slug: string) => {
  const {
    data: post,
    error,
    isLoading,
    mutate,
  } = useSWR<ApiPost>(slug ? createCacheKey.post(currentDomain, slug) : null, {
    revalidateOnFocus: false,
    dedupingInterval: 30000, // Cache single posts for 30 seconds
  })

  const convertedPost = useMemo(() => {
    return post ? convertApiPost(post) : null
  }, [post])

  return {
    post: convertedPost,
    loading: isLoading,
    error: error?.message || null,
    mutate,
  }
}
