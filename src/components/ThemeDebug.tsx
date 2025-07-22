import type React from 'react'
import { useEffect, useState } from 'react'
import { usePreferences } from '../hooks/useUserPreferences'

const ThemeDebug: React.FC = () => {
  const { preferences, updatePreference } = usePreferences()
  const theme = preferences.appearance.theme
  const [documentClass, setDocumentClass] = useState('')

  // Calculate effective theme
  const effectiveTheme =
    theme === 'system'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
      : theme

  const setTheme = (newTheme: 'light' | 'dark' | 'system') => {
    updatePreference('appearance', 'theme', newTheme)
  }

  useEffect(() => {
    // Check what's actually on the document element
    const observer = new MutationObserver(() => {
      setDocumentClass(document.documentElement.className)
    })

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    })

    // Initial state
    setDocumentClass(document.documentElement.className)

    return () => observer.disconnect()
  }, [])

  return (
    <div className="fixed bottom-4 right-4 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg text-xs font-mono z-50">
      <h3 className="font-bold mb-2 text-gray-900 dark:text-gray-100">
        Theme Debug
      </h3>

      {/* Test element to verify dark mode classes work */}
      <div className="mb-2 p-2 bg-blue-100 dark:bg-red-500 rounded">
        <div className="text-blue-900 dark:text-white">
          Test: Should be blue in light, red in dark
        </div>
      </div>

      <div className="space-y-1 text-gray-700 dark:text-gray-300">
        <div>
          Theme: <span className="font-bold">{theme}</span>
        </div>
        <div>
          Effective: <span className="font-bold">{effectiveTheme}</span>
        </div>
        <div>
          Document class:{' '}
          <span className="font-bold">{documentClass || 'none'}</span>
        </div>
        <div>
          System prefers:{' '}
          <span className="font-bold">
            {window.matchMedia('(prefers-color-scheme: dark)').matches
              ? 'dark'
              : 'light'}
          </span>
        </div>
      </div>
      <div className="mt-2 space-x-1">
        <button
          onClick={() => setTheme('light')}
          className="px-2 py-1 bg-blue-500 text-white rounded text-xs"
        >
          Light
        </button>
        <button
          onClick={() => setTheme('dark')}
          className="px-2 py-1 bg-gray-800 text-white rounded text-xs"
        >
          Dark
        </button>
        <button
          onClick={() => setTheme('system')}
          className="px-2 py-1 bg-purple-500 text-white rounded text-xs"
        >
          System
        </button>
      </div>
    </div>
  )
}

export default ThemeDebug
