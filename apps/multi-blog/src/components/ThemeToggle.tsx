import { Monitor, Moon, Sun } from 'lucide-react'
import { usePreferences } from '@/data/hooks/useUserPreferences'

const ThemeToggle = () => {
  const { preferences, updatePreference } = usePreferences()
  const theme = preferences.appearance.theme

  const setTheme = (newTheme: 'light' | 'dark' | 'system') => {
    updatePreference('appearance', 'theme', newTheme)
  }

  const themes = [
    { id: 'light', label: 'Light', icon: Sun },
    { id: 'dark', label: 'Dark', icon: Moon },
    { id: 'system', label: 'System', icon: Monitor },
  ] as const

  return (
    <div className="relative">
      <div className="flex items-center bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg p-1">
        {themes.map(({ id, label, icon: Icon }) => (
          <button
            type="button"
            key={id}
            onClick={() => setTheme(id)}
            className={`flex items-center space-x-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${theme === id
              ? 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300'
              : 'text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-gray-200 hover:bg-slate-50 dark:hover:bg-gray-700'
              }`}
            title={`Switch to ${label} theme`}
          >
            <Icon size={14} />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

export default ThemeToggle
