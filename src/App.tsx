import React from 'react'
import { Toaster } from 'react-hot-toast'
import { Route, Routes, useNavigate, useParams } from 'react-router-dom'
import './App.css'
import {
  Categories,
  ErrorMessage,
  Header,
  HeroSection,
  LoadingSpinner,
  PostCard,
} from './components'
import DomainDebugInfo from './components/DomainDebugInfo'
import { PreferencesWrapper } from './components/PreferencesWrapper'
import ProtectedRoute from './components/ProtectedRoute'
import { AuthProvider } from './contexts/AuthContext'
import { useDomain } from './contexts/DomainContext'
import { useBlogData } from './hooks/useBlogPosts'
import AdminDomains from './pages/admin/AdminDomains'
import AdminSettings from './pages/admin/AdminSettings'

import AdminLayout from './components/admin/AdminLayout'
import BlogPostPage from './pages/BlogPostPage'
import Portfolio from './pages/Portfolio'
import AdminAnalytics from './pages/admin/AdminAnalytics'
import AdminCreatePostPage from './pages/admin/AdminCreatePostPage'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminEditPost from './pages/admin/AdminEditPost'
import AdminPosts from './pages/admin/AdminPosts'
import AdminUsers from './pages/admin/AdminUsers'
import UserProfile from './pages/admin/UserProfile'

// BlogDomain: main blog grid for a domain
const BlogDomain = () => {
  const navigate = useNavigate()
  const { domain } = useParams()
  const { currentDomain, config, setDomain, updateFromRoute } = useDomain()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false)
  const {
    filteredPosts,
    searchTerm,
    setSearchTerm,
    isLoading: loading,
    error,
  } = useBlogData(currentDomain)

  // Update domain context with route parameter
  React.useEffect(() => {
    updateFromRoute(domain)
  }, [domain, updateFromRoute])

  const handleDomainChange = (newDomain: string) => {
    setDomain(newDomain as any) // Type assertion for now
    navigate(`/blog/${newDomain}`)
  }

  return (
    <div
      className={`min-h-screen bg-gradient-to-br ${config.theme.primary} relative overflow-hidden`}
    >
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-tl from-black/20 via-transparent to-white/10" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
      <div className="relative z-10">
        <Header
          config={config}
          currentDomain={currentDomain}
          onDomainChange={handleDomainChange}
          onWriteClick={() => navigate(`/blog/${currentDomain}/write`)}
          isMobileMenuOpen={isMobileMenuOpen}
          onMobileMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        />
        <main className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-12">
          <HeroSection
            config={config}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
          />
          <Categories config={config} />

          {/* Loading State */}
          {loading && (
            <div className="flex justify-center py-20">
              <div className="text-center">
                <LoadingSpinner size="lg" className="mb-4" />
                <p className="text-white/80">Loading posts...</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <ErrorMessage
              message={error}
              onRetry={() => window.location.reload()}
              className="py-20"
            />
          )}

          {/* Blog Posts Grid */}
          {!loading && !error && (
            <div className="grid gap-10 md:grid-cols-2 xl:grid-cols-3 mb-20">
              {filteredPosts.map((post, index) => (
                <div
                  key={post.id}
                  style={{ animationDelay: `${index * 150}ms` }}
                  className="animate-fade-in-up"
                >
                  <PostCard
                    post={post}
                    config={config}
                    onClick={() =>
                      navigate(`/blog/${currentDomain}/post/${post.slug}`)
                    }
                  />
                </div>
              ))}
            </div>
          )}

          {/* Enhanced Empty State */}
          {!loading && !error && filteredPosts.length === 0 && (
            <div className="text-center py-20">
              <div className="text-8xl mb-8 opacity-60">📝</div>
              <h3 className="text-3xl font-bold text-white mb-4">
                No posts found
              </h3>
              <p className="text-xl text-white/70 mb-8 max-w-md mx-auto leading-relaxed">
                {searchTerm
                  ? `No articles match "${searchTerm}". Try a different search term.`
                  : 'Be the first to share your thoughts with the world!'}
              </p>
              {!searchTerm && (
                <button
                  type="button"
                  onClick={() => navigate(`/blog/${currentDomain}/write`)}
                  className={`bg-gradient-to-r ${config.theme.secondary} text-white px-8 py-4 rounded-2xl font-semibold hover:shadow-2xl transition-all duration-300 hover:scale-105`}
                >
                  Write the First Post
                </button>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Debug info in development */}
      {process.env.NODE_ENV === 'development' && <DomainDebugInfo />}
    </div>
  )
}

// Admin wrapper component
const AdminApp = () => {
  return (
    <ProtectedRoute requiredRole="admin">
      <PreferencesWrapper>
        <AdminLayout>
          <Routes>
            <Route path="/" element={<AdminDashboard />} />
            <Route path="/posts" element={<AdminPosts />} />
            <Route path="/posts/new" element={<AdminCreatePostPage />} />
            <Route path="/posts/:id/edit" element={<AdminEditPost />} />
            <Route path="/profile" element={<UserProfile />} />
            <Route path="/analytics" element={<AdminAnalytics />} />
            <Route path="/domains" element={<AdminDomains />} />
            <Route path="/users" element={<AdminUsers />} />
            <Route path="/settings" element={<AdminSettings />} />
          </Routes>
        </AdminLayout>
      </PreferencesWrapper>
    </ProtectedRoute>
  )
}

// Main router
const BlogPlatform = () => {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Portfolio />} />
        <Route path="/blog/:domain" element={<BlogDomain />} />
        <Route path="/blog/:domain/post/:slug" element={<BlogPostPage />} />
        <Route path="/admin/*" element={<AdminApp />} />
      </Routes>

      {/* Toast notifications */}
      <Toaster
        position="top-right"
        reverseOrder={false}
        gutter={8}
        containerClassName=""
        containerStyle={{}}
        toastOptions={{
          // Define default options
          className: '',
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
            borderRadius: '8px',
            padding: '12px 16px',
            fontSize: '14px',
            fontWeight: '500',
            boxShadow:
              '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          },
          // Default options for specific types
          success: {
            style: {
              background: '#10b981',
              color: '#ffffff',
            },
            iconTheme: {
              primary: '#ffffff',
              secondary: '#10b981',
            },
            duration: 3000,
          },
          error: {
            style: {
              background: '#ef4444',
              color: '#ffffff',
            },
            iconTheme: {
              primary: '#ffffff',
              secondary: '#ef4444',
            },
            duration: 5000,
          },
          loading: {
            style: {
              background: '#6366f1',
              color: '#ffffff',
            },
            iconTheme: {
              primary: '#ffffff',
              secondary: '#6366f1',
            },
          },
        }}
      />
    </AuthProvider>
  )
}

export default BlogPlatform
