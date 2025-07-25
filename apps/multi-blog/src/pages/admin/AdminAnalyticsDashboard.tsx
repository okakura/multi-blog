// External libraries

// Jotai hooks
import {
  useAnalyticsData,
  useAnalyticsFormatters,
  useAnalyticsNavigation,
  useAnalyticsPeriod,
  useReferrerData,
  useRefreshAnalytics,
  useSearchData,
  useThemeStyles,
  useTrafficData,
} from '@state/hooks/useAnalyticsDashboard'
import { useAnalyticsDataProvider } from '@state/providers/useAnalyticsDataProvider'
import {
  Activity,
  ArrowLeft,
  BarChart3,
  Clock,
  Download,
  ExternalLink,
  Eye,
  Monitor,
  MousePointer,
  RefreshCw,
  Search,
  Smartphone,
  Tablet,
  TrendingUp,
  Users,
} from 'lucide-react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
// UI Components
import ChartWrapper from '@/components/ui/ChartWrapper'
import DataSection from '@/components/ui/DataSection'
// Constants and utilities
import { ANALYTICS_CONSTANTS } from '@/constants'
// Types
import type { ChartColors } from '@/types/admin'

const AdminAnalyticsDashboard = () => {
  // Initialize data provider to sync SWR with Jotai atoms
  useAnalyticsDataProvider()

  // Use Jotai hooks for all state and computed values
  const navigateToRoute = useAnalyticsNavigation()
  const [selectedPeriod, setSelectedPeriod] = useAnalyticsPeriod()
  const themeStyles = useThemeStyles()
  const data = useAnalyticsData()
  const trafficData = useTrafficData()
  const searchData = useSearchData()
  const referrerData = useReferrerData()
  const refreshData = useRefreshAnalytics()
  const formatters = useAnalyticsFormatters()

  // Loading state - we can enhance this later with proper atoms
  const isLoading = !data

  // Create refresh handler that works with DataSection
  const handleRefresh = () => refreshData('manual')

  // Extract formatters for easy access
  const formatDuration = formatters?.duration || ((val: number) => `${val}s`)
  const formatPercentage =
    formatters?.percentage || ((val: number) => `${val}%`)
  const formatNumber = formatters?.number || ((val: number) => val.toString())

  if (isLoading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">
              Loading analytics...
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            No analytics data available
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Analytics will appear here once users start visiting your blog.
          </p>
        </div>
      </div>
    )
  }

  const chartColors: ChartColors = ANALYTICS_CONSTANTS.CHART_COLORS

  const pieChartColors = [
    chartColors.primary,
    chartColors.secondary,
    chartColors.accent,
    chartColors.success,
    chartColors.danger,
  ]

  return (
    <div className="p-6 max-w-7xl mx-auto bg-slate-50 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <button
            type="button"
            onClick={() => navigateToRoute('admin')}
            className="flex items-center space-x-2 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 transition-colors"
          >
            <ArrowLeft size={20} />
            <span className="font-medium">Back to Dashboard</span>
          </button>
          <div className="w-px h-6 bg-slate-300 dark:bg-slate-700" />
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-gray-100 mb-2">
              Analytics Dashboard
            </h1>
            <p className="text-slate-600 dark:text-gray-400">
              Comprehensive insights into user behavior and content performance
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* Period selector */}
          <div className="flex items-center space-x-1 bg-white dark:bg-gray-800 rounded-lg border border-slate-200 dark:border-gray-700 p-1">
            {ANALYTICS_CONSTANTS.PERIOD_OPTIONS.map((days) => (
              <button
                type="submit"
                key={days}
                onClick={() => setSelectedPeriod(days)}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                  selectedPeriod === days
                    ? 'bg-purple-600 text-white'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-gray-700'
                }`}
              >
                {days}d
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isLoading}
            className="flex items-center space-x-2 px-4 py-2 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={`text-slate-600 dark:text-slate-400 ${
                isLoading ? 'animate-spin' : ''
              }`}
            />
            <span className="text-slate-700 dark:text-slate-300 font-medium">
              Refresh
            </span>
          </button>
          <button
            type="button"
            className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Download size={16} />
            <span className="font-medium">Export</span>
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <DataSection fallbackTitle="Overview Cards Error" onRetry={handleRefresh}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-slate-200 dark:border-gray-700 p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Sessions
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {data.overview.total_sessions.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-slate-200 dark:border-gray-700 p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <Eye className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Page Views
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {data.overview.total_page_views.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-slate-200 dark:border-gray-700 p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                <Clock className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Avg. Duration
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {formatDuration(data.overview.avg_session_duration)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-slate-200 dark:border-gray-700 p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                <TrendingUp className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Bounce Rate
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {formatPercentage(data.overview.bounce_rate)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-slate-200 dark:border-gray-700 p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-indigo-100 dark:bg-indigo-900/20 rounded-lg">
                <Activity className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Engagement
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {Math.round(data.behavior.engagement_score_avg)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </DataSection>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* User Behavior */}
        <div className="space-y-6">
          {/* Top Clicked Elements */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-slate-200 dark:border-gray-700 p-6">
            <div className="flex items-center space-x-2 mb-4">
              <MousePointer className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Top Clicked Elements
              </h3>
            </div>
            <div className="space-y-3">
              {data.behavior.top_clicked_elements.slice(0, 5).map((item) => (
                <div
                  key={item.element}
                  className="flex items-center justify-between"
                >
                  <span className="text-sm text-gray-600 dark:text-gray-400 font-mono">
                    {item.element}
                  </span>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {item.clicks}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Scroll Depth */}
          <DataSection
            fallbackTitle="Scroll Depth Error"
            onRetry={handleRefresh}
          >
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-slate-200 dark:border-gray-700 p-6">
              <div className="flex items-center space-x-2 mb-4">
                <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Scroll Depth Distribution
                </h3>
              </div>
              <div className="space-y-3">
                {data.behavior.scroll_depth_distribution.map((item) => (
                  <div
                    key={`depth-${item.depth}`}
                    className="flex items-center space-x-3"
                  >
                    <span className="text-sm text-gray-600 dark:text-gray-400 w-8">
                      {item.depth}%
                    </span>
                    <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-900 dark:text-gray-100 w-12 text-right">
                      {Math.round(item.percentage)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </DataSection>
        </div>

        {/* Search & Content */}
        <div className="space-y-6">
          {/* Search Analytics */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-slate-200 dark:border-gray-700 p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Search className="w-5 h-5 text-green-600 dark:text-green-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Search Analytics
              </h3>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {formatPercentage(data.search.no_results_rate)}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    No Results
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {formatPercentage(data.search.search_to_click_rate)}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Click Rate
                  </p>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                  Top Search Queries
                </h4>
                <div className="space-y-2">
                  {data.search.top_queries.slice(0, 5).map((query) => (
                    <div
                      key={`query-${query.query}`}
                      className="flex items-center justify-between"
                    >
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        "{query.query}"
                      </span>
                      <div className="text-right">
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {query.count}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-500 ml-1">
                          ({Math.round(query.results_avg)} avg results)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Top Content */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-slate-200 dark:border-gray-700 p-6">
            <div className="flex items-center space-x-2 mb-4">
              <TrendingUp className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Top Performing Content
              </h3>
            </div>
            <div className="space-y-3">
              {data.content.top_content.slice(0, 5).map((content) => (
                <div
                  key={`content-${content.title}`}
                  className="border border-gray-100 dark:border-gray-700 rounded-lg p-3"
                >
                  <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1 line-clamp-1">
                    {content.title}
                  </h4>
                  <div className="grid grid-cols-3 gap-2 text-xs text-gray-600 dark:text-gray-400">
                    <span>{content.views} views</span>
                    <span>{formatDuration(content.avg_reading_time)} read</span>
                    <span>{content.engagement_score} engagement</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Traffic Charts */}
      {trafficData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Daily Traffic Chart */}
          <ChartWrapper
            title="Daily Traffic"
            onRetry={handleRefresh}
            actions={
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center space-x-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: chartColors.primary }}
                  />
                  <span className="text-slate-600 dark:text-slate-400">
                    Page Views
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: chartColors.secondary }}
                  />
                  <span className="text-slate-600 dark:text-slate-400">
                    Unique Visitors
                  </span>
                </div>
              </div>
            }
          >
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trafficData.daily_stats}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={themeStyles.chartGridColor}
                  />
                  <XAxis
                    dataKey="date"
                    stroke={themeStyles.chartAxisColor}
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke={themeStyles.chartAxisColor}
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: themeStyles.chartTooltipBg,
                      border: `1px solid ${themeStyles.chartTooltipBorder}`,
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      color: themeStyles.isDark ? '#f3f4f6' : '#1f2937',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="page_views"
                    stroke={chartColors.primary}
                    fill={chartColors.primary}
                    fillOpacity={0.3}
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="unique_visitors"
                    stroke={chartColors.secondary}
                    fill={chartColors.secondary}
                    fillOpacity={0.3}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </ChartWrapper>

          {/* Device Breakdown */}
          <ChartWrapper
            title="Device Breakdown"
            onRetry={handleRefresh}
            actions={
              <div className="text-sm text-slate-500 dark:text-slate-400">
                Last {selectedPeriod} days
              </div>
            }
          >
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      {
                        name: 'Desktop',
                        value: trafficData.device_breakdown.desktop,
                        icon: Monitor,
                      },
                      {
                        name: 'Mobile',
                        value: trafficData.device_breakdown.mobile,
                        icon: Smartphone,
                      },
                      {
                        name: 'Tablet',
                        value: trafficData.device_breakdown.tablet,
                        icon: Tablet,
                      },
                    ]}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, percent }) =>
                      `${name} ${((percent || 0) * 100).toFixed(0)}%`
                    }
                  >
                    {[
                      {
                        name: 'Desktop',
                        value: trafficData.device_breakdown.desktop,
                        icon: Monitor,
                      },
                      {
                        name: 'Mobile',
                        value: trafficData.device_breakdown.mobile,
                        icon: Smartphone,
                      },
                      {
                        name: 'Tablet',
                        value: trafficData.device_breakdown.tablet,
                        icon: Tablet,
                      },
                    ].map((device, index) => (
                      <Cell key={device.name} fill={pieChartColors[index]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </ChartWrapper>
        </div>
      )}

      {/* Top Content & Search Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Top Posts */}
        {data?.top_posts && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-slate-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Top Performing Posts
              </h3>
              <button
                type="button"
                onClick={() => navigateToRoute('posts')}
                className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 text-sm font-medium"
              >
                View All
              </button>
            </div>
            <div className="space-y-4">
              {data.top_posts.slice(0, 5).map((post, index) => (
                <button
                  type="button"
                  key={post.id}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors cursor-pointer group"
                  onClick={() => navigateToRoute({ type: 'post', id: post.id })}
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                        index === 0
                          ? 'bg-yellow-500'
                          : index === 1
                            ? 'bg-gray-400'
                            : index === 2
                              ? 'bg-orange-600'
                              : 'bg-slate-400'
                      }`}
                    >
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 dark:text-slate-100 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                        {post.title}
                      </p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {formatNumber(post.views)} views •{' '}
                        {formatNumber(post.unique_views)} unique
                      </p>
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Search Terms */}
        {searchData?.popular_terms && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-slate-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Popular Search Terms
              </h3>
              <div className="text-sm text-slate-500 dark:text-slate-400">
                Last {selectedPeriod} days
              </div>
            </div>
            <div className="space-y-4">
              {searchData.popular_terms.slice(0, 5).map((term, _index) => (
                <div
                  key={term.query}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                      <Search className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 dark:text-slate-100">
                        {term.query}
                      </p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {formatNumber(term.count)} searches
                      </p>
                    </div>
                  </div>
                  <div
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      term.results_found
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                        : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                    }`}
                  >
                    {term.results_found ? 'Found' : 'No Results'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Referrer Sources */}
      {referrerData && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-slate-200 dark:border-gray-700 p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Traffic Sources
            </h3>
            <div className="text-sm text-slate-500 dark:text-slate-400">
              Last {selectedPeriod} days
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Referrer Types */}
            <div>
              <h4 className="text-md font-medium text-slate-700 dark:text-slate-300 mb-4">
                Source Types
              </h4>
              <div className="space-y-3">
                {Object.entries(referrerData.referrer_types).map(
                  ([type, count]) => (
                    <div
                      key={type}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 rounded-full bg-purple-500" />
                        <span className="text-slate-700 dark:text-slate-300 capitalize">
                          {type.replace('_', ' ')}
                        </span>
                      </div>
                      <span className="font-medium text-slate-900 dark:text-slate-100">
                        {formatNumber(count as number)}
                      </span>
                    </div>
                  ),
                )}
              </div>
            </div>

            {/* Top Referrers */}
            <div>
              <h4 className="text-md font-medium text-slate-700 dark:text-slate-300 mb-4">
                Top Referrers
              </h4>
              <div className="space-y-3">
                {referrerData.top_referrers.slice(0, 5).map((referrer) => (
                  <div
                    key={referrer.referrer}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-3">
                      <ExternalLink className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                      <span className="text-slate-700 dark:text-slate-300 truncate max-w-48">
                        {referrer.referrer || 'Direct'}
                      </span>
                    </div>
                    <span className="font-medium text-slate-900 dark:text-slate-100">
                      {formatNumber(referrer.visits)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div className="mt-8 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-slate-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Summary Statistics
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {formatDuration(data.content.avg_reading_time)}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Average Reading Time
            </p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {formatPercentage(data.content.content_completion_rate)}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Content Completion Rate
            </p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {data.overview.unique_visitors.toLocaleString()}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Unique Visitors
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminAnalyticsDashboard
