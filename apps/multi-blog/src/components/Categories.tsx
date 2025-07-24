import type React from 'react'
import type { AppConfig } from '../config/default'

interface CategoriesProps {
  config: AppConfig
}

export const Categories: React.FC<CategoriesProps> = ({ config }) => {
  return (
    <div className='flex flex-wrap justify-center gap-4 mb-16'>
      {config.categories.map((category, index) => (
        <button
          key={category}
          className='group px-8 py-4 bg-white/10 backdrop-blur-xl text-white rounded-2xl hover:bg-white/20 transition-all duration-300 border border-white/20 hover:border-white/40 font-semibold text-sm tracking-wide hover:scale-105 hover:shadow-xl relative overflow-hidden'
          style={{
            animationDelay: `${index * 100}ms`,
          }}>
          {/* Subtle gradient overlay on hover */}
          <div
            className='absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-300'
            style={{
              background: `linear-gradient(135deg, ${config.theme.accent}, transparent)`,
            }}
          />

          {/* Category text */}
          <span className='relative z-10 group-hover:text-white transition-colors duration-300'>
            {category}
          </span>

          {/* Hover indicator */}
          <div
            className='absolute bottom-0 left-1/2 transform -translate-x-1/2 w-0 h-0.5 group-hover:w-8 transition-all duration-300 rounded-full'
            style={{ backgroundColor: config.theme.accent }}
          />
        </button>
      ))}
    </div>
  )
}
