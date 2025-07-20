import React from 'react'
import { Modal } from './Modal'
import type { DomainConfig, NewPostForm } from '../types'

interface WritePostModalProps {
  isOpen: boolean
  onClose: () => void
  config: DomainConfig
  newPost: NewPostForm
  onPostChange: (post: NewPostForm) => void
  onSubmit: () => void
}

export const WritePostModal: React.FC<WritePostModalProps> = ({
  isOpen,
  onClose,
  config,
  newPost,
  onPostChange,
  onSubmit,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className='p-12'>
        {/* Enhanced header */}
        <div className='text-center mb-12'>
          <h2 className='text-4xl font-black mb-4 text-gray-900'>
            Create New Post
          </h2>
          <p className='text-lg text-gray-600 max-w-md mx-auto'>
            Share your thoughts, insights, and stories with the world
          </p>
          <div
            className='w-16 h-1 rounded-full mx-auto mt-6'
            style={{ backgroundColor: config.theme.accent }}
          />
        </div>

        <div className='space-y-8'>
          {/* Title */}
          <div>
            <label className='block text-sm font-bold text-gray-700 mb-3 tracking-wide uppercase'>
              Article Title
            </label>
            <input
              type='text'
              value={newPost.title}
              onChange={(e) =>
                onPostChange({ ...newPost, title: e.target.value })
              }
              className='w-full px-6 py-4 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-opacity-50 transition-all duration-300 text-lg font-medium placeholder-gray-400 hover:border-gray-300'
              placeholder='Enter a compelling title...'
            />
          </div>

          {/* Author and Category Row */}
          <div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
            <div>
              <label className='block text-sm font-bold text-gray-700 mb-3 tracking-wide uppercase'>
                Author
              </label>
              <input
                type='text'
                value={newPost.author}
                onChange={(e) =>
                  onPostChange({ ...newPost, author: e.target.value })
                }
                className='w-full px-6 py-4 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-opacity-50 transition-all duration-300 text-lg placeholder-gray-400 hover:border-gray-300'
                placeholder='Your name...'
              />
            </div>

            <div>
              <label className='block text-sm font-bold text-gray-700 mb-3 tracking-wide uppercase'>
                Category
              </label>
              <select
                value={newPost.category}
                onChange={(e) =>
                  onPostChange({ ...newPost, category: e.target.value })
                }
                className='w-full px-6 py-4 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-opacity-50 transition-all duration-300 text-lg hover:border-gray-300 bg-white appearance-none'
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                  backgroundPosition: 'right 20px center',
                  backgroundRepeat: 'no-repeat',
                  backgroundSize: '16px',
                }}>
                <option value=''>Select a category</option>
                {config.categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Excerpt */}
          <div>
            <label className='block text-sm font-bold text-gray-700 mb-3 tracking-wide uppercase'>
              Article Summary
            </label>
            <input
              type='text'
              value={newPost.excerpt}
              onChange={(e) =>
                onPostChange({ ...newPost, excerpt: e.target.value })
              }
              className='w-full px-6 py-4 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-opacity-50 transition-all duration-300 text-lg placeholder-gray-400 hover:border-gray-300'
              placeholder='A brief, engaging description of your article...'
            />
            <p className='text-sm text-gray-500 mt-2'>
              This will appear as a preview on the main page
            </p>
          </div>

          {/* Content */}
          <div>
            <label className='block text-sm font-bold text-gray-700 mb-3 tracking-wide uppercase'>
              Article Content
            </label>
            <textarea
              rows={16}
              value={newPost.content}
              onChange={(e) =>
                onPostChange({ ...newPost, content: e.target.value })
              }
              className='w-full px-6 py-4 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-opacity-50 transition-all duration-300 text-lg placeholder-gray-400 resize-vertical hover:border-gray-300'
              placeholder='Share your thoughts, insights, and stories...'
            />
            <p className='text-sm text-gray-500 mt-2'>
              {newPost.content.length > 0 &&
                `${Math.ceil(newPost.content.length / 200)} min read • `}
              {newPost.content.length} characters
            </p>
          </div>
        </div>

        {/* Enhanced action buttons */}
        <div className='flex gap-6 mt-12 pt-8 border-t border-gray-200'>
          <button
            onClick={onSubmit}
            disabled={
              !newPost.title ||
              !newPost.author ||
              !newPost.category ||
              !newPost.excerpt ||
              !newPost.content
            }
            className={`flex-1 bg-gradient-to-r ${config.theme.primary} text-white py-4 px-8 rounded-2xl font-bold text-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none`}>
            Publish Article
          </button>
          <button
            onClick={onClose}
            className='px-8 py-4 border-2 border-gray-300 rounded-2xl font-bold text-lg text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-colors duration-200'>
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  )
}
