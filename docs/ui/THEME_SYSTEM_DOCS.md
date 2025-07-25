# Enhanced Theme System - Component Documentation

## Overview

The `ThemedComponents.tsx` file now provides a complete, unified solution for handling both Tailwind gradient classes and individual hex colors in your theme system.

## Core Features

### 🔧 Utility Hooks

#### `useThemedUtils()`

```tsx
const { isGradient, getColorClass, getColor, getColorStyle } = useThemedUtils()

// Check if a color is a gradient
isGradient('primary') // true for "from-pink-500 to-rose-500", false for "#ec4899"

// Get CSS class (handles both gradients and solid colors)
getColorClass('primary', 'bg') // "bg-gradient-to-r from-pink-500 to-rose-500" OR "bg-[#ec4899]"

// Get raw color value
getColor('primary') // "from-pink-500 to-rose-500" OR "#ec4899"

// Get inline style (only for solid colors)
getColorStyle('primary') // {} for gradients, { backgroundColor: "#ec4899" } for solid
```

#### `useThemeStyles()`

```tsx
const { primaryBg, secondaryBg, accentBg, primaryGradient, accentGradient, primaryText, accentText } = useThemeStyles()

// Use inline styles
<div style={primaryGradient}>Gradient background</div>
<span style={accentText}>Accent colored text</span>
```

#### `useThemeClasses()`

```tsx
const { primaryBg, secondaryBg, accentBg } = useThemeClasses()

// Use with className
<div className={primaryBg}>Background with theme color</div>
```

### 🎨 Components

#### `ThemedButton`

```tsx
<ThemedButton variant="primary" onClick={handleClick}>
  Primary Button
</ThemedButton>
<ThemedButton variant="secondary" size="lg">
  Large Secondary Button
</ThemedButton>
```

- Automatically handles gradients vs solid colors
- Variants: `primary`, `secondary`, `accent`
- Sizes: `sm`, `md`, `lg`

#### `ThemedGradientBackground`

```tsx
<ThemedGradientBackground variant='primary' className='p-6 rounded-lg'>
  <h1>Content with gradient background</h1>
</ThemedGradientBackground>
```

- Creates gradients from theme colors
- Variants: `primary` (primary→secondary), `accent` (primary→accent)
- Adapts to both gradient and solid color themes

## Usage Examples

### With Existing Tailwind Gradients

```json
// Database theme config
{
  "primary": "from-pink-500 to-rose-500",
  "secondary": "from-orange-400 to-pink-500",
  "accent": "#ec4899"
}
```

```tsx
// Component usage
const { getColorClass } = useThemedUtils()

// Results in: "bg-gradient-to-r from-pink-500 to-rose-500"
<div className={getColorClass('primary', 'bg')}>
  Gradient background
</div>
```

### With Individual Hex Colors

```json
// Database theme config
{
  "primary": "#ec4899",
  "secondary": "#f43f5e",
  "accent": "#8b5cf6"
}
```

```tsx
// Component usage - same code!
const { getColorClass } = useThemedUtils()

// Results in: "bg-[#ec4899]"
<div className={getColorClass('primary', 'bg')}>
  Solid color background
</div>
```

## Admin Interface Integration

The AdminSettings component automatically:

- Detects gradient vs solid color mode
- Shows appropriate UI (gradient text inputs vs color pickers)
- Provides gradient presets
- Maintains backwards compatibility

## Key Benefits

1. **Unified API**: Same functions work for both gradient and solid color themes
2. **Backwards Compatible**: Existing gradient data works without changes
3. **Flexible**: Choose between CSS classes or inline styles as needed
4. **Type Safe**: Full TypeScript support
5. **Performance**: Smart detection avoids unnecessary processing
6. **No Duplicates**: Single source of truth in `ThemedComponents.tsx`

## Migration from Old System

If you were using the old `useThemeStyles()` hook:

```tsx
// Old way
const { primaryBg } = useThemeStyles()
<div style={primaryBg}>Content</div>

// New way (same API, but gradient-aware)
const { primaryBg } = useThemeStyles()
<div style={primaryBg}>Content</div>
```

The new system maintains the same API while adding gradient support automatically.
