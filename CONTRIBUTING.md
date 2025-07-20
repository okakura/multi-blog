# Contributing to Multi-Blog Platform

Thank you for your interest in contributing to the Multi-Blog Platform! This document provides guidelines for contributing to the project.

## 🚀 Quick Start

1. **Fork the repository** and clone your fork
2. **Install dependencies**: `pnpm install`
3. **Set up the backend**: Follow the setup instructions in the main README
4. **Start development**: `./dev.sh dev:both`

## 📋 Development Workflow

### Prerequisites
- Node.js 18+
- Rust 1.70+
- PostgreSQL 14+
- pnpm package manager

### Local Development
```bash
# Start both frontend and backend
./dev.sh dev:both

# Or start them separately
./dev.sh dev:frontend  # http://localhost:5173
./dev.sh dev:backend   # http://localhost:3000
```

### Project Structure
```
multi-blog/
├── src/           # React frontend
├── api/           # Rust backend
├── docs/          # Documentation
└── dev.sh         # Development helper script
```

## 🐛 Bug Reports

When filing bug reports, please include:
- Clear description of the issue
- Steps to reproduce
- Expected vs actual behavior
- Browser/environment information
- Screenshots if applicable

## ✨ Feature Requests

Before submitting feature requests:
- Check existing issues to avoid duplicates
- Provide clear use cases and benefits
- Consider backward compatibility
- Discuss large changes in issues first

## 🔧 Code Style

### Frontend (TypeScript/React)
- Use TypeScript for all new code
- Follow existing component patterns
- Use Tailwind CSS for styling
- Keep components small and focused
- Add proper error handling

### Backend (Rust)
- Follow Rust conventions (rustfmt, clippy)
- Add proper error handling
- Include tests for new features
- Document public APIs
- Use meaningful variable names

### General Guidelines
- Write clear commit messages
- Keep commits focused and atomic
- Add tests for new functionality
- Update documentation as needed

## 🧪 Testing

### Running Tests
```bash
# All tests
./dev.sh test

# Frontend only
pnpm test

# Backend only
cd api && cargo test
```

### Writing Tests
- Add unit tests for new functions
- Include integration tests for APIs
- Test error conditions
- Mock external dependencies

## 📝 Commit Messages

Use conventional commit format:
```
type(scope): description

feat(auth): add password reset functionality
fix(api): resolve CORS issues for admin endpoints
docs(readme): update installation instructions
```

Types:
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
