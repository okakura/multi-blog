// Mock API service for development when backend is not available
import type {
  CreateUserRequest,
  Domain,
  UpdateUserRequest,
  User,
  UsersResponse,
} from '../types'

// Mock domains data
const mockDomains: Domain[] = [
  {
    id: 1,
    name: 'Tech Blog',
    url: 'tech.blog',
    description: 'Technology and programming content',
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 2,
    name: 'Lifestyle Blog',
    url: 'lifestyle.blog',
    description: 'Lifestyle and wellness content',
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 3,
    name: 'Business Blog',
    url: 'business.blog',
    description: 'Business and entrepreneurship content',
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 4,
    name: 'Food Blog',
    url: 'food.blog',
    description: 'Recipes and food culture',
    created_at: '2024-01-01T00:00:00Z',
  },
]

// Mock users data with new permission model
const mockUsers: User[] = [
  {
    id: 1,
    name: 'John Doe',
    email: 'john@example.com',
    role: 'platform_admin',
    created_at: '2024-01-15T10:30:00Z',
    updated_at: '2024-01-15T10:30:00Z',
    domain_permissions: [], // Platform admin has access to everything
  },
  {
    id: 2,
    name: 'Jane Smith',
    email: 'jane@example.com',
    role: 'domain_user',
    created_at: '2024-02-20T14:15:00Z',
    updated_at: '2024-02-20T14:15:00Z',
    domain_permissions: [
      { domain_id: 1, domain_name: 'Tech Blog', role: 'admin' },
      { domain_id: 2, domain_name: 'Lifestyle Blog', role: 'editor' },
      { domain_id: 3, domain_name: 'Business Blog', role: 'viewer' },
      { domain_id: 4, domain_name: 'Food Blog', role: 'none' },
    ],
  },
  {
    id: 3,
    name: 'Mike Johnson',
    email: 'mike@example.com',
    role: 'domain_user',
    created_at: '2024-03-10T09:45:00Z',
    updated_at: '2024-03-10T09:45:00Z',
    domain_permissions: [
      { domain_id: 1, domain_name: 'Tech Blog', role: 'editor' },
      { domain_id: 2, domain_name: 'Lifestyle Blog', role: 'none' },
      { domain_id: 3, domain_name: 'Business Blog', role: 'admin' },
      { domain_id: 4, domain_name: 'Food Blog', role: 'editor' },
    ],
  },
  {
    id: 4,
    name: 'Sarah Wilson',
    email: 'sarah@example.com',
    role: 'domain_user',
    created_at: '2024-03-25T16:20:00Z',
    updated_at: '2024-03-25T16:20:00Z',
    domain_permissions: [
      { domain_id: 1, domain_name: 'Tech Blog', role: 'viewer' },
      { domain_id: 2, domain_name: 'Lifestyle Blog', role: 'admin' },
      { domain_id: 3, domain_name: 'Business Blog', role: 'none' },
      { domain_id: 4, domain_name: 'Food Blog', role: 'viewer' },
    ],
  },
  {
    id: 5,
    name: 'David Brown',
    email: 'david@example.com',
    role: 'domain_user',
    created_at: '2024-01-01T08:00:00Z',
    updated_at: '2024-01-01T08:00:00Z',
    domain_permissions: [
      { domain_id: 1, domain_name: 'Tech Blog', role: 'admin' },
      { domain_id: 2, domain_name: 'Lifestyle Blog', role: 'admin' },
      { domain_id: 3, domain_name: 'Business Blog', role: 'editor' },
      { domain_id: 4, domain_name: 'Food Blog', role: 'none' },
    ],
  },
]

// Simulate API delay
const delay = (ms = 500) => new Promise((resolve) => setTimeout(resolve, ms))

export class MockAdminApiService {
  private users: User[] = [...mockUsers]
  private domains: Domain[] = [...mockDomains]
  private nextId = 6

  async getDomains(): Promise<Domain[]> {
    await delay(200)
    return this.domains
  }

  async getUsers(page = 1, limit = 20): Promise<UsersResponse> {
    await delay(300) // Simulate network delay

    const start = (page - 1) * limit
    const end = start + limit
    const paginatedUsers = this.users.slice(start, end)

    return {
      users: paginatedUsers,
      total: this.users.length,
      page,
      per_page: limit,
    }
  }

  async getUser(id: number): Promise<User> {
    await delay(200)

    const user = this.users.find((u) => u.id === id)
    if (!user) {
      throw new Error('User not found')
    }

    return user
  }

  async createUser(userData: CreateUserRequest): Promise<User> {
    await delay(600) // Simulate longer operation

    const now = new Date().toISOString()
    const newUser: User = {
      id: this.nextId++,
      name: userData.name,
      email: userData.email,
      role: userData.role,
      created_at: now,
      updated_at: now,
      domain_permissions: userData.domain_permissions || [],
    }

    this.users.push(newUser)
    return newUser
  }

  async updateUser(id: number, userData: UpdateUserRequest): Promise<User> {
    await delay(500)

    const userIndex = this.users.findIndex((u) => u.id === id)
    if (userIndex === -1) {
      throw new Error('User not found')
    }

    const updatedUser: User = {
      ...this.users[userIndex],
      ...userData,
      updated_at: new Date().toISOString(),
    }

    this.users[userIndex] = updatedUser
    return updatedUser
  }

  async deleteUser(id: number): Promise<void> {
    await delay(400)

    const userIndex = this.users.findIndex((u) => u.id === id)
    if (userIndex === -1) {
      throw new Error('User not found')
    }

    this.users.splice(userIndex, 1)
  }
}

export const mockAdminApi = new MockAdminApiService()
