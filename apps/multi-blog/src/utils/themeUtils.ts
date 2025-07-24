/**
 * Utilities for handling theme colors that can be either hex colors or Tailwind gradients
 */

// Mapping of Tailwind color names to hex values (commonly used ones)
const TAILWIND_COLOR_MAP: Record<string, string> = {
  // Reds
  'red-400': '#f87171',
  'red-500': '#ef4444',
  'red-600': '#dc2626',
  'rose-400': '#fb7185',
  'rose-500': '#f43f5e',
  'rose-600': '#e11d48',

  // Pinks
  'pink-400': '#f472b6',
  'pink-500': '#ec4899',
  'pink-600': '#db2777',

  // Purples
  'purple-400': '#c084fc',
  'purple-500': '#a855f7',
  'purple-600': '#9333ea',
  'violet-400': '#a78bfa',
  'violet-500': '#8b5cf6',
  'violet-600': '#7c3aed',

  // Blues
  'blue-400': '#60a5fa',
  'blue-500': '#3b82f6',
  'blue-600': '#2563eb',
  'sky-400': '#38bdf8',
  'sky-500': '#0ea5e9',
  'sky-600': '#0284c7',
  'cyan-400': '#22d3ee',
  'cyan-500': '#06b6d4',
  'cyan-600': '#0891b2',

  // Greens
  'green-400': '#4ade80',
  'green-500': '#22c55e',
  'green-600': '#16a34a',
  'emerald-400': '#34d399',
  'emerald-500': '#10b981',
  'emerald-600': '#059669',
  'teal-400': '#2dd4bf',
  'teal-500': '#14b8a6',
  'teal-600': '#0d9488',

  // Yellows/Oranges
  'yellow-400': '#facc15',
  'yellow-500': '#eab308',
  'orange-400': '#fb923c',
  'orange-500': '#f97316',
  'orange-600': '#ea580c',

  // Grays
  'gray-400': '#9ca3af',
  'gray-500': '#6b7280',
  'gray-600': '#4b5563',
  'gray-700': '#374151',
  'gray-800': '#1f2937',
  'gray-900': '#111827',
  'slate-400': '#94a3b8',
  'slate-500': '#64748b',
  'slate-600': '#475569',
  'slate-700': '#334155',
  'slate-800': '#1e293b',
  'slate-900': '#0f172a',
}

export interface GradientColors {
  start: string
  end: string
}

export interface ThemeColorConfig {
  value: string // The actual value (hex or gradient)
  type: 'hex' | 'gradient'
  gradient?: GradientColors // Only present if type is 'gradient'
}

/**
 * Parse a Tailwind gradient string and extract start/end colors
 * @param gradient - e.g., "from-pink-500 to-rose-500"
 * @returns Object with start and end hex colors
 */
export function parseGradient(gradient: string): GradientColors | null {
  const gradientMatch = gradient.match(/from-(\S+)\s+to-(\S+)/)
  if (!gradientMatch) return null

  const [, startColor, endColor] = gradientMatch

  return {
    start: TAILWIND_COLOR_MAP[startColor] || '#3b82f6',
    end: TAILWIND_COLOR_MAP[endColor] || '#6366f1',
  }
}

/**
 * Create a Tailwind gradient from two hex colors
 * @param startColor - hex color like "#ec4899"
 * @param endColor - hex color like "#f43f5e"
 * @returns Tailwind gradient string like "from-pink-500 to-rose-500"
 */
export function createGradient(startColor: string, endColor: string): string {
  // Find closest Tailwind colors (simplified - you could make this more sophisticated)
  const findClosestTailwindColor = (hex: string): string => {
    // Simple fallback - in a real app you might want color distance calculation
    for (const [name, value] of Object.entries(TAILWIND_COLOR_MAP)) {
      if (value.toLowerCase() === hex.toLowerCase()) {
        return name
      }
    }
    // Fallback to a reasonable default or use the hex directly
    return `[${hex}]` // Arbitrary value syntax
  }

  const startTw = findClosestTailwindColor(startColor)
  const endTw = findClosestTailwindColor(endColor)

  return `from-${startTw} to-${endTw}`
}

/**
 * Analyze a theme color value and return its configuration
 * @param value - hex color or Tailwind gradient
 */
export function analyzeThemeColor(value: string): ThemeColorConfig {
  if (value.startsWith('from-')) {
    const gradient = parseGradient(value)
    return {
      value,
      type: 'gradient',
      gradient: gradient || { start: '#3b82f6', end: '#6366f1' },
    }
  }

  return {
    value,
    type: 'hex',
  }
}

/**
 * Convert theme colors to be compatible with both systems
 * @param primary - primary color (hex or gradient)
 * @param secondary - secondary color (hex or gradient)
 */
export function normalizeThemeColors(primary: string, secondary: string) {
  const primaryConfig = analyzeThemeColor(primary)
  const secondaryConfig = analyzeThemeColor(secondary)

  return {
    primary: primaryConfig.value,
    secondary: secondaryConfig.value,
    primaryStart: primaryConfig.gradient?.start,
    primaryEnd: primaryConfig.gradient?.end,
    secondaryStart: secondaryConfig.gradient?.start,
    secondaryEnd: secondaryConfig.gradient?.end,
  }
}

/**
 * Get CSS class for using theme colors with Tailwind
 */
export function getThemeGradientClass(
  colorType: 'primary' | 'secondary'
): string {
  return `bg-gradient-to-r var(--color-${colorType}-gradient, from-blue-500 to-purple-600)`
}
