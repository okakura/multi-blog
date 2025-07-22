import { ArrowLeft, Calendar, Clock, Share2, Tag, User } from 'lucide-react'
import React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ErrorMessage, LoadingSpinner } from '../components'
import { useDomain } from '../contexts/DomainContext'
import { useBlogPost } from '../hooks/useBlogPosts'
import { blogToast } from '../utils/toast'

const BlogPostPage: React.FC = () => {
  const navigate = useNavigate()
  const { domain, slug } = useParams<{ domain: string; slug: string }>()
  const { currentDomain, config, updateFromRoute } = useDomain()

  // Update domain context with route parameter
  React.useEffect(() => {
    updateFromRoute(domain)
  }, [domain, updateFromRoute])

  const { post, isLoading, error } = useBlogPost(currentDomain, slug || '')

  // Show error toast when post fails to load
  React.useEffect(() => {
    if (error) {
      blogToast.loadError()
    }
  }, [error])

  if (isLoading) {
    return (
      <div
        className={`min-h-screen bg-gradient-to-br ${config.theme.primary} relative overflow-hidden`}
      >
        <div className="absolute inset-0 bg-gradient-to-tl from-black/20 via-transparent to-white/10" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl" />

        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <LoadingSpinner size="lg" className="mb-4" />
            <p className="text-white/80 text-lg">Loading post...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div
        className={`min-h-screen bg-gradient-to-br ${config.theme.primary} relative overflow-hidden`}
      >
        <div className="absolute inset-0 bg-gradient-to-tl from-black/20 via-transparent to-white/10" />
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="max-w-md mx-auto px-6">
            <ErrorMessage
              message={error || 'Failed to load post'}
              className="bg-white/95 backdrop-blur-md rounded-2xl p-6"
            />
            <button
              onClick={() => navigate(`/blog/${currentDomain}`)}
              className="mt-4 w-full flex items-center justify-center gap-2 bg-white/20 backdrop-blur-md text-white px-4 py-2 rounded-lg hover:bg-white/30 transition-colors"
            >
              <ArrowLeft size={16} />
              Back to Blog
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!post) {
    return (
      <div
        className={`min-h-screen bg-gradient-to-br ${config.theme.primary} relative overflow-hidden`}
      >
        <div className="absolute inset-0 bg-gradient-to-tl from-black/20 via-transparent to-white/10" />
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="text-center text-white">
            <h1 className="text-2xl font-bold mb-4">Post Not Found</h1>
            <p className="text-white/80 mb-6">
              The post you're looking for doesn't exist.
            </p>
            <button
              onClick={() => navigate(`/blog/${currentDomain}`)}
              className="flex items-center gap-2 bg-white/20 backdrop-blur-md text-white px-4 py-2 rounded-lg hover:bg-white/30 transition-colors mx-auto"
            >
              <ArrowLeft size={16} />
              Back to Blog
            </button>
          </div>
        </div>
      </div>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const estimateReadTime = (content: string) => {
    const wordsPerMinute = 200
    // Strip HTML tags for accurate word count
    const tmp = document.createElement('div')
    tmp.innerHTML = content
    const plainText = tmp.textContent || tmp.innerText || ''
    const wordCount = plainText
      .split(/\s+/)
      .filter((word) => word.length > 0).length
    return Math.ceil(wordCount / wordsPerMinute)
  }

  const sharePost = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: post.title,
          text: `Check out this post: ${post.title}`,
          url: window.location.href,
        })
        blogToast.linkCopied()
      } catch (error) {
        // User cancelled sharing or error occurred
        if ((error as Error).name !== 'AbortError') {
          console.error('Error sharing:', error)
          blogToast.linkCopied()
        }
      }
    } else {
      // Fallback to copying URL to clipboard
      try {
        await navigator.clipboard.writeText(window.location.href)
        blogToast.linkCopied()
      } catch (error) {
        console.error('Failed to copy to clipboard:', error)
        // Fallback for older browsers
        const textArea = document.createElement('textarea')
        textArea.value = window.location.href
        document.body.appendChild(textArea)
        textArea.select()
        document.execCommand('copy')
        document.body.removeChild(textArea)
        blogToast.linkCopied()
      }
    }
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
        {/* Header with back navigation */}
        <header className="bg-white/10 backdrop-blur-md border-b border-white/20">
          <div className="max-w-4xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => navigate(`/blog/${currentDomain}`)}
                className="flex items-center gap-2 text-white/80 hover:text-white transition-colors"
              >
                <ArrowLeft size={20} />
                <span className="font-medium">{config.name}</span>
              </button>

              <button
                onClick={sharePost}
                className="flex items-center gap-2 bg-white/20 backdrop-blur-md text-white px-4 py-2 rounded-lg hover:bg-white/30 transition-colors"
              >
                <Share2 size={16} />
                <span className="hidden sm:inline">Share</span>
              </button>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="max-w-4xl mx-auto px-6 py-12">
          <article className="bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl overflow-hidden">
            {/* Article header */}
            <header className="p-8 pb-6 border-b border-gray-100">
              {/* Category badge */}
              <div className="mb-4">
                <span
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium text-white"
                  style={{
                    background: `linear-gradient(135deg, ${config.theme.accent}, ${config.theme.accent}CC)`,
                  }}
                >
                  <Tag size={12} />
                  {post.category}
                </span>
              </div>

              {/* Title */}
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
                {post.title}
              </h1>

              {/* Meta information */}
              <div className="flex flex-wrap items-center gap-6 text-gray-600">
                <div className="flex items-center gap-2">
                  <User size={16} />
                  <span className="font-medium">{post.author}</span>
                </div>

                <div className="flex items-center gap-2">
                  <Calendar size={16} />
                  <span>{formatDate(post.created_at)}</span>
                </div>

                <div className="flex items-center gap-2">
                  <Clock size={16} />
                  <span>{estimateReadTime(post.content)} min read</span>
                </div>
              </div>
            </header>

            {/* Article content */}
            <div className="p-8">
              <div
                className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-strong:text-gray-900 prose-a:text-blue-600 hover:prose-a:text-blue-800"
                dangerouslySetInnerHTML={{
                  __html: post.content,
                }}
              />
            </div>
          </article>

          {/* Back to blog button */}
          <div className="mt-8 text-center">
            <button
              onClick={() => navigate(`/blog/${currentDomain}`)}
              className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md text-white px-6 py-3 rounded-lg hover:bg-white/30 transition-colors font-medium"
            >
              <ArrowLeft size={16} />
              Back to {config.name}
            </button>
          </div>
        </main>
      </div>
    </div>
  )
}

export default BlogPostPage
