// src/services/authService.ts
import { API_CONFIG, buildApiUrl } from '../config/dev'

export interface LoginCredentials {
  email: string
  password: string
}

export interface User {
  id: number
  email: string
  name: string
  role: 'platform_admin' | 'domain_user'
  domain_permissions?: Array<{
    domain_id: number
    domain_name?: string
    role: 'admin' | 'editor' | 'viewer' | 'none'
  }>
}

export interface LoginResponse {
  user: User
  token: string
}

class AuthService {
  private token: string | null = null
  private currentUserPromise: Promise<User | null> | null = null
  private lastCurrentUserFetch: number = 0
  private readonly CACHE_DURATION = 10000 // 10 seconds

  constructor() {
    // Load token from localStorage on initialization
    this.token = localStorage.getItem('auth_token')
  }

  async login(
    credentials: LoginCredentials
  ): Promise<{ user: User; token: string }> {
    try {
      const response = await fetch(
        buildApiUrl(API_CONFIG.ENDPOINTS.AUTH.LOGIN),
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(credentials),
        }
      )

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Invalid email or password')
        }
        throw new Error('Login failed')
      }

      const data: LoginResponse = await response.json()

      // Store token
      this.token = data.token
      localStorage.setItem('auth_token', data.token)

      return data
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error('Login failed')
    }
  }

  async logout(): Promise<void> {
    try {
      if (this.token) {
        await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.AUTH.LOGOUT), {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.token}`,
          },
        })
      }
    } catch (error) {
      console.error('Logout request failed:', error)
    } finally {
      // Always clear token locally
      this.token = null
      localStorage.removeItem('auth_token')
    }
  }

  async getCurrentUser(): Promise<User | null> {
    if (!this.token) {
      return null
    }

    // Check if we have a recent cached result or pending request
    const now = Date.now()
    if (
      this.currentUserPromise &&
      now - this.lastCurrentUserFetch < this.CACHE_DURATION
    ) {
      return this.currentUserPromise
    }

    // Create new request and cache it
    this.lastCurrentUserFetch = now
    this.currentUserPromise = this.fetchCurrentUser()

    return this.currentUserPromise
  }

  private async fetchCurrentUser(): Promise<User | null> {
    if (!this.token) {
      return null
    }

    try {
      const response = await fetch(
        buildApiUrl(API_CONFIG.ENDPOINTS.AUTH.VERIFY),
        {
          headers: {
            Authorization: `Bearer ${this.token}`,
          },
        }
      )

      if (!response.ok) {
        // Token is invalid, clear it
        this.token = null
        localStorage.removeItem('auth_token')
        this.currentUserPromise = null
        return null
      }

      const user: User = await response.json()
      return user
    } catch (error) {
      console.error('Failed to verify token:', error)
      // On error, clear token and cache
      this.token = null
      localStorage.removeItem('auth_token')
      this.currentUserPromise = null
      return null
    }
  }

  getToken(): string | null {
    return this.token
  }

  isAuthenticated(): boolean {
    return this.token !== null
  }
}

export const authService = new AuthService()
