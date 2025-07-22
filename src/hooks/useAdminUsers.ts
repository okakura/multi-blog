// Hook for managing admin users with SWR and API integration
import { useState } from 'react'
import useSWR from 'swr'
import { shouldUseMockApi } from '../config/dev'
import { adminApiService } from '../services/adminApi'
import { mockAdminApi } from '../services/mockAdminApi'
import { performanceMetrics } from '../services/performanceMetrics'
import type {
  CreateUserRequest,
  UpdateUserRequest,
  User,
  UsersResponse,
} from '../types'

// Use mock API in development until backend middleware is fixed
const API_SERVICE = shouldUseMockApi() ? mockAdminApi : adminApiService

// Cache key creators
const createUserCacheKey = {
  users: (page: number, limit: number) => `admin-users-${page}-${limit}`,
  user: (id: number) => `admin-user-${id}`,
  all: () => 'admin-users-all',
}

export const useAdminUsers = (page = 1, limit = 20) => {
  const [isCreating, setIsCreating] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Fetch users with SWR
  const {
    data: usersResponse,
    error,
    isLoading,
    mutate,
  } = useSWR<UsersResponse>(
    createUserCacheKey.users(page, limit),
    async () => {
      const startTime = performance.now()
      try {
        const response = await API_SERVICE.getUsers(page, limit)
        const duration = performance.now() - startTime

        performanceMetrics.trackApiCall(
          'admin_users_api',
          duration,
          '/admin/users',
          'GET',
          200,
          { page, limit, userCount: response.users.length }
        )

        return response
      } catch (error) {
        const duration = performance.now() - startTime
        performanceMetrics.trackError(
          'admin_users_api',
          error instanceof Error ? error.message : 'Users fetch failed',
          { page, limit, duration }
        )
        throw error
      }
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      refreshInterval: 300000, // Reduce from 30 seconds to 5 minutes
    }
  )

  // Create user with optimistic updates
  const createUser = async (userData: CreateUserRequest) => {
    if (isCreating) return null

    setIsCreating(true)
    const startTime = performance.now()

    try {
      const newUser = await API_SERVICE.createUser(userData)
      const duration = performance.now() - startTime

      // Invalidate cache to refetch users
      await mutate()

      performanceMetrics.trackApiCall(
        'admin_users_api',
        duration,
        '/admin/users',
        'POST',
        201,
        { email: userData.email, role: userData.role }
      )

      return newUser
    } catch (error) {
      const duration = performance.now() - startTime
      performanceMetrics.trackError(
        'admin_users_api',
        error instanceof Error ? error.message : 'User creation failed',
        { email: userData.email, duration }
      )
      throw error
    } finally {
      setIsCreating(false)
    }
  }

  // Update user with optimistic updates
  const updateUser = async (id: number, userData: UpdateUserRequest) => {
    if (isUpdating) return null

    setIsUpdating(true)
    const startTime = performance.now()

    try {
      // Optimistic update
      if (usersResponse) {
        const optimisticData = {
          ...usersResponse,
          users: usersResponse.users.map((user) =>
            user.id === id ? { ...user, ...userData } : user
          ),
        }
        await mutate(optimisticData, false)
      }

      const updatedUser = await API_SERVICE.updateUser(id, userData)
      const duration = performance.now() - startTime

      // Revalidate to get server state
      await mutate()

      performanceMetrics.trackApiCall(
        'admin_users_api',
        duration,
        `/admin/users/${id}`,
        'PUT',
        200,
        { userId: id, updatedFields: Object.keys(userData) }
      )

      return updatedUser
    } catch (error) {
      const duration = performance.now() - startTime
      performanceMetrics.trackError(
        'admin_users_api',
        error instanceof Error ? error.message : 'User update failed',
        { userId: id, duration }
      )

      // Revert optimistic update on error
      await mutate()
      throw error
    } finally {
      setIsUpdating(false)
    }
  }

  // Delete user with optimistic updates
  const deleteUser = async (id: number) => {
    if (isDeleting) return false

    setIsDeleting(true)
    const startTime = performance.now()

    try {
      // Optimistic update
      if (usersResponse) {
        const optimisticData = {
          ...usersResponse,
          users: usersResponse.users.filter((user) => user.id !== id),
          total: usersResponse.total - 1,
        }
        await mutate(optimisticData, false)
      }

      await API_SERVICE.deleteUser(id)
      const duration = performance.now() - startTime

      // Revalidate to get server state
      await mutate()

      performanceMetrics.trackApiCall(
        'admin_users_api',
        duration,
        `/admin/users/${id}`,
        'DELETE',
        204,
        { userId: id }
      )

      return true
    } catch (error) {
      const duration = performance.now() - startTime
      performanceMetrics.trackError(
        'admin_users_api',
        error instanceof Error ? error.message : 'User deletion failed',
        { userId: id, duration }
      )

      // Revert optimistic update on error
      await mutate()
      throw error
    } finally {
      setIsDeleting(false)
    }
  }

  // Refresh users data
  const refresh = () => mutate()

  return {
    users: usersResponse?.users || [],
    total: usersResponse?.total || 0,
    page: usersResponse?.page || page,
    perPage: usersResponse?.per_page || limit,
    isLoading,
    error,
    createUser,
    updateUser,
    deleteUser,
    refresh,
    isCreating,
    isUpdating,
    isDeleting,
  }
}

// Hook for single user
export const useAdminUser = (id: number) => {
  const {
    data: user,
    error,
    isLoading,
    mutate,
  } = useSWR<User>(
    id ? createUserCacheKey.user(id) : null,
    async () => {
      const startTime = performance.now()
      try {
        const userData = await API_SERVICE.getUser(id)
        const duration = performance.now() - startTime

        performanceMetrics.trackApiCall(
          'admin_users_api',
          duration,
          `/admin/users/${id}`,
          'GET',
          200,
          { userId: id }
        )

        return userData
      } catch (error) {
        const duration = performance.now() - startTime
        performanceMetrics.trackError(
          'admin_users_api',
          error instanceof Error ? error.message : 'User fetch failed',
          { userId: id, duration }
        )
        throw error
      }
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  )

  return {
    user,
    isLoading,
    error,
    refresh: mutate,
  }
}
