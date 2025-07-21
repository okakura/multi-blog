import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BarChart3,
  TrendingUp,
  Users,
  Eye,
  Globe,
  Search,
  ExternalLink,
  Calendar,
  RefreshCw,
  ArrowLeft,
  Download,
  Clock,
  MousePointer,
  Smartphone,
  Monitor,
  Tablet,
} from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart,
} from 'recharts'
import {
  useAnalyticsOverview,
  useTrafficStats,
  usePostAnalytics,
  useSearchAnalytics,
  useReferrerStats,
} from '../../hooks/useAdminPosts'
import { adminToast } from '../../utils/toast'

const AdminAnalytics: React.FC = () => {
  const navigate = useNavigate()
  const [selectedPeriod, setSelectedPeriod] = useState(30)

  // Fetch all analytics data
  const {
    overview,
    isLoading: overviewLoading,
    error: overviewError,
    refresh: refreshOverview,
  } = useAnalyticsOverview(selectedPeriod)

  const {
    traffic,
    isLoading: trafficLoading,
    error: trafficError,
    refresh: refreshTraffic,
  } = useTrafficStats(selectedPeriod)

  const {
    postAnalytics,
    isLoading: postsLoading,
    error: postsError,
    refresh: refreshPosts,
  } = usePostAnalytics(selectedPeriod)

  const {
    searchAnalytics,
    isLoading: searchLoading,
    error: searchError,
    refresh: refreshSearch,
  } = useSearchAnalytics(selectedPeriod)

  const {
    referrerStats,
    isLoading: referrersLoading,
    error: referrersError,
    refresh: refreshReferrers,
  } = useReferrerStats(selectedPeriod)

  const isLoading =
    overviewLoading ||
    trafficLoading ||
    postsLoading ||
    searchLoading ||
    referrersLoading

  const hasError =
    overviewError || trafficError || postsError || searchError || referrersError

  // Handle period change
  const handlePeriodChange = (days: number) => {
    setSelectedPeriod(days)
  }

  // Refresh all data
  const refreshAllData = async () => {
    try {
      await Promise.all([
        refreshOverview(),
        refreshTraffic(),
        refreshPosts(),
        refreshSearch(),
        refreshReferrers(),
      ])
      adminToast.dataRefreshed()
    } catch (error) {
      adminToast.error('Failed to refresh analytics data')
    }
  }

  // Chart colors
  const chartColors = {
    primary: '#8b5cf6',
    secondary: '#06b6d4',
    accent: '#f59e0b',
    success: '#10b981',
    danger: '#ef4444',
  }

  const pieChartColors = [
    chartColors.primary,
    chartColors.secondary,
    chartColors.accent,
    chartColors.success,
    chartColors.danger,
  ]

  // Format numbers
  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  // Format percentage change
  const formatPercentChange = (current: number, previous: number) => {
    if (previous === 0) return '+0%'
    const change = ((current - previous) / previous) * 100
    return `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`
  }

  // Get trend direction
  const getTrend = (current: number, previous: number) => {
    return current >= previous ? 'up' : 'down'
  }

  return (
    <div className='p-6 max-w-7xl mx-auto'>
      {/* Header */}
      <div className='mb-8'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center space-x-4'>
            <button
              onClick={() => navigate('/admin')}
              className='flex items-center space-x-2 text-slate-600 hover:text-slate-900 transition-colors'>
              <ArrowLeft size={20} />
              <span className='font-medium'>Back to Dashboard</span>
            </button>
            <div className='w-px h-6 bg-slate-300' />
            <div>
              <h1 className='text-3xl font-bold text-slate-900 mb-2'>
                Analytics
              </h1>
              <p className='text-slate-600'>
                Detailed insights into your blog platform performance
              </p>
            </div>
          </div>
          <div className='flex items-center space-x-3'>
            {/* Period selector */}
            <div className='flex items-center space-x-1 bg-white rounded-lg border border-slate-200 p-1'>
              {[7, 30, 90].map((days) => (
                <button
                  key={days}
                  onClick={() => handlePeriodChange(days)}
                  className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                    selectedPeriod === days
                      ? 'bg-purple-600 text-white'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}>
                  {days}d
                </button>
              ))}
            </div>
            <button
              onClick={refreshAllData}
              disabled={isLoading}
              className='flex items-center space-x-2 px-4 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50'>
              <RefreshCw
                size={16}
                className={`text-slate-600 ${isLoading ? 'animate-spin' : ''}`}
              />
              <span className='text-slate-700 font-medium'>Refresh</span>
            </button>
            <button className='flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors'>
              <Download size={16} />
              <span className='font-medium'>Export</span>
            </button>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && !overview && (
        <div className='bg-white rounded-xl shadow-sm border border-slate-200 p-12'>
          <div className='flex items-center justify-center space-x-3'>
            <RefreshCw className='animate-spin w-8 h-8 text-purple-600' />
            <div className='text-center'>
              <p className='text-slate-900 font-medium text-lg'>
                Loading analytics data...
              </p>
              <p className='text-slate-500'>This may take a moment</p>
            </div>
          </div>
        </div>
      )}

      {/* Error State */}
      {hasError && (
        <div className='mb-8 bg-red-50 border border-red-200 rounded-xl p-6'>
          <div className='text-center'>
            <div className='text-red-500 mb-2'>
              <BarChart3 className='w-8 h-8 mx-auto' />
            </div>
            <p className='text-red-700 font-medium mb-2'>
              Error loading analytics data
            </p>
            <p className='text-red-600 text-sm mb-4'>
              {overviewError ||
                trafficError ||
                postsError ||
                searchError ||
                referrersError}
            </p>
            <button
              onClick={refreshAllData}
              className='px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors'>
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* Overview Stats */}
      {overview && (
        <>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
            <div className='bg-white rounded-xl shadow-sm border border-slate-200 p-6'>
              <div className='flex items-center justify-between mb-4'>
                <div className='p-3 rounded-xl bg-blue-500 bg-opacity-10'>
                  <Eye className='w-6 h-6 text-white' />
                </div>
                <div
                  className={`flex items-center text-sm font-medium px-2 py-1 rounded-full ${
                    getTrend(
                      overview.current_period.page_views,
                      overview.previous_period.page_views
                    ) === 'up'
                      ? 'text-green-700 bg-green-50'
                      : 'text-red-700 bg-red-50'
                  }`}>
                  <TrendingUp
                    className={`w-3 h-3 mr-1 ${
                      getTrend(
                        overview.current_period.page_views,
                        overview.previous_period.page_views
                      ) === 'down'
                        ? 'transform rotate-180'
                        : ''
                    }`}
                  />
                  {formatPercentChange(
                    overview.current_period.page_views,
                    overview.previous_period.page_views
                  )}
                </div>
              </div>
              <div>
                <p className='text-3xl font-bold text-slate-900 mb-1'>
                  {formatNumber(overview.current_period.page_views)}
                </p>
                <p className='text-slate-600 text-sm font-medium'>Page Views</p>
              </div>
            </div>

            <div className='bg-white rounded-xl shadow-sm border border-slate-200 p-6'>
              <div className='flex items-center justify-between mb-4'>
                <div className='p-3 rounded-xl bg-green-500 bg-opacity-10'>
                  <Users className='w-6 h-6 text-white' />
                </div>
                <div
                  className={`flex items-center text-sm font-medium px-2 py-1 rounded-full ${
                    getTrend(
                      overview.current_period.unique_visitors,
                      overview.previous_period.unique_visitors
                    ) === 'up'
                      ? 'text-green-700 bg-green-50'
                      : 'text-red-700 bg-red-50'
                  }`}>
                  <TrendingUp
                    className={`w-3 h-3 mr-1 ${
                      getTrend(
                        overview.current_period.unique_visitors,
                        overview.previous_period.unique_visitors
                      ) === 'down'
                        ? 'transform rotate-180'
                        : ''
                    }`}
                  />
                  {formatPercentChange(
                    overview.current_period.unique_visitors,
                    overview.previous_period.unique_visitors
                  )}
                </div>
              </div>
              <div>
                <p className='text-3xl font-bold text-slate-900 mb-1'>
                  {formatNumber(overview.current_period.unique_visitors)}
                </p>
                <p className='text-slate-600 text-sm font-medium'>
                  Unique Visitors
                </p>
              </div>
            </div>

            <div className='bg-white rounded-xl shadow-sm border border-slate-200 p-6'>
              <div className='flex items-center justify-between mb-4'>
                <div className='p-3 rounded-xl bg-purple-500 bg-opacity-10'>
                  <Globe className='w-6 h-6 text-white' />
                </div>
                <div
                  className={`flex items-center text-sm font-medium px-2 py-1 rounded-full ${
                    getTrend(
                      overview.current_period.post_views,
                      overview.previous_period.post_views
                    ) === 'up'
                      ? 'text-green-700 bg-green-50'
                      : 'text-red-700 bg-red-50'
                  }`}>
                  <TrendingUp
                    className={`w-3 h-3 mr-1 ${
                      getTrend(
                        overview.current_period.post_views,
                        overview.previous_period.post_views
                      ) === 'down'
                        ? 'transform rotate-180'
                        : ''
                    }`}
                  />
                  {formatPercentChange(
                    overview.current_period.post_views,
                    overview.previous_period.post_views
                  )}
                </div>
              </div>
              <div>
                <p className='text-3xl font-bold text-slate-900 mb-1'>
                  {formatNumber(overview.current_period.post_views)}
                </p>
                <p className='text-slate-600 text-sm font-medium'>Post Views</p>
              </div>
            </div>

            <div className='bg-white rounded-xl shadow-sm border border-slate-200 p-6'>
              <div className='flex items-center justify-between mb-4'>
                <div className='p-3 rounded-xl bg-orange-500 bg-opacity-10'>
                  <Search className='w-6 h-6 text-white' />
                </div>
                <div
                  className={`flex items-center text-sm font-medium px-2 py-1 rounded-full ${
                    getTrend(
                      overview.current_period.searches,
                      overview.previous_period.searches
                    ) === 'up'
                      ? 'text-green-700 bg-green-50'
                      : 'text-red-700 bg-red-50'
                  }`}>
                  <TrendingUp
                    className={`w-3 h-3 mr-1 ${
                      getTrend(
                        overview.current_period.searches,
                        overview.previous_period.searches
                      ) === 'down'
                        ? 'transform rotate-180'
                        : ''
                    }`}
                  />
                  {formatPercentChange(
                    overview.current_period.searches,
                    overview.previous_period.searches
                  )}
                </div>
              </div>
              <div>
                <p className='text-3xl font-bold text-slate-900 mb-1'>
                  {formatNumber(overview.current_period.searches)}
                </p>
                <p className='text-slate-600 text-sm font-medium'>Searches</p>
              </div>
            </div>
          </div>

          {/* Traffic Charts */}
          {traffic && (
            <div className='grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8'>
              {/* Daily Traffic Chart */}
              <div className='bg-white rounded-xl shadow-sm border border-slate-200 p-6'>
                <div className='flex items-center justify-between mb-6'>
                  <h3 className='text-lg font-semibold text-slate-900'>
                    Daily Traffic
                  </h3>
                  <div className='flex items-center space-x-4 text-sm'>
                    <div className='flex items-center space-x-2'>
                      <div
                        className='w-3 h-3 rounded-full'
                        style={{ backgroundColor: chartColors.primary }}
                      />
                      <span className='text-slate-600'>Page Views</span>
                    </div>
                    <div className='flex items-center space-x-2'>
                      <div
                        className='w-3 h-3 rounded-full'
                        style={{ backgroundColor: chartColors.secondary }}
                      />
                      <span className='text-slate-600'>Unique Visitors</span>
                    </div>
                  </div>
                </div>
                <div className='h-80'>
                  <ResponsiveContainer width='100%' height='100%'>
                    <AreaChart data={traffic.daily_stats}>
                      <CartesianGrid strokeDasharray='3 3' stroke='#f1f5f9' />
                      <XAxis
                        dataKey='date'
                        stroke='#64748b'
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        stroke='#64748b'
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#ffffff',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                        }}
                      />
                      <Area
                        type='monotone'
                        dataKey='page_views'
                        stroke={chartColors.primary}
                        fill={chartColors.primary}
                        fillOpacity={0.3}
                        strokeWidth={2}
                      />
                      <Area
                        type='monotone'
                        dataKey='unique_visitors'
                        stroke={chartColors.secondary}
                        fill={chartColors.secondary}
                        fillOpacity={0.3}
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Device Breakdown */}
              <div className='bg-white rounded-xl shadow-sm border border-slate-200 p-6'>
                <div className='flex items-center justify-between mb-6'>
                  <h3 className='text-lg font-semibold text-slate-900'>
                    Device Breakdown
                  </h3>
                  <div className='text-sm text-slate-500'>
                    Last {selectedPeriod} days
                  </div>
                </div>
                <div className='h-80'>
                  <ResponsiveContainer width='100%' height='100%'>
                    <PieChart>
                      <Pie
                        data={[
                          {
                            name: 'Desktop',
                            value: traffic.device_breakdown.desktop,
                            icon: Monitor,
                          },
                          {
                            name: 'Mobile',
                            value: traffic.device_breakdown.mobile,
                            icon: Smartphone,
                          },
                          {
                            name: 'Tablet',
                            value: traffic.device_breakdown.tablet,
                            icon: Tablet,
                          },
                        ]}
                        cx='50%'
                        cy='50%'
                        outerRadius={80}
                        dataKey='value'
                        label={({ name, percent }) =>
                          `${name} ${(percent * 100).toFixed(0)}%`
                        }>
                        {pieChartColors.map((color, index) => (
                          <Cell key={`cell-${index}`} fill={color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* Top Content & Search Analytics */}
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8'>
            {/* Top Posts */}
            {overview.top_posts && (
              <div className='bg-white rounded-xl shadow-sm border border-slate-200 p-6'>
                <div className='flex items-center justify-between mb-6'>
                  <h3 className='text-lg font-semibold text-slate-900'>
                    Top Performing Posts
                  </h3>
                  <button
                    onClick={() => navigate('/admin/posts')}
                    className='text-purple-600 hover:text-purple-700 text-sm font-medium'>
                    View All
                  </button>
                </div>
                <div className='space-y-4'>
                  {overview.top_posts.slice(0, 5).map((post, index) => (
                    <div
                      key={post.id}
                      className='flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer group'
                      onClick={() => navigate(`/admin/posts/${post.id}/edit`)}>
                      <div className='flex items-center space-x-3'>
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                            index === 0
                              ? 'bg-yellow-500'
                              : index === 1
                              ? 'bg-gray-400'
                              : index === 2
                              ? 'bg-orange-600'
                              : 'bg-slate-400'
                          }`}>
                          {index + 1}
                        </div>
                        <div>
                          <p className='font-medium text-slate-900 group-hover:text-purple-600 transition-colors'>
                            {post.title}
                          </p>
                          <p className='text-sm text-slate-500'>
                            {formatNumber(post.views)} views •{' '}
                            {formatNumber(post.unique_views)} unique
                          </p>
                        </div>
                      </div>
                      <ExternalLink className='w-4 h-4 text-slate-400 group-hover:text-purple-600 transition-colors' />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Search Terms */}
            {searchAnalytics?.popular_terms && (
              <div className='bg-white rounded-xl shadow-sm border border-slate-200 p-6'>
                <div className='flex items-center justify-between mb-6'>
                  <h3 className='text-lg font-semibold text-slate-900'>
                    Popular Search Terms
                  </h3>
                  <div className='text-sm text-slate-500'>
                    Last {selectedPeriod} days
                  </div>
                </div>
                <div className='space-y-4'>
                  {searchAnalytics.popular_terms
                    .slice(0, 5)
                    .map((term, index) => (
                      <div
                        key={term.query}
                        className='flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors'>
                        <div className='flex items-center space-x-3'>
                          <div className='w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center'>
                            <Search className='w-4 h-4 text-purple-600' />
                          </div>
                          <div>
                            <p className='font-medium text-slate-900'>
                              {term.query}
                            </p>
                            <p className='text-sm text-slate-500'>
                              {formatNumber(term.count)} searches
                            </p>
                          </div>
                        </div>
                        <div
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            term.results_found
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                          {term.results_found ? 'Found' : 'No Results'}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* Referrer Sources */}
          {referrerStats && (
            <div className='bg-white rounded-xl shadow-sm border border-slate-200 p-6'>
              <div className='flex items-center justify-between mb-6'>
                <h3 className='text-lg font-semibold text-slate-900'>
                  Traffic Sources
                </h3>
                <div className='text-sm text-slate-500'>
                  Last {selectedPeriod} days
                </div>
              </div>
              <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
                {/* Referrer Types */}
                <div>
                  <h4 className='text-md font-medium text-slate-700 mb-4'>
                    Source Types
                  </h4>
                  <div className='space-y-3'>
                    {Object.entries(referrerStats.referrer_types).map(
                      ([type, count]) => (
                        <div
                          key={type}
                          className='flex items-center justify-between'>
                          <div className='flex items-center space-x-3'>
                            <div className='w-3 h-3 rounded-full bg-purple-500' />
                            <span className='text-slate-700 capitalize'>
                              {type.replace('_', ' ')}
                            </span>
                          </div>
                          <span className='font-medium text-slate-900'>
                            {formatNumber(count as number)}
                          </span>
                        </div>
                      )
                    )}
                  </div>
                </div>

                {/* Top Referrers */}
                <div>
                  <h4 className='text-md font-medium text-slate-700 mb-4'>
                    Top Referrers
                  </h4>
                  <div className='space-y-3'>
                    {referrerStats.top_referrers.slice(0, 5).map((referrer) => (
                      <div
                        key={referrer.referrer}
                        className='flex items-center justify-between'>
                        <div className='flex items-center space-x-3'>
                          <ExternalLink className='w-4 h-4 text-slate-400' />
                          <span className='text-slate-700 truncate max-w-48'>
                            {referrer.referrer || 'Direct'}
                          </span>
                        </div>
                        <span className='font-medium text-slate-900'>
                          {formatNumber(referrer.visits)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default AdminAnalytics
