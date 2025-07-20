# Domain Management System

## Overview

The domain management system has been consolidated into a single, unified context that handles both subdomain-based and path-based domain routing efficiently.

## Architecture

### Before (Duplicated Logic)

- ❌ `useDomain` hook with domain detection logic
- ❌ `DomainContext` with separate domain detection logic
- ❌ Manual domain detection in components
- ❌ Inconsistent domain state management

### After (Unified Context)

- ✅ Single `DomainContext` with comprehensive domain management
- ✅ Automatic subdomain and URL parameter detection
- ✅ Centralized domain configuration
- ✅ Consistent domain state across the application

## Features

### 1. **Dual Mode Support**

```typescript
// Subdomain Mode: tech.yoursite.com
isSubdomainMode: true
detectedDomain: 'tech.blog'

// Path Mode: yoursite.com/blog/tech.blog
isSubdomainMode: false
detectedDomain: undefined
```

### 2. **Priority System**

1. **URL Parameter** (highest): `/blog/lifestyle.blog`
2. **Subdomain Detection**: `lifestyle.yoursite.com`
3. **Default Fallback** (lowest): `tech.blog`

### 3. **Smart Domain Resolution**

```typescript
const { currentDomain, config, isSubdomainMode } = useDomain()

// Always returns the correct domain regardless of routing method
// Automatically provides the matching configuration
```

## Usage

### In Components

```tsx
import { useDomain } from '../contexts/DomainContext'

const MyComponent = () => {
  const { currentDomain, config, setDomain } = useDomain()

  return (
    <div className={config.theme.primary}>
      <h1>{config.name}</h1>
      <p>Current domain: {currentDomain}</p>
    </div>
  )
}
```

### Domain Switching

```tsx
const handleDomainChange = (newDomain: DomainType) => {
  setDomain(newDomain)
  navigate(`/blog/${newDomain}`)
}
```

## Configuration

### Domain Configs

Each domain has its own configuration in `/config/domains.ts`:

```typescript
export const domainConfigs = {
  'tech.blog': {
    name: 'TechInsights',
    logo: '⚡',
    theme: {
      primary: 'from-blue-600 to-purple-600',
      secondary: 'from-purple-600 to-pink-600',
    },
  },
  // ... other domains
}
```

## Debug Information

In development mode, a debug panel shows:

- Current domain
- Detection mode (subdomain vs path)
- Detected domain (if any)
- Current configuration
- Host and path information

## Benefits

1. **No Duplication**: Single source of truth for domain logic
2. **Flexible Routing**: Supports both subdomain and path-based routing
3. **Type Safety**: Full TypeScript support with proper types
4. **Performance**: Memoized configurations and optimized re-renders
5. **Developer Experience**: Clear debug information and consistent API

## Migration Notes

- Removed `src/hooks/useDomain.ts` (logic moved to context)
- Import `useDomain` from `'../contexts/DomainContext'` instead
- No breaking changes to the API - same function signature
- Enhanced with additional properties (`isSubdomainMode`, `detectedDomain`)

## Testing

The system automatically detects:

- Local development: `localhost:5174/blog/tech.blog` (path mode)
- Subdomain setup: `tech.localhost:5174` (subdomain mode)
- Production domains: `tech.yourdomain.com` (subdomain mode)

This unified approach eliminates complexity while providing maximum flexibility for domain-based multi-tenancy.
