import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Eye,
  FileText,
  Globe,
  Hash,
  Loader2,
  Save,
  Tag,
  User,
} from 'lucide-react'
import type React from 'react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import RichTextEditor from '../../components/RichTextEditor'
import { useAdminPosts } from '../../hooks/useAdminPosts'
import { useAutoSave } from '../../hooks/useAutoSave'
import { usePreferences } from '../../hooks/useUserPreferences'
import type { NewPostForm } from '../../types'
import { adminToast, showToast } from '../../utils/toast'

const AdminCreatePostPage: React.FC = () => {
  const navigate = useNavigate()
  const { preferences } = usePreferences()

  // Calculate effective theme (if needed, currently unused)
  const _effectiveTheme =
    preferences.appearance.theme === 'system'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
      : preferences.appearance.theme
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

  // Auto-save functionality
  const {
    saveStatus,
    lastSaved,
    hasUnsavedChanges,
    clearAutoSave,
    restoreFromAutoSave,
  } = useAutoSave(formData, {
    key: `new-post-${formData.domain}`,
    debounceMs: 2000,
    enabled: true,
    onRestore: (restoredData) => {
      setFormData(restoredData)
      showToast.success('Draft restored from auto-save! 📝')
    },
  })

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

        // Clear auto-save data on successful creation
        clearAutoSave()

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

  // Helper function to strip HTML tags for word count
  const stripHtml = (html: string) => {
    const tmp = document.createElement('div')
    tmp.innerHTML = html
    return tmp.textContent || tmp.innerText || ''
  }

  const plainTextContent = stripHtml(formData.content)
  const wordCount = plainTextContent
    .split(/\s+/)
    .filter((word) => word.length > 0).length
  const readTime = Math.ceil(wordCount / 200)

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-slate-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/admin/posts')}
                className="flex items-center space-x-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
              >
                <ArrowLeft size={20} />
                <span>Back to Posts</span>
              </button>
              <div className="w-px h-6 bg-slate-300 dark:bg-gray-600" />
              <div className="flex items-center space-x-3">
                <FileText
                  size={24}
                  className="text-purple-600 dark:text-purple-400"
                />
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                    Create New Post
                  </h1>
                  <p className="text-slate-600 dark:text-slate-400">
                    Write and publish your next article
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="flex items-center space-x-2 px-4 py-2 bg-slate-100 dark:bg-gray-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-gray-600 transition-colors"
              >
                <Eye size={16} />
                <span>{showPreview ? 'Edit' : 'Preview'}</span>
              </button>
              <div
                className={`flex items-center space-x-1 text-sm ${
                  isFormValid()
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-orange-600 dark:text-orange-400'
                }`}
              >
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

      <div className="max-w-7xl mx-auto px-6 py-6">
        <form
          onSubmit={handleSubmit}
          className="flex gap-6 h-[calc(100vh-200px)]"
        >
          {/* Form Side */}
          <div
            className={`${
              showPreview ? 'w-1/2' : 'w-full'
            } overflow-y-auto space-y-6 bg-white dark:bg-gray-800 rounded-lg border border-slate-200 dark:border-gray-700 p-6`}
          >
            {/* Meta Information Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-6 border-b border-slate-200 dark:border-gray-700">
              <div>
                <label className="flex items-center space-x-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  <Globe size={16} />
                  <span>Domain</span>
                </label>
                <select
                  value={formData.domain}
                  onChange={(e) =>
                    setFormData({ ...formData, domain: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-slate-900 dark:text-slate-100 bg-white dark:bg-gray-700"
                >
                  {domains.map((domain) => (
                    <option key={domain} value={domain}>
                      {domain}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="flex items-center space-x-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
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
                  className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-slate-900 dark:text-slate-100 bg-white dark:bg-gray-700"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </div>

              <div>
                <label className="flex items-center space-x-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  <Hash size={16} />
                  <span>Category</span>
                </label>
                <select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-slate-900 dark:text-slate-100 bg-white dark:bg-gray-700"
                  required
                >
                  <option value="">Select Category</option>
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
              <label className="flex items-center space-x-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                <FileText size={16} />
                <span>Title</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                className="w-full px-4 py-3 border border-slate-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-lg text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 bg-white dark:bg-gray-700"
                placeholder="Enter a compelling title..."
                required
              />
            </div>

            {/* Author */}
            <div>
              <label className="flex items-center space-x-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                <User size={16} />
                <span>Author</span>
              </label>
              <input
                type="text"
                value={formData.author}
                onChange={(e) =>
                  setFormData({ ...formData, author: e.target.value })
                }
                className="w-full px-4 py-3 border border-slate-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 bg-white dark:bg-gray-700"
                placeholder="Author name..."
                required
              />
            </div>

            {/* Excerpt */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Excerpt
              </label>
              <textarea
                rows={2}
                value={formData.excerpt}
                onChange={(e) =>
                  setFormData({ ...formData, excerpt: e.target.value })
                }
                className="w-full px-4 py-3 border border-slate-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 bg-white dark:bg-gray-700"
                placeholder="A brief summary that will appear on the blog grid..."
                required
              />
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                {formData.excerpt.length}/200 characters
              </p>
            </div>

            {/* Content */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Content
              </label>
              <RichTextEditor
                content={formData.content}
                onChange={(content) => setFormData({ ...formData, content })}
                placeholder="Write your article content here..."
                minHeight={showPreview ? '300px' : '400px'}
                className="w-full"
              />
              <div className="flex justify-between items-center mt-1">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {wordCount} words • {readTime} min read
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Rich text with formatting and images
                </p>
              </div>
            </div>
          </div>

          {/* Preview Side */}
          {showPreview && (
            <div className="w-1/2 bg-white dark:bg-gray-800 rounded-lg border border-slate-200 dark:border-gray-700 overflow-y-auto">
              <div className="p-6 bg-slate-50 dark:bg-gray-700 border-b border-slate-200 dark:border-gray-600">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  Preview
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  How your post will appear
                </p>
              </div>
              <div className="p-6">
                <article className="prose max-w-none">
                  <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                    {formData.title || 'Untitled Post'}
                  </h1>
                  <div className="flex items-center space-x-4 text-sm text-slate-600 dark:text-slate-400 mb-6">
                    <span>By {formData.author || 'Author'}</span>
                    <span>•</span>
                    <span>{formData.category || 'Category'}</span>
                    <span>•</span>
                    <span>{readTime} min read</span>
                  </div>
                  {formData.excerpt && (
                    <p className="text-lg text-slate-700 dark:text-slate-300 font-medium mb-6 border-l-4 border-purple-500 pl-4">
                      {formData.excerpt}
                    </p>
                  )}
                  <div
                    className="prose prose-slate dark:prose-invert max-w-none text-slate-800 dark:text-slate-200 leading-relaxed"
                    dangerouslySetInnerHTML={{
                      __html:
                        formData.content ||
                        '<p class="text-slate-500 dark:text-slate-400 italic">Start writing to see your content here...</p>',
                    }}
                  />
                </article>
              </div>
            </div>
          )}
        </form>
      </div>

      {/* Floating Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-slate-200 dark:border-gray-700 p-4 lg:pl-64">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4 text-sm">
            <div
              className={`flex items-center space-x-2 ${autoSaveStatus.className}`}
            >
              {autoSaveStatus.icon}
              <span>{autoSaveStatus.text}</span>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={() => navigate('/admin/posts')}
              className="px-6 py-2 border border-slate-300 dark:border-gray-600 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={!isFormValid() || isCreating}
              className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
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
