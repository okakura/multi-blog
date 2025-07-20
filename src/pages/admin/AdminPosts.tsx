import React, { useState } from 'react'
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
} from 'lucide-react'

interface Post {
  id: number
  title: string
  author: string
  domain: string
  category: string
  status: 'published' | 'draft' | 'archived'
  views: number
  publishedAt: string
  updatedAt: string
}

const AdminPosts: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDomain, setSelectedDomain] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [showFilters, setShowFilters] = useState(false)

  // Mock data - replace with SWR/API calls
  const posts: Post[] = [
    {
      id: 1,
      title: 'Building Scalable Web Apps',
      author: 'Josh Gautier',
      domain: 'tech.blog',
      category: 'Web Development',
      status: 'published',
      views: 1234,
      publishedAt: '2025-07-20',
      updatedAt: '2025-07-20',
    },
    {
      id: 2,
      title: 'The Future of AI in 2024',
      author: 'Josh Gautier',
      domain: 'tech.blog',
      category: 'AI',
      status: 'published',
      views: 856,
      publishedAt: '2025-07-19',
      updatedAt: '2025-07-19',
    },
    {
      id: 3,
      title: 'Building REST APIs with Axum Framework',
      author: 'Alex Johnson',
      domain: 'tech.blog',
      category: 'Programming',
      status: 'draft',
      views: 0,
      publishedAt: '2025-07-18',
      updatedAt: '2025-07-20',
    },
    {
      id: 4,
      title: 'Mindful Living in a Digital World',
      author: 'Sarah Chen',
      domain: 'lifestyle.blog',
      category: 'Wellness',
      status: 'published',
      views: 432,
      publishedAt: '2025-07-17',
      updatedAt: '2025-07-17',
    },
  ]

  const domains = ['tech.blog', 'lifestyle.blog', 'business.blog']
  const statuses = ['published', 'draft', 'archived']

  const filteredPosts = posts.filter((post) => {
    const matchesSearch =
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.category.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesDomain =
      selectedDomain === 'all' || post.domain === selectedDomain
    const matchesStatus =
      selectedStatus === 'all' || post.status === selectedStatus

    return matchesSearch && matchesDomain && matchesStatus
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
        <button className='flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-colors'>
          <Plus size={16} />
          <span>New Post</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className='bg-white rounded-xl shadow-sm border border-slate-200 mb-6'>
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
                  className='w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent'
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
                    className='w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent'>
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
                    className='w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent'>
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
            {filteredPosts.length} post{filteredPosts.length !== 1 ? 's' : ''}{' '}
            found
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
                      <p className='font-medium text-slate-900'>{post.title}</p>
                      <p className='text-sm text-slate-500'>{post.category}</p>
                    </div>
                  </td>
                  <td className='py-4 px-6 text-slate-700'>{post.author}</td>
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
                      <button className='p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors'>
                        <Eye size={16} />
                      </button>
                      <button className='p-2 text-slate-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors'>
                        <Edit size={16} />
                      </button>
                      <button className='p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors'>
                        <Trash2 size={16} />
                      </button>
                      <button className='p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors'>
                        <MoreHorizontal size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredPosts.length === 0 && (
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
      </div>
    </div>
  )
}

export default AdminPosts
