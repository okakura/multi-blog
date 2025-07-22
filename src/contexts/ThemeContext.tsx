import type React from 'react'
import { createContext, useContext, useEffect, useState } from 'react'

export interface ThemeConfig {
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

interface ThemeContextType {
  theme: ThemeConfig
  updateTheme: (newTheme: Partial<ThemeConfig>) => void
  resetTheme: () => void
  isDarkMode: boolean
}

const defaultTheme: ThemeConfig = {
  primary: '#3b82f6',
  secondary: '#6366f1',
  accent: '#8b5cf6',
  background: '#ffffff',
  text: '#1f2937',
  mode: 'light',
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

interface ThemeProviderProps {
  children: React.ReactNode
  domainTheme?: Partial<ThemeConfig>
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  domainTheme,
}) => {
  const [theme, setTheme] = useState<ThemeConfig>(() => {
    // If domainTheme is provided, prioritize it over localStorage
    if (domainTheme) {
      return { ...defaultTheme, ...domainTheme }
    }

    // Otherwise, load theme from localStorage or use default
    const savedTheme = localStorage.getItem('blog-theme')
    if (savedTheme) {
      try {
        return { ...defaultTheme, ...JSON.parse(savedTheme) }
      } catch (error) {
        console.error('Failed to parse saved theme:', error)
      }
    }
    return defaultTheme
  })

  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (theme.mode === 'auto') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches
    }
    return theme.mode === 'dark'
  })

  // Apply domain theme when it changes
  useEffect(() => {
    if (domainTheme) {
      setTheme({ ...defaultTheme, ...domainTheme })
    }
  }, [domainTheme])

  // Handle auto theme mode
  useEffect(() => {
    if (theme.mode === 'auto') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      const handleChange = (e: MediaQueryListEvent) => {
        setIsDarkMode(e.matches)
      }

      setIsDarkMode(mediaQuery.matches)
      mediaQuery.addEventListener('change', handleChange)
      return () => mediaQuery.removeEventListener('change', handleChange)
    } else {
      setIsDarkMode(theme.mode === 'dark')
    }
  }, [theme.mode])

  // Apply CSS custom properties
  useEffect(() => {
    const root = document.documentElement

    // Handle both hex colors and Tailwind gradients
    const setPrimaryColors = (primary: string) => {
      if (primary.startsWith('from-')) {
        // It's a Tailwind gradient, extract individual colors
        root.style.setProperty('--color-primary-gradient', primary)
        root.style.setProperty(
          '--color-primary',
          theme.primaryStart || '#3b82f6'
        )
      } else {
        // It's a hex color
        root.style.setProperty('--color-primary', primary)
        root.style.setProperty(
          '--color-primary-gradient',
          `from-[${primary}] to-[${primary}]`
        )
      }
    }

    const setSecondaryColors = (secondary: string) => {
      if (secondary.startsWith('from-')) {
        // It's a Tailwind gradient
        root.style.setProperty('--color-secondary-gradient', secondary)
        root.style.setProperty(
          '--color-secondary',
          theme.secondaryStart || '#6366f1'
        )
      } else {
        // It's a hex color
        root.style.setProperty('--color-secondary', secondary)
        root.style.setProperty(
          '--color-secondary-gradient',
          `from-[${secondary}] to-[${secondary}]`
        )
      }
    }

    setPrimaryColors(theme.primary)
    setSecondaryColors(theme.secondary)
    root.style.setProperty('--color-accent', theme.accent)
    root.style.setProperty('--color-background', theme.background)
    root.style.setProperty('--color-text', theme.text)

    // Add/remove dark class
    if (isDarkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [theme, isDarkMode])

  const updateTheme = (newTheme: Partial<ThemeConfig>) => {
    const updatedTheme = { ...theme, ...newTheme }
    setTheme(updatedTheme)

    // Save to localStorage (exclude domain-specific overrides)
    const themeToSave = { ...updatedTheme }
    localStorage.setItem('blog-theme', JSON.stringify(themeToSave))
  }

  const resetTheme = () => {
    setTheme({ ...defaultTheme, ...domainTheme })
    localStorage.removeItem('blog-theme')
  }

  const value: ThemeContextType = {
    theme,
    updateTheme,
    resetTheme,
    isDarkMode,
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
