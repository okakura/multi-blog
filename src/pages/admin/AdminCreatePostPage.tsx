import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Save,
  Eye,
  FileText,
  User,
  Tag,
  Hash,
  Globe,
} from 'lucide-react'
import { useAdminPosts } from '../../hooks/useAdminPosts'
import { adminToast, showToast } from '../../utils/toast'
import type { NewPostForm } from '../../types'

const AdminCreatePostPage: React.FC = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState<
    NewPostForm & { domain: string; status: 'published' | 'draft' }
  >({
    title: '',
    author: '',
    category: '',
    excerpt: '',
    content: '',
    domain: 'tech.blog',
    status: 'draft',
  })

  const [showPreview, setShowPreview] = useState(false)

  // Use the admin posts hook for the selected domain
  const { createPost, isCreating } = useAdminPosts(formData.domain)

  const domains = ['tech.blog', 'lifestyle.blog', 'business.blog']
  const categories = [
    'Technology',
    'Web Development',
    'AI',
    'Programming',
    'Design',
    'Business',
    'Lifestyle',
    'Health',
    'Travel',
    'Food',
    'Fashion',
    'Productivity',
    'Marketing',
    'Entrepreneurship',
    'Personal Growth',
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isFormValid() && !isCreating) {
      const toastId = adminToast.saving()

      try {
        await createPost({
          title: formData.title,
          content: formData.content,
          category: formData.category,
          slug: undefined, // Let backend generate
          status: formData.status,
          domain: formData.domain,
        })

        showToast.dismiss(toastId)

        // Success feedback with appropriate message
        if (formData.status === 'published') {
          adminToast.postPublished(formData.title)
        } else {
          adminToast.postCreated(formData.title)
        }

        // Navigate back to posts list after a brief delay
        setTimeout(() => {
          navigate('/admin/posts')
        }, 1500)
      } catch (error) {
        console.error('Failed to create post:', error)
        showToast.dismiss(toastId)
        showToast.error('Failed to create post. Please try again.')
      }
    } else if (!isFormValid()) {
      showToast.warning('Please fill in all required fields! 📝')
    }
  }

  const handleReset = () => {
    setFormData({
      title: '',
      author: '',
      category: '',
      excerpt: '',
      content: '',
      domain: 'tech.blog',
      status: 'draft',
    })
    setShowPreview(false)
  }

  const isFormValid = () => {
    return (
      formData.title &&
      formData.author &&
      formData.category &&
      formData.excerpt &&
      formData.content
    )
  }

  const wordCount = formData.content
    .split(/\s+/)
    .filter((word) => word.length > 0).length
  const readTime = Math.ceil(wordCount / 200)

  return (
    <div className='min-h-screen bg-slate-50'>
      {/* Header */}
      <div className='bg-white border-b border-slate-200 sticky top-0 z-10'>
        <div className='max-w-7xl mx-auto px-6 py-4'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center space-x-4'>
              <button
                onClick={() => navigate('/admin/posts')}
                className='flex items-center space-x-2 text-slate-600 hover:text-slate-900 transition-colors'>
                <ArrowLeft size={20} />
                <span>Back to Posts</span>
              </button>
              <div className='w-px h-6 bg-slate-300' />
              <div className='flex items-center space-x-3'>
                <FileText size={24} className='text-purple-600' />
                <div>
                  <h1 className='text-2xl font-bold text-slate-900'>
                    Create New Post
                  </h1>
                  <p className='text-slate-600'>
                    Write and publish your next article
                  </p>
                </div>
              </div>
            </div>
            <div className='flex items-center space-x-3'>
              <button
                onClick={() => setShowPreview(!showPreview)}
                className='flex items-center space-x-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors'>
                <Eye size={16} />
                <span>{showPreview ? 'Edit' : 'Preview'}</span>
              </button>
              <div
                className={`flex items-center space-x-1 text-sm ${
                  isFormValid() ? 'text-green-600' : 'text-orange-600'
                }`}>
                <div
                  className={`w-2 h-2 rounded-full ${
                    isFormValid() ? 'bg-green-500' : 'bg-orange-500'
                  }`}
                />
                <span>
                  {isFormValid() ? 'Ready to publish' : 'Fill all fields'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className='max-w-7xl mx-auto px-6 py-6'>
        <form
          onSubmit={handleSubmit}
          className='flex gap-6 h-[calc(100vh-200px)]'>
          {/* Form Side */}
          <div
            className={`${
              showPreview ? 'w-1/2' : 'w-full'
            } overflow-y-auto space-y-6 bg-white rounded-lg border border-slate-200 p-6`}>
            {/* Meta Information Row */}
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4 pb-6 border-b border-slate-200'>
              <div>
                <label className='flex items-center space-x-2 text-sm font-medium text-slate-700 mb-2'>
                  <Globe size={16} />
                  <span>Domain</span>
                </label>
                <select
                  value={formData.domain}
                  onChange={(e) =>
                    setFormData({ ...formData, domain: e.target.value })
                  }
                  className='w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-slate-900 bg-white'>
                  {domains.map((domain) => (
                    <option key={domain} value={domain}>
                      {domain}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className='flex items-center space-x-2 text-sm font-medium text-slate-700 mb-2'>
                  <Tag size={16} />
                  <span>Status</span>
                </label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      status: e.target.value as 'published' | 'draft',
                    })
                  }
                  className='w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-slate-900 bg-white'>
                  <option value='draft'>Draft</option>
                  <option value='published'>Published</option>
                </select>
              </div>

              <div>
                <label className='flex items-center space-x-2 text-sm font-medium text-slate-700 mb-2'>
                  <Hash size={16} />
                  <span>Category</span>
                </label>
                <select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  className='w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-slate-900 bg-white'
                  required>
                  <option value=''>Select Category</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Title */}
            <div>
              <label className='flex items-center space-x-2 text-sm font-medium text-slate-700 mb-2'>
                <FileText size={16} />
                <span>Title</span>
              </label>
              <input
                type='text'
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                className='w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-lg text-slate-900 placeholder-slate-500 bg-white'
                placeholder='Enter a compelling title...'
                required
              />
            </div>

            {/* Author */}
            <div>
              <label className='flex items-center space-x-2 text-sm font-medium text-slate-700 mb-2'>
                <User size={16} />
                <span>Author</span>
              </label>
              <input
                type='text'
                value={formData.author}
                onChange={(e) =>
                  setFormData({ ...formData, author: e.target.value })
                }
                className='w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-slate-900 placeholder-slate-500 bg-white'
                placeholder='Author name...'
                required
              />
            </div>

            {/* Excerpt */}
            <div>
              <label className='block text-sm font-medium text-slate-700 mb-2'>
                Excerpt
              </label>
              <textarea
                rows={2}
                value={formData.excerpt}
                onChange={(e) =>
                  setFormData({ ...formData, excerpt: e.target.value })
                }
                className='w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none text-slate-900 placeholder-slate-500 bg-white'
                placeholder='A brief summary that will appear on the blog grid...'
                required
              />
              <p className='text-sm text-slate-500 mt-1'>
                {formData.excerpt.length}/200 characters
              </p>
            </div>

            {/* Content */}
            <div className='flex-1'>
              <label className='block text-sm font-medium text-slate-700 mb-2'>
                Content
              </label>
              <textarea
                rows={showPreview ? 10 : 20}
                value={formData.content}
                onChange={(e) =>
                  setFormData({ ...formData, content: e.target.value })
                }
                className='w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none text-slate-900 placeholder-slate-500 bg-white'
                placeholder='Write your article content here...'
                required
              />
              <div className='flex justify-between items-center mt-1'>
                <p className='text-sm text-slate-500'>
                  {wordCount} words • {readTime} min read
                </p>
                <p className='text-sm text-slate-500'>
                  {formData.content.length} characters
                </p>
              </div>
            </div>
          </div>

          {/* Preview Side */}
          {showPreview && (
            <div className='w-1/2 bg-white rounded-lg border border-slate-200 overflow-y-auto'>
              <div className='p-6 bg-slate-50 border-b border-slate-200'>
                <h3 className='text-lg font-semibold text-slate-900'>
                  Preview
                </h3>
                <p className='text-sm text-slate-600'>
                  How your post will appear
                </p>
              </div>
              <div className='p-6'>
                <article className='prose max-w-none'>
                  <h1 className='text-3xl font-bold text-slate-900 mb-2'>
                    {formData.title || 'Untitled Post'}
                  </h1>
                  <div className='flex items-center space-x-4 text-sm text-slate-600 mb-6'>
                    <span>By {formData.author || 'Author'}</span>
                    <span>•</span>
                    <span>{formData.category || 'Category'}</span>
                    <span>•</span>
                    <span>{readTime} min read</span>
                  </div>
                  {formData.excerpt && (
                    <p className='text-lg text-slate-700 font-medium mb-6 border-l-4 border-purple-500 pl-4'>
                      {formData.excerpt}
                    </p>
                  )}
                  <div className='whitespace-pre-wrap text-slate-800 leading-relaxed'>
                    {formData.content ||
                      'Start writing to see your content here...'}
                  </div>
                </article>
              </div>
            </div>
          )}
        </form>
      </div>

      {/* Floating Action Bar */}
      <div className='fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 lg:pl-64'>
        <div className='max-w-7xl mx-auto flex items-center justify-between'>
          <div className='flex items-center space-x-4 text-sm text-slate-600'>
            <span>Auto-saved 2 minutes ago</span>
          </div>
          <div className='flex items-center space-x-3'>
            <button
              type='button'
              onClick={handleReset}
              className='px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors'>
              Reset
            </button>
            <button
              type='button'
              onClick={() => navigate('/admin/posts')}
              className='px-6 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 transition-colors'>
              Cancel
            </button>
            <button
              type='submit'
              onClick={handleSubmit}
              disabled={!isFormValid() || isCreating}
              className='flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'>
              <Save size={16} />
              <span>{isCreating ? 'Saving...' : 'Save Post'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminCreatePostPage
