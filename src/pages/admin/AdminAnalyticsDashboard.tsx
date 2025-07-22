import {
  Activity,
  BarChart3,
  Clock,
  Eye,
  MousePointer,
  Search,
  TrendingUp,
  Users,
} from 'lucide-react'
import type React from 'react'
import { useEffect, useState } from 'react'
import { buildApiUrl } from '../../config/dev'

interface AnalyticsDashboardData {
  overview: {
    total_sessions: number
    total_page_views: number
    avg_session_duration: number
    bounce_rate: number
    unique_visitors: number
  }
  behavior: {
    top_clicked_elements: Array<{ element: string; clicks: number }>
    scroll_depth_distribution: Array<{ depth: number; percentage: number }>
    engagement_score_avg: number
  }
  search: {
    top_queries: Array<{ query: string; count: number; results_avg: number }>
    no_results_rate: number
    search_to_click_rate: number
  }
  content: {
    top_content: Array<{
      content_id: string
      title: string
      views: number
      avg_reading_time: number
      engagement_score: number
    }>
    avg_reading_time: number
    content_completion_rate: number
  }
}

const AdminAnalyticsDashboard: React.FC = () => {
  const [data, setData] = useState<AnalyticsDashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('7d')

  useEffect(() => {
    fetchAnalyticsData()
  }, [timeRange])

  const fetchAnalyticsData = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(
        `${buildApiUrl('/analytics/dashboard')}?range=${timeRange}`
      )
      if (response.ok) {
        const analyticsData = await response.json()
        setData(analyticsData)
      }
    } catch (error) {
      console.error('Failed to fetch analytics data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading analytics...</p>
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

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}m ${remainingSeconds}s`
  }

  const formatPercentage = (value: number) => `${Math.round(value * 100)}%`

  return (
    <div className="p-6 max-w-7xl mx-auto bg-slate-50 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-gray-100 mb-2">
            Analytics Dashboard
          </h1>
          <p className="text-slate-600 dark:text-gray-400">
            Comprehensive insights into user behavior and content performance
          </p>
        </div>
        
        {/* Time Range Selector */}
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">Time range:</span>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as '24h' | '7d' | '30d')}
            className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
          >
            <option value="24h">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
          </select>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-slate-200 dark:border-gray-700 p-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Sessions</p>
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
              <p className="text-sm text-gray-600 dark:text-gray-400">Page Views</p>
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
              <p className="text-sm text-gray-600 dark:text-gray-400">Avg. Duration</p>
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
              <p className="text-sm text-gray-600 dark:text-gray-400">Bounce Rate</p>
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
              <p className="text-sm text-gray-600 dark:text-gray-400">Engagement</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {Math.round(data.behavior.engagement_score_avg)}
              </p>
            </div>
          </div>
        </div>
      </div>

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
              {data.behavior.top_clicked_elements.slice(0, 5).map((item, index) => (
                <div key={index} className="flex items-center justify-between">
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
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-slate-200 dark:border-gray-700 p-6">
            <div className="flex items-center space-x-2 mb-4">
              <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Scroll Depth Distribution
              </h3>
            </div>
            <div className="space-y-3">
              {data.behavior.scroll_depth_distribution.map((item, index) => (
                <div key={index} className="flex items-center space-x-3">
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
                  <p className="text-xs text-gray-600 dark:text-gray-400">No Results</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {formatPercentage(data.search.search_to_click_rate)}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Click Rate</p>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                  Top Search Queries
                </h4>
                <div className="space-y-2">
                  {data.search.top_queries.slice(0, 5).map((query, index) => (
                    <div key={index} className="flex items-center justify-between">
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
              {data.content.top_content.slice(0, 5).map((content, index) => (
                <div key={index} className="border border-gray-100 dark:border-gray-700 rounded-lg p-3">
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
            <p className="text-sm text-gray-600 dark:text-gray-400">Average Reading Time</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {formatPercentage(data.content.content_completion_rate)}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Content Completion Rate</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {data.overview.unique_visitors.toLocaleString()}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Unique Visitors</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminAnalyticsDashboard
