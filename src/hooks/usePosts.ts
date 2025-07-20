import { useState, useEffect, useMemo } from 'react'
import type { Post, PostsData, DomainType, NewPostForm } from '../types'
import { samplePosts } from '../data/samplePosts'

export const usePosts = (currentDomain: DomainType) => {
  const [posts, setPosts] = useState<PostsData>({} as PostsData)
  const [searchTerm, setSearchTerm] = useState('')

  // Initialize posts for all domains
  useEffect(() => {
    setPosts({
      'tech.blog': samplePosts['tech.blog'] || [],
      'lifestyle.blog': samplePosts['lifestyle.blog'] || [],
      'business.blog': samplePosts['business.blog'] || [],
      default: [],
    })
  }, [])

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
    addPost,
  }
}
