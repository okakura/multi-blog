// src/services/authService.ts
export interface LoginCredentials {
  email: string
  password: string
}

export interface User {
  id: number
  email: string
  name: string
  role: 'admin' | 'editor' | 'viewer'
}

export interface LoginResponse {
  user: User
  token: string
}

const API_BASE_URL = 'http://localhost:3000'

class AuthService {
  private token: string | null = null

  constructor() {
    // Load token from localStorage on initialization
    this.token = localStorage.getItem('auth_token')
  }

  async login(
    credentials: LoginCredentials
  ): Promise<{ user: User; token: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      })

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
        await fetch(`${API_BASE_URL}/auth/logout`, {
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

    try {
      const response = await fetch(`${API_BASE_URL}/auth/verify`, {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      })

      if (!response.ok) {
        // Token is invalid, clear it
        this.token = null
        localStorage.removeItem('auth_token')
        return null
      }

      const user: User = await response.json()
      return user
    } catch (error) {
      console.error('Failed to verify token:', error)
      // On error, clear token
      this.token = null
      localStorage.removeItem('auth_token')
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
