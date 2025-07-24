// SWR hooks for public blog data fetching

import { useState } from 'react'
import useSWR from 'swr'
import {
  type BlogHomeResponse,
  type BlogPost,
  type BlogPostSummary,
  type BlogPostsResponse,
  blogApiService,
} from '@/services/blogApi'

// Cache key creators for blog data
const createBlogCacheKey = {
  home: (domain: string) => `blog-home-${domain}`,
  posts: (domain: string, page: number, category?: string) =>
    `blog-posts-${domain}-${page}${category ? `-${category}` : ''}`,
  post: (domain: string, slug: string) => `blog-post-${domain}-${slug}`,
  search: (domain: string, query: string, page: number) =>
    `blog-search-${domain}-${query}-${page}`,
  category: (domain: string, category: string) =>
    `blog-category-${domain}-${category}`,
}

// Hook for homepage data
export const useBlogHome = (domain = 'tech.blog') => {
  const {
    data: homeData,
    error,
    isLoading,
    mutate,
  } = useSWR<BlogHomeResponse>(
    createBlogCacheKey.home(domain),
    () => blogApiService.getHomePage(domain),
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // Cache for 1 minute
    },
  )

  return {
    homeData,
    isLoading,
    error: error?.message || null,
    refresh: mutate,
  }
}

// Hook for posts listing
export const useBlogPosts = (
  domain = 'tech.blog',
  page = 1,
  category?: string,
) => {
  const {
    data: postsResponse,
    error,
    isLoading,
    mutate,
  } = useSWR<BlogPostsResponse>(
    createBlogCacheKey.posts(domain, page, category),
    () => blogApiService.getPosts(page, 20, domain, category),
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000, // Cache for 30 seconds
    },
  )

  return {
    posts: postsResponse?.posts || [],
    total: postsResponse?.total || 0,
    page: postsResponse?.page || 1,
    perPage: postsResponse?.per_page || 20,
    isLoading,
    error: error?.message || null,
    refresh: mutate,
  }
}

// Hook for single post
export const useBlogPost = (domain: string, slug: string) => {
  const {
    data: post,
    error,
    isLoading,
    mutate,
  } = useSWR<BlogPost>(
    slug ? createBlogCacheKey.post(domain, slug) : null,
    () => blogApiService.getPost(slug, domain),
    {
      revalidateOnFocus: false,
      dedupingInterval: 300000, // Cache single posts for 5 minutes
    },
  )

  return {
    post,
    isLoading,
    error: error?.message || null,
    refresh: mutate,
  }
}

// Hook for category posts
export const useBlogCategory = (domain: string, category: string) => {
  const {
    data: postsResponse,
    error,
    isLoading,
    mutate,
  } = useSWR<BlogPostsResponse>(
    category ? createBlogCacheKey.category(domain, category) : null,
    () => blogApiService.getPostsByCategory(category, domain),
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // Cache for 1 minute
    },
  )

  return {
    posts: postsResponse?.posts || [],
    total: postsResponse?.total || 0,
    isLoading,
    error: error?.message || null,
    refresh: mutate,
  }
}

// Hook for search functionality
export const useBlogSearch = (domain = 'tech.blog') => {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchPage, setSearchPage] = useState(1)
  const [isSearching, setIsSearching] = useState(false)

  const {
    data: searchResponse,
    error,
    isLoading,
    mutate,
  } = useSWR<BlogPostsResponse>(
    searchQuery
      ? createBlogCacheKey.search(domain, searchQuery, searchPage)
      : null,
    () => blogApiService.searchPosts(searchQuery, searchPage, domain),
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // Cache search results for 1 minute
    },
  )

  // Search function
  const search = async (query: string) => {
    setIsSearching(true)
    setSearchQuery(query)
    setSearchPage(1)

    try {
      // Trigger SWR fetch
      await mutate()
    } catch (error) {
      console.error('Search failed:', error)
    } finally {
      setIsSearching(false)
    }
  }

  // Clear search
  const clearSearch = () => {
    setSearchQuery('')
    setSearchPage(1)
    setIsSearching(false)
  }

  return {
    // Search state
    searchQuery,
    searchPage,
    isSearching: isSearching || isLoading,

    // Search results
    searchResults: searchResponse?.posts || [],
    searchTotal: searchResponse?.total || 0,

    // Actions
    search,
    clearSearch,
    setSearchPage,

    // Error state
    error: error?.message || null,
    refresh: mutate,
  }
}

// Utility hook that combines multiple blog data sources
export const useBlogData = (domain = 'tech.blog') => {
  const {
    homeData,
    isLoading: homeLoading,
    error: homeError,
  } = useBlogHome(domain)
  const {
    posts,
    isLoading: postsLoading,
    error: postsError,
  } = useBlogPosts(domain, 1)
  const { search, searchResults, isSearching, searchQuery, clearSearch } =
    useBlogSearch(domain)

  // Convert BlogPostSummary to legacy Post interface for compatibility
  const convertToLegacyPost = (blogPost: BlogPostSummary) => ({
    id: blogPost.id,
    title: blogPost.title,
    author: blogPost.author,
    category: blogPost.category,
    date: new Date(blogPost.created_at).toISOString().split('T')[0],
    excerpt: `Explore this ${blogPost.category.toLowerCase()} post by ${
      blogPost.author
    }. Click to read the full content.`, // Generated excerpt
    content: '', // Not available in summary, will be filled when viewing full post
    readTime: '3 min read', // Calculated placeholder
    slug: blogPost.slug,
  })

  // Use search results if searching, otherwise use regular posts
  const currentPosts = searchQuery
    ? searchResults.map(convertToLegacyPost)
    : posts.map(convertToLegacyPost)

  return {
    // Data
    homeData,
    posts: currentPosts,
    categories: homeData?.categories || [],

    // Loading states
    isLoading: homeLoading || postsLoading,
    isSearching,

    // Error states
    error: homeError || postsError,

    // Search functionality
    searchQuery,
    search,
    clearSearch,

    // Legacy compatibility
    filteredPosts: currentPosts,
    searchTerm: searchQuery,
    setSearchTerm: search,
  }
}
