import React, { createContext, useContext, useState, useEffect } from 'react'
import { authService } from '../services/authService'

export interface User {
  id: number
  email: string
  name: string
  role: 'admin' | 'editor' | 'viewer'
  avatar?: string
}

export interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  checkAuth: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const isAuthenticated = !!user

  // Check if user is authenticated on app load
  const checkAuth = async () => {
    try {
      setIsLoading(true)

      // Use auth service to check current user
      const userData = await authService.getCurrentUser()
      setUser(userData)
    } catch (error) {
      console.error('Auth check failed:', error)
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  // Login function
  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true)

      // Use auth service for real authentication
      const { user: userData } = await authService.login({ email, password })

      // Set user
      setUser(userData)
    } catch (error) {
      console.error('Login failed:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  // Logout function
  const logout = async () => {
    try {
      await authService.logout()
    } catch (error) {
      console.error('Logout failed:', error)
    } finally {
      setUser(null)
    }
  }

  // Check auth on mount
  useEffect(() => {
    checkAuth()
  }, [])

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    login,
    logout,
    checkAuth,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
