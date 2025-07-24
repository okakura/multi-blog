import type React from 'react'
import { usePreferences } from '@/data/hooks/useUserPreferences'

const AdminPreferencesStatus: React.FC = () => {
  const { preferences } = usePreferences()

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
        Current Admin Preferences
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
        <div className="bg-gray-50 dark:bg-gray-700 p-2 rounded">
          <span className="font-medium text-gray-700 dark:text-gray-300">
            Theme:
          </span>
          <div className="text-purple-600 dark:text-purple-400 font-semibold">
            {preferences.appearance.theme}
          </div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-700 p-2 rounded">
          <span className="font-medium text-gray-700 dark:text-gray-300">
            Font:
          </span>
          <div className="text-blue-600 dark:text-blue-400 font-semibold">
            {preferences.appearance.fontSize}
          </div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-700 p-2 rounded">
          <span className="font-medium text-gray-700 dark:text-gray-300">
            Compact:
          </span>
          <div className="text-green-600 dark:text-green-400 font-semibold">
            {preferences.appearance.compactMode ? 'Yes' : 'No'}
          </div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-700 p-2 rounded">
          <span className="font-medium text-gray-700 dark:text-gray-300">
            Animations:
          </span>
          <div className="text-orange-600 dark:text-orange-400 font-semibold">
            {preferences.appearance.animations ? 'On' : 'Off'}
          </div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-700 p-2 rounded">
          <span className="font-medium text-gray-700 dark:text-gray-300">
            Default View:
          </span>
          <div className="text-indigo-600 dark:text-indigo-400 font-semibold">
            {preferences.dashboard.defaultView}
          </div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-700 p-2 rounded">
          <span className="font-medium text-gray-700 dark:text-gray-300">
            High Contrast:
          </span>
          <div className="text-red-600 dark:text-red-400 font-semibold">
            {preferences.accessibility.highContrast ? 'On' : 'Off'}
          </div>
        </div>
      </div>
      <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
        💡 Change these settings in your <strong>Profile → Preferences</strong>
      </div>
    </div>
  )
}

export { AdminPreferencesStatus }
