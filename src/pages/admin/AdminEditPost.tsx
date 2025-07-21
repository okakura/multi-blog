import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Save, ArrowLeft, Loader2 } from 'lucide-react'
import { useAdminPost } from '../../hooks/useAdminPosts'
import { adminApiService } from '../../services/adminApi'

const AdminEditPost: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const postId = id ? parseInt(id, 10) : 0

  // Fetch the post data
  const { post, isLoading, error } = useAdminPost('tech.blog', postId)

  // Form state
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [category, setCategory] = useState('')
  const [status, setStatus] = useState<'published' | 'draft' | 'archived'>(
    'draft'
  )
  const [isUpdating, setIsUpdating] = useState(false)

  // Update form when post is loaded
  useEffect(() => {
    if (post) {
      setTitle(post.title)
      setContent(post.content)
      setCategory(post.category)
      setStatus(post.status)
    }
  }, [post])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim() || !content.trim()) {
      alert('Title and content are required')
      return
    }

    setIsUpdating(true)
    try {
      await adminApiService.updatePost(postId, {
        title: title.trim(),
        content: content.trim(),
        category: category.trim(),
        status,
      })

      // Navigate back to posts list
      navigate('/admin/posts')
    } catch (error) {
      console.error('Failed to update post:', error)
      alert('Failed to update post. Please try again.')
    } finally {
      setIsUpdating(false)
    }
  }

  if (isLoading) {
    return (
      <div className='p-6 max-w-4xl mx-auto'>
        <div className='flex justify-center items-center py-12'>
          <Loader2 className='animate-spin mr-2' size={20} />
          <span>Loading post...</span>
        </div>
      </div>
    )
  }

  if (error || !post) {
    return (
      <div className='p-6 max-w-4xl mx-auto'>
        <div className='text-center py-12'>
          <div className='text-red-500 mb-4'>
            <span className='text-lg'>⚠️ Error loading post</span>
          </div>
          <p className='text-red-600 mb-4'>{error || 'Post not found'}</p>
          <button
            onClick={() => navigate('/admin/posts')}
            className='px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors'>
            Back to Posts
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className='p-6 max-w-4xl mx-auto'>
      {/* Header */}
      <div className='flex items-center justify-between mb-8'>
        <div className='flex items-center space-x-4'>
          <button
            onClick={() => navigate('/admin/posts')}
            className='p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors'>
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className='text-3xl font-bold text-slate-900'>Edit Post</h1>
            <p className='text-slate-600'>Update your blog post</p>
          </div>
        </div>
      </div>

      {/* Edit Form */}
      <div className='bg-white rounded-xl shadow-sm border border-slate-200'>
        <form onSubmit={handleSubmit} className='p-6 space-y-6'>
          {/* Title */}
          <div>
            <label
              htmlFor='title'
              className='block text-sm font-medium text-slate-700 mb-2'>
              Title *
            </label>
            <input
              type='text'
              id='title'
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className='w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent text-slate-900 placeholder-slate-500 bg-white'
              placeholder='Enter post title...'
              required
            />
          </div>

          {/* Category */}
          <div>
            <label
              htmlFor='category'
              className='block text-sm font-medium text-slate-700 mb-2'>
              Category
            </label>
            <input
              type='text'
              id='category'
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className='w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent text-slate-900 placeholder-slate-500 bg-white'
              placeholder='Enter category...'
            />
          </div>

          {/* Status */}
          <div>
            <label
              htmlFor='status'
              className='block text-sm font-medium text-slate-700 mb-2'>
              Status
            </label>
            <select
              id='status'
              value={status}
              onChange={(e) =>
                setStatus(e.target.value as 'published' | 'draft' | 'archived')
              }
              className='w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent text-slate-900 bg-white'>
              <option value='draft'>Draft</option>
              <option value='published'>Published</option>
              <option value='archived'>Archived</option>
            </select>
          </div>

          {/* Content */}
          <div>
            <label
              htmlFor='content'
              className='block text-sm font-medium text-slate-700 mb-2'>
              Content *
            </label>
            <textarea
              id='content'
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={12}
              className='w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent text-slate-900 placeholder-slate-500 bg-white'
              placeholder='Write your post content...'
              required
            />
          </div>

          {/* Actions */}
          <div className='flex items-center justify-between pt-6 border-t border-slate-200'>
            <button
              type='button'
              onClick={() => navigate('/admin/posts')}
              className='px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors'>
              Cancel
            </button>
            <button
              type='submit'
              disabled={isUpdating || !title.trim() || !content.trim()}
              className='flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-2 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'>
              {isUpdating ? (
                <Loader2 size={16} className='animate-spin' />
              ) : (
                <Save size={16} />
              )}
              <span>{isUpdating ? 'Updating...' : 'Update Post'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AdminEditPost
