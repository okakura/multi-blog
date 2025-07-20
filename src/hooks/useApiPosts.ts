import { useState, useEffect, useMemo } from 'react'
import type { Post, PostsData, DomainType, NewPostForm } from '../types'
import { apiService, type ApiPost } from '../services/api'

// Convert API post to frontend post format
const convertApiPost = (apiPost: ApiPost): Post => ({
  id: apiPost.id,
  title: apiPost.title,
  author: apiPost.author,
  category: apiPost.category,
  date: new Date(apiPost.created_at).toISOString().split('T')[0],
  excerpt: apiPost.content.substring(0, 150) + '...', // Create excerpt from content
  content: apiPost.content,
  readTime: `${Math.ceil(apiPost.content.length / 200)} min read`,
})

export const useApiPosts = (currentDomain: DomainType) => {
  const [posts, setPosts] = useState<PostsData>({} as PostsData)
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch posts for current domain
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await apiService.getPosts(currentDomain)
        const convertedPosts = response.posts.map(convertApiPost)

        setPosts((prev) => ({
          ...prev,
          [currentDomain]: convertedPosts,
        }))
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch posts')
        console.error('Error fetching posts:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchPosts()
  }, [currentDomain])

  // Get posts for current domain
  const currentPosts = posts[currentDomain] || []

  // Filter posts based on search
  const filteredPosts = useMemo(() => {
    if (!searchTerm) return currentPosts
    return currentPosts.filter(
      (post) =>
        post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.excerpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.category.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [currentPosts, searchTerm])

  // Search posts via API
  const searchPosts = async (query: string) => {
    if (!query.trim()) {
      setSearchTerm('')
      return
    }

    try {
      setLoading(true)
      setError(null)

      const response = await apiService.searchPosts(currentDomain, query)
      const convertedPosts = response.posts.map(convertApiPost)

      setPosts((prev) => ({
        ...prev,
        [currentDomain]: convertedPosts,
      }))
      setSearchTerm(query)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed')
      console.error('Error searching posts:', err)
    } finally {
      setLoading(false)
    }
  }

  // Get posts by category
  const getPostsByCategory = async (category: string) => {
    try {
      setLoading(true)
      setError(null)

      const response = await apiService.getPostsByCategory(
        currentDomain,
        category
      )
      const convertedPosts = response.posts.map(convertApiPost)

      setPosts((prev) => ({
        ...prev,
        [currentDomain]: convertedPosts,
      }))
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to fetch posts by category'
      )
      console.error('Error fetching posts by category:', err)
    } finally {
      setLoading(false)
    }
  }

  // Add post (this would need to be implemented in the API)
  const addPost = (newPostData: NewPostForm) => {
    const post: Post = {
      ...newPostData,
      id: Date.now(),
      date: new Date().toISOString().split('T')[0],
      readTime: `${Math.ceil(newPostData.content.length / 200)} min read`,
    }

    setPosts((prev) => ({
      ...prev,
      [currentDomain]: [post, ...(prev[currentDomain] || [])],
    }))
  }

  return {
    posts,
    currentPosts,
    filteredPosts,
    searchTerm,
    setSearchTerm,
    loading,
    error,
    addPost,
    searchPosts,
    getPostsByCategory,
  }
}
