import type { DomainConfig, DomainType } from '../types'

export const domainConfigs: Record<DomainType, DomainConfig> = {
  'tech.blog': {
    name: 'TechInsights',
    tagline: 'Exploring the Future of Technology',
    theme: {
      primary: 'from-blue-600 to-purple-600',
      secondary: 'from-cyan-400 to-blue-500',
      accent: '#3b82f6',
    },
    categories: ['AI', 'Web Dev', 'Mobile', 'Cloud'],
    logo: '🚀',
  },
  'lifestyle.blog': {
    name: 'LifeStyle Hub',
    tagline: 'Living Your Best Life Every Day',
    theme: {
      primary: 'from-pink-500 to-rose-500',
      secondary: 'from-orange-400 to-pink-500',
      accent: '#ec4899',
    },
    categories: ['Health', 'Travel', 'Food', 'Fashion'],
    logo: '🌟',
  },
  'business.blog': {
    name: 'BizWorks',
    tagline: 'Strategies for Modern Business',
    theme: {
      primary: 'from-green-600 to-teal-600',
      secondary: 'from-emerald-400 to-green-500',
      accent: '#059669',
    },
    categories: ['Startups', 'Marketing', 'Finance', 'Leadership'],
    logo: '📊',
  },
  default: {
    name: 'Universal Blog',
    tagline: 'Stories Worth Sharing',
    theme: {
      primary: 'from-indigo-600 to-purple-600',
      secondary: 'from-blue-400 to-indigo-500',
      accent: '#6366f1',
    },
    categories: ['General', 'Ideas', 'Stories', 'Thoughts'],
    logo: '✨',
  },
}
