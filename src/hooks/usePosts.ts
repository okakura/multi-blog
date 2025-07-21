import { useState, useEffect, useMemo } from 'react'
import type { Post, PostsData, DomainType, NewPostForm } from '../types'

// Simple mock data for development
const mockPosts: Post[] = [
  {
    id: 1,
    title: 'Welcome to Tech Blog',
    author: 'Demo Author',
    category: 'Technology',
    date: '2025-01-15',
    excerpt:
      'Welcome to our technology blog. Here you will find the latest insights...',
    content: 'This is a sample post content for development purposes.',
    readTime: '3 min read',
    slug: 'welcome-to-tech-blog',
  },
  {
    id: 2,
    title: 'Getting Started with React',
    author: 'Demo Author',
    category: 'Web Development',
    date: '2025-01-10',
    excerpt: 'Learn the fundamentals of React development...',
    content: 'This is another sample post for development.',
    readTime: '5 min read',
    slug: 'getting-started-with-react',
  },
]

export const usePosts = (currentDomain: DomainType) => {
  const [posts, setPosts] = useState<PostsData>({} as PostsData)
  const [searchTerm, setSearchTerm] = useState('')

  // Initialize posts for all domains
  useEffect(() => {
    setPosts({
      'tech.blog': mockPosts,
      'lifestyle.blog': mockPosts,
      'business.blog': mockPosts,
      default: mockPosts,
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
      slug: newPostData.title
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, ''),
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
