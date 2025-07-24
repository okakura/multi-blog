/**
 * Themed components and utilities for the blog
 * Supports both hex colors and Tailwind gradient classes
 */
import type React from 'react'
import { useTheme } from '../contexts/ThemeContext'

// Utility function to check if a value is a Tailwind gradient
const isGradient = (value: string): boolean => {
  return value.includes('from-') && value.includes('to-')
}

/**
 * Hook to get theme-aware utilities
 */
export const useThemedUtils = () => {
  const { theme } = useTheme()

  return {
    // Check if a color is a gradient
    isGradient: (colorType: 'primary' | 'secondary' | 'accent') => {
      return isGradient(theme[colorType])
    },

    // Get CSS class for a theme color
    getColorClass: (
      colorType: 'primary' | 'secondary' | 'accent',
      variant: 'bg' | 'text' | 'border' = 'bg'
    ) => {
      const color = theme[colorType]

      if (isGradient(color)) {
        // For gradients, always use background
        return variant === 'bg' ? `bg-gradient-to-r ${color}` : ''
      } else {
        // For solid colors, return appropriate class
        return `${variant}-[${color}]`
      }
    },

    // Get raw color value
    getColor: (colorType: 'primary' | 'secondary' | 'accent') => {
      return theme[colorType]
    },

    // Get inline style for a theme color
    getColorStyle: (colorType: 'primary' | 'secondary' | 'accent') => {
      const color = theme[colorType]
      return isGradient(color)
        ? {} // Gradients need CSS classes, not inline styles
        : { backgroundColor: color }
    },
  }
}

/**
 * Hook to get theme-aware inline styles for backgrounds and gradients
 */
export const useThemeStyles = () => {
  const { theme } = useTheme()

  return {
    // Primary background
    primaryBg: {
      backgroundColor: isGradient(theme.primary)
        ? 'transparent'
        : theme.primary,
    },

    // Secondary background
    secondaryBg: {
      backgroundColor: isGradient(theme.secondary)
        ? 'transparent'
        : theme.secondary,
    },

    // Accent background
    accentBg: {
      backgroundColor: theme.accent,
    },

    // Primary to secondary gradient
    primaryGradient: {
      background:
        isGradient(theme.primary) || isGradient(theme.secondary)
          ? `linear-gradient(135deg, ${theme.primaryStart || theme.primary}, ${
              theme.secondaryStart || theme.secondary
            })`
          : `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`,
    },

    // Primary to accent gradient
    accentGradient: {
      background: isGradient(theme.primary)
        ? `linear-gradient(135deg, ${theme.primaryStart || theme.primary}, ${
            theme.accent
          })`
        : `linear-gradient(135deg, ${theme.primary}, ${theme.accent})`,
    },

    // Text colors
    primaryText: {
      color: isGradient(theme.primary)
        ? theme.primaryStart || '#3b82f6'
        : theme.primary,
    },

    secondaryText: {
      color: isGradient(theme.secondary)
        ? theme.secondaryStart || '#6366f1'
        : theme.secondary,
    },

    accentText: {
      color: theme.accent,
    },

    // Border colors
    primaryBorder: {
      borderColor: isGradient(theme.primary)
        ? theme.primaryStart || '#3b82f6'
        : theme.primary,
    },

    secondaryBorder: {
      borderColor: isGradient(theme.secondary)
        ? theme.secondaryStart || '#6366f1'
        : theme.secondary,
    },

    accentBorder: {
      borderColor: theme.accent,
    },
  }
}

/**
 * Component that renders a themed gradient background
 * Supports both gradient and solid color themes
 */
export const ThemedGradientBackground: React.FC<{
  children: React.ReactNode
  className?: string
  variant?: 'primary' | 'accent'
}> = ({ children, className = '', variant = 'primary' }) => {
  const { primaryGradient, accentGradient } = useThemeStyles()

  const gradientStyle = variant === 'primary' ? primaryGradient : accentGradient

  return (
    <div className={`relative ${className}`} style={gradientStyle}>
      {children}
    </div>
  )
}

/**
 * Component that renders a button with theme colors
 * Supports both gradient and solid color themes
 */
export const ThemedButton: React.FC<{
  children: React.ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'accent'
  className?: string
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
}> = ({
  children,
  onClick,
  variant = 'primary',
  className = '',
  disabled = false,
  type = 'button',
}) => {
  const { getColorClass, getColorStyle } = useThemedUtils()

  // Get the appropriate styling for the variant
  const colorClass = getColorClass(variant, 'bg')
  const colorStyle = getColorStyle(variant)

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 hover:shadow-lg hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 ${colorClass} ${className}`.trim()}
      style={colorStyle}>
      {children}
    </button>
  )
}

/**
 * Hook to get theme-aware Tailwind classes (for cases where inline styles aren't suitable)
 */
export const useThemeClasses = () => {
  const { getColorClass } = useThemedUtils()

  return {
    primaryBg: getColorClass('primary', 'bg'),
    secondaryBg: getColorClass('secondary', 'bg'),
    accentBg: getColorClass('accent', 'bg'),
    primaryText: getColorClass('primary', 'text'),
    secondaryText: getColorClass('secondary', 'text'),
    accentText: getColorClass('accent', 'text'),
    primaryBorder: getColorClass('primary', 'border'),
    secondaryBorder: getColorClass('secondary', 'border'),
    accentBorder: getColorClass('accent', 'border'),
  }
}
