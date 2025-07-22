import {
  Activity,
  BarChart,
  Bell,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Clock,
  Edit,
  Eye,
  FileText,
  Globe,
  Image,
  Layout,
  Lock,
  Mail,
  Monitor,
  Moon,
  Palette,
  Save,
  Settings,
  Shield,
  Smartphone,
  Sun,
  Timer,
  TrendingUp,
  Type,
  User,
  X,
} from 'lucide-react'
import type React from 'react'
import { useEffect, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { usePreferences } from '../../hooks/useUserPreferences'
import type { ExpandedSections } from '../../types/preferences'
import { adminToast, showToast } from '../../utils/toast'

const UserProfile: React.FC = () => {
  const { user } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [activeTab, setActiveTab] = useState<'profile' | 'preferences'>(
    'profile',
  )
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
  })

  // Default expanded sections (appearance expanded by default)
  const defaultExpandedSections: ExpandedSections = {
    appearance: true,
    content: false,
    notifications: false,
    dashboard: false,
    localization: false,
    privacy: false,
    accessibility: false,
  }

  // UI state for expanded sections (replaces Zustand store)
  const [expandedSections, setExpandedSections] = useState<ExpandedSections>(
    defaultExpandedSections,
  )

  // Load expanded sections from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('preferences-ui')
      if (saved) {
        const parsed = JSON.parse(saved)
        setExpandedSections(parsed.expandedSections || defaultExpandedSections)
      }
    } catch (error) {
      console.warn('Failed to load preferences UI state:', error)
    }
  }, [])

  // Save expanded sections to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(
        'preferences-ui',
        JSON.stringify({ expandedSections }),
      )
    } catch (error) {
      console.warn('Failed to save preferences UI state:', error)
    }
  }, [expandedSections])

  // UI Actions (replaces Zustand actions)
  const toggleSection = (section: keyof ExpandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  const expandAllSections = () => {
    setExpandedSections({
      appearance: true,
      content: true,
      notifications: true,
      dashboard: true,
      localization: true,
      privacy: true,
      accessibility: true,
    })
  }

  const collapseAllSections = () => {
    setExpandedSections(defaultExpandedSections)
  }

  // Unified preferences hook
  const {
    preferences,
    updatePreference,
    exportPreferences,
    importPreferences,
    resetAllPreferences,
  } = usePreferences()

  const handleSave = () => {
    // Validate form data
    if (!formData.name.trim()) {
      showToast.warning('Please enter a valid name')
      return
    }

    if (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email)) {
      showToast.warning('Please enter a valid email address')
      return
    }

    const toastId = adminToast.saving()

    try {
      // In a real app, this would update the user profile via API
      console.log('Saving user profile:', formData)

      // Simulate API delay
      setTimeout(() => {
        showToast.dismiss(toastId)
        adminToast.profileUpdated()
        setIsEditing(false)
      }, 1000)
    } catch (error) {
      console.error('Failed to update profile:', error)
      showToast.dismiss(toastId)
      showToast.error('Failed to update profile. Please try again.')
    }
  }

  const handleCancel = () => {
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
    })
    setIsEditing(false)
  }

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    updatePreference('appearance', 'theme', newTheme)
  }

  const handlePreferenceChange = (
    category: string,
    key: string,
    value: any,
  ) => {
    updatePreference(category as any, key as any, value)
  }

  const handleNotificationChange = (key: string, value: any) => {
    updatePreference('notifications', key as any, value)
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300'
      case 'editor':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
      case 'viewer':
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
    }
  }

  if (!user) {
    return (
      <div className="p-6">
        <div className="text-center">
          <p className="text-slate-500">No user information available</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-slate-200 dark:border-gray-700">
        {/* Header with Tabs */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-gray-700">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Account Settings
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Manage your account information and preferences
          </p>

          {/* Tab Navigation */}
          <div className="flex space-x-8 mt-6">
            <button
              onClick={() => setActiveTab('profile')}
              className={`pb-4 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'profile'
                  ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <User size={16} />
                <span>Profile</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('preferences')}
              className={`pb-4 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'preferences'
                  ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Settings size={16} />
                <span>Preferences</span>
              </div>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'profile' && (
            <div className="flex items-start space-x-6">
              {/* Avatar */}
              <div className="flex-shrink-0">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
                  <User size={32} className="text-white" />
                </div>
              </div>

              {/* User Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                      {user.name}
                    </h2>
                    <div className="flex items-center space-x-2 mt-1">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(
                          user.role,
                        )}`}
                      >
                        <Shield className="w-3 h-3 mr-1" />
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-gray-700 hover:bg-slate-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                  >
                    {isEditing ? 'Cancel' : 'Edit Profile'}
                  </button>
                </div>

                {/* Form */}
                <div className="space-y-4">
                  {/* Name Field */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Full Name
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            name: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-slate-900 dark:text-slate-100 bg-white dark:bg-gray-700"
                      />
                    ) : (
                      <div className="flex items-center space-x-2 py-2">
                        <User
                          size={16}
                          className="text-slate-400 dark:text-slate-500"
                        />
                        <span className="text-slate-900 dark:text-slate-100">
                          {user.name}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Email Field */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Email Address
                    </label>
                    {isEditing ? (
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            email: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-slate-900 dark:text-slate-100 bg-white dark:bg-gray-700"
                      />
                    ) : (
                      <div className="flex items-center space-x-2 py-2">
                        <Mail
                          size={16}
                          className="text-slate-400 dark:text-slate-500"
                        />
                        <span className="text-slate-900 dark:text-slate-100">
                          {user.email}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Role Field (Read-only) */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Role
                    </label>
                    <div className="flex items-center space-x-2 py-2">
                      <Shield
                        size={16}
                        className="text-slate-400 dark:text-slate-500"
                      />
                      <span className="text-slate-900 dark:text-slate-100">
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        (Contact admin to change role)
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  {isEditing && (
                    <div className="flex items-center space-x-3 pt-4">
                      <button
                        onClick={handleSave}
                        className="flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-colors"
                      >
                        <Save size={16} />
                        <span>Save Changes</span>
                      </button>
                      <button
                        onClick={handleCancel}
                        className="flex items-center space-x-2 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 px-4 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        <X size={16} />
                        <span>Cancel</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Preferences Tab */}
          {activeTab === 'preferences' && (
            <div className="space-y-6">
              {/* Action Buttons */}
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  Preferences
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={expandAllSections}
                    className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    Expand All
                  </button>
                  <button
                    onClick={collapseAllSections}
                    className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    Collapse All
                  </button>
                  <button
                    onClick={() => {
                      try {
                        console.log('Starting export process...')
                        const success = exportPreferences()
                        if (!success) {
                          showToast.error('Failed to export preferences')
                        }
                      } catch (error) {
                        console.error('Export error:', error)
                        showToast.error(
                          `Failed to export preferences: ${(error as Error).message}`,
                        )
                      }
                    }}
                    className="px-3 py-1 text-sm bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                  >
                    Export
                  </button>
                  <button
                    onClick={() => {
                      const input = document.createElement('input')
                      input.type = 'file'
                      input.accept = '.json'
                      input.onchange = (e) => {
                        const file = (e.target as HTMLInputElement).files?.[0]
                        if (file) {
                          const reader = new FileReader()
                          reader.onload = async (e) => {
                            try {
                              const data = e.target?.result as string
                              console.log('Importing preferences data...')
                              const success = await importPreferences(data)
                              if (success) {
                                showToast.success(
                                  'Preferences imported successfully! 📥',
                                )
                              }
                            } catch (error) {
                              console.error(
                                'Failed to import preferences:',
                                error,
                              )
                              showToast.error(
                                'Failed to import preferences - invalid file format',
                              )
                            }
                          }
                          reader.readAsText(file)
                        }
                      }
                      input.click()
                    }}
                    className="px-3 py-1 text-sm bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded hover:bg-green-200 dark:hover:bg-green-800 transition-colors"
                  >
                    Import
                  </button>
                  <button
                    onClick={() => {
                      if (
                        confirm(
                          'Are you sure you want to reset all preferences to defaults? This action cannot be undone.',
                        )
                      ) {
                        resetAllPreferences()
                      }
                    }}
                    className="px-3 py-1 text-sm bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded hover:bg-red-200 dark:hover:bg-red-800 transition-colors"
                  >
                    Reset All
                  </button>
                </div>
              </div>
              {/* Appearance & UI Section */}
              <div className="bg-slate-50 dark:bg-gray-700/50 rounded-lg">
                <button
                  onClick={() => toggleSection('appearance')}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-100 dark:hover:bg-gray-600/50 rounded-lg transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <Palette
                      size={20}
                      className="text-purple-600 dark:text-purple-400"
                    />
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                        Appearance & UI
                      </h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Customize the look and feel of your interface
                      </p>
                    </div>
                  </div>
                  {expandedSections.appearance ? (
                    <ChevronUp size={20} className="text-slate-400" />
                  ) : (
                    <ChevronDown size={20} className="text-slate-400" />
                  )}
                </button>

                {expandedSections.appearance && (
                  <div className="px-4 pb-4 space-y-4 border-t border-slate-200 dark:border-gray-600">
                    {/* Theme */}
                    <div className="pt-4">
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                        Theme
                      </label>
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { value: 'light', label: 'Light', icon: Sun },
                          { value: 'dark', label: 'Dark', icon: Moon },
                          { value: 'system', label: 'System', icon: Monitor },
                        ].map(({ value, label, icon: Icon }) => (
                          <button
                            key={value}
                            onClick={() =>
                              handleThemeChange(
                                value as 'light' | 'dark' | 'system',
                              )
                            }
                            className={`p-3 rounded-lg border-2 transition-all ${
                              preferences.appearance.theme === value
                                ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300'
                                : 'border-slate-200 dark:border-gray-600 hover:border-slate-300 dark:hover:border-gray-500 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            <div className="flex flex-col items-center space-y-2">
                              <Icon size={24} />
                              <span className="text-sm font-medium">
                                {label}
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Font Size */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          <div className="flex items-center space-x-2">
                            <Type size={16} />
                            <span>Font Size</span>
                          </div>
                        </label>
                        <select
                          value={preferences.appearance.fontSize}
                          onChange={(e) =>
                            handlePreferenceChange(
                              'appearance',
                              'fontSize',
                              e.target.value,
                            )
                          }
                          className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-slate-900 dark:text-slate-100 bg-white dark:bg-gray-700"
                        >
                          <option value="small">Small</option>
                          <option value="medium">Medium</option>
                          <option value="large">Large</option>
                          <option value="extra-large">Extra Large</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          <div className="flex items-center space-x-2">
                            <BookOpen size={16} />
                            <span>Reading Width</span>
                          </div>
                        </label>
                        <select
                          value={preferences.appearance.readingWidth}
                          onChange={(e) =>
                            handlePreferenceChange(
                              'appearance',
                              'readingWidth',
                              e.target.value,
                            )
                          }
                          className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-slate-900 dark:text-slate-100 bg-white dark:bg-gray-700"
                        >
                          <option value="narrow">Narrow</option>
                          <option value="medium">Medium</option>
                          <option value="wide">Wide</option>
                        </select>
                      </div>
                    </div>

                    {/* Toggles */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Activity size={16} className="text-slate-400" />
                          <div>
                            <label className="text-sm font-medium text-slate-900 dark:text-slate-100">
                              Animations
                            </label>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              Enable UI animations
                            </p>
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={preferences.appearance.animations}
                            onChange={(e) =>
                              handlePreferenceChange(
                                'appearance',
                                'animations',
                                e.target.checked,
                              )
                            }
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-slate-200 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600" />
                        </label>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Layout size={16} className="text-slate-400" />
                          <div>
                            <label className="text-sm font-medium text-slate-900 dark:text-slate-100">
                              Compact Mode
                            </label>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              Denser UI layout
                            </p>
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={preferences.appearance.compactMode}
                            onChange={(e) =>
                              handlePreferenceChange(
                                'appearance',
                                'compactMode',
                                e.target.checked,
                              )
                            }
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-slate-200 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600" />
                        </label>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Content & Editor Section */}
              <div className="bg-slate-50 dark:bg-gray-700/50 rounded-lg">
                <button
                  onClick={() => toggleSection('content')}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-100 dark:hover:bg-gray-600/50 rounded-lg transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <FileText
                      size={20}
                      className="text-blue-600 dark:text-blue-400"
                    />
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                        Content & Editor
                      </h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Writing and content management preferences
                      </p>
                    </div>
                  </div>
                  {expandedSections.content ? (
                    <ChevronUp size={20} className="text-slate-400" />
                  ) : (
                    <ChevronDown size={20} className="text-slate-400" />
                  )}
                </button>

                {expandedSections.content && (
                  <div className="px-4 pb-4 space-y-4 border-t border-slate-200 dark:border-gray-600">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          <div className="flex items-center space-x-2">
                            <Edit size={16} />
                            <span>Default Editor</span>
                          </div>
                        </label>
                        <select
                          value={preferences.content.defaultEditor}
                          onChange={(e) =>
                            handlePreferenceChange(
                              'content',
                              'defaultEditor',
                              e.target.value,
                            )
                          }
                          className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-slate-900 dark:text-slate-100 bg-white dark:bg-gray-700"
                        >
                          <option value="rich-text">Rich Text</option>
                          <option value="markdown">Markdown</option>
                          <option value="html">HTML</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          <div className="flex items-center space-x-2">
                            <Timer size={16} />
                            <span>Auto-save Interval</span>
                          </div>
                        </label>
                        <select
                          value={preferences.content.autoSaveInterval}
                          onChange={(e) =>
                            handlePreferenceChange(
                              'content',
                              'autoSaveInterval',
                              Number.parseInt(e.target.value),
                            )
                          }
                          className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-slate-900 dark:text-slate-100 bg-white dark:bg-gray-700"
                        >
                          <option value={30}>30 seconds</option>
                          <option value={60}>1 minute</option>
                          <option value={120}>2 minutes</option>
                          <option value={300}>5 minutes</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          <div className="flex items-center space-x-2">
                            <Layout size={16} />
                            <span>Posts Per Page</span>
                          </div>
                        </label>
                        <select
                          value={preferences.content.postsPerPage}
                          onChange={(e) =>
                            handlePreferenceChange(
                              'content',
                              'postsPerPage',
                              Number.parseInt(e.target.value),
                            )
                          }
                          className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-slate-900 dark:text-slate-100 bg-white dark:bg-gray-700"
                        >
                          <option value={5}>5 posts</option>
                          <option value={10}>10 posts</option>
                          <option value={25}>25 posts</option>
                          <option value={50}>50 posts</option>
                          <option value={100}>100 posts</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          Default Post Status
                        </label>
                        <select
                          value={preferences.content.defaultStatus}
                          onChange={(e) =>
                            handlePreferenceChange(
                              'content',
                              'defaultStatus',
                              e.target.value,
                            )
                          }
                          className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-slate-900 dark:text-slate-100 bg-white dark:bg-gray-700"
                        >
                          <option value="draft">Draft</option>
                          <option value="published">Published</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          <div className="flex items-center space-x-2">
                            <BookOpen size={16} />
                            <span>Reading Mode</span>
                          </div>
                        </label>
                        <select
                          value={preferences.content.readingMode}
                          onChange={(e) =>
                            handlePreferenceChange(
                              'content',
                              'readingMode',
                              e.target.value,
                            )
                          }
                          className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-slate-900 dark:text-slate-100 bg-white dark:bg-gray-700"
                        >
                          <option value="excerpts">Show Excerpts</option>
                          <option value="full">Full Posts</option>
                          <option value="cards">Cards Only</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          <div className="flex items-center space-x-2">
                            <Image size={16} />
                            <span>Image Quality</span>
                          </div>
                        </label>
                        <select
                          value={preferences.content.imageQuality}
                          onChange={(e) =>
                            handlePreferenceChange(
                              'content',
                              'imageQuality',
                              e.target.value,
                            )
                          }
                          className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-slate-900 dark:text-slate-100 bg-white dark:bg-gray-700"
                        >
                          <option value="auto">Auto</option>
                          <option value="high">High</option>
                          <option value="medium">Medium</option>
                          <option value="low">Low</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Notifications Section */}
              <div className="bg-slate-50 dark:bg-gray-700/50 rounded-lg">
                <button
                  onClick={() => toggleSection('notifications')}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-100 dark:hover:bg-gray-600/50 rounded-lg transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <Bell
                      size={20}
                      className="text-green-600 dark:text-green-400"
                    />
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                        Notifications
                      </h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Manage how and when you receive notifications
                      </p>
                    </div>
                  </div>
                  {expandedSections.notifications ? (
                    <ChevronUp size={20} className="text-slate-400" />
                  ) : (
                    <ChevronDown size={20} className="text-slate-400" />
                  )}
                </button>

                {expandedSections.notifications && (
                  <div className="px-4 pb-4 space-y-4 border-t border-slate-200 dark:border-gray-600 pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          New Comments
                        </label>
                        <select
                          value={preferences.notifications.comments}
                          onChange={(e) =>
                            handleNotificationChange('comments', e.target.value)
                          }
                          className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-slate-900 dark:text-slate-100 bg-white dark:bg-gray-700"
                        >
                          <option value="email">Email</option>
                          <option value="browser">Browser</option>
                          <option value="none">None</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          Post Mentions
                        </label>
                        <select
                          value={preferences.notifications.mentions}
                          onChange={(e) =>
                            handleNotificationChange('mentions', e.target.value)
                          }
                          className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-slate-900 dark:text-slate-100 bg-white dark:bg-gray-700"
                        >
                          <option value="email">Email</option>
                          <option value="browser">Browser</option>
                          <option value="none">None</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          System Updates
                        </label>
                        <select
                          value={preferences.notifications.systemUpdates}
                          onChange={(e) =>
                            handleNotificationChange(
                              'systemUpdates',
                              e.target.value,
                            )
                          }
                          className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-slate-900 dark:text-slate-100 bg-white dark:bg-gray-700"
                        >
                          <option value="email">Email</option>
                          <option value="browser">Browser</option>
                          <option value="none">None</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          Notification Timing
                        </label>
                        <select
                          value={preferences.notifications.timing}
                          onChange={(e) =>
                            handleNotificationChange('timing', e.target.value)
                          }
                          className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-slate-900 dark:text-slate-100 bg-white dark:bg-gray-700"
                        >
                          <option value="immediate">Immediate</option>
                          <option value="hourly">Hourly</option>
                          <option value="daily">Daily</option>
                        </select>
                      </div>
                    </div>

                    <div className="pt-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-sm font-medium text-slate-900 dark:text-slate-100">
                            Weekly Digest
                          </label>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Receive a weekly summary email
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={preferences.notifications.weeklyDigest}
                            onChange={(e) =>
                              handleNotificationChange(
                                'weeklyDigest',
                                e.target.checked,
                              )
                            }
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-slate-200 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600" />
                        </label>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Dashboard & Analytics Section */}
              <div className="bg-slate-50 dark:bg-gray-700/50 rounded-lg">
                <button
                  onClick={() => toggleSection('dashboard')}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-100 dark:hover:bg-gray-600/50 rounded-lg transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <TrendingUp
                      size={20}
                      className="text-orange-600 dark:text-orange-400"
                    />
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                        Dashboard & Analytics
                      </h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Customize your dashboard and analytics preferences
                      </p>
                    </div>
                  </div>
                  {expandedSections.dashboard ? (
                    <ChevronUp size={20} className="text-slate-400" />
                  ) : (
                    <ChevronDown size={20} className="text-slate-400" />
                  )}
                </button>

                {expandedSections.dashboard && (
                  <div className="px-4 pb-4 space-y-4 border-t border-slate-200 dark:border-gray-600">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          Default Dashboard View
                        </label>
                        <select
                          value={preferences.dashboard.defaultView}
                          onChange={(e) =>
                            handlePreferenceChange(
                              'dashboard',
                              'defaultView',
                              e.target.value,
                            )
                          }
                          className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-slate-900 dark:text-slate-100 bg-white dark:bg-gray-700"
                        >
                          <option value="overview">Overview</option>
                          <option value="posts">Posts</option>
                          <option value="analytics">Analytics</option>
                          <option value="recent-activity">
                            Recent Activity
                          </option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          Analytics Detail Level
                        </label>
                        <select
                          value={preferences.dashboard.analyticsLevel}
                          onChange={(e) =>
                            handlePreferenceChange(
                              'dashboard',
                              'analyticsLevel',
                              e.target.value,
                            )
                          }
                          className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-slate-900 dark:text-slate-100 bg-white dark:bg-gray-700"
                        >
                          <option value="basic">Basic</option>
                          <option value="advanced">Advanced</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          <div className="flex items-center space-x-2">
                            <BarChart size={16} />
                            <span>Chart Type Preference</span>
                          </div>
                        </label>
                        <select
                          value={preferences.dashboard.chartType}
                          onChange={(e) =>
                            handlePreferenceChange(
                              'dashboard',
                              'chartType',
                              e.target.value,
                            )
                          }
                          className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-slate-900 dark:text-slate-100 bg-white dark:bg-gray-700"
                        >
                          <option value="line">Line Charts</option>
                          <option value="bar">Bar Charts</option>
                          <option value="pie">Pie Charts</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          Date Range Default
                        </label>
                        <select
                          value={preferences.dashboard.dateRange}
                          onChange={(e) =>
                            handlePreferenceChange(
                              'dashboard',
                              'dateRange',
                              e.target.value,
                            )
                          }
                          className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-slate-900 dark:text-slate-100 bg-white dark:bg-gray-700"
                        >
                          <option value="7-days">Last 7 days</option>
                          <option value="30-days">Last 30 days</option>
                          <option value="90-days">Last 90 days</option>
                        </select>
                      </div>
                    </div>

                    <div className="pt-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-sm font-medium text-slate-900 dark:text-slate-100">
                            Show Admin Metrics
                          </label>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Display advanced metrics for multi-author blogs
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={preferences.dashboard.showAdminMetrics}
                            onChange={(e) =>
                              handlePreferenceChange(
                                'dashboard',
                                'showAdminMetrics',
                                e.target.checked,
                              )
                            }
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-slate-200 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600" />
                        </label>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Localization Section */}
              <div className="bg-slate-50 dark:bg-gray-700/50 rounded-lg">
                <button
                  onClick={() => toggleSection('localization')}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-100 dark:hover:bg-gray-600/50 rounded-lg transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <Globe
                      size={20}
                      className="text-indigo-600 dark:text-indigo-400"
                    />
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                        Localization & Format
                      </h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Language, timezone, and formatting preferences
                      </p>
                    </div>
                  </div>
                  {expandedSections.localization ? (
                    <ChevronUp size={20} className="text-slate-400" />
                  ) : (
                    <ChevronDown size={20} className="text-slate-400" />
                  )}
                </button>

                {expandedSections.localization && (
                  <div className="px-4 pb-4 space-y-4 border-t border-slate-200 dark:border-gray-600">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          <div className="flex items-center space-x-2">
                            <Globe size={16} />
                            <span>Language</span>
                          </div>
                        </label>
                        <select
                          value={preferences.localization.language}
                          onChange={(e) =>
                            handlePreferenceChange(
                              'localization',
                              'language',
                              e.target.value,
                            )
                          }
                          className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-slate-900 dark:text-slate-100 bg-white dark:bg-gray-700"
                        >
                          <option value="en">English</option>
                          <option value="es">Español</option>
                          <option value="fr">Français</option>
                          <option value="de">Deutsch</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          <div className="flex items-center space-x-2">
                            <Clock size={16} />
                            <span>Timezone</span>
                          </div>
                        </label>
                        <select
                          value={preferences.localization.timezone}
                          onChange={(e) =>
                            handlePreferenceChange(
                              'localization',
                              'timezone',
                              e.target.value,
                            )
                          }
                          className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-slate-900 dark:text-slate-100 bg-white dark:bg-gray-700"
                        >
                          <option value="auto">Auto-detect</option>
                          <option value="UTC">UTC</option>
                          <option value="America/New_York">Eastern Time</option>
                          <option value="America/Chicago">Central Time</option>
                          <option value="America/Denver">Mountain Time</option>
                          <option value="America/Los_Angeles">
                            Pacific Time
                          </option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          Date Format
                        </label>
                        <select
                          value={preferences.localization.dateFormat}
                          onChange={(e) =>
                            handlePreferenceChange(
                              'localization',
                              'dateFormat',
                              e.target.value,
                            )
                          }
                          className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-slate-900 dark:text-slate-100 bg-white dark:bg-gray-700"
                        >
                          <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                          <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                          <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          Time Format
                        </label>
                        <select
                          value={preferences.localization.timeFormat}
                          onChange={(e) =>
                            handlePreferenceChange(
                              'localization',
                              'timeFormat',
                              e.target.value,
                            )
                          }
                          className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-slate-900 dark:text-slate-100 bg-white dark:bg-gray-700"
                        >
                          <option value="12-hour">12-hour</option>
                          <option value="24-hour">24-hour</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          Number Format
                        </label>
                        <select
                          value={preferences.localization.numberFormat}
                          onChange={(e) =>
                            handlePreferenceChange(
                              'localization',
                              'numberFormat',
                              e.target.value,
                            )
                          }
                          className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-slate-900 dark:text-slate-100 bg-white dark:bg-gray-700"
                        >
                          <option value="1,000.00">1,000.00</option>
                          <option value="1.000,00">1.000,00</option>
                          <option value="1 000,00">1 000,00</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Privacy & Security Section */}
              <div className="bg-slate-50 dark:bg-gray-700/50 rounded-lg">
                <button
                  onClick={() => toggleSection('privacy')}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-100 dark:hover:bg-gray-600/50 rounded-lg transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <Lock
                      size={20}
                      className="text-red-600 dark:text-red-400"
                    />
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                        Privacy & Security
                      </h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Control your privacy and security settings
                      </p>
                    </div>
                  </div>
                  {expandedSections.privacy ? (
                    <ChevronUp size={20} className="text-slate-400" />
                  ) : (
                    <ChevronDown size={20} className="text-slate-400" />
                  )}
                </button>

                {expandedSections.privacy && (
                  <div className="px-4 pb-4 space-y-4 border-t border-slate-200 dark:border-gray-600">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          Profile Visibility
                        </label>
                        <select
                          value={preferences.privacy.profileVisibility}
                          onChange={(e) =>
                            handlePreferenceChange(
                              'privacy',
                              'profileVisibility',
                              e.target.value,
                            )
                          }
                          className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-slate-900 dark:text-slate-100 bg-white dark:bg-gray-700"
                        >
                          <option value="public">Public</option>
                          <option value="private">Private</option>
                          <option value="contacts">Contacts Only</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          Session Timeout
                        </label>
                        <select
                          value={preferences.privacy.sessionTimeout}
                          onChange={(e) =>
                            handlePreferenceChange(
                              'privacy',
                              'sessionTimeout',
                              e.target.value,
                            )
                          }
                          className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-slate-900 dark:text-slate-100 bg-white dark:bg-gray-700"
                        >
                          <option value="30min">30 minutes</option>
                          <option value="1hr">1 hour</option>
                          <option value="4hr">4 hours</option>
                          <option value="never">Never</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-3 pt-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-sm font-medium text-slate-900 dark:text-slate-100">
                            Show Online Status
                          </label>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Let others see when you're online
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={preferences.privacy.showOnlineStatus}
                            onChange={(e) =>
                              handlePreferenceChange(
                                'privacy',
                                'showOnlineStatus',
                                e.target.checked,
                              )
                            }
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-slate-200 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600" />
                        </label>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-sm font-medium text-slate-900 dark:text-slate-100">
                            Activity Tracking
                          </label>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Enable analytics tracking for better insights
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={preferences.privacy.activityTracking}
                            onChange={(e) =>
                              handlePreferenceChange(
                                'privacy',
                                'activityTracking',
                                e.target.checked,
                              )
                            }
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-slate-200 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600" />
                        </label>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Accessibility Section */}
              <div className="bg-slate-50 dark:bg-gray-700/50 rounded-lg">
                <button
                  onClick={() => toggleSection('accessibility')}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-100 dark:hover:bg-gray-600/50 rounded-lg transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <Eye
                      size={20}
                      className="text-teal-600 dark:text-teal-400"
                    />
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                        Accessibility
                      </h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Mobile and accessibility preferences
                      </p>
                    </div>
                  </div>
                  {expandedSections.accessibility ? (
                    <ChevronUp size={20} className="text-slate-400" />
                  ) : (
                    <ChevronDown size={20} className="text-slate-400" />
                  )}
                </button>

                {expandedSections.accessibility && (
                  <div className="px-4 pb-4 space-y-4 border-t border-slate-200 dark:border-gray-600">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          <div className="flex items-center space-x-2">
                            <Smartphone size={16} />
                            <span>Mobile Editor</span>
                          </div>
                        </label>
                        <select
                          value={preferences.accessibility.mobileEditor}
                          onChange={(e) =>
                            handlePreferenceChange(
                              'accessibility',
                              'mobileEditor',
                              e.target.value,
                            )
                          }
                          className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-slate-900 dark:text-slate-100 bg-white dark:bg-gray-700"
                        >
                          <option value="simplified">Simplified</option>
                          <option value="full">Full</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-3 pt-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-sm font-medium text-slate-900 dark:text-slate-100">
                            Touch Gestures
                          </label>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Enable touch gestures for mobile devices
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={preferences.accessibility.touchGestures}
                            onChange={(e) =>
                              handlePreferenceChange(
                                'accessibility',
                                'touchGestures',
                                e.target.checked,
                              )
                            }
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-slate-200 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600" />
                        </label>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-sm font-medium text-slate-900 dark:text-slate-100">
                            High Contrast
                          </label>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Increase contrast for better visibility
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={preferences.accessibility.highContrast}
                            onChange={(e) =>
                              handlePreferenceChange(
                                'accessibility',
                                'highContrast',
                                e.target.checked,
                              )
                            }
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-slate-200 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600" />
                        </label>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-sm font-medium text-slate-900 dark:text-slate-100">
                            Screen Reader Support
                          </label>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Enhanced support for screen readers
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={preferences.accessibility.screenReader}
                            onChange={(e) =>
                              handlePreferenceChange(
                                'accessibility',
                                'screenReader',
                                e.target.checked,
                              )
                            }
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-slate-200 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600" />
                        </label>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-sm font-medium text-slate-900 dark:text-slate-100">
                            Keyboard Navigation
                          </label>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Enhanced keyboard navigation support
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={preferences.accessibility.keyboardNav}
                            onChange={(e) =>
                              handlePreferenceChange(
                                'accessibility',
                                'keyboardNav',
                                e.target.checked,
                              )
                            }
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-slate-200 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600" />
                        </label>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Save Preferences Button */}
              <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-gray-700">
                <button
                  onClick={() => {
                    const toastId = adminToast.saving()

                    // Simulate API call
                    setTimeout(() => {
                      showToast.dismiss(toastId)
                      adminToast.settingsSaved()
                      console.log('Saving preferences:', preferences)
                    }, 800)
                  }}
                  className="flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-2 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-colors"
                >
                  <Save size={16} />
                  <span>Save Preferences</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default UserProfile
