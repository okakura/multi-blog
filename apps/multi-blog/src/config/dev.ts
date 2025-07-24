// Environment variables - these will be replaced at build time by the bundler
// For browser safety, we declare them as constants that the bundler can replace
declare const REACT_APP_API_URL: string | undefined
declare const NODE_ENV: string | undefined

// Safe environment variable access
const getApiUrl = (): string => {
  // Try to get from build-time environment variable replacement
  try {
    if (typeof REACT_APP_API_URL !== 'undefined') {
      return REACT_APP_API_URL
    }
  } catch (e) {
    // Variable not defined at build time
  }

  // Default for development
  return 'http://localhost:8000'
}

const isDevelopment = (): boolean => {
  // Check browser location first
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname
    return (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname.includes('local')
    )
  }

  // Fallback to build-time environment
  try {
    if (typeof NODE_ENV !== 'undefined') {
      return NODE_ENV === 'development'
    }
  } catch (e) {
    // Variable not defined
  }

  return true // Default to development mode
}

// Configuration for development API selection
export const DEV_CONFIG = {
  // Set to false to use real backend API in development
  USE_MOCK_API: false,

  // Backend API URL - supports environment variable override
  BACKEND_URL: getApiUrl(),

  // Mock API response delay (ms)
  MOCK_DELAY: 300,

  // Debug logging
  DEBUG_API: isDevelopment(),
}

// API Configuration
export const API_CONFIG = {
  BASE_URL: DEV_CONFIG.BACKEND_URL,
  ENDPOINTS: {
    // Auth endpoints
    AUTH: {
      LOGIN: '/auth/login',
      LOGOUT: '/auth/logout',
      VERIFY: '/auth/verify',
    },
    // Admin endpoints
    ADMIN: {
      USERS: '/admin/users',
      POSTS: '/admin/posts',
      DOMAINS: '/admin/domains',
      SETTINGS: '/admin/settings',
    },
    // Analytics endpoints (separate from admin)
    ANALYTICS: {
      OVERVIEW: '/analytics/overview',
      TRAFFIC: '/analytics/traffic',
      POSTS: '/analytics/posts',
      SEARCH_TERMS: '/analytics/search-terms',
      REFERRERS: '/analytics/referrers',
      REAL_TIME: '/analytics/real-time',
      EXPORT: '/analytics/export',
    },
    // Public blog endpoints
    BLOG: {
      HOME: '/',
      POSTS: '/posts',
      POST_BY_SLUG: '/posts',
      CATEGORY: '/category',
      SEARCH: '/search',
    },
  },
}

// Helper to build full API URLs
export const buildApiUrl = (
  endpoint: string,
  params?: Record<string, string | number>
) => {
  let url = `${API_CONFIG.BASE_URL}${endpoint}`

  if (params) {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      searchParams.append(key, String(value))
    })
    url += `?${searchParams.toString()}`
  }

  return url
}

// Helper to check if we should use mock API
export const shouldUseMockApi = () => {
  return isDevelopment() && DEV_CONFIG.USE_MOCK_API
}

// Log API choice in development
if (DEV_CONFIG.DEBUG_API) {
  console.log(
    `🔧 API Mode: ${shouldUseMockApi() ? 'Mock API' : 'Real Backend'}`
  )
  if (shouldUseMockApi()) {
    console.log('📋 Mock data loaded with 5 sample users')
  }
}
