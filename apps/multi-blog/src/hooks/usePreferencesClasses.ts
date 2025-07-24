import { useMemo } from 'react'
import { usePreferences } from '@/data/hooks/useUserPreferences'

export const usePreferencesClasses = () => {
  const { preferences } = usePreferences()

  return useMemo(() => {
    // Font size classes
    const getFontSizeClasses = () => {
      const sizeMap = {
        small: 'text-sm',
        medium: 'text-base',
        large: 'text-lg',
        'extra-large': 'text-xl',
      }
      return sizeMap[preferences.appearance.fontSize] || 'text-base'
    }

    // Reading width classes
    const getReadingWidthClasses = () => {
      const widthMap = {
        narrow: 'max-w-2xl',
        medium: 'max-w-4xl',
        wide: 'max-w-6xl',
      }
      return widthMap[preferences.appearance.readingWidth] || 'max-w-4xl'
    }

    // Compact mode classes
    const getSpacingClasses = () => {
      return preferences.appearance.compactMode
        ? 'space-y-2 py-2'
        : 'space-y-4 py-4'
    }

    // Animation classes
    const getAnimationClasses = () => {
      return preferences.appearance.animations
        ? 'transition-all duration-200'
        : ''
    }

    // High contrast classes
    const getContrastClasses = () => {
      return preferences.accessibility.highContrast
        ? 'contrast-125 saturate-110'
        : ''
    }

    // Pre-compute values to avoid function calls during render
    const fontSizeClasses = getFontSizeClasses()
    const readingWidthClasses = getReadingWidthClasses()
    const spacingClasses = getSpacingClasses()
    const animationClasses = getAnimationClasses()
    const contrastClasses = getContrastClasses()

    return {
      fontSizeClasses,
      readingWidthClasses,
      spacingClasses,
      animationClasses,
      contrastClasses,

      // Combined utility for content areas
      getContentClasses: () =>
        `${fontSizeClasses} ${readingWidthClasses} ${spacingClasses} ${animationClasses}`,

      // Combined utility for the whole app
      getAppClasses: () => `${contrastClasses}`,
    }
  }, [preferences])
}
