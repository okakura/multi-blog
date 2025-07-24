import {
  AlertTriangle,
  ArrowLeft,
  Eye,
  Globe,
  Loader2,
  Monitor,
  Moon,
  Palette,
  Save,
  Shield,
  Sun,
  Type,
  Users,
  X,
} from 'lucide-react'
import type React from 'react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ThemeToggle from '../../components/ThemeToggle'
import {
  useAdminDomainSettings,
  useAdminDomains,
} from '@/data/hooks/useAdminPosts'
import type { Domain } from '../../services/adminApi'
import { showToast } from '../../utils/toast'
import {
  analyzeThemeColor,
  createGradient,
  normalizeThemeColors,
} from '../../utils/themeUtils'

interface ThemeConfig {
  // Support both individual colors and Tailwind gradients
  primary: string // Can be a hex color '#3b82f6' or Tailwind gradient 'from-pink-500 to-rose-500'
  secondary: string // Can be a hex color '#6366f1' or Tailwind gradient 'from-orange-400 to-pink-500'
  accent: string // Usually a hex color for accents
  background: string
  text: string
  mode: 'light' | 'dark' | 'auto'

  // Optional: Individual color components for gradients (used by color pickers)
  primaryStart?: string // For 'from-pink-500' -> '#ec4899'
  primaryEnd?: string // For 'to-rose-500' -> '#f43f5e'
  secondaryStart?: string
  secondaryEnd?: string
}

interface DomainSettings {
  theme_config: ThemeConfig
  categories: string[]
  seo_config: {
    meta_description: string
    meta_keywords: string[]
    site_name: string
    social_image: string
  }
  analytics_config: {
    google_analytics_id: string
    facebook_pixel_id: string
    hotjar_id: string
  }
  content_config: {
    posts_per_page: number
    allow_comments: boolean
    moderation_enabled: boolean
    auto_publish: boolean
  }
  social_config: {
    twitter_handle: string
    facebook_page: string
    instagram_handle: string
    linkedin_page: string
  }
}

const AdminSettings: React.FC = () => {
  const navigate = useNavigate()
  const [selectedDomain, setSelectedDomain] = useState<Domain | null>(null)
  const [activeTab, setActiveTab] = useState<string>('theme')
  const [hasChanges, setHasChanges] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Theme customization state
  const [useGradients, setUseGradients] = useState(false) // Toggle between gradients and solid colors

  const { domains, isLoading: domainsLoading } = useAdminDomains()
  const {
    settings,
    isLoading: settingsLoading,
    updateSettings,
    error: settingsError,
  } = useAdminDomainSettings(selectedDomain?.hostname || 'tech.localhost')

  const [formData, setFormData] = useState<DomainSettings>({
    theme_config: {
      primary: '#3b82f6',
      secondary: '#6366f1',
      accent: '#8b5cf6',
      background: '#ffffff',
      text: '#1f2937',
      mode: 'light',
    },
    categories: [],
    seo_config: {
      meta_description: '',
      meta_keywords: [],
      site_name: '',
      social_image: '',
    },
    analytics_config: {
      google_analytics_id: '',
      facebook_pixel_id: '',
      hotjar_id: '',
    },
    content_config: {
      posts_per_page: 10,
      allow_comments: true,
      moderation_enabled: true,
      auto_publish: false,
    },
    social_config: {
      twitter_handle: '',
      facebook_page: '',
      instagram_handle: '',
      linkedin_page: '',
    },
  })

  // Set default domain when domains load
  useEffect(() => {
    if (domains.length > 0 && !selectedDomain) {
      setSelectedDomain(domains[0])
    }
  }, [domains, selectedDomain])

  // Update form data when settings load
  useEffect(() => {
    if (settings && selectedDomain) {
      const settingsData = typeof settings === 'object' ? settings : {}
      const themeData = settingsData.theme_config || {}

      // Detect if current theme uses gradients
      const hasGradients =
        (themeData.primary && themeData.primary.includes('from-')) ||
        (themeData.secondary && themeData.secondary.includes('from-'))
      setUseGradients(hasGradients)

      // Normalize theme colors to support both gradients and hex
      const normalizedTheme = normalizeThemeColors(
        themeData.primary || '#3b82f6',
        themeData.secondary || '#6366f1'
      )

      setFormData({
        theme_config: {
          accent: '#8b5cf6',
          background: '#ffffff',
          text: '#1f2937',
          mode: 'light',
          ...themeData,
          ...normalizedTheme,
        },
        categories: Array.isArray(settingsData.categories)
          ? settingsData.categories
          : Array.isArray(selectedDomain.categories)
            ? selectedDomain.categories
            : [],
        seo_config: {
          meta_description: `${selectedDomain.name} - Official Blog`,
          meta_keywords: Array.isArray(settingsData.categories)
            ? settingsData.categories
            : [],
          site_name: selectedDomain.name,
          social_image: '',
          ...(settingsData.seo_config || {}),
        },
        analytics_config: {
          google_analytics_id: '',
          facebook_pixel_id: '',
          hotjar_id: '',
          ...(settingsData.analytics_config || {}),
        },
        content_config: {
          posts_per_page: 10,
          allow_comments: true,
          moderation_enabled: true,
          auto_publish: false,
          ...(settingsData.content_config || {}),
        },
        social_config: {
          twitter_handle: '',
          facebook_page: '',
          instagram_handle: '',
          linkedin_page: '',
          ...(settingsData.social_config || {}),
        },
      })
      setHasChanges(false)
    }
  }, [settings, selectedDomain])

  const handleInputChange = (
    section: keyof DomainSettings,
    field: string,
    value: any
  ) => {
    setFormData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }))
    setHasChanges(true)
  }

  const handleSaveSettings = async () => {
    if (!selectedDomain) return

    setIsSaving(true)
    try {
      await updateSettings({
        theme_config: formData.theme_config,
        categories: formData.categories,
        seo_config: formData.seo_config,
        analytics_config: formData.analytics_config,
        content_config: formData.content_config,
        social_config: formData.social_config,
      })

      showToast.success(
        `Settings for "${selectedDomain.name}" saved successfully! ⚙️`
      )
      setHasChanges(false)
    } catch (error) {
      showToast.error(
        error instanceof Error ? error.message : 'Failed to save settings'
      )
    } finally {
      setIsSaving(false)
    }
  }

  const addCategory = () => {
    const input = prompt('Enter new category name:')
    if (input?.trim() && !formData.categories.includes(input.trim())) {
      handleInputChange('categories', 'categories', [
        ...formData.categories,
        input.trim(),
      ])
    }
  }

  const removeCategory = (index: number) => {
    const newCategories = formData.categories.filter((_, i) => i !== index)
    setFormData((prev) => ({ ...prev, categories: newCategories }))
    setHasChanges(true)
  }

  const addKeyword = () => {
    const input = prompt('Enter new SEO keyword:')
    if (
      input?.trim() &&
      !formData.seo_config.meta_keywords.includes(input.trim())
    ) {
      handleInputChange('seo_config', 'meta_keywords', [
        ...formData.seo_config.meta_keywords,
        input.trim(),
      ])
    }
  }

  const removeKeyword = (index: number) => {
    const newKeywords = formData.seo_config.meta_keywords.filter(
      (_, i) => i !== index
    )
    handleInputChange('seo_config', 'meta_keywords', newKeywords)
  }

  const tabs = [
    { id: 'theme', label: 'Theme & Appearance', icon: Palette },
    { id: 'content', label: 'Content Settings', icon: Type },
    { id: 'seo', label: 'SEO & Meta', icon: Globe },
    { id: 'analytics', label: 'Analytics', icon: Eye },
    { id: 'social', label: 'Social Media', icon: Users },
    { id: 'security', label: 'Security', icon: Shield },
  ]

  if (domainsLoading) {
    return (
      <div className='p-6 max-w-7xl mx-auto'>
        <div className='flex items-center justify-center py-12'>
          <div className='text-center'>
            <Loader2
              size={32}
              className='animate-spin text-purple-600 mx-auto mb-4'
            />
            <p className='text-slate-600'>Loading domains...</p>
          </div>
        </div>
      </div>
    )
  }

  if (settingsError) {
    return (
      <div className='p-6 max-w-7xl mx-auto'>
        <div className='bg-red-50 border border-red-200 rounded-lg p-4'>
          <div className='flex items-center space-x-2 text-red-800'>
            <AlertTriangle size={20} />
            <span className='font-medium'>Error loading settings</span>
          </div>
          <p className='text-red-700 mt-1'>{settingsError}</p>
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
              Settings
            </h1>
            <p className='text-slate-600 dark:text-gray-400'>
              Configure domain-specific settings and preferences
            </p>
          </div>
        </div>
        <div className='flex items-center space-x-4'>
          <ThemeToggle />
          <button
            onClick={handleSaveSettings}
            disabled={!hasChanges || isSaving}
            className='flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'>
            {isSaving ? (
              <Loader2 size={16} className='animate-spin' />
            ) : (
              <Save size={16} />
            )}
            <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-4 gap-6'>
        {/* Sidebar */}
        <div className='lg:col-span-1'>
          {/* Domain Selector */}
          <div className='bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-slate-200 dark:border-gray-700 p-4 mb-6'>
            <label className='block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2'>
              Select Domain
            </label>
            <select
              value={selectedDomain?.id || ''}
              onChange={(e) => {
                const domain = domains.find(
                  (d) => d.id === Number.parseInt(e.target.value)
                )
                setSelectedDomain(domain || null)
              }}
              className='w-full border border-slate-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent text-slate-900 dark:text-gray-100 bg-white dark:bg-gray-700'>
              {domains.map((domain) => (
                <option key={domain.id} value={domain.id}>
                  {domain.name} ({domain.hostname})
                </option>
              ))}
            </select>
          </div>

          {/* Navigation Tabs */}
          <div className='bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-slate-200 dark:border-gray-700 p-2'>
            <nav className='space-y-1'>
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${activeTab === tab.id
                      ? 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-700'
                      : 'text-slate-700 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-700'
                      }`}>
                    <Icon size={16} />
                    <span className='text-sm font-medium'>{tab.label}</span>
                  </button>
                )
              })}
            </nav>
          </div>

          {/* Changes Indicator */}
          {hasChanges && (
            <div className='mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3'>
              <div className='flex items-center space-x-2 text-yellow-800'>
                <AlertTriangle size={16} />
                <span className='text-sm font-medium'>Unsaved Changes</span>
              </div>
              <p className='text-xs text-yellow-700 mt-1'>
                Don't forget to save your changes
              </p>
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className='lg:col-span-3'>
          <div className='bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-slate-200 dark:border-gray-700 p-6'>
            {settingsLoading ? (
              <div className='flex items-center justify-center py-12'>
                <div className='text-center'>
                  <Loader2
                    size={32}
                    className='animate-spin text-purple-600 mx-auto mb-4'
                  />
                  <p className='text-slate-600 dark:text-gray-400'>
                    Loading settings...
                  </p>
                </div>
              </div>
            ) : (
              <div>
                {/* Theme & Appearance Tab */}
                {activeTab === 'theme' && (
                  <div className='space-y-6'>
                    <div>
                      <h3 className='text-lg font-semibold text-slate-900 dark:text-gray-100 mb-4'>
                        Theme & Appearance
                      </h3>

                      {/* Color Scheme Section */}
                      <div className='space-y-6'>
                        {/* Theme Mode Toggle */}
                        <div className='flex justify-between items-center'>
                          <h4 className='text-md font-medium text-slate-800 dark:text-slate-200'>
                            Color Scheme Mode
                          </h4>
                          <div className='flex items-center space-x-3'>
                            <span className='text-sm text-slate-600 dark:text-slate-400'>
                              Individual Colors
                            </span>
                            <button
                              type='button'
                              onClick={() => setUseGradients(!useGradients)}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${useGradients
                                ? 'bg-purple-600'
                                : 'bg-slate-300 dark:bg-slate-600'
                                }`}>
                              <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${useGradients
                                  ? 'translate-x-6'
                                  : 'translate-x-1'
                                  }`}
                              />
                            </button>
                            <span className='text-sm text-slate-600 dark:text-slate-400'>
                              Tailwind Gradients
                            </span>
                          </div>
                        </div>

                        {useGradients ? (
                          /* Gradient Mode */
                          <div>
                            <h4 className='text-md font-medium text-slate-800 dark:text-slate-200 mb-4'>
                              Tailwind Gradient Classes
                            </h4>
                            <div className='space-y-4'>
                              {/* Primary Gradient */}
                              <div>
                                <label className='block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2'>
                                  Primary Gradient
                                </label>
                                <div className='flex items-center space-x-3'>
                                  <div
                                    className={`w-12 h-12 rounded-lg border border-slate-300 dark:border-slate-600 bg-gradient-to-r ${formData.theme_config.primary}`}
                                    style={{
                                      background:
                                        formData.theme_config.primary.startsWith(
                                          'from-'
                                        )
                                          ? undefined
                                          : formData.theme_config.primary,
                                    }}
                                  />
                                  <input
                                    type='text'
                                    value={formData.theme_config.primary}
                                    onChange={(e) =>
                                      handleInputChange(
                                        'theme_config',
                                        'primary',
                                        e.target.value
                                      )
                                    }
                                    className='flex-1 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm font-mono'
                                    placeholder='from-pink-500 to-rose-500'
                                  />
                                </div>
                                <p className='text-xs text-slate-500 dark:text-slate-400 mt-1'>
                                  Enter Tailwind gradient classes like
                                  "from-pink-500 to-rose-500"
                                </p>
                              </div>

                              {/* Secondary Gradient */}
                              <div>
                                <label className='block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2'>
                                  Secondary Gradient
                                </label>
                                <div className='flex items-center space-x-3'>
                                  <div
                                    className={`w-12 h-12 rounded-lg border border-slate-300 dark:border-slate-600 bg-gradient-to-r ${formData.theme_config.secondary}`}
                                    style={{
                                      background:
                                        formData.theme_config.secondary.startsWith(
                                          'from-'
                                        )
                                          ? undefined
                                          : formData.theme_config.secondary,
                                    }}
                                  />
                                  <input
                                    type='text'
                                    value={formData.theme_config.secondary}
                                    onChange={(e) =>
                                      handleInputChange(
                                        'theme_config',
                                        'secondary',
                                        e.target.value
                                      )
                                    }
                                    className='flex-1 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm font-mono'
                                    placeholder='from-orange-400 to-pink-500'
                                  />
                                </div>
                                <p className='text-xs text-slate-500 dark:text-slate-400 mt-1'>
                                  Enter Tailwind gradient classes like
                                  "from-orange-400 to-pink-500"
                                </p>
                              </div>
                            </div>
                          </div>
                        ) : (
                          /* Individual Color Mode */
                          <div>
                            <h4 className='text-md font-medium text-slate-800 dark:text-slate-200 mb-4'>
                              Individual Colors
                            </h4>
                            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                              {/* Primary Color */}
                              <div>
                                <label className='block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2'>
                                  Primary Color
                                </label>
                                <div className='flex items-center space-x-3'>
                                  <input
                                    type='color'
                                    value={
                                      formData.theme_config.primary.startsWith(
                                        '#'
                                      )
                                        ? formData.theme_config.primary
                                        : '#3b82f6'
                                    }
                                    onChange={(e) =>
                                      handleInputChange(
                                        'theme_config',
                                        'primary',
                                        e.target.value
                                      )
                                    }
                                    className='w-12 h-12 rounded-lg border border-slate-300 dark:border-slate-600 cursor-pointer'
                                  />
                                  <input
                                    type='text'
                                    value={formData.theme_config.primary}
                                    onChange={(e) =>
                                      handleInputChange(
                                        'theme_config',
                                        'primary',
                                        e.target.value
                                      )
                                    }
                                    className='flex-1 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm font-mono'
                                    placeholder='#3b82f6'
                                  />
                                </div>
                              </div>

                              {/* Secondary Color */}
                              <div>
                                <label className='block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2'>
                                  Secondary Color
                                </label>
                                <div className='flex items-center space-x-3'>
                                  <input
                                    type='color'
                                    value={
                                      formData.theme_config.secondary.startsWith(
                                        '#'
                                      )
                                        ? formData.theme_config.secondary
                                        : '#6366f1'
                                    }
                                    onChange={(e) =>
                                      handleInputChange(
                                        'theme_config',
                                        'secondary',
                                        e.target.value
                                      )
                                    }
                                    className='w-12 h-12 rounded-lg border border-slate-300 dark:border-slate-600 cursor-pointer'
                                  />
                                  <input
                                    type='text'
                                    value={formData.theme_config.secondary}
                                    onChange={(e) =>
                                      handleInputChange(
                                        'theme_config',
                                        'secondary',
                                        e.target.value
                                      )
                                    }
                                    className='flex-1 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm font-mono'
                                    placeholder='#6366f1'
                                  />
                                </div>
                              </div>

                              {/* Accent Color */}
                              <div>
                                <label className='block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2'>
                                  Accent Color
                                </label>
                                <div className='flex items-center space-x-3'>
                                  <input
                                    type='color'
                                    value={formData.theme_config.accent}
                                    onChange={(e) =>
                                      handleInputChange(
                                        'theme_config',
                                        'accent',
                                        e.target.value
                                      )
                                    }
                                    className='w-12 h-12 rounded-lg border border-slate-300 dark:border-slate-600 cursor-pointer'
                                  />
                                  <input
                                    type='text'
                                    value={formData.theme_config.accent}
                                    onChange={(e) =>
                                      handleInputChange(
                                        'theme_config',
                                        'accent',
                                        e.target.value
                                      )
                                    }
                                    className='flex-1 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm font-mono'
                                    placeholder='#8b5cf6'
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Theme Mode */}
                        <div>
                          <h4 className='text-md font-medium text-slate-800 dark:text-slate-200 mb-4'>
                            Default Theme Mode
                          </h4>
                          <div className='grid grid-cols-3 gap-3'>
                            {[
                              { value: 'light', label: 'Light', icon: Sun },
                              { value: 'dark', label: 'Dark', icon: Moon },
                              { value: 'auto', label: 'Auto', icon: Monitor },
                            ].map(({ value, label, icon: Icon }) => (
                              <button
                                key={value}
                                type='button'
                                onClick={() =>
                                  handleInputChange(
                                    'theme_config',
                                    'mode',
                                    value
                                  )
                                }
                                className={`p-4 border rounded-lg flex flex-col items-center space-y-2 transition-all ${formData.theme_config.mode === value
                                  ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300'
                                  : 'border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500 text-slate-600 dark:text-slate-400'
                                  }`}>
                                <Icon size={24} />
                                <span className='text-sm font-medium'>
                                  {label}
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Gradient Presets (only show in gradient mode) */}
                        {useGradients && (
                          <div>
                            <h4 className='text-md font-medium text-slate-800 dark:text-slate-200 mb-4'>
                              Gradient Presets
                            </h4>
                            <div className='grid grid-cols-2 md:grid-cols-4 gap-3'>
                              {[
                                {
                                  name: 'Pink to Rose',
                                  primary: 'from-pink-500 to-rose-500',
                                  secondary: 'from-orange-400 to-pink-500',
                                  accent: '#ec4899',
                                },
                                {
                                  name: 'Blue to Purple',
                                  primary: 'from-blue-600 to-purple-600',
                                  secondary: 'from-cyan-400 to-blue-500',
                                  accent: '#3b82f6',
                                },
                                {
                                  name: 'Green to Teal',
                                  primary: 'from-green-600 to-teal-600',
                                  secondary: 'from-emerald-400 to-green-500',
                                  accent: '#059669',
                                },
                                {
                                  name: 'Purple to Indigo',
                                  primary: 'from-purple-600 to-indigo-600',
                                  secondary: 'from-violet-400 to-purple-500',
                                  accent: '#8b5cf6',
                                },
                                {
                                  name: 'Ocean Breeze',
                                  primary: 'from-cyan-500 to-blue-500',
                                  secondary: 'from-sky-400 to-cyan-500',
                                  accent: '#06b6d4',
                                },
                                {
                                  name: 'Sunset Glow',
                                  primary: 'from-pink-400 to-orange-400',
                                  secondary: 'from-yellow-300 to-pink-400',
                                  accent: '#fb7185',
                                },
                              ].map((preset) => (
                                <button
                                  key={preset.name}
                                  type='button'
                                  onClick={() => {
                                    setFormData((prev) => ({
                                      ...prev,
                                      theme_config: {
                                        ...prev.theme_config,
                                        primary: preset.primary,
                                        secondary: preset.secondary,
                                        accent: preset.accent,
                                      },
                                    }))
                                    setHasChanges(true)
                                  }}
                                  className='p-3 border border-slate-300 dark:border-slate-600 rounded-lg hover:border-purple-500 dark:hover:border-purple-400 transition-colors group'>
                                  <div className='space-y-2'>
                                    <div className='flex space-x-1'>
                                      <div
                                        className={`h-4 w-full rounded bg-gradient-to-r ${preset.primary}`}
                                      />
                                      <div
                                        className={`h-4 w-full rounded bg-gradient-to-r ${preset.secondary}`}
                                      />
                                    </div>
                                    <div className='flex items-center justify-between'>
                                      <span className='text-xs font-medium text-slate-700 dark:text-slate-300 group-hover:text-purple-600 dark:group-hover:text-purple-400'>
                                        {preset.name}
                                      </span>
                                      <div
                                        className='w-3 h-3 rounded-full border border-slate-300 dark:border-slate-600'
                                        style={{
                                          backgroundColor: preset.accent,
                                        }}
                                      />
                                    </div>
                                  </div>
                                </button>
                              ))}
                            </div>
                            <p className='text-xs text-slate-500 dark:text-slate-400 mt-2'>
                              Click any preset to apply its gradient
                              configuration
                            </p>
                          </div>
                        )}

                        {/* Color Preview */}
                        <div>
                          <div className='flex items-center justify-between mb-4'>
                            <h4 className='text-md font-medium text-slate-800 dark:text-slate-200'>
                              Preview
                            </h4>
                            <button
                              type='button'
                              onClick={() => {
                                setFormData((prev) => ({
                                  ...prev,
                                  theme_config: {
                                    primary: '#3b82f6',
                                    secondary: '#6366f1',
                                    accent: '#8b5cf6',
                                    background: '#ffffff',
                                    text: '#1f2937',
                                    mode: 'light',
                                  },
                                }))
                                setHasChanges(true)
                              }}
                              className='px-3 py-1 text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors'>
                              Reset to Default
                            </button>
                          </div>
                          <div className='border border-slate-300 dark:border-slate-600 rounded-lg p-6 bg-white dark:bg-slate-800'>
                            <div className='space-y-4'>
                              {/* Sample Header */}
                              <div
                                className='rounded-lg p-4 text-white'
                                style={{
                                  backgroundColor:
                                    formData.theme_config.primary,
                                }}>
                                <h5 className='font-semibold'>Sample Header</h5>
                                <p className='text-sm opacity-90'>
                                  This shows how your primary color looks
                                </p>
                              </div>

                              {/* Sample Buttons */}
                              <div className='flex space-x-3'>
                                <button
                                  className='px-4 py-2 rounded-lg text-white font-medium'
                                  style={{
                                    backgroundColor:
                                      formData.theme_config.secondary,
                                  }}>
                                  Secondary Button
                                </button>
                                <button
                                  className='px-4 py-2 rounded-lg text-white font-medium'
                                  style={{
                                    backgroundColor:
                                      formData.theme_config.accent,
                                  }}>
                                  Accent Button
                                </button>
                              </div>

                              {/* Sample Content */}
                              <div className='space-y-2'>
                                <p className='text-slate-900 dark:text-slate-100'>
                                  Sample blog content with your theme colors.
                                </p>
                                <a
                                  href='#'
                                  className='font-medium hover:underline'
                                  style={{
                                    color: formData.theme_config.primary,
                                  }}>
                                  Sample link color
                                </a>
                              </div>

                              {/* Color Usage Info */}
                              <div className='mt-4 p-3 bg-slate-50 dark:bg-slate-700 rounded-lg'>
                                <p className='text-xs text-slate-600 dark:text-slate-400'>
                                  <strong>Note:</strong> These colors will be
                                  applied to your blog's header, buttons, links,
                                  and accents. Changes are saved per domain and
                                  take effect immediately after saving.
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className='mt-6'>
                        <label className='block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2'>
                          Categories
                        </label>
                        <div className='flex flex-wrap gap-2 mb-3'>
                          {formData.categories.map((category, index) => (
                            <span
                              key={index}
                              className='inline-flex items-center space-x-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 px-3 py-1 rounded-full text-sm'>
                              <span>{category}</span>
                              <button
                                type='button'
                                onClick={() => removeCategory(index)}
                                className='text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-200 ml-1'>
                                <X size={14} />
                              </button>
                            </span>
                          ))}
                        </div>
                        <button
                          type='button'
                          onClick={addCategory}
                          className='px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors'>
                          Add Category
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Content Settings Tab */}
                {activeTab === 'content' && (
                  <div className='space-y-6'>
                    <div>
                      <h3 className='text-lg font-semibold text-slate-900 dark:text-slate-300 mb-4'>
                        Content Settings
                      </h3>
                      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                        <div>
                          <label className='block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2'>
                            Posts Per Page
                          </label>
                          <input
                            type='number'
                            min='1'
                            max='50'
                            value={formData.content_config.posts_per_page}
                            onChange={(e) =>
                              handleInputChange(
                                'content_config',
                                'posts_per_page',
                                Number.parseInt(e.target.value) || 10
                              )
                            }
                            className='w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-purple-500 focus:border-transparent'
                          />
                        </div>

                        <div className='space-y-4'>
                          <div className='flex items-center space-x-3'>
                            <input
                              type='checkbox'
                              id='allow_comments'
                              checked={formData.content_config.allow_comments}
                              onChange={(e) =>
                                handleInputChange(
                                  'content_config',
                                  'allow_comments',
                                  e.target.checked
                                )
                              }
                              className='w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500'
                            />
                            <label
                              htmlFor='allow_comments'
                              className='text-sm font-medium text-slate-700'>
                              Allow Comments
                            </label>
                          </div>

                          <div className='flex items-center space-x-3'>
                            <input
                              type='checkbox'
                              id='moderation_enabled'
                              checked={
                                formData.content_config.moderation_enabled
                              }
                              onChange={(e) =>
                                handleInputChange(
                                  'content_config',
                                  'moderation_enabled',
                                  e.target.checked
                                )
                              }
                              className='w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500'
                            />
                            <label
                              htmlFor='moderation_enabled'
                              className='text-sm font-medium text-slate-700'>
                              Enable Comment Moderation
                            </label>
                          </div>

                          <div className='flex items-center space-x-3'>
                            <input
                              type='checkbox'
                              id='auto_publish'
                              checked={formData.content_config.auto_publish}
                              onChange={(e) =>
                                handleInputChange(
                                  'content_config',
                                  'auto_publish',
                                  e.target.checked
                                )
                              }
                              className='w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500'
                            />
                            <label
                              htmlFor='auto_publish'
                              className='text-sm font-medium text-slate-700'>
                              Auto-publish Posts
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* SEO & Meta Tab */}
                {activeTab === 'seo' && (
                  <div className='space-y-6'>
                    <div>
                      <h3 className='text-lg font-semibold text-slate-900 dark:text-slate-300 mb-4'>
                        SEO & Meta Information
                      </h3>
                      <div className='space-y-4'>
                        <div>
                          <label className='block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2'>
                            Site Name
                          </label>
                          <input
                            type='text'
                            value={formData.seo_config.site_name}
                            onChange={(e) =>
                              handleInputChange(
                                'seo_config',
                                'site_name',
                                e.target.value
                              )
                            }
                            className='w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-purple-500 focus:border-transparent'
                            placeholder='Your Site Name'
                          />
                        </div>

                        <div>
                          <label className='block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2'>
                            Meta Description
                          </label>
                          <textarea
                            value={formData.seo_config.meta_description}
                            onChange={(e) =>
                              handleInputChange(
                                'seo_config',
                                'meta_description',
                                e.target.value
                              )
                            }
                            rows={3}
                            className='w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-purple-500 focus:border-transparent'
                            placeholder='A brief description of your site...'
                          />
                        </div>

                        <div>
                          <label className='block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2'>
                            SEO Keywords
                          </label>
                          <div className='flex flex-wrap gap-2 mb-3'>
                            {formData.seo_config.meta_keywords.map(
                              (keyword, index) => (
                                <span
                                  key={index}
                                  className='inline-flex items-center space-x-1 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm'>
                                  <span>{keyword}</span>
                                  <button
                                    type='button'
                                    onClick={() => removeKeyword(index)}
                                    className='text-blue-600 hover:text-blue-800 ml-1'>
                                    <X size={14} />
                                  </button>
                                </span>
                              )
                            )}
                          </div>
                          <button
                            type='button'
                            onClick={addKeyword}
                            className='px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors'>
                            Add Keyword
                          </button>
                        </div>

                        <div>
                          <label className='block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2'>
                            Social Share Image URL
                          </label>
                          <input
                            type='url'
                            value={formData.seo_config.social_image}
                            onChange={(e) =>
                              handleInputChange(
                                'seo_config',
                                'social_image',
                                e.target.value
                              )
                            }
                            className='w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-purple-500 focus:border-transparent'
                            placeholder='https://example.com/image.jpg'
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Analytics Tab */}
                {activeTab === 'analytics' && (
                  <div className='space-y-6'>
                    <div>
                      <h3 className='text-lg font-semibold text-slate-900 dark:text-slate-300 mb-4'>
                        Analytics Integration
                      </h3>
                      <div className='space-y-4'>
                        <div>
                          <label className='block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2'>
                            Google Analytics ID
                          </label>
                          <input
                            type='text'
                            value={
                              formData.analytics_config.google_analytics_id
                            }
                            onChange={(e) =>
                              handleInputChange(
                                'analytics_config',
                                'google_analytics_id',
                                e.target.value
                              )
                            }
                            className='w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-purple-500 focus:border-transparent'
                            placeholder='G-XXXXXXXXXX'
                          />
                        </div>

                        <div>
                          <label className='block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2'>
                            Facebook Pixel ID
                          </label>
                          <input
                            type='text'
                            value={formData.analytics_config.facebook_pixel_id}
                            onChange={(e) =>
                              handleInputChange(
                                'analytics_config',
                                'facebook_pixel_id',
                                e.target.value
                              )
                            }
                            className='w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-purple-500 focus:border-transparent'
                            placeholder='123456789012345'
                          />
                        </div>

                        <div>
                          <label className='block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2'>
                            Hotjar Site ID
                          </label>
                          <input
                            type='text'
                            value={formData.analytics_config.hotjar_id}
                            onChange={(e) =>
                              handleInputChange(
                                'analytics_config',
                                'hotjar_id',
                                e.target.value
                              )
                            }
                            className='w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-purple-500 focus:border-transparent'
                            placeholder='1234567'
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Social Media Tab */}
                {activeTab === 'social' && (
                  <div className='space-y-6'>
                    <div>
                      <h3 className='text-lg font-semibold text-slate-900 dark:text-slate-300 mb-4'>
                        Social Media Integration
                      </h3>
                      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                        <div>
                          <label className='block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2'>
                            Twitter Handle
                          </label>
                          <input
                            type='text'
                            value={formData.social_config.twitter_handle}
                            onChange={(e) =>
                              handleInputChange(
                                'social_config',
                                'twitter_handle',
                                e.target.value
                              )
                            }
                            className='w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-purple-500 focus:border-transparent'
                            placeholder='@yourusername'
                          />
                        </div>

                        <div>
                          <label className='block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2'>
                            Facebook Page
                          </label>
                          <input
                            type='url'
                            value={formData.social_config.facebook_page}
                            onChange={(e) =>
                              handleInputChange(
                                'social_config',
                                'facebook_page',
                                e.target.value
                              )
                            }
                            className='w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-purple-500 focus:border-transparent'
                            placeholder='https://facebook.com/yourpage'
                          />
                        </div>

                        <div>
                          <label className='block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2'>
                            Instagram Handle
                          </label>
                          <input
                            type='text'
                            value={formData.social_config.instagram_handle}
                            onChange={(e) =>
                              handleInputChange(
                                'social_config',
                                'instagram_handle',
                                e.target.value
                              )
                            }
                            className='w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-purple-500 focus:border-transparent'
                            placeholder='@yourusername'
                          />
                        </div>

                        <div>
                          <label className='block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2'>
                            LinkedIn Page
                          </label>
                          <input
                            type='url'
                            value={formData.social_config.linkedin_page}
                            onChange={(e) =>
                              handleInputChange(
                                'social_config',
                                'linkedin_page',
                                e.target.value
                              )
                            }
                            className='w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-purple-500 focus:border-transparent'
                            placeholder='https://linkedin.com/company/yourcompany'
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Security Tab */}
                {activeTab === 'security' && (
                  <div className='space-y-6'>
                    <div>
                      <h3 className='text-lg font-semibold text-slate-900 dark:text-slate-300 mb-4'>
                        Security Settings
                      </h3>
                      <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
                        <div className='flex items-center space-x-2 text-blue-800'>
                          <Shield size={20} />
                          <span className='font-medium'>
                            Security Configuration
                          </span>
                        </div>
                        <p className='text-blue-700 mt-1'>
                          Advanced security settings are managed at the server
                          level. Contact your system administrator for security
                          configurations.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminSettings
