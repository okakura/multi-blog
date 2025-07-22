import { Edit, Menu } from 'lucide-react'
import type React from 'react'
import type { DomainConfig, DomainType } from '../types'

interface HeaderProps {
  config: DomainConfig
  currentDomain: DomainType
  onDomainChange: (domain: DomainType) => void
  onWriteClick: () => void
  isMobileMenuOpen: boolean
  onMobileMenuToggle: () => void
}

export const Header: React.FC<HeaderProps> = ({
  config,
  currentDomain,
  onDomainChange,
  onWriteClick,
  isMobileMenuOpen,
  onMobileMenuToggle,
}) => {
  return (
    <header className="bg-white/5 backdrop-blur-xl border-b border-white/10 sticky top-0 z-40 shadow-lg">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="flex items-center justify-between h-20">
          {/* Logo and Brand */}
          <div className="flex items-center gap-4">
            <div className="text-4xl drop-shadow-lg">{config.logo}</div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">
                {config.name}
              </h1>
              <p className="text-white/70 text-sm hidden sm:block font-medium">
                {config.tagline}
              </p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {/* Portfolio Link */}
            <a
              href="/"
              className="text-white/80 hover:text-white font-medium transition-colors duration-200 text-sm"
            >
              Portfolio
            </a>

            {/* Domain Switcher */}
            <div className="relative">
              <select
                value={currentDomain}
                onChange={(e) => onDomainChange(e.target.value as DomainType)}
                className="bg-white/15 backdrop-blur-md text-white border border-white/20 rounded-2xl px-6 py-3 text-sm font-medium hover:bg-white/20 transition-all duration-300 cursor-pointer shadow-lg appearance-none pr-10"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23ffffff' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                  backgroundPosition: 'right 12px center',
                  backgroundRepeat: 'no-repeat',
                  backgroundSize: '16px',
                }}
              >
                <option value="tech.blog" className="bg-gray-800">
                  TechInsights
                </option>
                <option value="lifestyle.blog" className="bg-gray-800">
                  LifeStyle Hub
                </option>
                <option value="business.blog" className="bg-gray-800">
                  BizWorks
                </option>
              </select>
            </div>

            {/* Write Button */}
            <button
              onClick={onWriteClick}
              className={`group bg-gradient-to-r ${config.theme.secondary} hover:shadow-2xl text-white px-8 py-3 rounded-2xl font-semibold transition-all duration-300 flex items-center gap-3 hover:scale-105 shadow-xl`}
            >
              <Edit className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" />
              <span>Create Post</span>
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={onMobileMenuToggle}
            className="md:hidden p-3 rounded-2xl text-white hover:bg-white/10 transition-colors duration-200 backdrop-blur-md"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-6 border-t border-white/10 backdrop-blur-xl">
            <div className="space-y-4">
              <a
                href="/"
                className="block w-full text-white/80 hover:text-white font-medium transition-colors duration-200 text-center py-2"
              >
                Portfolio
              </a>
              <select
                value={currentDomain}
                onChange={(e) => onDomainChange(e.target.value as DomainType)}
                className="w-full bg-white/15 text-white border border-white/20 rounded-2xl px-6 py-4 font-medium"
              >
                <option value="tech.blog" className="bg-gray-800">
                  TechInsights
                </option>
                <option value="lifestyle.blog" className="bg-gray-800">
                  LifeStyle Hub
                </option>
                <option value="business.blog" className="bg-gray-800">
                  BizWorks
                </option>
              </select>
              <button
                onClick={onWriteClick}
                className={`w-full bg-gradient-to-r ${config.theme.secondary} text-white px-6 py-4 rounded-2xl font-semibold flex items-center justify-center gap-3 shadow-xl`}
              >
                <Edit className="w-5 h-5" />
                Create Post
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
