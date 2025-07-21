import React, { useEffect, useState } from 'react'
import { adminApiService } from '../../services/adminApi'

const AdminTest: React.FC = () => {
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const testAdminApi = async () => {
      try {
        console.log('Testing admin API directly...')
        const token = localStorage.getItem('auth_token')
        console.log('Auth token:', token)
        console.log('Token exists:', !!token)

        if (!token) {
          setError('No auth token found in localStorage')
          setLoading(false)
          return
        }

        console.log('Making admin API call...')
        const response = await adminApiService.getPosts(1, 100, 'tech.blog')
        console.log('Admin API direct call response:', response)
        console.log('Response type:', typeof response)
        console.log('Response.posts:', response.posts)
        console.log('Response.posts length:', response.posts?.length)

        if (response.posts) {
          setPosts(response.posts)
        } else {
          setPosts([])
          console.warn('No posts property in response')
        }
        setLoading(false)
      } catch (err) {
        console.error('Admin API test error:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
        setLoading(false)
      }
    }

    testAdminApi()
  }, [])

  if (loading) return <div>Testing admin API...</div>
  if (error) return <div>Error: {error}</div>

  return (
    <div className='p-6'>
      <h1 className='text-2xl font-bold mb-4'>Admin API Test</h1>
      <p>Found {posts.length} posts:</p>
      <ul className='list-disc ml-6'>
        {posts.map((post) => (
          <li key={post.id}>
            {post.title} by {post.author} ({post.status})
          </li>
        ))}
      </ul>
    </div>
  )
}

export default AdminTest
