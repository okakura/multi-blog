import { Search } from 'lucide-react'
import type React from 'react'
import type { AppConfig } from '../config/default'
import { useTheme } from '../contexts/ThemeContext'

interface HeroSectionProps {
  config: AppConfig
  searchTerm: string
  onSearchChange: (term: string) => void
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  config,
  searchTerm,
  onSearchChange,
}) => {
  const { theme } = useTheme()

  return (
    <div className='text-center mb-20 py-12'>
      {/* Main heading with better typography */}
      <div className='mb-8'>
        <h2 className='text-5xl md:text-7xl lg:text-8xl font-black text-white mb-6 leading-tight tracking-tight drop-shadow-2xl'>
          {config.tagline}
        </h2>
        <p className='text-xl md:text-2xl text-white/80 mb-4 font-light max-w-3xl mx-auto leading-relaxed'>
          Discover insights, stories, and ideas that matter
        </p>
        <div
          className='w-24 h-1 rounded-full mx-auto mb-12'
          style={{ backgroundColor: theme.accent }}
        />
      </div>

      {/* Enhanced Search Bar */}
      <div className='max-w-2xl mx-auto relative group'>
        <div className='absolute inset-0 bg-gradient-to-r from-white/20 to-white/10 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-500' />
        <div className='relative'>
          <Search className='absolute left-6 top-1/2 transform -translate-y-1/2 text-gray-400 w-6 h-6 z-10' />
          <input
            type='text'
            placeholder='Search articles, authors, topics...'
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className='w-full pl-16 pr-8 py-6 bg-white/95 backdrop-blur-xl rounded-3xl border border-white/30 focus:outline-none focus:ring-4 focus:ring-white/20 focus:border-white/50 transition-all duration-300 text-lg font-medium placeholder-gray-400 shadow-2xl hover:shadow-3xl'
            style={{
              boxShadow:
                '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1)',
            }}
          />
          {/* Search button indicator */}
          <div className='absolute right-4 top-1/2 transform -translate-y-1/2'>
            <div
              className='w-10 h-10 rounded-2xl flex items-center justify-center text-white font-semibold shadow-lg'
              style={{ backgroundColor: theme.accent }}>
              <Search className='w-5 h-5' />
            </div>
          </div>
        </div>
      </div>

      {/* Subtle animation hint */}
      <p className='text-white/50 text-sm mt-6 font-medium tracking-wide'>
        Press Enter to search • Browse categories below
      </p>
    </div>
  )
}
