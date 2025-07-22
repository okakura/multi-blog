// Default configuration for the blog platform
export const defaultConfig = {
  name: 'Multi-Blog Platform',
  tagline: 'Professional Blog Management',
  theme: {
    primary: 'from-blue-600 to-purple-600',
    secondary: 'from-cyan-400 to-blue-500',
    accent: '#3b82f6',
  },
  categories: ['Technology', 'Business', 'Lifestyle', 'General'],
  logo: '📝',
}

export type AppConfig = typeof defaultConfig
