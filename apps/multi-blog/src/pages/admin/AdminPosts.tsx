import {
  Activity,
  Archive,
  Calendar,
  ChevronDown,
  Edit,
  ExternalLink,
  Eye,
  FileText,
  Filter,
  Globe,
  Grid3X3,
  List,
  Loader2,
  MoreHorizontal,
  Plus,
  Search,
  Trash2,

} from 'lucide-react'
import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAdminPosts } from '@/data/hooks/useAdminPosts'
import { usePreferencesClasses } from '@/hooks/usePreferencesClasses'
import { usePreferences } from '@/data/hooks/useUserPreferences'
import { adminToast, showToast } from '@/utils/toast'

interface Post {
  id: number
  title: string
  author: string | null
  domain: string
  category: string | null
  status: 'published' | 'draft' | 'archived'
  views: number
  publishedAt: string
  updatedAt: string
}

const AdminPosts: React.FC = () => {
  const navigate = useNavigate()
  const { preferences } = usePreferences()
  const { fontSizeClasses, spacingClasses } = usePreferencesClasses()

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDomain, setSelectedDomain] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [showFilters, setShowFilters] = useState(false)
  const [deletingPost, setDeletingPost] = useState<number | null>(null)
  const [showMoreActions, setShowMoreActions] = useState<number | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table')
  const [deleteConfirmModal, setDeleteConfirmModal] = useState<{
    isOpen: boolean
    post: Post | null
  }>({ isOpen: false, post: null })

  // Use the admin posts hook
  const {
    posts: adminPosts,
    isLoading,
    error,
    deletePost,
    updatePost,
    refresh,
  } = useAdminPosts(selectedDomain)

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = () => {
      if (showMoreActions !== null) {
        setShowMoreActions(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showMoreActions])

  // Debug logging
  console.log('AdminPosts debug:', {
    adminPosts,
    isLoading,
    error,
    selectedDomain,
    samplePost: adminPosts[0], // Log first post to see structure
    rawPostData: adminPosts.slice(0, 3), // Log first 3 posts
  })

  // Action handlers
  const handleViewPost = (post: Post) => {
    // Navigate to the public blog post page
    const domainMap: Record<string, string> = {
      'TechInsights': 'tech.localhost',
      'LifeStyle Hub': 'lifestyle.localhost',
      'BizWorks': 'business.localhost',
      'Tech Blog': 'tech.localhost',
      'Food Adventures': 'lifestyle.localhost',
      'Wanderlust Chronicles': 'business.localhost',
      'tech.localhost': 'tech.localhost',
      'lifestyle.localhost': 'lifestyle.localhost',
      'business.localhost': 'business.localhost',
    }
    const publicDomain = domainMap[post.domain] || 'tech.localhost'
    // Find the original admin post to get the slug
    const adminPost = adminPosts.find((p) => p.id === post.id)
    const slug = adminPost?.slug || post.id.toString()
    window.open(`/blog/${publicDomain}/post/${slug}`, '_blank')
  }

  const handleEditPost = (post: Post) => {
    // Navigate to edit form (we'll create this route)
    navigate(`/admin/posts/${post.id}/edit`)
  }

  const handleDeletePost = async (post: Post) => {
    // Show confirmation modal instead of browser alert
    setDeleteConfirmModal({ isOpen: true, post })
  }

  const confirmDeletePost = async () => {
    const post = deleteConfirmModal.post
    if (!post) return

    setDeletingPost(post.id)
    setDeleteConfirmModal({ isOpen: false, post: null })

    // Show loading toast
    const toastId = adminToast.deleting()

    try {
      await deletePost(post.id)
      showToast.dismiss(toastId)
      adminToast.postDeleted(post.title)
    } catch (error) {
      console.error('Failed to delete post:', error)
      showToast.dismiss(toastId)
      showToast.error('Failed to delete post. Please try again.')
    } finally {
      setDeletingPost(null)
    }
  }

  const handleStatusChange = async (
    post: Post,
    newStatus: 'published' | 'draft' | 'archived',
  ) => {
    const toastId = showToast.loading(`Changing status to ${newStatus}...`)

    try {
      // Use the hook's updatePost method
      await updatePost(post.id, { status: newStatus })
      showToast.dismiss(toastId)

      if (newStatus === 'published') {
        adminToast.postPublished(post.title)
      } else if (newStatus === 'draft') {
        adminToast.postUnpublished(post.title)
      } else {
        showToast.success(`Post "${post.title}" archived successfully! 📦`)
      }
    } catch (error) {
      console.error('Failed to update post status:', error)
      showToast.dismiss(toastId)
      showToast.error('Failed to update post status. Please try again.')
    }
  }

  // Convert AdminPost to our local Post interface for display
  const posts: Post[] = adminPosts.map((post) => ({
    id: post.id,
    title: post.title,
    author: post.author || 'Unknown Author',
    domain: post.domain_name || `Missing domain_name (id: ${post.domain_id})`, // More descriptive fallback
    category: post.category || 'Uncategorized',
    status: (post.status as 'published' | 'draft' | 'archived') || 'draft',
    views: 0, // Not available from API yet, using 0
    publishedAt: post.created_at
      ? new Date(post.created_at).toISOString().split('T')[0]
      : '',
    updatedAt: post.updated_at
      ? new Date(post.updated_at).toISOString().split('T')[0]
      : '',
  }))

  const domains = ['tech.localhost', 'lifestyle.localhost', 'business.localhost']
  const statuses = ['published', 'draft', 'archived']

  // Apply preferences-based filtering and pagination
  const { paginatedPosts, totalPages, totalPosts } = useMemo(() => {
    // First filter posts
    const filtered = posts.filter((post) => {
      const matchesSearch =
        post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.author?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.category?.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus =
        selectedStatus === 'all' || post.status === selectedStatus

      return matchesSearch && matchesStatus
    })

    // Apply pagination based on user preferences
    const postsPerPage = preferences.content.postsPerPage
    const startIndex = (currentPage - 1) * postsPerPage
    const endIndex = startIndex + postsPerPage
    const paginatedResults = filtered.slice(startIndex, endIndex)

    return {
      paginatedPosts: paginatedResults,
      totalPages: Math.ceil(filtered.length / postsPerPage),
      totalPosts: filtered.length,
    }
  }, [
    posts,
    searchTerm,
    selectedStatus,
    currentPage,
    preferences.content.postsPerPage,
  ])

  // Reset to first page when filters change
  React.useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, selectedStatus])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
      case 'draft':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
      case 'archived':
        return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300'
      default:
        return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300'
    }
  }

  const getDomainColor = (domain: string) => {
    switch (domain) {
      case 'TechInsights':
      case 'tech.localhost':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
      case 'LifeStyle Hub':
      case 'lifestyle.localhost':
        return 'bg-pink-100 dark:bg-pink-900/30 text-pink-800 dark:text-pink-300'
      case 'BizWorks':
      case 'business.localhost':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
      case 'Tech Blog':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
      case 'Food Adventures':
        return 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300'
      case 'Wanderlust Chronicles':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
      default:
        return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300'
    }
  }

  return (
    <div
      className={`p-6 max-w-7xl mx-auto bg-white dark:bg-gray-900 min-h-screen ${fontSizeClasses}`}
    >
      {/* Header */}
      <div
        className={`flex items-center justify-between mb-8 ${spacingClasses}`}
      >
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            Posts
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Manage your blog posts across all domains
          </p>
        </div>
        <button
          onClick={() => navigate('/admin/posts/new')}
          className="flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-colors"
        >
          <Plus size={16} />
          <span>New Post</span>
        </button>
      </div>

      {/* View Controls */}
      <div
        className={`flex items-center justify-between mb-6 ${spacingClasses}`}
      >
        <div className="flex items-center space-x-4">
          <span className="text-sm text-slate-600 dark:text-slate-400 font-medium">
            View:
          </span>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('cards')}
              className={`p-2 rounded-lg transition-colors ${viewMode === 'cards'
                ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-gray-700'
                }`}
              title="Card View"
            >
              <Grid3X3 size={16} />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-lg transition-colors ${viewMode === 'table'
                ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-gray-700'
                }`}
              title="Table View"
            >
              <List size={16} />
            </button>
          </div>
          {!isLoading && !error && (
            <span className="text-sm text-slate-600 dark:text-slate-400">
              • {totalPosts} post{totalPosts !== 1 ? 's' : ''} found
            </span>
          )}
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-slate-600 dark:text-slate-400">
            {preferences.content.postsPerPage} posts per page
          </span>
          <span className="text-sm text-slate-600 dark:text-slate-400">
            Page {currentPage} of {totalPages}
          </span>
        </div>
      </div>

      {/* Search and Filters */}
      <div className='bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-slate-200 dark:border-gray-700 p-4 mb-6'>
        <div className='flex items-center space-x-4'>
          <div className='flex-1 relative'>
            <Search
              className='absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-gray-500'
              size={16}
            />
            <input
              type="text"
              placeholder="Search posts by title, author, or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className='w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-slate-900 dark:text-gray-100 placeholder-slate-500 dark:placeholder-gray-400'
            />
          </div>
          <button
            onClick={() => refresh()}
            className='flex items-center space-x-2 px-4 py-2 bg-slate-100 dark:bg-gray-700 text-slate-700 dark:text-gray-300 rounded-lg hover:bg-slate-200 dark:hover:bg-gray-600 transition-colors'>
            <Activity size={16} />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2 px-4 py-2 bg-slate-100 dark:bg-gray-700 text-slate-700 dark:text-gray-300 rounded-lg hover:bg-slate-200 dark:hover:bg-gray-600 transition-colors"
          >
            <Filter size={16} />
            <span>Filters</span>
            <ChevronDown
              className={`transform transition-transform ${showFilters ? 'rotate-180' : ''
                }`}
              size={16}
            />
          </button>
        </div>

        {showFilters && (
          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-gray-700">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Domain
                </label>
                <select
                  value={selectedDomain}
                  onChange={(e) => setSelectedDomain(e.target.value)}
                  className="w-full border border-slate-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent text-slate-900 dark:text-slate-100 bg-white dark:bg-gray-800"
                >
                  <option value="all">All Domains</option>
                  {/* Dynamic options based on actual data */}
                  {Array.from(new Set(adminPosts.map(post => post.domain_name).filter(Boolean))).map((domainName) => (
                    <option key={domainName} value={domainName}>
                      {domainName}
                    </option>
                  ))}
                  {/* Fallback static options */}
                  {domains.map((domain) => (
                    <option key={domain} value={domain}>
                      {domain}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Status
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full border border-slate-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent text-slate-900 dark:text-slate-100 bg-white dark:bg-gray-800"
                >
                  <option value="all">All Statuses</option>
                  {statuses.map((status) => (
                    <option key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center items-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-slate-200 dark:border-gray-700 mb-6">
          <Loader2 className="animate-spin mr-2 text-purple-600" size={20} />
          <span className="text-slate-700 dark:text-slate-300">
            Loading posts...
          </span>
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-slate-200 dark:border-gray-700 mb-6">
          <div className="text-red-500 dark:text-red-400 mb-4">
            <span className="text-lg">⚠️ Error loading posts</span>
          </div>
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Content when not loading and no error */}
      {!isLoading && !error && (
        <>
          {/* Posts Table/Cards View */}
          {viewMode === 'table' ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-slate-200 dark:border-gray-700 mb-6 overflow-hidden">
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium text-slate-900 dark:text-slate-100">
                      Title
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-slate-900 dark:text-slate-100">
                      Author
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-slate-900 dark:text-slate-100">
                      Domain
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-slate-900 dark:text-slate-100">
                      Status
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-slate-900 dark:text-slate-100">
                      Views
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-slate-900 dark:text-slate-100">
                      Updated
                    </th>
                    <th className="text-right py-3 px-4 font-medium text-slate-900 dark:text-slate-100">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedPosts.map((post, index) => (
                    <tr
                      key={post.id}
                      className={`hover:bg-slate-50 dark:hover:bg-gray-800/30 transition-colors ${index !== paginatedPosts.length - 1 ? 'border-b border-slate-100 dark:border-gray-700/50' : ''
                        }`}
                    >
                      <td className="py-4 px-6">
                        <div>
                          <p className="font-medium text-slate-900 dark:text-slate-100 leading-tight">
                            {post.title}
                          </p>
                          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                            {post.category}
                          </p>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-slate-700 dark:text-slate-300">
                        {post.author}
                      </td>
                      <td className="py-4 px-6">
                        <span
                          className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full ${getDomainColor(
                            post.domain,
                          )}`}
                        >
                          {post.domain}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span
                          className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full ${getStatusColor(
                            post.status,
                          )}`}
                        >
                          {post.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-slate-700 dark:text-slate-300 font-medium">
                        {post.views.toLocaleString()}
                      </td>
                      <td className="py-4 px-6 text-slate-700 dark:text-slate-300">
                        <div className="flex items-center text-sm text-slate-500 dark:text-slate-400">
                          <Calendar size={14} className="mr-1.5" />
                          {new Date(post.updatedAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center justify-end space-x-1">
                          <button
                            onClick={() => handleViewPost(post)}
                            className="p-2 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all duration-200"
                            title="View post"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => handleEditPost(post)}
                            className="p-2 text-slate-500 dark:text-slate-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-all duration-200"
                            title="Edit post"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDeletePost(post)}
                            disabled={deletingPost === post.id}
                            className="p-2 text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200 disabled:opacity-50"
                            title="Delete post"
                          >
                            {deletingPost === post.id ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : (
                              <Trash2 size={16} />
                            )}
                          </button>
                          <div className="relative">
                            <button
                              onClick={() =>
                                setShowMoreActions(
                                  showMoreActions === post.id ? null : post.id,
                                )
                              }
                              className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-200"
                              title="More actions"
                            >
                              <MoreHorizontal size={16} />
                            </button>
                            {showMoreActions === post.id && (
                              <div className="absolute right-0 top-10 w-48 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-600 rounded-lg shadow-lg z-10">
                                <div className="py-1">
                                  <button
                                    onClick={() => {
                                      handleStatusChange(post, 'published')
                                      setShowMoreActions(null)
                                    }}
                                    className="flex items-center w-full px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-gray-700"
                                  >
                                    <Globe size={14} className="mr-2" />
                                    Mark as Published
                                  </button>
                                  <button
                                    onClick={() => {
                                      handleStatusChange(post, 'draft')
                                      setShowMoreActions(null)
                                    }}
                                    className="flex items-center w-full px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-gray-700"
                                  >
                                    <FileText size={14} className="mr-2" />
                                    Mark as Draft
                                  </button>
                                  <button
                                    onClick={() => {
                                      handleStatusChange(post, 'archived')
                                      setShowMoreActions(null)
                                    }}
                                    className="flex items-center w-full px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-gray-700"
                                  >
                                    <Archive size={14} className="mr-2" />
                                    Archive Post
                                  </button>
                                  <hr className="my-1 border-slate-200 dark:border-gray-600" />
                                  <button
                                    onClick={() => {
                                      navigator.clipboard.writeText(
                                        `${window.location.origin}/blog/${post.domain}/post/${post.id}`,
                                      )
                                      setShowMoreActions(null)
                                    }}
                                    className="flex items-center w-full px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-gray-700"
                                  >
                                    <ExternalLink size={14} className="mr-2" />
                                    Copy Link
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            /* Cards View - displayed against background */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
              {paginatedPosts.map((post) => (
                <div
                  key={post.id}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-slate-200 dark:border-gray-700 hover:shadow-md hover:border-purple-300 dark:hover:border-purple-600 transition-all duration-200 transform hover:-translate-y-1"
                >
                  {/* Card Header */}
                  <div className="p-6 pb-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-lg leading-tight line-clamp-2 mb-2">
                          {post.title}
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
                          {post.category}
                        </p>
                      </div>
                    </div>

                    {/* Status and Domain Badges */}
                    <div className="flex items-center space-x-2 mb-4">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                          post.status,
                        )}`}
                      >
                        {post.status}
                      </span>
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getDomainColor(
                          post.domain,
                        )}`}
                      >
                        {post.domain}
                      </span>
                    </div>

                    {/* Metadata */}
                    <div className="space-y-2 text-sm text-slate-500 dark:text-slate-400">
                      <div className="flex items-center justify-between">
                        <span>Author:</span>
                        <span className="font-medium">{post.author}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Views:</span>
                        <span className="font-medium">{post.views.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Updated:</span>
                        <span className="font-medium">
                          {new Date(post.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div className="px-6 pb-6">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleViewPost(post)}
                        className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 text-sm text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                        title="View post"
                      >
                        <Eye size={14} />
                        <span>View</span>
                      </button>
                      <button
                        onClick={() => handleEditPost(post)}
                        className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg transition-colors"
                        title="Edit post"
                      >
                        <Edit size={14} />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => handleDeletePost(post)}
                        disabled={deletingPost === post.id}
                        className="px-3 py-2 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors disabled:opacity-50"
                        title="Delete post"
                      >
                        {deletingPost === post.id ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Trash2 size={14} />
                        )}
                      </button>
                      <div className="relative">
                        <button
                          onClick={() =>
                            setShowMoreActions(
                              showMoreActions === post.id ? null : post.id,
                            )
                          }
                          className="px-3 py-2 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                          title="More actions"
                        >
                          <MoreHorizontal size={14} />
                        </button>
                        {showMoreActions === post.id && (
                          <div className="absolute right-0 bottom-full mb-2 w-48 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-600 rounded-lg shadow-lg z-10">
                            <div className="py-1">
                              <button
                                onClick={() => {
                                  handleStatusChange(post, 'published')
                                  setShowMoreActions(null)
                                }}
                                className="flex items-center w-full px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-gray-700"
                              >
                                <Globe size={14} className="mr-2" />
                                Mark as Published
                              </button>
                              <button
                                onClick={() => {
                                  handleStatusChange(post, 'draft')
                                  setShowMoreActions(null)
                                }}
                                className="flex items-center w-full px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-gray-700"
                              >
                                <FileText size={14} className="mr-2" />
                                Mark as Draft
                              </button>
                              <button
                                onClick={() => {
                                  handleStatusChange(post, 'archived')
                                  setShowMoreActions(null)
                                }}
                                className="flex items-center w-full px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-gray-700"
                              >
                                <Archive size={14} className="mr-2" />
                                Archive Post
                              </button>
                              <hr className="my-1 border-slate-200 dark:border-gray-600" />
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(
                                    `${window.location.origin}/blog/${post.domain}/post/${post.id}`,
                                  )
                                  setShowMoreActions(null)
                                }}
                                className="flex items-center w-full px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-gray-700"
                              >
                                <ExternalLink size={14} className="mr-2" />
                                Copy Link
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {totalPosts === 0 && !isLoading && (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-slate-200 dark:border-gray-700 mb-6">
              <div className="text-slate-400 dark:text-slate-500 mb-4">
                <Search size={48} className="mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
                No posts found
              </h3>
              <p className="text-slate-500 dark:text-slate-400">
                Try adjusting your search or filter criteria
              </p>
            </div>
          )}
        </>
      )}      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <div className="text-sm text-slate-600 dark:text-slate-400">
            Showing {(currentPage - 1) * preferences.content.postsPerPage + 1}{' '}
            to{' '}
            {Math.min(
              currentPage * preferences.content.postsPerPage,
              totalPosts,
            )}{' '}
            of {totalPosts} posts
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-3 py-2 text-sm rounded-lg transition-colors ${page === currentPage
                  ? 'bg-purple-600 text-white'
                  : 'bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 hover:bg-slate-50 dark:hover:bg-gray-700'
                  }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() =>
                setCurrentPage(Math.min(totalPages, currentPage + 1))
              }
              disabled={currentPage === totalPages}
              className="px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmModal.isOpen && deleteConfirmModal.post && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-slate-200 dark:border-gray-700 max-w-md w-full transform transition-all duration-300 scale-100">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="flex-shrink-0 w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                  <Trash2 size={20} className="text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                    Delete Post
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    This action cannot be undone
                  </p>
                </div>
              </div>

              <div className="mb-6">
                <p className="text-slate-700 dark:text-slate-300 mb-2">
                  Are you sure you want to delete this post?
                </p>
                <div className="bg-slate-50 dark:bg-gray-700/50 rounded-lg p-3 border border-slate-200 dark:border-gray-600">
                  <p className="font-medium text-slate-900 dark:text-slate-100 line-clamp-2">
                    "{deleteConfirmModal.post.title}"
                  </p>
                  <div className="flex items-center space-x-2 mt-2">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getDomainColor(deleteConfirmModal.post.domain)}`}>
                      {deleteConfirmModal.post.domain}
                    </span>
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(deleteConfirmModal.post.status)}`}>
                      {deleteConfirmModal.post.status}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setDeleteConfirmModal({ isOpen: false, post: null })}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-gray-700 hover:bg-slate-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeletePost}
                  disabled={deletingPost === deleteConfirmModal.post.id}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {deletingPost === deleteConfirmModal.post.id ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 size={16} />
                      <span>Delete Post</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminPosts
