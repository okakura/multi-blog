import { Search, X } from 'lucide-react'
import type { FC } from 'react'
import { useEffect, useState } from 'react'
import { useBlogPosts } from '@/data/hooks/useBlogPosts'
import { useAnalytics } from '@/hooks/useAnalytics'

interface AnalyticsSearchProps {
  domain?: string
  onResults?: (results: any[]) => void
  placeholder?: string
  className?: string
}

export const AnalyticsSearch: FC<AnalyticsSearchProps> = ({
  domain = 'default',
  onResults,
  placeholder = 'Search posts...',
  className = '',
}) => {
  const [query, setQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [showResults, setShowResults] = useState(false)

  const { posts } = useBlogPosts(domain)
  const { trackSearch, trackSearchClick } = useAnalytics()

  // Debounced search effect
  useEffect(() => {
    if (!query.trim()) {
      setSearchResults([])
      setShowResults(false)
      return
    }

    setIsSearching(true)
    const timeoutId = setTimeout(() => {
      performSearch(query)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [query, posts])

  const performSearch = async (searchQuery: string) => {
    const trimmedQuery = searchQuery.trim().toLowerCase()

    if (!trimmedQuery) {
      setSearchResults([])
      setIsSearching(false)
      return
    }

    // Perform search across posts
    const results = posts
      .filter((post) => {
        return (
          post.title.toLowerCase().includes(trimmedQuery) ||
          post.category.toLowerCase().includes(trimmedQuery) ||
          post.author.toLowerCase().includes(trimmedQuery) ||
          post.slug.toLowerCase().includes(trimmedQuery)
        )
      })
      .slice(0, 10) // Limit to top 10 results

    setSearchResults(results)
    setShowResults(true)
    setIsSearching(false)

    // Track search analytics
    await trackSearch(trimmedQuery, results.length, results.length === 0)

    // Notify parent component
    if (onResults) {
      onResults(results)
    }

    console.log('🔍 Search performed:', {
      query: trimmedQuery,
      results: results.length,
      noResults: results.length === 0,
    })
  }

  const handleResultClick = (result: any, position: number) => {
    // Track search result click
    trackSearchClick(query.trim(), result.slug, position)

    console.log('📊 Search result clicked:', {
      query: query.trim(),
      result: result.title,
      position: position + 1,
    })

    // Hide results and clear search
    setShowResults(false)
    setQuery('')
  }

  const clearSearch = () => {
    setQuery('')
    setSearchResults([])
    setShowResults(false)
  }

  return (
    <div className={`relative ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.trim() && setShowResults(true)}
          placeholder={placeholder}
          className="block w-full pl-10 pr-10 py-3 border border-white/20 rounded-xl bg-white/10 backdrop-blur-md text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent transition-all"
        />
        {query && (
          <button
            onClick={clearSearch}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-white/70 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {showResults && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50 max-h-96 overflow-y-auto">
          {isSearching ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
              <span className="ml-2 text-gray-600 dark:text-gray-400">
                Searching...
              </span>
            </div>
          ) : searchResults.length > 0 ? (
            <div className="py-2">
              <div className="px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide border-b border-gray-100 dark:border-gray-700">
                {searchResults.length} result
                {searchResults.length !== 1 ? 's' : ''} found
              </div>
              {searchResults.map((result, index) => (
                <button
                  key={result.id}
                  onClick={() => handleResultClick(result, index)}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-b-0 transition-colors group"
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 group-hover:text-purple-600 dark:group-hover:text-purple-400 line-clamp-1">
                        {result.title}
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                        {result.slug.replace(/-/g, ' ')} •{' '}
                        {new Date(result.created_at).toLocaleDateString()}
                      </p>
                      <div className="flex items-center space-x-2 mt-2">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-300">
                          {result.category}
                        </span>
                        <span className="text-xs text-gray-400 dark:text-gray-500">
                          by {result.author}
                        </span>
                      </div>
                    </div>
                    <div className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">
                      #{index + 1}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : query.trim() ? (
            <div className="px-4 py-8 text-center">
              <div className="text-4xl mb-2">🔍</div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                No results found
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Try searching with different keywords
              </p>
            </div>
          ) : null}
        </div>
      )}

      {/* Click outside to close */}
      {showResults && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowResults(false)}
        />
      )}
    </div>
  )
}
