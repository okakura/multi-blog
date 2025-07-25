import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Loader2,
  Save,
} from 'lucide-react'
import type React from 'react'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import RichTextEditor from '@/components/RichTextEditor'
import { useAdminPost } from '@/data/hooks/useAdminPosts'
import { useAutoSave } from '@/hooks/useAutoSave'
import { usePreferences } from '@/data/hooks/useUserPreferences'
import { adminApiService } from '@/data/services/adminApi' // TODO: this probably shouldn't be accessed directly
import { adminToast, showToast } from '@/utils/toast'

const AdminEditPost: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { preferences } = usePreferences()

  // Calculate effective theme (if needed, currently unused)
  const _effectiveTheme =
    preferences.appearance.theme === 'system'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
      : preferences.appearance.theme

  const postId = id ? Number.parseInt(id, 10) : 0

  // Fetch the post data
  const { post, isLoading, error } = useAdminPost('tech.blog', postId)

  // Form state
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [category, setCategory] = useState('')
  const [status, setStatus] = useState<'published' | 'draft' | 'archived'>(
    'draft',
  )
  const [isUpdating, setIsUpdating] = useState(false)

  // Create form data object for auto-save
  const formData = { title, content, category, status }

  // Auto-save functionality
  const { saveStatus, lastSaved, hasUnsavedChanges, clearAutoSave } =
    useAutoSave(formData, {
      key: `edit-post-${postId}`,
      debounceMs: 2000,
      enabled: !!post, // Only enable after post is loaded
    })

  // Helper function to get auto-save status text and icon
  const getAutoSaveStatus = () => {
    if (saveStatus === 'saving') {
      return {
        text: 'Saving...',
        icon: <Loader2 className="w-4 h-4 animate-spin" />,
        className: 'text-blue-600',
      }
    }

    if (saveStatus === 'saved' && lastSaved) {
      const timeDiff = Math.floor((Date.now() - lastSaved.getTime()) / 1000)
      let timeText = ''

      if (timeDiff < 60) {
        timeText = 'just now'
      } else if (timeDiff < 3600) {
        const minutes = Math.floor(timeDiff / 60)
        timeText = `${minutes} minute${minutes !== 1 ? 's' : ''} ago`
      } else {
        const hours = Math.floor(timeDiff / 3600)
        timeText = `${hours} hour${hours !== 1 ? 's' : ''} ago`
      }

      return {
        text: `Auto-saved ${timeText}`,
        icon: <CheckCircle2 className="w-4 h-4" />,
        className: 'text-green-600',
      }
    }

    if (saveStatus === 'error') {
      return {
        text: 'Auto-save failed',
        icon: <AlertCircle className="w-4 h-4" />,
        className: 'text-red-600',
      }
    }

    if (hasUnsavedChanges) {
      return {
        text: 'Unsaved changes',
        icon: <Clock className="w-4 h-4" />,
        className: 'text-orange-600',
      }
    }

    return {
      text: 'All changes saved',
      icon: <CheckCircle2 className="w-4 h-4" />,
      className: 'text-slate-500',
    }
  }

  const autoSaveStatus = getAutoSaveStatus()

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
      showToast.warning('Title and content are required! 📝')
      return
    }

    setIsUpdating(true)
    const toastId = adminToast.saving()

    try {
      await adminApiService.updatePost(postId, {
        title: title.trim(),
        content: content.trim(),
        category: category.trim(),
        status,
      })

      showToast.dismiss(toastId)

      // Clear auto-save data on successful update
      clearAutoSave()

      adminToast.postUpdated(title.trim())

      // Navigate back to posts list after a brief delay
      setTimeout(() => {
        navigate('/admin/posts')
      }, 1000)
    } catch (error) {
      console.error('Failed to update post:', error)
      showToast.dismiss(toastId)
      showToast.error('Failed to update post. Please try again.')
    } finally {
      setIsUpdating(false)
    }
  }

  if (isLoading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="flex justify-center items-center py-12 text-slate-600 dark:text-slate-400">
          <Loader2 className="animate-spin mr-2" size={20} />
          <span>Loading post...</span>
        </div>
      </div>
    )
  }

  if (error || !post) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="text-center py-12">
          <div className="text-red-500 dark:text-red-400 mb-4">
            <span className="text-lg">⚠️ Error loading post</span>
          </div>
          <p className="text-red-600 dark:text-red-400 mb-4">
            {error || 'Post not found'}
          </p>
          <button
            onClick={() => navigate('/admin/posts')}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            Back to Posts
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/admin/posts')}
            className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
              Edit Post
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Update your blog post
            </p>
          </div>
        </div>
      </div>

      {/* Edit Form */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-slate-200 dark:border-gray-700">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Title */}
          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
            >
              Title *
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border border-slate-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 bg-white dark:bg-gray-700"
              placeholder="Enter post title..."
              required
            />
          </div>

          {/* Category */}
          <div>
            <label
              htmlFor="category"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
            >
              Category
            </label>
            <input
              type="text"
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full border border-slate-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 bg-white dark:bg-gray-700"
              placeholder="Enter category..."
            />
          </div>

          {/* Status */}
          <div>
            <label
              htmlFor="status"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
            >
              Status
            </label>
            <select
              id="status"
              value={status}
              onChange={(e) =>
                setStatus(e.target.value as 'published' | 'draft' | 'archived')
              }
              className="w-full border border-slate-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent text-slate-900 dark:text-slate-100 bg-white dark:bg-gray-700"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Content *
            </label>
            <RichTextEditor
              content={content}
              onChange={setContent}
              placeholder="Write your post content..."
              minHeight="400px"
              className="w-full"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-6 border-t border-slate-200 dark:border-gray-700">
            <div className="flex items-center space-x-4">
              <button
                type="button"
                onClick={() => navigate('/admin/posts')}
                className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
              >
                Cancel
              </button>
              <div
                className={`flex items-center space-x-2 text-sm ${autoSaveStatus.className}`}
              >
                {autoSaveStatus.icon}
                <span>{autoSaveStatus.text}</span>
              </div>
            </div>
            <button
              type="submit"
              disabled={isUpdating || !title.trim() || !content.trim()}
              className="flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-2 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUpdating ? (
                <Loader2 size={16} className="animate-spin" />
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
