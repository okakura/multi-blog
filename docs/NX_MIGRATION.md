# Nx Migration Guide

This document explains the changes made when migrating the Multi-Blog Platform to an Nx monorepo.

## What Changed

### Project Structure

**Before (Simple Monorepo):**
```
multi-blog/
├── src/                    # Frontend source
├── api/                    # Backend source
├── public/                 # Static assets
├── package.json            # Single package.json
└── docker-compose.yml      # Services
```

**After (Nx Monorepo):**
```
multi-blog/
├── apps/
│   ├── multi-blog/         # Frontend application
│   └── api/                # Backend application
├── services/               # Infrastructure services
├── libs/                   # Shared libraries (future)
├── nx.json                 # Nx configuration
└── package.json            # Root package.json
```

### Command Changes

| Old Command | New Nx Command | Legacy Support |
|-------------|----------------|----------------|
| `pnpm dev` | `nx run multi-blog:serve` | ✅ `make dev-frontend` |
| `cd api && cargo run` | `nx run api:serve` | ✅ `make dev-backend` |
| `pnpm build` | `nx run multi-blog:build` | ✅ `make build` |
| `pnpm test` | `nx run-many --target=test` | ✅ `make test` |
| `pnpm lint` | `nx run-many --target=lint` | ✅ `make lint` |

### New Capabilities

1. **Task Orchestration**: Nx manages dependencies between tasks
2. **Caching**: Build and test results are cached for faster rebuilds
3. **Affected Commands**: Only run tasks on changed projects
4. **Plugin Ecosystem**: Rust support via `@monodon/rust` plugin
5. **Better Tooling**: Enhanced developer experience

### Migration Benefits

- **Faster Builds**: Nx caching reduces build times
- **Better Organization**: Clear separation of frontend/backend
- **Scalability**: Easy to add new applications and libraries
- **Consistent Tooling**: Unified task runner across languages
- **Future Ready**: Foundation for microservices and shared libraries

## Quick Start for Existing Developers

If you're familiar with the old setup:

```bash
# Instead of npm/pnpm install
pnpm install

# Instead of starting services manually
nx run services:up

# Instead of cd api && cargo run
nx run api:serve

# Instead of pnpm dev (frontend)
nx run multi-blog:serve

# Or use the new all-in-one command
pnpm dev-all
```

## Backwards Compatibility

- **Makefile commands still work** - No need to change your workflow immediately
- **All functionality preserved** - Same features, better organization
- **Environment variables unchanged** - Same `.env` setup
- **Docker services identical** - Same database and monitoring setup

## Future Enhancements

With Nx in place, we can now easily:

- Add new applications (admin dashboard, mobile app, etc.)
- Create shared libraries for common code
- Implement more sophisticated build pipelines
- Add code generation and scaffolding tools
- Integrate with Nx Cloud for distributed caching

## Need Help?

- Check the [main README](./README.md) for complete setup instructions
- See [CONTRIBUTING.md](./CONTRIBUTING.md) for development workflow
- Makefile commands are still available as fallbacks
