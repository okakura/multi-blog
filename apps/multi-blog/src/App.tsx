import { Toaster } from 'react-hot-toast'
import { Route, Routes } from 'react-router-dom'
import './App.css'
import { PreferencesWrapper } from './components/PreferencesWrapper'
import PerformanceOverlay from './components/PerformanceOverlay'
import ProtectedRoute from './components/ProtectedRoute'
import { AuthProvider } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { useSessionTracking } from './hooks/useSessionTracking'
import AdminDomains from './pages/admin/AdminDomains'
import AdminSettings from './pages/admin/AdminSettings'
import AdminLayout from './components/admin/AdminLayout'
import BlogPostPage from './pages/BlogPostPage'
import BlogDomainPage from './pages/BlogDomainPage'
import Portfolio from './pages/Portfolio'
import AdminAnalyticsDashboard from './pages/admin/AdminAnalyticsDashboard'
import AdminCreatePostPage from './pages/admin/AdminCreatePostPage'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminEditPost from './pages/admin/AdminEditPost'
import AdminPosts from './pages/admin/AdminPosts'
import AdminUsers from './pages/admin/AdminUsers'
import UserProfile from './pages/admin/UserProfile'

// Admin wrapper component
const AdminApp = () => {
  return (
    <ProtectedRoute requiredRole="admin">
      <ThemeProvider>
        <PreferencesWrapper>
          <AdminLayout>
            <Routes>
              <Route path="/" element={<AdminDashboard />} />
              <Route path="/posts" element={<AdminPosts />} />
              <Route path="/posts/new" element={<AdminCreatePostPage />} />
              <Route path="/posts/:id/edit" element={<AdminEditPost />} />
              <Route path="/profile" element={<UserProfile />} />
              <Route path="/analytics" element={<AdminAnalyticsDashboard />} />
              <Route path="/domains" element={<AdminDomains />} />
              <Route path="/users" element={<AdminUsers />} />
              <Route path="/settings" element={<AdminSettings />} />
            </Routes>
          </AdminLayout>
        </PreferencesWrapper>
      </ThemeProvider>
    </ProtectedRoute>
  )
}

// Public blog wrapper component (with analytics tracking)
const PublicBlogApp = () => {
  // Initialize session tracking for analytics (only for public blog routes)
  useSessionTracking()
  console.log('PublicBlogApp initialized - session tracking active')
  return (
    <>
      <Routes>
        <Route path="/" element={<Portfolio />} />
        <Route path="/blog/:domain" element={<BlogDomainPage />} />
        <Route path="/blog/:domain/post/:slug" element={<BlogPostPage />} />
      </Routes>

      {/* Performance overlay for blog pages */}
      <PerformanceOverlay />
    </>
  )
}

// Main router
const BlogPlatform = () => {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/admin/*" element={<AdminApp />} />
        <Route path="/*" element={<PublicBlogApp />} />
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
