import React from 'react'
import { usePreferences } from '../hooks/useUserPreferences'

const PreferencesDebug: React.FC = () => {
  const { preferences } = usePreferences()

  return (
    <div className='fixed bottom-4 right-4 max-w-sm p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg'>
      <h4 className='text-sm font-semibold text-gray-900 dark:text-white mb-2'>
        Current Preferences
      </h4>
      <div className='text-xs text-gray-600 dark:text-gray-400 space-y-1'>
        <div>
          <strong>Theme:</strong> {preferences.appearance.theme}
        </div>
        <div>
          <strong>Font Size:</strong> {preferences.appearance.fontSize}
        </div>
        <div>
          <strong>Animations:</strong>{' '}
          {preferences.appearance.animations ? 'On' : 'Off'}
        </div>
        <div>
          <strong>Compact Mode:</strong>{' '}
          {preferences.appearance.compactMode ? 'On' : 'Off'}
        </div>
        <div>
          <strong>Auto Save:</strong> {preferences.content.autoSaveInterval}s
        </div>
        <div>
          <strong>Language:</strong> {preferences.localization.language}
        </div>
        <div>
          <strong>Time Zone:</strong> {preferences.localization.timezone}
        </div>
        <div>
          <strong>Privacy:</strong> {preferences.privacy.profileVisibility}
        </div>
      </div>
    </div>
  )
}
