import React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Categories,
  ErrorMessage,
  Header,
  HeroSection,
  LoadingSpinner,
  PostCard,
} from '../components'
import { AnalyticsSearch } from '../components/search/AnalyticsSearch'
import { ThemeProvider } from '../contexts/ThemeContext'
import { useThemedUtils } from '../components/ThemedComponents'
import { useAnalytics } from '../hooks/useAnalytics'
import { useBlogData } from '../hooks/useBlogPosts'
import { useDomainTheme } from '../hooks/useDomainTheme'
import { defaultConfig } from '../config/default'

// Wrapper component that provides domain-specific theming
const BlogDomainWithTheme: React.FC<{
  domain: string
  children: React.ReactNode
}> = ({ domain, children }) => {
  const { domainTheme } = useDomainTheme(domain)

  return (
    <ThemeProvider domainTheme={domainTheme || undefined}>
      {children}
    </ThemeProvider>
  )
}

// Main blog content component that uses theme context
const BlogContent: React.FC<{
  domain: string
  filteredPosts: any[]
  searchTerm: string
  setSearchTerm: (term: string) => void
  loading: boolean
  error: any
  isMobileMenuOpen: boolean
  setIsMobileMenuOpen: (open: boolean) => void
  onDomainChange: (domain: string) => void
  navigate: any
}> = ({
  domain,
  filteredPosts,
  searchTerm,
  setSearchTerm,
  loading,
  error,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
  onDomainChange,
  navigate,
}) => {
  const { getColorClass } = useThemedUtils()

  // Get the primary theme class (handles both gradients and solid colors)
  const primaryBgClass = getColorClass('primary', 'bg')

  return (
    <div
      className={`min-h-screen bg-gradient-to-br ${primaryBgClass} relative overflow-hidden`}>
      {/* Background decoration */}
      <div className='absolute inset-0 bg-gradient-to-tl from-black/20 via-transparent to-white/10' />
      <div className='absolute top-0 left-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl' />
      <div className='absolute bottom-0 right-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl' />
      <div className='relative z-10'>
        <Header
          config={defaultConfig}
          currentDomain={domain}
          onDomainChange={onDomainChange}
          onWriteClick={() => navigate(`/blog/${domain}/write`)}
          isMobileMenuOpen={isMobileMenuOpen}
          onMobileMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        />
        <main className='max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-12'>
          <HeroSection
            config={defaultConfig}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
          />
          
          {/* Enhanced Analytics Search */}
          <div className="mb-8">
            <AnalyticsSearch
              domain={domain || 'default'}
              onResults={(results) => {
                // Handle search results if needed
                console.log('Search results:', results.length)
              }}
              placeholder="Search posts with analytics tracking..."
              className="max-w-2xl mx-auto"
            />
          </div>
          
          <Categories config={defaultConfig} />

          {/* Loading State */}
          {loading && (
            <div className='flex justify-center py-20'>
              <div className='text-center'>
                <LoadingSpinner size='lg' className='mb-4' />
                <p className='text-white/80'>Loading posts...</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <ErrorMessage
              message={error}
              onRetry={() => window.location.reload()}
              className='py-20'
            />
          )}

          {/* Blog Posts Grid */}
          {!loading && !error && (
            <div className='grid gap-10 md:grid-cols-2 xl:grid-cols-3 mb-20'>
              {filteredPosts.map((post, index) => (
                <div
                  key={post.id}
                  style={{ animationDelay: `${index * 150}ms` }}
                  className='animate-fade-in-up'>
                  <PostCard
                    post={post}
                    config={defaultConfig}
                    onClick={() =>
                      navigate(`/blog/${domain || 'default'}/post/${post.slug}`)
                    }
                  />
                </div>
              ))}
            </div>
          )}

          {/* Enhanced Empty State */}
          {!loading && !error && filteredPosts.length === 0 && (
            <div className='text-center py-20'>
              <div className='text-8xl mb-8 opacity-60'>📝</div>
              <h3 className='text-3xl font-bold text-white mb-4'>
                No posts found
              </h3>
              <p className='text-xl text-white/70 mb-8 max-w-md mx-auto leading-relaxed'>
                {searchTerm
                  ? `No articles match "${searchTerm}". Try a different search term.`
                  : 'Be the first to share your thoughts with the world!'}
              </p>
              {!searchTerm && (
                <button
                  type='button'
                  onClick={() => navigate(`/blog/${domain || 'default'}/write`)}
                  className={`bg-gradient-to-r ${getColorClass(
                    'secondary',
                    'bg'
                  )} text-white px-8 py-4 rounded-2xl font-semibold hover:shadow-2xl transition-all duration-300 hover:scale-105`}>
                  Write the First Post
                </button>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

// Main blog domain page component
const BlogDomainPage = () => {
  const navigate = useNavigate()
  const { domain } = useParams()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false)
  const {
    filteredPosts,
    searchTerm,
    setSearchTerm,
    isLoading: loading,
    error,
  } = useBlogData(domain || 'default')

  // Set up analytics tracking for this domain page
  useAnalytics({
    trackContent: true,
    contentId: `domain-${domain || 'default'}`,
    contentType: 'page',
    contentTitle: `${defaultConfig.name} - ${domain || 'default'}`,
  })

  const handleDomainChange = (newDomain: string) => {
    navigate(`/blog/${newDomain}`)
  }

  return (
    <BlogDomainWithTheme domain={domain || 'default'}>
      <BlogContent
        domain={domain || 'default'}
        filteredPosts={filteredPosts}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        loading={loading}
        error={error}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        onDomainChange={handleDomainChange}
        navigate={navigate}
      />
    </BlogDomainWithTheme>
  )
}

export default BlogDomainPage
