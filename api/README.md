# Multi-Blog API

A multi-tenant blog platform API built with Rust, Axum, and PostgreSQL.

## Features

- **Multi-tenant architecture**: Support for multiple blog domains/subdomains
- **Domain-based routing**: Automatic domain detection and context switching
- **Role-based permissions**: Admin, editor, and viewer roles per domain
- **Analytics tracking**: Built-in analytics for page views, post views, and user behavior
- **RESTful API**: Clean REST endpoints for blog management
- **Authentication**: JWT-based authentication with role-based access control

## API Endpoints

### Public Blog Routes

- `GET /` - Homepage with recent posts
- `GET /posts` - List all published posts (with pagination)
- `GET /posts/:slug` - Get specific post by slug
- `GET /category/:category` - Get posts by category
- `GET /search?q=term` - Search posts
- `GET /feed.xml` - RSS feed

### Admin Routes (Auth Required)

- `GET /admin/posts` - List all posts (including drafts)
- `POST /admin/posts` - Create new post
- `GET /admin/posts/:id` - Get post by ID
- `PUT /admin/posts/:id` - Update post
- `DELETE /admin/posts/:id` - Delete post
- `GET /admin/analytics` - Get analytics summary
- `GET /admin/domain/settings` - Get domain settings
- `PUT /admin/domain/settings` - Update domain settings

### Analytics Routes (Auth Required)

- `GET /analytics/overview` - Analytics overview
- `GET /analytics/traffic` - Traffic statistics
- `GET /analytics/posts` - Post analytics
- `GET /analytics/posts/:id/stats` - Individual post stats
- `GET /analytics/search-terms` - Search analytics
- `GET /analytics/referrers` - Referrer statistics
- `GET /analytics/real-time` - Real-time visitor data

## Setup

1. **Database Setup**:

   ```bash
   # Install PostgreSQL and create database
   createdb multi_blog_dev

   # Set environment variable
   export DATABASE_URL="postgresql://user:password@localhost/multi_blog_dev"
   ```

2. **Run Migrations**:

   ```bash
   cargo install sqlx-cli
   sqlx migrate run
   ```

3. **Start the Server**:
   ```bash
   cargo run
   ```

## Environment Variables

- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret for JWT token signing (optional, defaults to dev key)
- `RUST_LOG` - Log level (optional, defaults to info)

## Domain Configuration

The API supports multiple domains/subdomains. Each domain has its own:

- Theme configuration (colors, styling)
- Categories
- Posts
- Analytics
- User permissions

Example domains from the sample data:

- `tech.localhost` - Tech blog
- `lifestyle.localhost` - Lifestyle blog
- `business.localhost` - Business blog

## Authentication

The API uses JWT tokens for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Sample Data

The migration includes sample data:

- 3 domains (tech, lifestyle, business)
- Admin user (email: admin@example.com, password: admin123)
- Sample posts for each domain

## Architecture

The API is structured with:

- **Middleware**: Domain detection, analytics tracking, authentication
- **Handlers**: Modular route handlers (blog, admin, analytics)
- **Context**: Domain and user context passed through request pipeline
- **Database**: PostgreSQL with proper indexing for performance
