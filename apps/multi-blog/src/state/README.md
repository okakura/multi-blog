# State Management Organization

This folder contains all Jotai-based state management for the multi-blog application.

## Structure

```
state/
├── atoms/           # Jotai atoms - the source of truth
│   └── analytics.ts # Analytics state atoms
├── hooks/           # React hooks that consume atoms
│   └── useAnalyticsDashboard.ts # Analytics dashboard hooks
├── providers/       # Data integration providers
│   └── useAnalyticsDataProvider.ts # SWR ↔ Jotai bridge
└── index.ts         # Central exports
```

## Philosophy

- **Atoms** (`atoms/`) are the single source of truth for application state
- **Hooks** (`hooks/`) provide clean React APIs for consuming atoms
- **Providers** (`providers/`) bridge external data sources (SWR, APIs) with atoms
- **Separation of Concerns**: Data fetching (SWR) vs State management (Jotai)

## Usage

### Import from organized paths:
```typescript
// Specific imports (recommended)
import { useAnalyticsData } from '@state/hooks/useAnalyticsDashboard'
import { analyticsDataAtom } from '@state/atoms/analytics'
import { useAnalyticsDataProvider } from '@state/providers/useAnalyticsDataProvider'

// Or bulk import (for convenience)
import { useAnalyticsData, analyticsDataAtom } from '@state'
```

### Provider Setup:
```typescript
function AnalyticsPage() {
  // Initialize data sync at component level
  useAnalyticsDataProvider()
  
  // Use clean hooks throughout the component tree
  const data = useAnalyticsData()
  const formatters = useAnalyticsFormatters()
  
  return <div>...</div>
}
```

## Benefits

- ✅ **No prop drilling** - state accessible anywhere
- ✅ **Granular reactivity** - only affected components re-render  
- ✅ **Type safety** - Full TypeScript support
- ✅ **Performance** - Built-in memoization and selective updates
- ✅ **Maintainable** - Clear separation of concerns
- ✅ **Scalable** - Easy to add new state without refactoring components
