import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Globe,
  Plus,
  Edit,
  Trash2,
  Activity,
  Users,
  FileText,
  Eye,
  Search,
  MoreHorizontal,
  ArrowLeft,
  Calendar,
  ExternalLink,
  AlertTriangle,
  Loader2,
  XCircle,
} from 'lucide-react'
import { useAdminDomains } from '../../hooks/useAdminPosts'
import { showToast } from '../../utils/toast'
import type {
  Domain,
  CreateDomainRequest,
  UpdateDomainRequest,
} from '../../services/adminApi'

interface DomainModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: any) => Promise<void>
  domain?: Domain
  isLoading: boolean
}

const DomainModal: React.FC<DomainModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  domain,
  isLoading,
}) => {
  const [formData, setFormData] = useState({
    hostname: domain?.hostname || '',
    name: domain?.name || '',
    categories: domain?.categories
      ? Array.isArray(domain.categories)
        ? domain.categories
        : []
      : [],
    theme_config: domain?.theme_config || {},
  })

  const [newCategory, setNewCategory] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await onSubmit(formData)
      onClose()
    } catch (error) {
      // Error handling is done in the parent component
    }
  }

  const addCategory = () => {
    if (
      newCategory.trim() &&
      !formData.categories.includes(newCategory.trim())
    ) {
      setFormData({
        ...formData,
        categories: [...formData.categories, newCategory.trim()],
      })
      setNewCategory('')
    }
  }

  const removeCategory = (index: number) => {
    setFormData({
      ...formData,
      categories: formData.categories.filter((_, i) => i !== index),
    })
  }

  if (!isOpen) return null

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
      <div className='bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto'>
        <div className='p-6 border-b border-slate-200 dark:border-gray-700'>
          <h2 className='text-xl font-semibold text-slate-900 dark:text-gray-100'>
            {domain ? 'Edit Domain' : 'Create New Domain'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className='p-6 space-y-6'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div>
              <label className='block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2'>
                Hostname *
              </label>
              <input
                type='text'
                value={formData.hostname}
                onChange={(e) =>
                  setFormData({ ...formData, hostname: e.target.value })
                }
                placeholder='e.g., tech.blog'
                className='w-full border border-slate-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-slate-900 dark:text-gray-100'
                required
              />
              <p className='text-xs text-slate-500 dark:text-gray-400 mt-1'>
                The domain hostname (e.g., tech.localhost, myblog.com)
              </p>
            </div>

            <div>
              <label className='block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2'>
                Display Name *
              </label>
              <input
                type='text'
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder='e.g., Tech Insights'
                className='w-full border border-slate-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-slate-900 dark:text-gray-100'
                required
              />
              <p className='text-xs text-slate-500 dark:text-gray-400 mt-1'>
                The friendly name shown to users
              </p>
            </div>
          </div>

          <div>
            <label className='block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2'>
              Categories
            </label>
            <div className='space-y-3'>
              <div className='flex space-x-2'>
                <input
                  type='text'
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  onKeyPress={(e) =>
                    e.key === 'Enter' && (e.preventDefault(), addCategory())
                  }
                  placeholder='Add a category'
                  className='flex-1 border border-slate-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-slate-900 dark:text-gray-100'
                />
                <button
                  type='button'
                  onClick={addCategory}
                  className='px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors'>
                  Add
                </button>
              </div>

              {formData.categories.length > 0 && (
                <div className='flex flex-wrap gap-2'>
                  {formData.categories.map((category, index) => (
                    <span
                      key={index}
                      className='inline-flex items-center space-x-1 bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-300 px-3 py-1 rounded-full text-sm'>
                      <span>{category}</span>
                      <button
                        type='button'
                        onClick={() => removeCategory(index)}
                        className='text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-200 ml-1'>
                        <XCircle size={14} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className='flex justify-end space-x-3 pt-4 border-t border-slate-200 dark:border-gray-700'>
            <button
              type='button'
              onClick={onClose}
              className='px-4 py-2 text-slate-600 dark:text-gray-400 border border-slate-300 dark:border-gray-600 rounded-lg hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors'
              disabled={isLoading}>
              Cancel
            </button>
            <button
              type='submit'
              disabled={isLoading}
              className='px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2'>
              {isLoading && <Loader2 size={16} className='animate-spin' />}
              <span>{domain ? 'Update Domain' : 'Create Domain'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const AdminDomains: React.FC = () => {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingDomain, setEditingDomain] = useState<Domain | undefined>()
  const [deletingDomain, setDeletingDomain] = useState<number | null>(null)
  const [showMoreActions, setShowMoreActions] = useState<number | null>(null)

  const {
    domains,
    isLoading,
    isCreating,
    isUpdating,
    isDeleting,
    error,
    createDomain,
    updateDomain,
    deleteDomain,
    refresh,
  } = useAdminDomains()

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = () => {
      if (showMoreActions !== null) {
        setShowMoreActions(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showMoreActions])

  const filteredDomains = domains.filter(
    (domain) =>
      domain.hostname.toLowerCase().includes(searchTerm.toLowerCase()) ||
      domain.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleCreateDomain = async (data: CreateDomainRequest) => {
    try {
      await createDomain(data)
      showToast.success(`Domain "${data.name}" created successfully! 🌐`)
      setShowModal(false)
    } catch (error) {
      showToast.error(
        error instanceof Error ? error.message : 'Failed to create domain'
      )
      throw error
    }
  }

  const handleUpdateDomain = async (data: UpdateDomainRequest) => {
    if (!editingDomain) return

    try {
      await updateDomain(editingDomain.id, data)
      showToast.success(
        `Domain "${data.name || editingDomain.name}" updated successfully! ✅`
      )
      setShowModal(false)
      setEditingDomain(undefined)
    } catch (error) {
      showToast.error(
        error instanceof Error ? error.message : 'Failed to update domain'
      )
      throw error
    }
  }

  const handleDeleteDomain = async (domain: Domain) => {
    if (
      !confirm(
        `Are you sure you want to delete "${domain.name}"? This action cannot be undone.`
      )
    ) {
      return
    }

    setDeletingDomain(domain.id)

    try {
      await deleteDomain(domain.id)
      showToast.success(`Domain "${domain.name}" deleted successfully! 🗑️`)
    } catch (error) {
      if (error instanceof Error && error.message.includes('existing posts')) {
        showToast.error(
          'Cannot delete domain with existing posts. Delete all posts first.'
        )
      } else {
        showToast.error(
          error instanceof Error ? error.message : 'Failed to delete domain'
        )
      }
    } finally {
      setDeletingDomain(null)
    }
  }

  const openCreateModal = () => {
    setEditingDomain(undefined)
    setShowModal(true)
  }

  const openEditModal = (domain: Domain) => {
    setEditingDomain(domain)
    setShowModal(true)
  }

  const getStatusColor = (domain: Domain) => {
    if ((domain.posts_count || 0) > 0) {
      return 'bg-green-100 text-green-800'
    }
    return 'bg-yellow-100 text-yellow-800'
  }

  const getStatusText = (domain: Domain) => {
    if ((domain.posts_count || 0) > 0) {
      return 'Active'
    }
    return 'Inactive'
  }

  if (error) {
    return (
      <div className='p-6 max-w-7xl mx-auto'>
        <div className='bg-red-50 border border-red-200 rounded-lg p-4'>
          <div className='flex items-center space-x-2 text-red-800'>
            <AlertTriangle size={20} />
            <span className='font-medium'>Error loading domains</span>
          </div>
          <p className='text-red-700 mt-1'>{error}</p>
          <button
            onClick={() => refresh()}
            className='mt-3 px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors'>
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className='p-6 max-w-7xl mx-auto bg-slate-50 dark:bg-gray-900 min-h-screen transition-colors'>
      {/* Header */}
      <div className='flex items-center justify-between mb-8'>
        <div className='flex items-center space-x-4'>
          <button
            onClick={() => navigate('/admin')}
            className='flex items-center space-x-2 text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-gray-200 transition-colors'>
            <ArrowLeft size={20} />
            <span className='font-medium'>Back to Dashboard</span>
          </button>
          <div className='w-px h-6 bg-slate-300 dark:bg-gray-600' />
          <div>
            <h1 className='text-3xl font-bold text-slate-900 dark:text-gray-100 mb-2'>
              Domains
            </h1>
            <p className='text-slate-600 dark:text-gray-400'>
              Manage your blog domains and their configurations
            </p>
          </div>
        </div>
        <button
          onClick={openCreateModal}
          className='flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-colors'>
          <Plus size={16} />
          <span>New Domain</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className='bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-slate-200 dark:border-gray-700 p-4 mb-6'>
        <div className='flex items-center space-x-4'>
          <div className='flex-1 relative'>
            <Search
              className='absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-gray-500'
              size={16}
            />
            <input
              type='text'
              placeholder='Search domains...'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className='w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-slate-900 dark:text-gray-100 placeholder-slate-500 dark:placeholder-gray-400'
            />
          </div>
          <button
            onClick={() => refresh()}
            className='flex items-center space-x-2 px-4 py-2 bg-slate-100 dark:bg-gray-700 text-slate-700 dark:text-gray-300 rounded-lg hover:bg-slate-200 dark:hover:bg-gray-600 transition-colors'>
            <Activity size={16} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Domains Grid */}
      {isLoading ? (
        <div className='flex items-center justify-center py-12'>
          <div className='text-center'>
            <Loader2
              size={32}
              className='animate-spin text-purple-600 mx-auto mb-4'
            />
            <p className='text-slate-600 dark:text-gray-400'>
              Loading domains...
            </p>
          </div>
        </div>
      ) : filteredDomains.length === 0 ? (
        <div className='bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-slate-200 dark:border-gray-700 p-12 text-center'>
          <Globe className='w-16 h-16 text-slate-300 dark:text-gray-600 mx-auto mb-4' />
          <h3 className='text-lg font-medium text-slate-900 dark:text-gray-100 mb-2'>
            {searchTerm ? 'No domains found' : 'No domains yet'}
          </h3>
          <p className='text-slate-600 dark:text-gray-400 mb-6'>
            {searchTerm
              ? 'Try adjusting your search terms'
              : 'Create your first domain to get started with multi-blog management'}
          </p>
          {!searchTerm && (
            <button
              onClick={openCreateModal}
              className='bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-colors'>
              Create First Domain
            </button>
          )}
        </div>
      ) : (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          {filteredDomains.map((domain) => (
            <div
              key={domain.id}
              className='bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-slate-200 dark:border-gray-700 hover:shadow-md transition-shadow'>
              {/* Domain Header */}
              <div className='p-6 border-b border-slate-100 dark:border-gray-700'>
                <div className='flex items-start justify-between'>
                  <div className='flex-1'>
                    <div className='flex items-center space-x-3 mb-2'>
                      <div className='w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center'>
                        <Globe size={20} className='text-white' />
                      </div>
                      <div>
                        <h3 className='font-semibold text-slate-900 dark:text-gray-100'>
                          {domain.name}
                        </h3>
                        <p className='text-sm text-slate-500 dark:text-gray-400'>
                          {domain.hostname}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        domain
                      )}`}>
                      {getStatusText(domain)}
                    </span>
                  </div>

                  <div className='relative'>
                    <button
                      onClick={() =>
                        setShowMoreActions(
                          showMoreActions === domain.id ? null : domain.id
                        )
                      }
                      className='p-2 text-slate-400 dark:text-gray-500 hover:text-slate-600 dark:hover:text-gray-300 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-lg transition-colors'>
                      <MoreHorizontal size={16} />
                    </button>

                    {showMoreActions === domain.id && (
                      <div className='absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-slate-200 dark:border-gray-700 py-1 z-10'>
                        <button
                          onClick={() => {
                            openEditModal(domain)
                            setShowMoreActions(null)
                          }}
                          className='w-full px-4 py-2 text-left text-slate-700 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-700 flex items-center space-x-2'>
                          <Edit size={14} />
                          <span>Edit Domain</span>
                        </button>
                        <button
                          onClick={() =>
                            navigate(`/admin/posts?domain=${domain.hostname}`)
                          }
                          className='w-full px-4 py-2 text-left text-slate-700 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-700 flex items-center space-x-2'>
                          <FileText size={14} />
                          <span>View Posts</span>
                        </button>
                        <button
                          onClick={() => {
                            window.open(`/blog/${domain.hostname}`, '_blank')
                            setShowMoreActions(null)
                          }}
                          className='w-full px-4 py-2 text-left text-slate-700 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-700 flex items-center space-x-2'>
                          <ExternalLink size={14} />
                          <span>Visit Site</span>
                        </button>
                        <div className='border-t border-slate-100 dark:border-gray-700 my-1' />
                        <button
                          onClick={() => {
                            handleDeleteDomain(domain)
                            setShowMoreActions(null)
                          }}
                          disabled={deletingDomain === domain.id}
                          className='w-full px-4 py-2 text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center space-x-2 disabled:opacity-50'>
                          {deletingDomain === domain.id ? (
                            <Loader2 size={14} className='animate-spin' />
                          ) : (
                            <Trash2 size={14} />
                          )}
                          <span>Delete Domain</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Domain Stats */}
              <div className='p-6'>
                <div className='grid grid-cols-3 gap-4'>
                  <div className='text-center'>
                    <div className='flex items-center justify-center w-8 h-8 bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg mx-auto mb-2'>
                      <FileText size={16} />
                    </div>
                    <p className='text-sm font-medium text-slate-900 dark:text-gray-100'>
                      {domain.posts_count || 0}
                    </p>
                    <p className='text-xs text-slate-500 dark:text-gray-400'>
                      Posts
                    </p>
                  </div>
                  <div className='text-center'>
                    <div className='flex items-center justify-center w-8 h-8 bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg mx-auto mb-2'>
                      <Users size={16} />
                    </div>
                    <p className='text-sm font-medium text-slate-900 dark:text-gray-100'>
                      {domain.active_users || 0}
                    </p>
                    <p className='text-xs text-slate-500 dark:text-gray-400'>
                      Users
                    </p>
                  </div>
                  <div className='text-center'>
                    <div className='flex items-center justify-center w-8 h-8 bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-lg mx-auto mb-2'>
                      <Eye size={16} />
                    </div>
                    <p className='text-sm font-medium text-slate-900 dark:text-gray-100'>
                      {domain.monthly_views || 0}
                    </p>
                    <p className='text-xs text-slate-500 dark:text-gray-400'>
                      Views
                    </p>
                  </div>
                </div>

                {/* Categories */}
                {domain.categories &&
                  Array.isArray(domain.categories) &&
                  domain.categories.length > 0 && (
                    <div className='mt-4 pt-4 border-t border-slate-100'>
                      <p className='text-xs font-medium text-slate-700 mb-2'>
                        Categories:
                      </p>
                      <div className='flex flex-wrap gap-1'>
                        {domain.categories
                          .slice(0, 3)
                          .map((category, index) => (
                            <span
                              key={index}
                              className='inline-block bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs'>
                              {category}
                            </span>
                          ))}
                        {domain.categories.length > 3 && (
                          <span className='inline-block text-slate-400 px-2 py-1 text-xs'>
                            +{domain.categories.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                {/* Last Updated */}
                <div className='mt-4 pt-4 border-t border-slate-100'>
                  <div className='flex items-center text-xs text-slate-500'>
                    <Calendar size={12} className='mr-1' />
                    <span>
                      Updated {new Date(domain.updated_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Domain Modal */}
      <DomainModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false)
          setEditingDomain(undefined)
        }}
        onSubmit={editingDomain ? handleUpdateDomain : handleCreateDomain}
        domain={editingDomain}
        isLoading={isCreating || isUpdating}
      />
    </div>
  )
}

export default AdminDomains
