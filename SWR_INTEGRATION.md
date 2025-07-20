# SWR Integration Guide

## What's New

Your blog platform now uses SWR (stale-while-revalidate) for efficient data fetching! Here's what this gives you:

### Benefits of SWR Integration

1. **Automatic Caching**: Data is cached and reused across components
2. **Background Revalidation**: Fresh data is fetched in the background
3. **Focus Revalidation**: Data updates when you return to the tab
4. **Error Retry**: Automatic retry on failed requests
5. **Optimistic Updates**: Instant UI updates with background sync
6. **Deduplication**: Prevents duplicate requests

### How to Use

#### Basic Post Fetching (Already integrated)

```typescript
const { currentPosts, loading, error } = useApiPosts(currentDomain)
```

#### Search with SWR

```typescript
const { searchPosts } = useApiPosts(currentDomain)
await searchPosts('React') // Automatically cached!
```

#### Single Post Fetching

```typescript
import { useApiPost } from './hooks/useSwrApiPosts'

const { post, loading, error } = useApiPost(currentDomain, 'post-slug')
```

#### Manual Cache Control

```typescript
const { refresh, mutate } = useApiPosts(currentDomain)

// Refresh all data
refresh()

// Optimistic update
mutate(newData, false) // Update cache without revalidation
```

### Configuration

SWR is configured in `src/lib/swr.ts` with:

- 10-second cache for post lists
- 30-second cache for individual posts
- 5-second cache for search results
- Automatic error retry (3 attempts)
- Background revalidation disabled on focus (configurable)

### Cache Keys

Cache keys are structured for efficient invalidation:

- Posts: `["/posts?page=1&limit=10", "tech.blog"]`
- Search: `["/search?q=react", "tech.blog"]`
- Single Post: `["/posts/post-slug", "tech.blog"]`

### Advanced Usage

#### Clear all cache for a domain

```typescript
import { mutate } from 'swr'

// Clear all tech.blog cache
mutate((key) => Array.isArray(key) && key[1] === 'tech.blog', undefined, false)
```

#### Prefetch data

```typescript
import { mutate } from 'swr'
import { createCacheKey } from './lib/swr'

// Prefetch posts for faster navigation
mutate(createCacheKey.posts('lifestyle.blog'))
```

## What Changed

1. **New Files**:

   - `src/lib/swr.ts` - SWR configuration and cache key helpers
   - `src/hooks/useSwrApiPosts.ts` - SWR-powered data hooks
   - `src/providers/SWRProvider.tsx` - SWR context provider

2. **Updated Files**:

   - `src/index.tsx` - Added SWRProvider wrapper
   - `src/App.tsx` - Now uses SWR-powered hooks

3. **Benefits**:
   - Faster navigation (cached data)
   - Better UX (optimistic updates)
   - Reduced API calls (deduplication)
   - Automatic error handling
   - Background data freshness

Your app now has enterprise-level data fetching with minimal overhead!
