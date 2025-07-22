export interface Post {
  id: number
  title: string
  author: string
  date: string
  category: string
  excerpt: string
  content: string
  readTime: string
  slug: string
}

export interface DomainTheme {
  primary: string
  secondary: string
  accent: string
}

export interface DomainConfig {
  name: string
  tagline: string
  theme: DomainTheme
  categories: string[]
  logo: string
}

export interface NewPostForm {
  title: string
  author: string
  category: string
  excerpt: string
  content: string
}

export type DomainType =
  | 'tech.blog'
  | 'lifestyle.blog'
  | 'business.blog'
  | 'default'

export type PostsData = Record<DomainType, Post[]>

// User Management Types
export interface User {
  id: number
  email: string
  name: string
  role: 'platform_admin' | 'domain_user'
  created_at: string
  updated_at: string
  domain_permissions: DomainPermission[]
}

export interface DomainPermission {
  domain_id: number
  domain_name?: string
  role: 'admin' | 'editor' | 'viewer' | 'none'
}

// Domain information for permission management
export interface Domain {
  id: number
  name: string
  url: string
  description?: string
  created_at: string
}

export interface CreateUserRequest {
  email: string
  name: string
  password: string
  role: 'platform_admin' | 'domain_user'
  domain_permissions?: Omit<DomainPermission, 'domain_name'>[]
}

export interface UpdateUserRequest {
  email?: string
  name?: string
  password?: string
  role?: 'platform_admin' | 'domain_user'
  domain_permissions?: Omit<DomainPermission, 'domain_name'>[]
}

export interface UsersResponse {
  users: User[]
  total: number
  page: number
  per_page: number
}
