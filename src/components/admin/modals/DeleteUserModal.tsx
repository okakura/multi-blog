import {
  AlertTriangle,
  Loader2,
  Mail,
  Shield,
  Trash2,
  User,
  X,
} from 'lucide-react'
import type React from 'react'
import { useEffect } from 'react'
import type { User as UserType } from '../../../types'

interface DeleteUserModalProps {
  user: UserType
  onClose: () => void
  onConfirm: () => void
  isLoading: boolean
}

const DeleteUserModal: React.FC<DeleteUserModalProps> = ({
  user,
  onClose,
  onConfirm,
  isLoading,
}) => {
  // Escape key handler
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [onClose])

  const getDomainCount = () => {
    return user.domain_permissions?.length || 0
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
      case 'user':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <Trash2 className="w-5 h-5 text-red-500" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Delete User
            </h3>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Warning */}
          <div className="flex items-start space-x-3 mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-700 dark:text-red-300">
                This action cannot be undone
              </p>
              <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                All user data, permissions, and access will be permanently
                removed.
              </p>
            </div>
          </div>

          {/* User Info */}
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center">
                <User size={20} className="text-gray-500 dark:text-gray-400" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 dark:text-white">
                  {user.name}
                </h4>
                <div className="flex items-center space-x-1 text-sm text-gray-500 dark:text-gray-400">
                  <Mail size={12} />
                  <span>{user.email}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Role:</span>
                <span
                  className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(
                    user.role,
                  )}`}
                >
                  {user.role === 'super_admin' ? 'Super Admin' : 'User'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">
                  Domain Access:
                </span>
                <span className="text-gray-900 dark:text-white">
                  {getDomainCount()} domains
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">
                  Created:
                </span>
                <span className="text-gray-900 dark:text-white">
                  {new Date(user.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {/* Confirmation Message */}
          <div className="mb-6">
            <p className="text-gray-700 dark:text-gray-300 text-sm">
              Are you sure you want to delete{' '}
              <span className="font-medium text-gray-900 dark:text-white">
                {user.name}
              </span>
              ?
            </p>
            {user.role === 'super_admin' && (
              <p className="text-sm text-orange-600 dark:text-orange-400 mt-2 flex items-center space-x-1">
                <Shield size={14} />
                <span>Warning: This user has super admin privileges</span>
              </p>
            )}
            {getDomainCount() > 0 && (
              <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
                This will also remove access to {getDomainCount()} domain
                {getDomainCount() !== 1 ? 's' : ''}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isLoading}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Deleting...</span>
                </>
              ) : (
                <>
                  <Trash2 size={16} />
                  <span>Delete User</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DeleteUserModal
