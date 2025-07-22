import { useEffect, useState } from 'react'
import type { ThemeConfig } from '../contexts/ThemeContext'
import { useAdminDomainSettings } from './useAdminPosts'

/**
 * Hook to fetch and manage domain-specific theme configuration
 * This integrates with the AdminSettings theme system
 */
export const useDomainTheme = (hostname?: string) => {
  const [domainTheme, setDomainTheme] = useState<Partial<ThemeConfig> | null>(
    null
  )
  const [isLoading, setIsLoading] = useState(true)

  // Use the existing settings hook to get domain settings
  const {
    settings,
    isLoading: settingsLoading,
    updateSettings,
    error,
  } = useAdminDomainSettings(hostname || window.location.hostname)

  // Extract theme config from domain settings
  useEffect(() => {
    if (
      settings &&
      typeof settings === 'object' &&
      'theme_config' in settings
    ) {
      const themeConfig = settings.theme_config as ThemeConfig
      setDomainTheme(themeConfig)
    } else {
      // No custom theme, use defaults
      setDomainTheme(null)
    }
    setIsLoading(settingsLoading)
  }, [settings, settingsLoading])

  const updateDomainTheme = async (newTheme: Partial<ThemeConfig>) => {
    try {
      if (settings && typeof settings === 'object') {
        const updatedSettings = {
          ...settings,
          theme_config: {
            ...((settings.theme_config as ThemeConfig) || {}),
            ...newTheme,
          },
        }
        await updateSettings(updatedSettings)
        setDomainTheme(updatedSettings.theme_config as ThemeConfig)
      }
    } catch (error) {
      console.error('Failed to update domain theme:', error)
      throw error
    }
  }

  return {
    domainTheme,
    isLoading,
    error,
    updateDomainTheme,
  }
}

/**
 * Utility to get CSS custom properties for theme colors
 */
export const getThemeCSSVars = (theme: Partial<ThemeConfig>) => {
  return {
    '--color-primary': theme.primary || '#3b82f6',
    '--color-secondary': theme.secondary || '#6366f1',
    '--color-accent': theme.accent || '#8b5cf6',
    '--color-background': theme.background || '#ffffff',
    '--color-text': theme.text || '#1f2937',
  } as React.CSSProperties
}

/**
 * Utility to convert hex colors to Tailwind-compatible RGB values
 */
export const hexToRgb = (hex: string): string => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) return '0, 0, 0'

  const r = parseInt(result[1], 16)
  const g = parseInt(result[2], 16)
  const b = parseInt(result[3], 16)

  return `${r}, ${g}, ${b}`
}

/**
 * Generate Tailwind-compatible color classes from hex values
 */
export const generateColorClasses = (theme: Partial<ThemeConfig>) => {
  return {
    primary: {
      50: `rgb(${hexToRgb(theme.primary || '#3b82f6')} / 0.05)`,
      100: `rgb(${hexToRgb(theme.primary || '#3b82f6')} / 0.1)`,
      500: theme.primary || '#3b82f6',
      600: theme.primary || '#3b82f6',
      700: theme.primary || '#3b82f6',
    },
    secondary: {
      50: `rgb(${hexToRgb(theme.secondary || '#6366f1')} / 0.05)`,
      100: `rgb(${hexToRgb(theme.secondary || '#6366f1')} / 0.1)`,
      500: theme.secondary || '#6366f1',
      600: theme.secondary || '#6366f1',
      700: theme.secondary || '#6366f1',
    },
    accent: {
      50: `rgb(${hexToRgb(theme.accent || '#8b5cf6')} / 0.05)`,
      100: `rgb(${hexToRgb(theme.accent || '#8b5cf6')} / 0.1)`,
      500: theme.accent || '#8b5cf6',
      600: theme.accent || '#8b5cf6',
      700: theme.accent || '#8b5cf6',
    },
  }
}
