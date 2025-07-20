import React from 'react'
import { Calendar } from 'lucide-react'
import { Modal } from './Modal'
import type { Post, DomainConfig } from '../types'

interface PostModalProps {
  post: Post | null
  config: DomainConfig
  onClose: () => void
}

export const PostModal: React.FC<PostModalProps> = ({
  post,
  config,
  onClose,
}) => {
  return (
    <Modal isOpen={!!post} onClose={onClose}>
      {post && (
        <article className='p-12 max-w-4xl mx-auto'>
          {/* Enhanced header */}
          <div className='flex items-start gap-6 mb-10 pb-8 border-b border-gray-100'>
            <div
              className='w-16 h-16 rounded-3xl flex items-center justify-center text-white font-bold text-xl shadow-xl flex-shrink-0'
              style={{
                background: `linear-gradient(135deg, ${config.theme.accent}, ${config.theme.accent}CC)`,
              }}>
              {post.author.charAt(0)}
            </div>
            <div className='flex-1'>
              <div className='flex items-center justify-between mb-2'>
                <h3 className='font-bold text-gray-900 text-lg'>
                  {post.author}
                </h3>
                <span
                  className='px-4 py-2 rounded-2xl text-sm font-semibold shadow-sm'
                  style={{
                    background: `linear-gradient(135deg, ${config.theme.accent}15, ${config.theme.accent}25)`,
                    color: config.theme.accent,
                    border: `1px solid ${config.theme.accent}30`,
                  }}>
                  {post.category}
                </span>
              </div>
              <div className='flex items-center gap-3 text-gray-500 text-sm'>
                <Calendar className='w-4 h-4' />
                <span>
                  {new Date(post.date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
                <span className='w-1 h-1 bg-gray-400 rounded-full' />
                <span>{post.readTime}</span>
              </div>
            </div>
          </div>

          {/* Enhanced title */}
          <h1 className='text-4xl md:text-5xl font-black mb-8 text-gray-900 leading-tight'>
            {post.title}
          </h1>

          {/* Enhanced content */}
          <div className='prose prose-xl max-w-none'>
            <p
              className='text-2xl text-gray-600 mb-12 font-light leading-relaxed border-l-4 pl-8 italic'
              style={{ borderColor: config.theme.accent }}>
              {post.excerpt}
            </p>
            <div className='text-gray-700 leading-relaxed text-lg space-y-6'>
              {post.content.split('\n').map(
                (paragraph, index) =>
                  paragraph.trim() && (
                    <p key={index} className='mb-6 leading-loose'>
                      {paragraph}
                    </p>
                  )
              )}
            </div>
          </div>

          {/* Reading progress indicator */}
          <div className='mt-12 pt-8 border-t border-gray-100'>
            <div className='flex items-center justify-between text-sm text-gray-500'>
              <span>Thanks for reading!</span>
              <div className='flex items-center gap-2'>
                <div
                  className='w-2 h-2 rounded-full'
                  style={{ backgroundColor: config.theme.accent }}
                />
                <span>End of article</span>
              </div>
            </div>
          </div>
        </article>
      )}
    </Modal>
  )
}
