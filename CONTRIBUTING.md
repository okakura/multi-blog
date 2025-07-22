# Contributing to Multi-Blog Platform

Thank you for your interest in contributing! This document provides guidelines for developing and contributing to the project.

## 🚀 Quick Start

1. **Fork and clone the repository**
2. **Set up development environment**:
   ```bash
   make setup
   ```
3. **Start development servers**:
   ```bash
   make dev-both
   ```

## �️ Development Workflow

### Prerequisites

- Node.js 18+ and pnpm
- Rust 1.70+
- PostgreSQL (via Docker)
- Git

### Initial Setup

```bash
# Check prerequisites
make check-deps

# Complete setup (installs deps, starts database, etc.)
make setup

# Verify everything works
make health
```

### Daily Development

```bash
# Start both servers
make dev-both

# Or start individually
make dev-frontend  # Frontend only (port 5173)
make dev-backend   # Backend only (port 8000)
```

### Before Committing

```bash
# Run all quality checks
make check

# Fix auto-fixable issues
make fix

# Run tests
make test
```

## 📝 Code Style

### Frontend (TypeScript/React)

We use **Biome** for linting and formatting:

```bash
# Check for issues
make lint

# Auto-fix issues
make lint-fix

# Format code
make format
```

**Key conventions:**

- Use TypeScript for all new code
- Prefer functional components with hooks
- Use SWR for data fetching
- Follow React best practices for state management
- Use Tailwind CSS for styling

### Backend (Rust)

```bash
# Check linting
cd api && cargo clippy

# Format code
cd api && cargo fmt

# Run tests
cd api && cargo test
```

## 🏗️ Architecture Guidelines

### Frontend Structure

```
src/
├── components/          # Reusable UI components
│   ├── admin/          # Admin-specific components
│   └── modals/         # Modal dialogs
├── pages/              # Page-level components
├── hooks/              # Custom hooks for data and logic
├── services/           # API calls and external services
├── contexts/           # React contexts for global state
├── types/              # TypeScript type definitions
└── utils/              # Helper functions
```

### Backend Structure

```
api/src/
├── handlers/           # Route handlers by feature
├── bin/               # Binary utilities and tools
├── lib.rs             # Shared middleware and utilities
└── main.rs            # Application entry point
```

## � Making Changes

### 1. Create a Feature Branch

```bash
git checkout -b feature/your-feature-name
```

### 2. Make Your Changes

- Follow the existing code style
- Add tests for new functionality
- Update documentation if needed

### 3. Test Your Changes

```bash
# Run all tests
make test

# Check code quality
make check

# Test the application manually
make dev-both
```

### 4. Commit and Push

```bash
# Stage changes
git add .

# Commit with descriptive message
git commit -m "feat: add user profile management"

# Push to your fork
git push origin feature/your-feature-name
```

### 5. Create Pull Request

- Describe what your changes do
- Reference any related issues
- Include screenshots for UI changes
- Ensure CI checks pass

## 🧪 Testing

### Running Tests

```bash
# All tests
make test

# Frontend only
make test-frontend

# Backend only
make test-backend
```

### Writing Tests

**Frontend:**

- Use React Testing Library for component tests
- Mock API calls in tests
- Test user interactions and accessibility

**Backend:**

- Write unit tests for handlers and utilities
- Use integration tests for full request/response cycles
- Test error conditions and edge cases

## 📊 Database Changes

### Adding Migrations

1. Create a new migration file in `api/migrations/`
2. Use sequential numbering: `004_your_migration.sql`
3. Include both `-- +migrate Up` and `-- +migrate Down` sections
4. Test the migration thoroughly

### Example Migration

```sql
-- +migrate Up
CREATE TABLE example (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- +migrate Down
DROP TABLE example;
```

## 📝 Commit Messages

Use conventional commit format:

```
type(scope): description

feat(auth): add password reset functionality
fix(api): resolve CORS issues for admin endpoints
docs(readme): update installation instructions
```

## 🐛 Bug Reports

When filing bug reports, please include:

- Clear description of the issue
- Steps to reproduce
- Expected vs actual behavior
- Browser/environment information
- Screenshots if applicable
- Error messages and logs

## ✨ Feature Requests

Before submitting feature requests:

- Check existing issues to avoid duplicates
- Provide clear use cases and benefits
- Consider backward compatibility
- Discuss large changes in issues first

## 🤝 Review Process

### What We Look For

- **Functionality**: Does it work as intended?
- **Code Quality**: Is it readable and maintainable?
- **Tests**: Are there appropriate tests?
- **Documentation**: Is it properly documented?
- **Performance**: Does it impact performance?

### Review Workflow

1. Automated checks must pass
2. Manual code review by maintainers
3. Testing of functionality
4. Documentation review
5. Merge after approval

## 💬 Getting Help

- Check existing issues and discussions
- Review documentation and README
- Use `make help` for development commands
- Ask questions in issue discussions

## 🙏 Recognition

Contributors are recognized in:

- Git commit history
- Release notes for significant features
- Project documentation

Thank you for contributing to Multi-Blog Platform!

- `feat`: New features
- `fix`: Bug fixes
- `docs`: Documentation
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Test additions/changes
- `chore`: Maintenance tasks

## 🔀 Pull Request Process

1. **Create a feature branch** from `main`
2. **Make your changes** following the style guidelines
3. **Add tests** for new functionality
4. **Update documentation** if needed
5. **Test thoroughly** locally
6. **Submit a pull request** with:
   - Clear title and description
   - Link to related issues
   - Screenshots for UI changes
   - Testing instructions

### Pull Request Checklist

- [ ] Code follows project style guidelines
- [ ] Tests pass locally
- [ ] New functionality has tests
- [ ] Documentation is updated
- [ ] No breaking changes (or clearly documented)
- [ ] PR description is clear and complete

## 🏷️ Versioning

We use [Semantic Versioning](https://semver.org/):

- **MAJOR**: Incompatible API changes
- **MINOR**: New functionality (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

## 📞 Getting Help

- **Issues**: For bugs and feature requests
- **Discussions**: For questions and general discussion
- **Documentation**: Check the README and docs/ folder

## 🙏 Recognition

Contributors will be recognized in:

- CHANGELOG.md for significant contributions
- README.md contributors section
- Release notes for major features

Thank you for contributing to Multi-Blog Platform! 🎉
