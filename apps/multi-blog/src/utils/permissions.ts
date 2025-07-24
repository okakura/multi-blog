// Utility functions for user permission management
import type { User } from '../types'

// Helper to get a human-readable permission summary
export const getPermissionSummary = (user: User): string => {
  if (user.role === 'platform_admin') {
    return 'Platform Admin (Full Access)'
  }

  if (!user.domain_permissions || user.domain_permissions.length === 0) {
    return 'No domain access'
  }

  const adminCount = user.domain_permissions.filter(
    (p) => p.role === 'admin',
  ).length
  const editorCount = user.domain_permissions.filter(
    (p) => p.role === 'editor',
  ).length
  const viewerCount = user.domain_permissions.filter(
    (p) => p.role === 'viewer',
  ).length

  const parts: string[] = []
  if (adminCount > 0) parts.push(`Admin on ${adminCount}`)
  if (editorCount > 0) parts.push(`Editor on ${editorCount}`)
  if (viewerCount > 0) parts.push(`Viewer on ${viewerCount}`)

  return parts.length > 0 ? parts.join(', ') : 'No active permissions'
}

// Helper to get permission badge color
export const getPermissionBadgeColor = (role: string): string => {
  switch (role) {
    case 'platform_admin':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
    case 'admin':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
    case 'editor':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
    case 'viewer':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
    case 'none':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
  }
}

// Helper to get role display name
export const getRoleDisplayName = (role: string): string => {
  switch (role) {
    case 'platform_admin':
      return 'Platform Admin'
    case 'admin':
      return 'Admin'
    case 'editor':
      return 'Editor'
    case 'viewer':
      return 'Viewer'
    case 'none':
      return 'No Access'
    default:
      return role
  }
}

// Helper to check if user has any permissions
export const hasAnyPermissions = (user: User): boolean => {
  if (user.role === 'platform_admin') return true
  return user.domain_permissions.some((p) => p.role !== 'none')
}

// Helper to get highest permission level across all domains
export const getHighestPermissionLevel = (user: User): string => {
  if (user.role === 'platform_admin') return 'platform_admin'

  const permissions = user.domain_permissions
  if (permissions.some((p) => p.role === 'admin')) return 'admin'
  if (permissions.some((p) => p.role === 'editor')) return 'editor'
  if (permissions.some((p) => p.role === 'viewer')) return 'viewer'

  return 'none'
}
