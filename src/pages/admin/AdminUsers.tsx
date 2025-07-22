import {
  Activity,
  AlertCircle,
  Calendar,
  CheckCircle,
  Crown,
  Edit,
  Filter,
  Mail,
  Plus,
  Search,
  Trash2,
  Users,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import DeleteUserModal from '../../components/admin/modals/DeleteUserModal'
import UnifiedUserModal from '../../components/admin/modals/UnifiedUserModal'
import { useAdminUsers } from '../../hooks/useAdminUsers'
import type { CreateUserRequest, UpdateUserRequest, User } from '../../types'
import {
  getPermissionBadgeColor,
  getRoleDisplayName,
} from '../../utils/permissions'
import { showToast } from '../../utils/toast'

// Helper function to format date
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export default function AdminUsers() {
  const { users, isLoading, error, createUser, updateUser, deleteUser } =
    useAdminUsers()

  // State for modals and interactions
  const [showUserModal, setShowUserModal] = useState(false)
  const [userModalMode, setUserModalMode] = useState<'create' | 'edit'>(
    'create',
  )
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [userToDelete, setUserToDelete] = useState<User | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // State for filtering and search
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')

  // Filter users based on search term and role filter
  const filteredUsers = useMemo(() => {
    if (!users) return []

    let filtered = users.filter(
      (user) =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()),
    )

    if (roleFilter !== 'all') {
      filtered = filtered.filter((user) => user.role === roleFilter)
    }

    return filtered
  }, [users, searchTerm, roleFilter])

  // Handle create user
  const handleCreateUser = async (userData: CreateUserRequest) => {
    try {
      await createUser(userData)
      setShowUserModal(false)
      showToast.success('User created successfully! 🎉')
    } catch (error) {
      console.error('Failed to create user:', error)
      showToast.error('Failed to create user')
    }
  }

  // Handle update user
  const handleUpdateUser = async (
    userId: number,
    userData: UpdateUserRequest,
  ) => {
    try {
      await updateUser(userId, userData)
      setShowUserModal(false)
      setSelectedUser(null)
      showToast.success('User updated successfully!')
    } catch (error) {
      console.error('Failed to update user:', error)
      showToast.error('Failed to update user')
    }
  }

  // Handle delete user
  const handleDeleteUser = async (user: User) => {
    setUserToDelete(user)
    setShowDeleteModal(true)
  }

  // Handle confirm delete
  const handleConfirmDelete = async () => {
    if (!userToDelete) return

    setIsDeleting(true)
    try {
      await deleteUser(userToDelete.id)
      setShowDeleteModal(false)
      setUserToDelete(null)
      showToast.success('User deleted successfully')
    } catch (error) {
      console.error('Failed to delete user:', error)
      showToast.error('Failed to delete user')
    } finally {
      setIsDeleting(false)
    }
  }

  // Handle cancel delete
  const handleCancelDelete = () => {
    setShowDeleteModal(false)
    setUserToDelete(null)
    setIsDeleting(false)
  }

  // Handle unified save from modal
  const handleUnifiedSave = async (
    userData: CreateUserRequest | UpdateUserRequest,
    userId?: number,
  ) => {
    if (userModalMode === 'create') {
      await handleCreateUser(userData as CreateUserRequest)
    } else if (selectedUser && userId) {
      await handleUpdateUser(userId, userData as UpdateUserRequest)
    }
  }

  // Open create modal
  const openCreateModal = () => {
    setUserModalMode('create')
    setSelectedUser(null)
    setShowUserModal(true)
  }

  // Open edit modal
  const openEditModal = (user: User) => {
    setUserModalMode('edit')
    setSelectedUser(user)
    setShowUserModal(true)
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'platform_admin':
        return <Crown className="w-4 h-4 text-amber-500 dark:text-amber-400" />
      case 'domain_user':
        return <Users className="w-4 h-4 text-blue-500 dark:text-blue-400" />
      default:
        return <Users className="w-4 h-4 text-slate-500 dark:text-slate-400" />
    }
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded-lg w-48" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-24 bg-slate-200 dark:bg-slate-700 rounded-lg"
              />
            ))}
          </div>
          <div className="h-96 bg-slate-200 dark:bg-slate-700 rounded-lg" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 dark:text-red-400 flex-shrink-0" />
          <div>
            <h3 className="font-medium text-red-900 dark:text-red-200">
              Error loading users
            </h3>
            <p className="text-red-700 dark:text-red-300 text-sm mt-1">
              {error}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            User Management
          </h1>
          <p className="text-slate-600 dark:text-slate-300 mt-1">
            Manage platform administrators and domain users
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add User
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                Total Users
              </p>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {users?.length || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
              <Crown className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                Platform Admins
              </p>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {users?.filter((u) => u.role === 'platform_admin').length || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                Domain Users
              </p>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {users?.filter((u) => u.role === 'domain_user').length || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
              <Activity className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                Total Users
              </p>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {users?.length || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-slate-500 w-4 h-4" />
            <input
              type="text"
              placeholder="Search users by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-slate-500 w-4 h-4" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="pl-10 pr-8 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
            >
              <option value="all">All Roles</option>
              <option value="platform_admin">Platform Admins</option>
              <option value="domain_user">Domain Users</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="text-left py-3 px-4 font-medium text-slate-900 dark:text-slate-100">
                  User
                </th>
                <th className="text-left py-3 px-4 font-medium text-slate-900 dark:text-slate-100">
                  Role
                </th>
                <th className="text-left py-3 px-4 font-medium text-slate-900 dark:text-slate-100">
                  Permissions
                </th>
                <th className="text-left py-3 px-4 font-medium text-slate-900 dark:text-slate-100">
                  Status
                </th>
                <th className="text-left py-3 px-4 font-medium text-slate-900 dark:text-slate-100">
                  Created
                </th>
                <th className="text-left py-3 px-4 font-medium text-slate-900 dark:text-slate-100">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="text-center py-8 text-slate-500 dark:text-slate-400"
                  >
                    {searchTerm || roleFilter !== 'all'
                      ? 'No users found matching your criteria'
                      : 'No users found'}
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-700/50"
                  >
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-slate-200 dark:bg-slate-600 rounded-full flex items-center justify-center">
                          <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                            {user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium text-slate-900 dark:text-slate-100">
                            {user.name}
                          </div>
                          <div className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        {getRoleIcon(user.role)}
                        <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                          {getRoleDisplayName(user.role)}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex flex-wrap gap-1">
                        {user.role === 'platform_admin' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 text-xs font-medium rounded-full">
                            <Crown className="w-3 h-3" />
                            All Access
                          </span>
                        ) : (
                          user.domain_permissions?.slice(0, 2).map((perm) => (
                            <span
                              key={perm.domain_id}
                              className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${getPermissionBadgeColor(
                                perm.role,
                              )}`}
                            >
                              {perm.domain_name}: {perm.role}
                            </span>
                          ))
                        )}
                        {user.role === 'domain_user' &&
                          user.domain_permissions &&
                          user.domain_permissions.length > 2 && (
                            <span className="inline-flex items-center px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-medium rounded-full">
                              +{user.domain_permissions.length - 2} more
                            </span>
                          )}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                        <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                          Active
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400">
                        <Calendar className="w-3 h-3" />
                        {formatDate(user.created_at)}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEditModal(user)}
                          className="inline-flex items-center gap-1 px-2 py-1 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors text-sm"
                        >
                          <Edit className="w-3 h-3" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user)}
                          className="inline-flex items-center gap-1 px-2 py-1 text-slate-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors text-sm"
                        >
                          <Trash2 className="w-3 h-3" />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Unified User Modal */}
      {showUserModal && (
        <UnifiedUserModal
          isOpen={showUserModal}
          onClose={() => {
            setShowUserModal(false)
            setSelectedUser(null)
          }}
          onSave={handleUnifiedSave}
          mode={userModalMode}
          user={selectedUser}
        />
      )}

      {/* Delete User Modal */}
      {showDeleteModal && userToDelete && (
        <DeleteUserModal
          user={userToDelete}
          onClose={handleCancelDelete}
          onConfirm={handleConfirmDelete}
          isLoading={isDeleting}
        />
      )}
    </div>
  )
}
