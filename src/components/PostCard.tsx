import { ArrowRight, Calendar } from 'lucide-react'
import type React from 'react'
import type { Post } from '../types'
import type { AppConfig } from '../config/default'

interface PostCardProps {
  post: Post
  config: AppConfig
  onClick: (post: Post) => void
}

export const PostCard: React.FC<PostCardProps> = ({
  post,
  config,
  onClick,
}) => (
  <article
    className='group bg-white/95 backdrop-blur-md rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-3 cursor-pointer border border-white/30 hover:border-white/50 relative overflow-hidden'
    onClick={() => onClick(post)}>
    {/* Subtle gradient overlay */}
    <div className='absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500' />

    {/* Content */}
    <div className='relative z-10'>
      {/* Author and meta info */}
      <div className='flex items-center gap-4 mb-6'>
        <div
          className='w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-lg'
          style={{
            background: `linear-gradient(135deg, ${config.theme.accent}, ${config.theme.accent}CC)`,
          }}>
          {post.author.charAt(0)}
        </div>
        <div className='flex-1'>
          <div className='font-semibold text-gray-800 text-sm'>
            {post.author}
          </div>
          <div className='flex items-center gap-2 text-gray-500 text-xs mt-1'>
            <Calendar className='w-3 h-3' />
            <span>{new Date(post.date).toLocaleDateString()}</span>
            <span className='w-1 h-1 bg-gray-400 rounded-full' />
            <span>{post.readTime}</span>
          </div>
        </div>
        <span
          className='px-3 py-1.5 rounded-xl text-xs font-semibold tracking-wide shadow-sm'
          style={{
            background: `linear-gradient(135deg, ${config.theme.accent}15, ${config.theme.accent}25)`,
            color: config.theme.accent,
            border: `1px solid ${config.theme.accent}30`,
          }}>
          {post.category}
        </span>
      </div>

      {/* Title */}
      <h3 className='text-2xl font-bold mb-4 text-gray-900 line-clamp-2 leading-tight group-hover:text-gray-700 transition-colors duration-300'>
        {post.title}
      </h3>

      {/* Excerpt */}
      <p className='text-gray-600 mb-6 line-clamp-3 leading-relaxed text-sm'>
        {post.excerpt}
      </p>

      {/* Read more */}
      <div className='flex items-center justify-between pt-4 border-t border-gray-100'>
        <div
          className='flex items-center gap-2 text-sm font-semibold group-hover:gap-3 transition-all duration-300'
          style={{ color: config.theme.accent }}>
          <span>Read Article</span>
          <ArrowRight className='w-4 h-4 group-hover:translate-x-1 transition-transform duration-300' />
        </div>
        <div
          className='w-8 h-0.5 rounded-full transition-all duration-300 group-hover:w-12'
          style={{ backgroundColor: config.theme.accent }}
        />
      </div>
    </div>
  </article>
)
