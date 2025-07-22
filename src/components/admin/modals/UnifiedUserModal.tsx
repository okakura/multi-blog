import {
  Ban,
  Check,
  ChevronDown,
  ChevronUp,
  Eye,
  Globe,
  Info,
  Lock,
  Mail,
  Save,
  Shield,
  User as UserIcon,
  X,
} from 'lucide-react'
import type React from 'react'
import { useEffect, useState } from 'react'
import { mockAdminApi } from '../../../services/mockAdminApi'
import type {
  CreateUserRequest,
  Domain,
  DomainPermission,
  UpdateUserRequest,
  User,
} from '../../../types'
import {
  getPermissionBadgeColor,
  getRoleDisplayName,
} from '../../../utils/permissions'

interface UnifiedUserModalProps {
  mode: 'create' | 'edit'
  user?: User | null
  isOpen: boolean
  onClose: () => void
  onSave: (
    userData: CreateUserRequest | UpdateUserRequest,
    userId?: number,
  ) => Promise<void>
}

const UnifiedUserModal: React.FC<UnifiedUserModalProps> = ({
  mode,
  user,
  isOpen,
  onClose,
  onSave,
}) => {
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'domain_user' as 'platform_admin' | 'domain_user',
  })

  // Permission state
  const [domains, setDomains] = useState<Domain[]>([])
  const [permissions, setPermissions] = useState<
    Record<number, 'admin' | 'editor' | 'viewer' | 'none'>
  >({})

  // UI state
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [permissionsSectionExpanded, setPermissionsSectionExpanded] =
    useState(true)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Load data when modal opens
  useEffect(() => {
    if (isOpen) {
      loadData()
    }
  }, [isOpen, user])

  const loadData = async () => {
    try {
      setIsLoading(true)

      // Load domains
      const domainsData = await mockAdminApi.getDomains()
      setDomains(domainsData)

      // Initialize form data
      if (mode === 'edit' && user) {
        setFormData({
          name: user.name,
          email: user.email,
          password: '', // Don't pre-fill password for security
          role: user.role,
        })

        // Initialize permissions
        const currentPermissions: Record<
          number,
          'admin' | 'editor' | 'viewer' | 'none'
        > = {}
        domainsData.forEach((domain) => {
          currentPermissions[domain.id] = 'none'
        })

        if (user.domain_permissions) {
          user.domain_permissions.forEach((permission) => {
            currentPermissions[permission.domain_id] = permission.role
          })
        }

        setPermissions(currentPermissions)
      } else {
        // Create mode - initialize with defaults
        setFormData({
          name: '',
          email: '',
          password: '',
          role: 'domain_user',
        })

        const defaultPermissions: Record<
          number,
          'admin' | 'editor' | 'viewer' | 'none'
        > = {}
        domainsData.forEach((domain) => {
          defaultPermissions[domain.id] = 'none'
        })
        setPermissions(defaultPermissions)
      }

      setErrors({})
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: '',
      }))
    }
  }

  const handleRoleChange = (role: 'platform_admin' | 'domain_user') => {
    setFormData((prev) => ({
      ...prev,
      role,
    }))

    // Auto-expand permissions section when switching to domain_user
    if (role === 'domain_user') {
      setPermissionsSectionExpanded(true)
    }
  }

  const handlePermissionChange = (
    domainId: number,
    role: 'admin' | 'editor' | 'viewer' | 'none',
  ) => {
    setPermissions((prev) => ({
      ...prev,
      [domainId]: role,
    }))
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Invalid email format'
    }

    if (mode === 'create' && !formData.password.trim()) {
      newErrors.password = 'Password is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async () => {
    if (!validateForm()) return

    try {
      setIsSaving(true)

      const userData: CreateUserRequest | UpdateUserRequest = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
      }

      // Add password for create mode
      if (mode === 'create') {
        ;(userData as CreateUserRequest).password = formData.password
      } else if (formData.password.trim()) {
        // Only include password in edit if it's provided
        ;(userData as UpdateUserRequest).password = formData.password
      }

      // Add domain permissions if user is domain_user
      if (formData.role === 'domain_user') {
        const permissionsList: Omit<DomainPermission, 'domain_name'>[] =
          Object.entries(permissions).map(([domainId, role]) => ({
            domain_id: Number.parseInt(domainId),
            role,
          }))
        userData.domain_permissions = permissionsList
      }

      await onSave(userData, mode === 'edit' ? user?.id : undefined)
      onClose()
    } catch (error) {
      console.error('Failed to save user:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Shield size={16} className="text-red-500" />
      case 'editor':
        return <UserIcon size={16} className="text-blue-500" />
      case 'viewer':
        return <Eye size={16} className="text-green-500" />
      case 'none':
        return <Ban size={16} className="text-gray-400" />
      default:
        return <Globe size={16} className="text-gray-400" />
    }
  }

  const getRoleDescription = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Full control: manage content, users, and domain settings'
      case 'editor':
        return 'Content management: create, edit, and publish posts'
      case 'viewer':
        return 'Read-only access: view content and analytics'
      case 'none':
        return 'No access to this domain'
      default:
        return ''
    }
  }

  const getPermissionSummary = () => {
    const counts = {
      admin: 0,
      editor: 0,
      viewer: 0,
      none: 0,
    }

    Object.values(permissions).forEach((role) => {
      counts[role]++
    })

    const parts: string[] = []
    if (counts.admin > 0) parts.push(`${counts.admin} Admin`)
    if (counts.editor > 0) parts.push(`${counts.editor} Editor`)
    if (counts.viewer > 0) parts.push(`${counts.viewer} Viewer`)

    return parts.length > 0 ? parts.join(', ') : 'No active permissions'
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <UserIcon className="w-6 h-6 text-blue-600" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {mode === 'create' ? 'Create User' : `Edit User: ${user?.name}`}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {mode === 'create'
                  ? 'Add a new user with role and permissions'
                  : 'Update user information and permissions'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-gray-500 dark:text-gray-400">Loading...</div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Basic Information Section */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 flex items-center space-x-2">
                  <UserIcon size={16} />
                  <span>Basic Information</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        handleInputChange('name', e.target.value)
                      }
                      className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.name
                          ? 'border-red-500'
                          : 'border-gray-300 dark:border-gray-600'
                      }`}
                      placeholder="Enter full name"
                    />
                    {errors.name && (
                      <p className="text-red-500 text-xs mt-1">{errors.name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail
                        size={16}
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                      />
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) =>
                          handleInputChange('email', e.target.value)
                        }
                        className={`w-full pl-10 pr-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          errors.email
                            ? 'border-red-500'
                            : 'border-gray-300 dark:border-gray-600'
                        }`}
                        placeholder="Enter email address"
                      />
                    </div>
                    {errors.email && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.email}
                      </p>
                    )}
                  </div>
                </div>

                <div className="md:w-1/2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {mode === 'create'
                      ? 'Password'
                      : 'New Password (leave blank to keep current)'}
                  </label>
                  <div className="relative">
                    <Lock
                      size={16}
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    />
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) =>
                        handleInputChange('password', e.target.value)
                      }
                      className={`w-full pl-10 pr-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.password
                          ? 'border-red-500'
                          : 'border-gray-300 dark:border-gray-600'
                      }`}
                      placeholder={
                        mode === 'create'
                          ? 'Enter password'
                          : 'Enter new password'
                      }
                    />
                  </div>
                  {errors.password && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.password}
                    </p>
                  )}
                </div>
              </div>

              {/* Account Type Section */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 flex items-center space-x-2">
                  <Shield size={16} />
                  <span>Account Type</span>
                </h4>

                <div className="space-y-3">
                  <label
                    className={`block p-4 border rounded-lg cursor-pointer transition-all ${
                      formData.role === 'platform_admin'
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <input
                        type="radio"
                        name="role"
                        value="platform_admin"
                        checked={formData.role === 'platform_admin'}
                        onChange={(e) =>
                          handleRoleChange(e.target.value as 'platform_admin')
                        }
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <Shield size={16} className="text-purple-600" />
                          <span className="font-medium text-gray-900 dark:text-gray-100">
                            Platform Administrator
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          Unrestricted access to all domains, users, and system
                          settings. Cannot have domain-specific permissions.
                        </p>
                      </div>
                    </div>
                  </label>

                  <label
                    className={`block p-4 border rounded-lg cursor-pointer transition-all ${
                      formData.role === 'domain_user'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <input
                        type="radio"
                        name="role"
                        value="domain_user"
                        checked={formData.role === 'domain_user'}
                        onChange={(e) =>
                          handleRoleChange(e.target.value as 'domain_user')
                        }
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <UserIcon size={16} className="text-blue-600" />
                          <span className="font-medium text-gray-900 dark:text-gray-100">
                            Domain User
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          Access controlled by domain-specific permissions.
                          Configure permissions for each domain below.
                        </p>
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Domain Permissions Section - Only show for domain users */}
              {formData.role === 'domain_user' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 flex items-center space-x-2">
                      <Globe size={16} />
                      <span>Domain Permissions</span>
                    </h4>
                    <button
                      onClick={() =>
                        setPermissionsSectionExpanded(
                          !permissionsSectionExpanded,
                        )
                      }
                      className="flex items-center space-x-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                    >
                      <span>
                        {permissionsSectionExpanded ? 'Collapse' : 'Expand'}
                      </span>
                      {permissionsSectionExpanded ? (
                        <ChevronUp size={16} />
                      ) : (
                        <ChevronDown size={16} />
                      )}
                    </button>
                  </div>

                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Info size={16} className="text-blue-600" />
                      <div>
                        <p className="text-sm text-blue-800 dark:text-blue-300">
                          <strong>Current permissions:</strong>{' '}
                          {getPermissionSummary()}
                        </p>
                        <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                          Set the access level for each domain. Hover over
                          permission types for detailed descriptions.
                        </p>
                      </div>
                    </div>
                  </div>

                  {permissionsSectionExpanded && (
                    <div className="space-y-4">
                      {domains.map((domain) => (
                        <div
                          key={domain.id}
                          className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <h5 className="font-medium text-gray-900 dark:text-gray-100">
                                {domain.name}
                              </h5>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {domain.url}
                              </p>
                              {domain.description && (
                                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                  {domain.description}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center space-x-2">
                              {getRoleIcon(permissions[domain.id] || 'none')}
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-medium ${getPermissionBadgeColor(
                                  permissions[domain.id] || 'none',
                                )}`}
                              >
                                {getRoleDisplayName(
                                  permissions[domain.id] || 'none',
                                )}
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-4 gap-2">
                            {(
                              ['none', 'viewer', 'editor', 'admin'] as const
                            ).map((role) => (
                              <label
                                key={role}
                                title={getRoleDescription(role)}
                                className={`relative flex items-center justify-center p-3 border rounded-lg cursor-pointer transition-all ${
                                  permissions[domain.id] === role
                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                }`}
                              >
                                <input
                                  type="radio"
                                  name={`domain-${domain.id}`}
                                  value={role}
                                  checked={permissions[domain.id] === role}
                                  onChange={() =>
                                    handlePermissionChange(domain.id, role)
                                  }
                                  className="sr-only"
                                />
                                <div className="text-center">
                                  <div className="flex justify-center mb-1">
                                    {getRoleIcon(role)}
                                  </div>
                                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                    {getRoleDisplayName(role)}
                                  </span>
                                </div>
                                {permissions[domain.id] === role && (
                                  <Check
                                    size={16}
                                    className="absolute top-1 right-1 text-blue-500"
                                  />
                                )}
                              </label>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
          <div className="text-xs text-gray-600 dark:text-gray-400">
            {mode === 'create'
              ? 'User will receive login credentials and can access assigned domains immediately.'
              : 'Changes will be applied immediately and user will see updated permissions on next login.'}
          </div>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || isLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>{mode === 'create' ? 'Creating...' : 'Saving...'}</span>
                </>
              ) : (
                <>
                  <Save size={16} />
                  <span>
                    {mode === 'create' ? 'Create User' : 'Save Changes'}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UnifiedUserModal
