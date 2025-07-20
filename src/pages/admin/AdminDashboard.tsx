import React from 'react'
import {
  FileText,
  Users,
  Globe,
  BarChart3,
  Clock,
  Eye,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react'
import { useAdminAnalytics, useAdminPosts } from '../../hooks/useAdminApi'

const AdminDashboard: React.FC = () => {
  // Fetch real analytics data
  const {
    analytics,
    loading: analyticsLoading,
    error: analyticsError,
  } = useAdminAnalytics()

  // Fetch recent posts
  const { posts: recentPosts, loading: postsLoading } = useAdminPosts(1, 5)

  // Create stats from real data
  const stats = [
    {
      title: 'Total Posts',
      value: analytics?.total_posts?.toString() || '0',
      change: '+12%', // TODO: Calculate real change from historical data
      changeType: 'increase' as const,
      icon: FileText,
      color: 'bg-blue-500',
    },
    {
      title: 'Active Domains',
      value: analytics?.active_domains?.toString() || '3',
      change: '+0%',
      changeType: 'neutral' as const,
      icon: Globe,
      color: 'bg-green-500',
    },
    {
      title: 'Monthly Views',
      value: analytics?.monthly_views
        ? (analytics.monthly_views / 1000).toFixed(1) + 'K'
        : '0',
      change: '+18%', // TODO: Calculate real change
      changeType: 'increase' as const,
      icon: Eye,
      color: 'bg-purple-500',
    },
    {
      title: 'Total Users',
      value: analytics?.total_users?.toString() || '0',
      change: '-2%', // TODO: Calculate real change
      changeType: 'decrease' as const,
      icon: Users,
      color: 'bg-orange-500',
    },
  ]

  // Mock domain data - TODO: replace with real API call
  const topDomains = [
    { name: 'tech.blog', posts: 156, views: '18.2K', growth: '+15%' },
    { name: 'lifestyle.blog', posts: 89, views: '12.1K', growth: '+8%' },
    { name: 'business.blog', posts: 67, views: '9.8K', growth: '+22%' },
  ]

  // Helper function to format date
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    )

    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24)
      return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`

    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7)
      return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`

    return date.toLocaleDateString()
  }

  return (
    <div className='p-6 max-w-7xl mx-auto'>
      {/* Header */}
      <div className='mb-8'>
        <h1 className='text-3xl font-bold text-slate-900 mb-2'>Dashboard</h1>
        <p className='text-slate-600'>
          Welcome back! Here's what's happening with your blog platform.
        </p>
      </div>

      {/* Loading state for analytics */}
      {analytics === undefined && !analyticsError && (
        <div className='mb-8 text-center'>
          <p className='text-slate-500'>Loading dashboard data...</p>
        </div>
      )}

      {/* Error state for analytics */}
      {analyticsError && (
        <div className='mb-8 text-center'>
          <p className='text-red-500'>
            Error loading analytics data. Please try again.
          </p>
        </div>
      )}

      {/* Stats Grid */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div
              key={stat.title}
              className='bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow'>
              <div className='flex items-center justify-between mb-4'>
                <div className={`p-2 rounded-lg ${stat.color} bg-opacity-10`}>
                  <Icon
                    className={`w-6 h-6 ${stat.color.replace('bg-', 'text-')}`}
                  />
                </div>
                <div
                  className={`flex items-center text-sm font-medium ${
                    stat.changeType === 'increase'
                      ? 'text-green-600'
                      : stat.changeType === 'decrease'
                      ? 'text-red-600'
                      : 'text-slate-500'
                  }`}>
                  {stat.changeType === 'increase' && (
                    <ArrowUpRight className='w-4 h-4 mr-1' />
                  )}
                  {stat.changeType === 'decrease' && (
                    <ArrowDownRight className='w-4 h-4 mr-1' />
                  )}
                  {stat.change}
                </div>
              </div>
              <div>
                <p className='text-2xl font-bold text-slate-900 mb-1'>
                  {stat.value}
                </p>
                <p className='text-slate-600 text-sm'>{stat.title}</p>
              </div>
            </div>
          )
        })}
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
        {/* Recent Posts */}
        <div className='lg:col-span-2'>
          <div className='bg-white rounded-xl shadow-sm border border-slate-200'>
            <div className='p-6 border-b border-slate-200'>
              <div className='flex items-center justify-between'>
                <h2 className='text-lg font-semibold text-slate-900'>
                  Recent Posts
                </h2>
                <button className='text-purple-600 hover:text-purple-700 text-sm font-medium'>
                  View all
                </button>
              </div>
            </div>
            <div className='divide-y divide-slate-200'>
              {recentPosts.length > 0 ? (
                recentPosts.map((post) => (
                  <div
                    key={post.id}
                    className='p-6 hover:bg-slate-50 transition-colors'>
                    <div className='flex items-start justify-between'>
                      <div className='flex-1'>
                        <h3 className='font-medium text-slate-900 mb-1'>
                          {post.title}
                        </h3>
                        <div className='flex items-center space-x-4 text-sm text-slate-500'>
                          <span className='flex items-center'>
                            <Globe className='w-4 h-4 mr-1' />
                            {post.domain_name || 'Unknown Domain'}
                          </span>
                          <span className='flex items-center'>
                            <Eye className='w-4 h-4 mr-1' />
                            {post.views?.toLocaleString() || '0'} views
                          </span>
                          <span className='flex items-center'>
                            <Clock className='w-4 h-4 mr-1' />
                            {formatRelativeTime(post.updated_at)}
                          </span>
                        </div>
                      </div>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          post.status === 'published'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                        {post.status}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className='p-6 text-center text-slate-500'>
                  {postsLoading || analyticsLoading
                    ? 'Loading...'
                    : 'No recent posts found'}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Domain Performance */}
        <div className='space-y-8'>
          <div className='bg-white rounded-xl shadow-sm border border-slate-200'>
            <div className='p-6 border-b border-slate-200'>
              <h2 className='text-lg font-semibold text-slate-900'>
                Domain Performance
              </h2>
            </div>
            <div className='p-6'>
              <div className='space-y-4'>
                {topDomains.map((domain, index) => (
                  <div
                    key={domain.name}
                    className='flex items-center justify-between'>
                    <div className='flex items-center space-x-3'>
                      <div
                        className={`w-3 h-3 rounded-full ${
                          index === 0
                            ? 'bg-blue-500'
                            : index === 1
                            ? 'bg-green-500'
                            : 'bg-purple-500'
                        }`}
                      />
                      <div>
                        <p className='font-medium text-slate-900'>
                          {domain.name}
                        </p>
                        <p className='text-sm text-slate-500'>
                          {domain.posts} posts
                        </p>
                      </div>
                    </div>
                    <div className='text-right'>
                      <p className='font-medium text-slate-900'>
                        {domain.views}
                      </p>
                      <p className='text-sm text-green-600'>{domain.growth}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className='bg-white rounded-xl shadow-sm border border-slate-200'>
            <div className='p-6 border-b border-slate-200'>
              <h2 className='text-lg font-semibold text-slate-900'>
                Quick Actions
              </h2>
            </div>
            <div className='p-6'>
              <div className='space-y-3'>
                <button className='w-full flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-blue-50 hover:from-purple-100 hover:to-blue-100 rounded-lg transition-colors'>
                  <span className='flex items-center text-slate-700 font-medium'>
                    <FileText className='w-4 h-4 mr-2' />
                    Create New Post
                  </span>
                  <ArrowUpRight className='w-4 h-4 text-slate-400' />
                </button>

                <button className='w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors'>
                  <span className='flex items-center text-slate-700 font-medium'>
                    <BarChart3 className='w-4 h-4 mr-2' />
                    View Analytics
                  </span>
                  <ArrowUpRight className='w-4 h-4 text-slate-400' />
                </button>

                <button className='w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors'>
                  <span className='flex items-center text-slate-700 font-medium'>
                    <Globe className='w-4 h-4 mr-2' />
                    Domain Settings
                  </span>
                  <ArrowUpRight className='w-4 h-4 text-slate-400' />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard
