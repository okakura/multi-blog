import {
  AlertCircle,
  Check,
  Clock,
  Download,
  FileText,
  Loader2,
  RotateCcw,
  Save,
  Settings,
  Upload,
} from 'lucide-react'
import type React from 'react'
import { useEffect, useRef, useState } from 'react'
import { usePreferences } from '@/data/hooks/useUserPreferences'
import { showToast } from '../../utils/toast'

interface AdminPreferencesManagerProps {
  compact?: boolean
}

export const AdminPreferencesManager: React.FC<
  AdminPreferencesManagerProps
> = ({ compact = false }) => {
  const {
    preferences,
    importPreferences,
    resetAllPreferences,
    savePreferences,
  } = usePreferences()

  // Local state for UI management
  const [isImporting, setIsImporting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Track unsaved changes (simplified - could be enhanced to deep compare)
  useEffect(() => {
    // In a real implementation, you'd compare with last saved state
    // For now, assume changes exist if preferences are loaded
    setHasUnsavedChanges(false)
  }, [preferences])

  // Handle manual save
  const handleSave = async () => {
    if (isSaving) return

    setIsSaving(true)
    try {
      const success = await savePreferences(preferences)
      if (success) {
        setLastSaved(new Date())
        showToast.success('Preferences saved successfully! 💾')
      }
    } catch (_error) {
      showToast.error('Failed to save preferences')
    }
  }

  // Handle export to file
  const handleExport = () => {
    try {
      console.log('Starting export process...')
      console.log('Preferences to export:', preferences)

      const exportData = JSON.stringify(preferences, null, 2)
      console.log('Export data type:', typeof exportData)
      console.log(
        'Export data received:',
        exportData ? `${exportData.substring(0, 100)}...` : 'null/undefined',
      )
      console.log('Export data length:', exportData ? exportData.length : 0)

      if (!exportData) {
        showToast.error('Failed to generate export data')
        return
      }

      // Try modern download approach first
      try {
        const blob = new Blob([exportData], { type: 'application/json' })
        console.log('Blob created:', blob.size, 'bytes')

        // Check if browser supports download attribute
        if ('download' in document.createElement('a')) {
          const url = URL.createObjectURL(blob)
          console.log('Object URL created:', url)

          const link = document.createElement('a')
          link.href = url
          link.download = `multi-blog-preferences-${new Date().toISOString().split('T')[0]
            }.json`
          link.style.display = 'none'
          link.setAttribute('target', '_blank')

          console.log('Download link created:', link.download)

          // Ensure link is added to DOM before clicking
          document.body.appendChild(link)
          console.log('Link added to DOM')

          link.click()
          console.log('Download triggered')

          // Clean up after a short delay to ensure download starts
          setTimeout(() => {
            if (document.body.contains(link)) {
              document.body.removeChild(link)
            }
            URL.revokeObjectURL(url)
            console.log('Cleanup completed')
          }, 100)
        } else {
          // Fallback for older browsers
          console.log('Using fallback method')
          const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(exportData)}`
          const link = document.createElement('a')
          link.href = dataUri
          link.download = `multi-blog-preferences-${new Date().toISOString().split('T')[0]
            }.json`
          link.click()
        }
      } catch (downloadError) {
        console.error('Download method failed:', downloadError)

        // Ultimate fallback - open in new window
        const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(exportData)}`
        const newWindow = window.open(dataUri, '_blank')
        if (!newWindow) {
          throw new Error(
            'Pop-up blocked - please enable pop-ups for this site',
          )
        }
        showToast.info(
          'Preferences opened in new window - please save manually',
        )
        return
      }

      showToast.success('Preferences exported successfully! 📁')
    } catch (error) {
      console.error('Export error:', error)
      showToast.error(
        `Failed to export preferences: ${(error as Error).message}`,
      )
    }
  }

  // Handle import from file
  const handleImport = () => {
    fileInputRef.current?.click()
  }

  const handleFileImport = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      setIsImporting(true)
      const text = await file.text()
      const success = await importPreferences(text)

      if (success) {
        setLastSaved(new Date())
        setHasUnsavedChanges(false)
      }
    } catch (_error) {
      showToast.error('Failed to read preferences file')
    } finally {
      setIsImporting(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  // Handle reset
  const handleReset = async () => {
    if (
      window.confirm(
        'Are you sure you want to reset all preferences to defaults? This action cannot be undone.',
      )
    ) {
      const success = await resetAllPreferences()
      if (success) {
        setLastSaved(new Date())
        setHasUnsavedChanges(false)
      }
    }
  }

  if (compact) {
    return (
      <div className="flex items-center space-x-2">
        <button
          onClick={handleSave}
          disabled={isSaving || !hasUnsavedChanges}
          className="flex items-center space-x-1 px-3 py-1.5 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-200 dark:hover:bg-green-800/30 transition-colors text-sm disabled:opacity-50"
        >
          {isSaving ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <Save className="w-3 h-3" />
          )}
          <span>Save</span>
          {hasUnsavedChanges && (
            <span className="w-1 h-1 bg-green-500 rounded-full ml-1" />
          )}
        </button>

        <button
          onClick={handleExport}
          className="flex items-center space-x-1 px-3 py-1.5 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800/30 transition-colors text-sm"
        >
          <Download className="w-3 h-3" />
          <span>Export</span>
        </button>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-slate-200 dark:border-gray-700">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
              <Settings className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-gray-100">
                Preferences Manager
              </h3>
              <p className="text-sm text-slate-500 dark:text-gray-400">
                Save, export, or import your settings
              </p>
            </div>
          </div>

          {(lastSaved || hasUnsavedChanges) && (
            <div className="flex items-center space-x-1 text-sm">
              {hasUnsavedChanges ? (
                <>
                  <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                  <span className="text-amber-600 dark:text-amber-400">
                    Unsaved changes
                  </span>
                </>
              ) : lastSaved ? (
                <>
                  <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                  <span className="text-green-600 dark:text-green-400">
                    Saved {lastSaved.toLocaleTimeString()}
                  </span>
                </>
              ) : null}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Current Status */}
        <div className="bg-slate-50 dark:bg-gray-700 rounded-lg p-4 mb-4">
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-slate-900 dark:text-gray-100 mb-1">
                Current Configuration
              </h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-slate-500 dark:text-gray-400">
                    Theme:
                  </span>
                  <span className="ml-2 text-slate-700 dark:text-gray-300 capitalize">
                    {preferences.appearance.theme}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-gray-400">
                    Font Size:
                  </span>
                  <span className="ml-2 text-slate-700 dark:text-gray-300 capitalize">
                    {preferences.appearance.fontSize}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-gray-400">
                    Posts/Page:
                  </span>
                  <span className="ml-2 text-slate-700 dark:text-gray-300">
                    {preferences.content.postsPerPage}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-gray-400">
                    Language:
                  </span>
                  <span className="ml-2 text-slate-700 dark:text-gray-300 uppercase">
                    {preferences.localization.language}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={isSaving || !hasUnsavedChanges}
            className="flex items-center justify-center space-x-2 p-3 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-100 dark:hover:bg-green-800/30 transition-colors disabled:opacity-50 group"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4 group-hover:scale-110 transition-transform" />
            )}
            <span className="font-medium">
              {hasUnsavedChanges ? 'Save Changes' : 'Saved'}
            </span>
            {hasUnsavedChanges && (
              <span className="w-1 h-1 bg-green-500 rounded-full" />
            )}
          </button>

          {/* Export Button */}
          <button
            onClick={handleExport}
            className="flex items-center justify-center space-x-2 p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-800/30 transition-colors group"
          >
            <Download className="w-4 h-4 group-hover:scale-110 transition-transform" />
            <span className="font-medium">Export</span>
          </button>

          {/* Import Button */}
          <button
            onClick={handleImport}
            disabled={isImporting}
            className="flex items-center justify-center space-x-2 p-3 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-800/30 transition-colors disabled:opacity-50 group"
          >
            {isImporting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Upload className="w-4 h-4 group-hover:scale-110 transition-transform" />
            )}
            <span className="font-medium">Import</span>
          </button>

          {/* Reset Button */}
          <button
            onClick={handleReset}
            className="flex items-center justify-center space-x-2 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-100 dark:hover:bg-red-800/30 transition-colors group"
          >
            <RotateCcw className="w-4 h-4 group-hover:scale-110 transition-transform" />
            <span className="font-medium">Reset All</span>
          </button>
        </div>

        {/* Help Text */}
        <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
          <div className="flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-amber-700 dark:text-amber-300">
              <p className="font-medium mb-1">Preference Management</p>
              <p>
                Your preferences are automatically saved to browser storage. Use
                the export/import feature to backup or sync settings across
                devices.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileImport}
        className="hidden"
      />
    </div>
  )
}
