import {
  ArrowLeft,
  BarChart3,
  Calendar,
  Clock,
  Download,
  ExternalLink,
  Eye,
  Globe,
  Monitor,
  MousePointer,
  RefreshCw,
  Search,
  Smartphone,
  Tablet,
  TrendingUp,
  Users,
} from 'lucide-react'
import type React from 'react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  useAnalyticsOverview,
  usePostAnalytics,
  useReferrerStats,
  useSearchAnalytics,
  useTrafficStats,
} from '../../hooks/useAdminPosts'
import { usePreferences } from '../../hooks/useUserPreferences'
import { adminToast } from '../../utils/toast'

const AdminAnalytics: React.FC = () => {
  const navigate = useNavigate()
  const { preferences } = usePreferences()

  // Calculate effective theme
  const effectiveTheme =
    preferences.appearance.theme === 'system'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
      : preferences.appearance.theme

  const [selectedPeriod, setSelectedPeriod] = useState(30)
  // Remove hardcoded domain - now aggregates all domains user has access to
  // const [selectedDomain] = useState('tech.blog') // Default domain for analytics

  // Fetch all analytics data - now aggregated across all permitted domains
  const {
    overview,
    isLoading: overviewLoading,
    error: overviewError,
    refresh: refreshOverview,
  } = useAnalyticsOverview(selectedPeriod) // No domain parameter

  const {
    traffic,
    isLoading: trafficLoading,
    error: trafficError,
    refresh: refreshTraffic,
  } = useTrafficStats(selectedPeriod) // No domain parameter

  const {
    postAnalytics,
    isLoading: postsLoading,
    error: postsError,
    refresh: refreshPosts,
  } = usePostAnalytics(selectedPeriod) // No domain parameter

  const {
    searchAnalytics,
    isLoading: searchLoading,
    error: searchError,
    refresh: refreshSearch,
  } = useSearchAnalytics(selectedPeriod) // No domain parameter

  const {
    referrerStats,
    isLoading: referrersLoading,
    error: referrersError,
    refresh: refreshReferrers,
  } = useReferrerStats(selectedPeriod) // No domain parameter

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
    } catch (_error) {
      adminToast.deleting() // Using an existing method instead
    }
  }

  // Chart colors - responsive to theme
  const isDark = effectiveTheme === 'dark'

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

  // Chart styling for theme
  const chartGridColor = isDark ? '#374151' : '#f1f5f9'
  const chartAxisColor = isDark ? '#9ca3af' : '#64748b'
  const chartTooltipBg = isDark ? '#1f2937' : '#ffffff'
  const chartTooltipBorder = isDark ? '#374151' : '#e2e8f0'

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
    <div className='p-6 max-w-7xl mx-auto bg-white dark:bg-gray-900 min-h-screen'>
      {/* Header */}
      <div className='mb-8'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center space-x-4'>
            <button
              onClick={() => navigate('/admin')}
              className='flex items-center space-x-2 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 transition-colors'>
              <ArrowLeft size={20} />
              <span className='font-medium'>Back to Dashboard</span>
            </button>
            <div className='w-px h-6 bg-slate-300 dark:bg-slate-700' />
            <div>
              <h1 className='text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2'>
                Analytics
              </h1>
              <p className='text-slate-600 dark:text-slate-400'>
                Detailed insights into your blog platform performance
              </p>
            </div>
          </div>
          <div className='flex items-center space-x-3'>
            {/* Period selector */}
            <div className='flex items-center space-x-1 bg-white dark:bg-gray-800 rounded-lg border border-slate-200 dark:border-gray-700 p-1'>
              {[7, 30, 90].map((days) => (
                <button
                  key={days}
                  onClick={() => handlePeriodChange(days)}
                  className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                    selectedPeriod === days
                      ? 'bg-purple-600 text-white'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-gray-700'
                  }`}>
                  {days}d
                </button>
              ))}
            </div>
            <button
              onClick={refreshAllData}
              disabled={isLoading}
              className='flex items-center space-x-2 px-4 py-2 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50'>
              <RefreshCw
                size={16}
                className={`text-slate-600 dark:text-slate-400 ${
                  isLoading ? 'animate-spin' : ''
                }`}
              />
              <span className='text-slate-700 dark:text-slate-300 font-medium'>
                Refresh
              </span>
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
        <div className='bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-slate-200 dark:border-gray-700 p-12'>
          <div className='flex items-center justify-center space-x-3'>
            <RefreshCw className='animate-spin w-8 h-8 text-purple-600' />
            <div className='text-center'>
              <p className='text-slate-900 dark:text-slate-100 font-medium text-lg'>
                Loading analytics data...
              </p>
              <p className='text-slate-500 dark:text-slate-400'>
                This may take a moment
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error State */}
      {hasError && (
        <div className='mb-8 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6'>
          <div className='text-center'>
            <div className='text-red-500 dark:text-red-400 mb-2'>
              <BarChart3 className='w-8 h-8 mx-auto' />
            </div>
            <p className='text-red-700 dark:text-red-300 font-medium mb-2'>
              Error loading analytics data
            </p>
            <p className='text-red-600 dark:text-red-400 text-sm mb-4'>
              {overviewError ||
                trafficError ||
                postsError ||
                searchError ||
                referrersError}
            </p>
            <button
              onClick={refreshAllData}
              className='px-4 py-2 bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-100 rounded-lg hover:bg-red-200 dark:hover:bg-red-700 transition-colors'>
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* Overview Stats */}
      {overview && (
        <>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
            <div className='bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-slate-200 dark:border-gray-700 p-6'>
              <div className='flex items-center justify-between mb-4'>
                <div className='p-3 rounded-xl bg-blue-500 bg-opacity-10 dark:bg-blue-500 dark:bg-opacity-20'>
                  <Eye className='w-6 h-6 text-blue-600 dark:text-blue-400' />
                </div>
                <div
                  className={`flex items-center text-sm font-medium px-2 py-1 rounded-full ${
                    getTrend(
                      overview.current_period.page_views,
                      overview.previous_period.page_views
                    ) === 'up'
                      ? 'text-green-700 bg-green-50 dark:text-green-300 dark:bg-green-900/30'
                      : 'text-red-700 bg-red-50 dark:text-red-300 dark:bg-red-900/30'
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
                <p className='text-3xl font-bold text-slate-900 dark:text-slate-100 mb-1'>
                  {formatNumber(overview.current_period.page_views)}
                </p>
                <p className='text-slate-600 dark:text-slate-400 text-sm font-medium'>
                  Page Views
                </p>
              </div>
            </div>

            <div className='bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-slate-200 dark:border-gray-700 p-6'>
              <div className='flex items-center justify-between mb-4'>
                <div className='p-3 rounded-xl bg-green-500 bg-opacity-10 dark:bg-green-500 dark:bg-opacity-20'>
                  <Users className='w-6 h-6 text-green-600 dark:text-green-400' />
                </div>
                <div
                  className={`flex items-center text-sm font-medium px-2 py-1 rounded-full ${
                    getTrend(
                      overview.current_period.unique_visitors,
                      overview.previous_period.unique_visitors
                    ) === 'up'
                      ? 'text-green-700 bg-green-50 dark:text-green-300 dark:bg-green-900/30'
                      : 'text-red-700 bg-red-50 dark:text-red-300 dark:bg-red-900/30'
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
                <p className='text-3xl font-bold text-slate-900 dark:text-slate-100 mb-1'>
                  {formatNumber(overview.current_period.unique_visitors)}
                </p>
                <p className='text-slate-600 dark:text-slate-400 text-sm font-medium'>
                  Unique Visitors
                </p>
              </div>
            </div>

            <div className='bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-slate-200 dark:border-gray-700 p-6'>
              <div className='flex items-center justify-between mb-4'>
                <div className='p-3 rounded-xl bg-purple-500 bg-opacity-10 dark:bg-purple-500 dark:bg-opacity-20'>
                  <Globe className='w-6 h-6 text-purple-600 dark:text-purple-400' />
                </div>
                <div
                  className={`flex items-center text-sm font-medium px-2 py-1 rounded-full ${
                    getTrend(
                      overview.current_period.post_views,
                      overview.previous_period.post_views
                    ) === 'up'
                      ? 'text-green-700 bg-green-50 dark:text-green-300 dark:bg-green-900/30'
                      : 'text-red-700 bg-red-50 dark:text-red-300 dark:bg-red-900/30'
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
                <p className='text-3xl font-bold text-slate-900 dark:text-slate-100 mb-1'>
                  {formatNumber(overview.current_period.post_views)}
                </p>
                <p className='text-slate-600 dark:text-slate-400 text-sm font-medium'>
                  Post Views
                </p>
              </div>
            </div>

            <div className='bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-slate-200 dark:border-gray-700 p-6'>
              <div className='flex items-center justify-between mb-4'>
                <div className='p-3 rounded-xl bg-orange-500 bg-opacity-10 dark:bg-orange-500 dark:bg-opacity-20'>
                  <Search className='w-6 h-6 text-orange-600 dark:text-orange-400' />
                </div>
                <div
                  className={`flex items-center text-sm font-medium px-2 py-1 rounded-full ${
                    getTrend(
                      overview.current_period.searches,
                      overview.previous_period.searches
                    ) === 'up'
                      ? 'text-green-700 bg-green-50 dark:text-green-300 dark:bg-green-900/30'
                      : 'text-red-700 bg-red-50 dark:text-red-300 dark:bg-red-900/30'
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
                <p className='text-3xl font-bold text-slate-900 dark:text-slate-100 mb-1'>
                  {formatNumber(overview.current_period.searches)}
                </p>
                <p className='text-slate-600 dark:text-slate-400 text-sm font-medium'>
                  Searches
                </p>
              </div>
            </div>
          </div>

          {/* Traffic Charts */}
          {traffic && (
            <div className='grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8'>
              {/* Daily Traffic Chart */}
              <div className='bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-slate-200 dark:border-gray-700 p-6'>
                <div className='flex items-center justify-between mb-6'>
                  <h3 className='text-lg font-semibold text-slate-900 dark:text-slate-100'>
                    Daily Traffic
                  </h3>
                  <div className='flex items-center space-x-4 text-sm'>
                    <div className='flex items-center space-x-2'>
                      <div
                        className='w-3 h-3 rounded-full'
                        style={{ backgroundColor: chartColors.primary }}
                      />
                      <span className='text-slate-600 dark:text-slate-400'>
                        Page Views
                      </span>
                    </div>
                    <div className='flex items-center space-x-2'>
                      <div
                        className='w-3 h-3 rounded-full'
                        style={{ backgroundColor: chartColors.secondary }}
                      />
                      <span className='text-slate-600 dark:text-slate-400'>
                        Unique Visitors
                      </span>
                    </div>
                  </div>
                </div>
                <div className='h-80'>
                  <ResponsiveContainer width='100%' height='100%'>
                    <AreaChart data={traffic.daily_stats}>
                      <CartesianGrid
                        strokeDasharray='3 3'
                        stroke={chartGridColor}
                      />
                      <XAxis
                        dataKey='date'
                        stroke={chartAxisColor}
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        stroke={chartAxisColor}
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: chartTooltipBg,
                          border: `1px solid ${chartTooltipBorder}`,
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                          color: isDark ? '#f3f4f6' : '#1f2937',
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
              <div className='bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-slate-200 dark:border-gray-700 p-6'>
                <div className='flex items-center justify-between mb-6'>
                  <h3 className='text-lg font-semibold text-slate-900 dark:text-slate-100'>
                    Device Breakdown
                  </h3>
                  <div className='text-sm text-slate-500 dark:text-slate-400'>
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
              <div className='bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-slate-200 dark:border-gray-700 p-6'>
                <div className='flex items-center justify-between mb-6'>
                  <h3 className='text-lg font-semibold text-slate-900 dark:text-slate-100'>
                    Top Performing Posts
                  </h3>
                  <button
                    onClick={() => navigate('/admin/posts')}
                    className='text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 text-sm font-medium'>
                    View All
                  </button>
                </div>
                <div className='space-y-4'>
                  {overview.top_posts.slice(0, 5).map((post, index) => (
                    <div
                      key={post.id}
                      className='flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors cursor-pointer group'
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
                          <p className='font-medium text-slate-900 dark:text-slate-100 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors'>
                            {post.title}
                          </p>
                          <p className='text-sm text-slate-500 dark:text-slate-400'>
                            {formatNumber(post.views)} views •{' '}
                            {formatNumber(post.unique_views)} unique
                          </p>
                        </div>
                      </div>
                      <ExternalLink className='w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors' />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Search Terms */}
            {searchAnalytics?.popular_terms && (
              <div className='bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-slate-200 dark:border-gray-700 p-6'>
                <div className='flex items-center justify-between mb-6'>
                  <h3 className='text-lg font-semibold text-slate-900 dark:text-slate-100'>
                    Popular Search Terms
                  </h3>
                  <div className='text-sm text-slate-500 dark:text-slate-400'>
                    Last {selectedPeriod} days
                  </div>
                </div>
                <div className='space-y-4'>
                  {searchAnalytics.popular_terms
                    .slice(0, 5)
                    .map((term, _index) => (
                      <div
                        key={term.query}
                        className='flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors'>
                        <div className='flex items-center space-x-3'>
                          <div className='w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center'>
                            <Search className='w-4 h-4 text-purple-600 dark:text-purple-400' />
                          </div>
                          <div>
                            <p className='font-medium text-slate-900 dark:text-slate-100'>
                              {term.query}
                            </p>
                            <p className='text-sm text-slate-500 dark:text-slate-400'>
                              {formatNumber(term.count)} searches
                            </p>
                          </div>
                        </div>
                        <div
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            term.results_found
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                              : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
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
            <div className='bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-slate-200 dark:border-gray-700 p-6'>
              <div className='flex items-center justify-between mb-6'>
                <h3 className='text-lg font-semibold text-slate-900 dark:text-slate-100'>
                  Traffic Sources
                </h3>
                <div className='text-sm text-slate-500 dark:text-slate-400'>
                  Last {selectedPeriod} days
                </div>
              </div>
              <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
                {/* Referrer Types */}
                <div>
                  <h4 className='text-md font-medium text-slate-700 dark:text-slate-300 mb-4'>
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
                            <span className='text-slate-700 dark:text-slate-300 capitalize'>
                              {type.replace('_', ' ')}
                            </span>
                          </div>
                          <span className='font-medium text-slate-900 dark:text-slate-100'>
                            {formatNumber(count as number)}
                          </span>
                        </div>
                      )
                    )}
                  </div>
                </div>

                {/* Top Referrers */}
                <div>
                  <h4 className='text-md font-medium text-slate-700 dark:text-slate-300 mb-4'>
                    Top Referrers
                  </h4>
                  <div className='space-y-3'>
                    {referrerStats.top_referrers.slice(0, 5).map((referrer) => (
                      <div
                        key={referrer.referrer}
                        className='flex items-center justify-between'>
                        <div className='flex items-center space-x-3'>
                          <ExternalLink className='w-4 h-4 text-slate-400 dark:text-slate-500' />
                          <span className='text-slate-700 dark:text-slate-300 truncate max-w-48'>
                            {referrer.referrer || 'Direct'}
                          </span>
                        </div>
                        <span className='font-medium text-slate-900 dark:text-slate-100'>
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
