# Multi-Blog Platform

A full-stack multi-tenant blog platform built with React (frontend) and Rust/Axum (backend). Supports multiple domains with independent blog instances, user authentication, and comprehensive analytics.

## 🚀 Features

- **Multi-tenant Architecture**: Support for multiple blog domains
- **Modern Frontend**: React with TypeScript, Tailwind CSS, and Rsbuild
- **Robust Backend**: Rust with Axum framework and PostgreSQL
- **Authentication**: JWT-based auth with role-based access control
- **Admin Dashboard**: Content management and analytics
- **Real-time Analytics**: Track page views, user engagement, and performance
- **Domain Management**: Configure themes and settings per domain

## 🏗️ Architecture

### Frontend (`/`)

- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS
- **Build Tool**: Rsbuild
- **State Management**: SWR for data fetching
- **Routing**: React Router
- **Icons**: Lucide React

### Backend (`/api`)

- **Language**: Rust
- **Framework**: Axum
- **Database**: PostgreSQL with SQLx
- **Authentication**: JWT tokens
- **Docs**: OpenAPI/Swagger integration

## 📦 Setup

### Prerequisites

- Node.js 18+ and pnpm
- Rust 1.70+
- PostgreSQL 14+

### Installation

1. **Clone the repository**:

```bash
git clone <repository-url>
cd multi-blog
```

2. **Install frontend dependencies**:

```bash
pnpm install
```

3. **Set up the backend**:

```bash
cd api
cargo build
```

4. **Configure environment**:

```bash
# Copy the example environment file
cp api/.env.example api/.env
# Edit api/.env with your database URL and other settings
```

5. **Run database migrations**:

```bash
cd api
cargo run # Migrations run automatically on startup
```

## 🚀 Development

### Start the development servers

**Frontend** (runs on http://localhost:5173):

```bash
pnpm dev
```

**Backend** (runs on http://localhost:3000):

```bash
cd api
cargo run
```

### Demo Credentials

- **Admin**: `admin@multi-blog.com` / `admin123`
- **Editor**: `editor@multi-blog.com` / `editor123`
- **Viewer**: `viewer@multi-blog.com` / `viewer123`

## 📁 Project Structure

```
multi-blog/
├── src/                    # React frontend source
│   ├── components/         # Reusable UI components
│   ├── pages/             # Page components
│   ├── contexts/          # React contexts (Auth, Domain)
│   ├── hooks/             # Custom hooks
│   └── services/          # API services
├── api/                   # Rust backend
│   ├── src/
│   │   ├── handlers/      # Route handlers
│   │   ├── lib.rs         # Core middleware and utilities
│   │   └── main.rs        # Application entry point
│   └── migrations/        # Database migrations
├── public/                # Static assets
└── docs/                  # Documentation
```

## 🚢 Production Build

**Frontend**:

```bash
pnpm build
pnpm preview  # Preview production build
```

**Backend**:

```bash
cd api
cargo build --release
```

## 🔧 Configuration

### Environment Variables

Create `api/.env` with:

```env
DATABASE_URL=postgresql://user:password@localhost/multi_blog
JWT_SECRET=your-secret-key
RUST_LOG=info
```

### Domain Configuration

The platform supports multiple domains configured in the database. Each domain can have:

- Custom themes and styling
- Independent content categories
- Separate analytics tracking
- Domain-specific user permissions

## 📊 API Documentation

Visit `http://localhost:3000/swagger-ui` when the backend is running to explore the API documentation.

## 🧪 Testing

```bash
# Frontend tests
pnpm test

# Backend tests
cd api
cargo test
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

```

## Learn more

To learn more about Rsbuild, check out the following resources:

- [Rsbuild documentation](https://rsbuild.rs) - explore Rsbuild features and APIs.
- [Rsbuild GitHub repository](https://github.com/web-infra-dev/rsbuild) - your feedback and contributions are welcome!
```
