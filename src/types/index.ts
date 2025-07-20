export interface Post {
  id: number
  title: string
  author: string
  date: string
  category: string
  excerpt: string
  content: string
  readTime: string
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
