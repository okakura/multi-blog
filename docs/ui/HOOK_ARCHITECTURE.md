# Hook Architecture Documentation

## Post Management Hooks

After cleaning up duplicate and confusing hooks, here's the clear structure:

### `useAdminPosts` (Admin Interface)

**Location:** `src/hooks/useAdminPosts.ts`
**Purpose:** Full CRUD operations for admin users managing posts
**Used by:** Admin panels (AdminPosts.tsx, AdminEditPost.tsx, etc.)
**Features:**

- Create, read, update, delete posts
- Domain filtering (`'all'` or specific domain)
- Admin-level permissions
- Optimistic updates with SWR
- Analytics and stats integration

### `useBlogPosts` (Public Blog)

**Location:** `src/hooks/useBlogPosts.ts`
**Purpose:** Read-only post fetching for public blog pages
**Used by:** Public blog pages and components
**Features:**

- Read-only post fetching
- Category filtering
- Search functionality
- Public API endpoints
- Pagination support

### `useAdminUsers` (User Management)

**Location:** `src/hooks/useAdminUsers.ts`
**Purpose:** Admin user management
**Features:**

- User CRUD operations
- Role and permission management
- Performance metrics tracking

## Removed Files (Duplicates/Unused)

- ❌ `usePosts.ts` - Duplicate functionality, unused
- ❌ `useSwrApiPosts.ts` - Empty file from abandoned refactor

## Architecture Pattern

- **Admin hooks** (`useAdmin*`) - Full CRUD with authentication
- **Blog hooks** (`useBlog*`) - Read-only public access
- **User hooks** (`useUser*`, `useAdmin*`) - Authentication and preferences

This clean separation eliminates confusion and makes the codebase much easier to navigate!
