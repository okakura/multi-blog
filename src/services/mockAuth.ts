// Mock authentication service for development
// This would be replaced with real API calls in production

export interface MockUser {
  id: string
  email: string
  name: string
  role: 'admin' | 'editor' | 'viewer'
  avatar?: string
}

const MOCK_USERS: MockUser[] = [
  {
    id: '1',
    email: 'admin@multi-blog.com',
    name: 'Josh Gautier',
    role: 'admin',
  },
  {
    id: '2',
    email: 'editor@multi-blog.com',
    name: 'Jane Smith',
    role: 'editor',
  },
  {
    id: '3',
    email: 'viewer@multi-blog.com',
    name: 'John Doe',
    role: 'viewer',
  },
]

const VALID_PASSWORDS = ['admin123', 'password', 'demo123']

// Simulate API delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export const mockAuthService = {
  // Mock login
  async login(
    email: string,
    password: string,
  ): Promise<{ user: MockUser; token: string }> {
    await delay(1000) // Simulate network delay

    const user = MOCK_USERS.find((u) => u.email === email)

    if (!user || !VALID_PASSWORDS.includes(password)) {
      throw new Error('Invalid email or password')
    }

    const token = `mock_token_${user.id}_${Date.now()}`

    return { user, token }
  },

  // Mock token verification
  async verifyToken(token: string): Promise<MockUser> {
    await delay(500) // Simulate network delay

    if (!token || !token.startsWith('mock_token_')) {
      throw new Error('Invalid token')
    }

    // Extract user ID from token
    const parts = token.split('_')
    const userId = parts[2]

    const user = MOCK_USERS.find((u) => u.id === userId)

    if (!user) {
      throw new Error('User not found')
    }

    return user
  },

  // Mock logout (nothing to do for mock)
  async logout(): Promise<void> {
    await delay(300)
    // In real implementation, this would invalidate the token on the server
  },
}
