import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  Eye,
  Calendar,
  MoreHorizontal,
  ChevronDown,
  Loader2,
  ExternalLink,
  Archive,
  FileText,
  Globe,
} from 'lucide-react'
import { useAdminPosts } from '../../hooks/useAdminPosts'
import { adminApiService } from '../../services/adminApi'

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
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDomain, setSelectedDomain] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [showFilters, setShowFilters] = useState(false)
  const [deletingPost, setDeletingPost] = useState<number | null>(null)
  const [showMoreActions, setShowMoreActions] = useState<number | null>(null)

  // Use the admin posts hook
  const {
    posts: adminPosts,
    isLoading,
    error,
    deletePost,
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
  })

  // Action handlers
  const handleViewPost = (post: Post) => {
    // Navigate to the public blog post page
    const domainMap: Record<string, string> = {
      'tech.blog': 'tech.localhost',
      'lifestyle.blog': 'lifestyle.localhost',
      'business.blog': 'business.localhost',
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
    if (
      !confirm(
        `Are you sure you want to delete "${post.title}"? This action cannot be undone.`
      )
    ) {
      return
    }

    setDeletingPost(post.id)
    try {
      await deletePost(post.id)
      // Show success message (you could add a toast here)
      console.log('Post deleted successfully')
    } catch (error) {
      console.error('Failed to delete post:', error)
      alert('Failed to delete post. Please try again.')
    } finally {
      setDeletingPost(null)
    }
  }

  const handleStatusChange = async (
    post: Post,
    newStatus: 'published' | 'draft' | 'archived'
  ) => {
    try {
      // We'll need to implement updatePost in the hook or use the API directly
      await adminApiService.updatePost(
        post.id,
        { status: newStatus },
        post.domain
      )
      refresh() // Refresh the posts list
      console.log(`Post status changed to ${newStatus}`)
    } catch (error) {
      console.error('Failed to update post status:', error)
      alert('Failed to update post status. Please try again.')
    }
  }

  // Convert AdminPost to our local Post interface for display
  const posts: Post[] = adminPosts.map((post) => ({
    id: post.id,
    title: post.title,
    author: post.author || 'Unknown Author',
    domain: post.domain_name || selectedDomain, // Use domain_name when available (for "all" view)
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

  const domains = ['tech.blog', 'lifestyle.blog', 'business.blog']
  const statuses = ['published', 'draft', 'archived']

  const filteredPosts = posts.filter((post) => {
    const matchesSearch =
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (post.author &&
        post.author.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (post.category &&
        post.category.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesStatus =
      selectedStatus === 'all' || post.status === selectedStatus

    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800'
      case 'draft':
        return 'bg-yellow-100 text-yellow-800'
      case 'archived':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getDomainColor = (domain: string) => {
    switch (domain) {
      case 'tech.blog':
        return 'bg-blue-100 text-blue-800'
      case 'lifestyle.blog':
        return 'bg-green-100 text-green-800'
      case 'business.blog':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className='p-6 max-w-7xl mx-auto'>
      {/* Header */}
      <div className='flex items-center justify-between mb-8'>
        <div>
          <h1 className='text-3xl font-bold text-slate-900 mb-2'>Posts</h1>
          <p className='text-slate-600'>
            Manage your blog posts across all domains
          </p>
        </div>
        <button
          onClick={() => navigate('/admin/posts/new')}
          className='flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-colors'>
          <Plus size={16} />
          <span>New Post</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className='bg-white rounded-xl shadow-sm border border-slate-200 mb-6'>
        {/* Loading State */}
        {isLoading && (
          <div className='flex justify-center items-center py-12'>
            <Loader2 className='animate-spin mr-2' size={20} />
            <span>Loading posts...</span>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className='text-center py-12'>
            <div className='text-red-500 mb-4'>
              <span className='text-lg'>⚠️ Error loading posts</span>
            </div>
            <p className='text-red-600 mb-4'>{error}</p>
            <button
              onClick={() => window.location.reload()}
              className='px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors'>
              Retry
            </button>
          </div>
        )}

        {/* Content when not loading and no error */}
        {!isLoading && !error && (
          <>
            <div className='p-6 border-b border-slate-200'>
              <div className='flex flex-col sm:flex-row gap-4'>
                <div className='flex-1'>
                  <div className='relative'>
                    <Search
                      className='absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400'
                      size={16}
                    />
                    <input
                      type='text'
                      placeholder='Search posts by title, author, or category...'
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className='w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-slate-900 placeholder-slate-500 bg-white'
                    />
                  </div>
                </div>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className='flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-slate-600 to-slate-700 text-white rounded-lg hover:from-slate-700 hover:to-slate-800 transition-all duration-200 shadow-sm'>
                  <Filter size={16} />
                  <span>Filters</span>
                  <ChevronDown
                    className={`transform transition-transform ${
                      showFilters ? 'rotate-180' : ''
                    }`}
                    size={16}
                  />
                </button>
              </div>

              {showFilters && (
                <div className='mt-4 pt-4 border-t border-slate-200'>
                  <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                    <div>
                      <label className='block text-sm font-medium text-slate-700 mb-2'>
                        Domain
                      </label>
                      <select
                        value={selectedDomain}
                        onChange={(e) => setSelectedDomain(e.target.value)}
                        className='w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent text-slate-900 bg-white'>
                        <option value='all'>All Domains</option>
                        {domains.map((domain) => (
                          <option key={domain} value={domain}>
                            {domain}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className='block text-sm font-medium text-slate-700 mb-2'>
                        Status
                      </label>
                      <select
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                        className='w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent text-slate-900 bg-white'>
                        <option value='all'>All Statuses</option>
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

            {/* Results count */}
            <div className='px-6 py-3 bg-slate-50 border-b border-slate-200'>
              <p className='text-sm text-slate-600'>
                {filteredPosts.length} post
                {filteredPosts.length !== 1 ? 's' : ''} found
              </p>
            </div>

            {/* Posts Table */}
            <div className='overflow-x-auto'>
              <table className='w-full'>
                <thead className='bg-slate-50'>
                  <tr>
                    <th className='text-left py-3 px-6 text-sm font-medium text-slate-700'>
                      Title
                    </th>
                    <th className='text-left py-3 px-6 text-sm font-medium text-slate-700'>
                      Author
                    </th>
                    <th className='text-left py-3 px-6 text-sm font-medium text-slate-700'>
                      Domain
                    </th>
                    <th className='text-left py-3 px-6 text-sm font-medium text-slate-700'>
                      Status
                    </th>
                    <th className='text-left py-3 px-6 text-sm font-medium text-slate-700'>
                      Views
                    </th>
                    <th className='text-left py-3 px-6 text-sm font-medium text-slate-700'>
                      Updated
                    </th>
                    <th className='text-right py-3 px-6 text-sm font-medium text-slate-700'>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-slate-200'>
                  {filteredPosts.map((post) => (
                    <tr
                      key={post.id}
                      className='hover:bg-slate-50 transition-colors'>
                      <td className='py-4 px-6'>
                        <div>
                          <p className='font-medium text-slate-900'>
                            {post.title}
                          </p>
                          <p className='text-sm text-slate-500'>
                            {post.category}
                          </p>
                        </div>
                      </td>
                      <td className='py-4 px-6 text-slate-700'>
                        {post.author}
                      </td>
                      <td className='py-4 px-6'>
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getDomainColor(
                            post.domain
                          )}`}>
                          {post.domain}
                        </span>
                      </td>
                      <td className='py-4 px-6'>
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                            post.status
                          )}`}>
                          {post.status}
                        </span>
                      </td>
                      <td className='py-4 px-6 text-slate-700'>
                        {post.views.toLocaleString()}
                      </td>
                      <td className='py-4 px-6 text-slate-700'>
                        <div className='flex items-center text-sm text-slate-500'>
                          <Calendar size={14} className='mr-1' />
                          {new Date(post.updatedAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className='py-4 px-6'>
                        <div className='flex items-center justify-end space-x-2'>
                          <button
                            onClick={() => handleViewPost(post)}
                            className='p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors'
                            title='View post'>
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => handleEditPost(post)}
                            className='p-2 text-slate-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors'
                            title='Edit post'>
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDeletePost(post)}
                            disabled={deletingPost === post.id}
                            className='p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50'
                            title='Delete post'>
                            {deletingPost === post.id ? (
                              <Loader2 size={16} className='animate-spin' />
                            ) : (
                              <Trash2 size={16} />
                            )}
                          </button>
                          <div className='relative'>
                            <button
                              onClick={() =>
                                setShowMoreActions(
                                  showMoreActions === post.id ? null : post.id
                                )
                              }
                              className='p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors'
                              title='More actions'>
                              <MoreHorizontal size={16} />
                            </button>
                            {showMoreActions === post.id && (
                              <div className='absolute right-0 top-10 w-48 bg-white border border-slate-200 rounded-lg shadow-lg z-10'>
                                <div className='py-1'>
                                  <button
                                    onClick={() => {
                                      handleStatusChange(post, 'published')
                                      setShowMoreActions(null)
                                    }}
                                    className='flex items-center w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-50'>
                                    <Globe size={14} className='mr-2' />
                                    Mark as Published
                                  </button>
                                  <button
                                    onClick={() => {
                                      handleStatusChange(post, 'draft')
                                      setShowMoreActions(null)
                                    }}
                                    className='flex items-center w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-50'>
                                    <FileText size={14} className='mr-2' />
                                    Mark as Draft
                                  </button>
                                  <button
                                    onClick={() => {
                                      handleStatusChange(post, 'archived')
                                      setShowMoreActions(null)
                                    }}
                                    className='flex items-center w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-50'>
                                    <Archive size={14} className='mr-2' />
                                    Archive Post
                                  </button>
                                  <hr className='my-1' />
                                  <button
                                    onClick={() => {
                                      navigator.clipboard.writeText(
                                        `${window.location.origin}/blog/${post.domain}/post/${post.id}`
                                      )
                                      setShowMoreActions(null)
                                    }}
                                    className='flex items-center w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-50'>
                                    <ExternalLink size={14} className='mr-2' />
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

            {filteredPosts.length === 0 && !isLoading && (
              <div className='text-center py-12'>
                <div className='text-slate-400 mb-4'>
                  <Search size={48} className='mx-auto' />
                </div>
                <h3 className='text-lg font-medium text-slate-900 mb-2'>
                  No posts found
                </h3>
                <p className='text-slate-500'>
                  Try adjusting your search or filter criteria
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default AdminPosts
