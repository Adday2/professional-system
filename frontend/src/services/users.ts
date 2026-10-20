
import api from './api'

export interface User {
  id: number
  name: string
  email: string
  role: 'admin' | 'user'
  created_at: string
}

export interface UserPage {
  items: User[]
  total: number
  skip: number
  limit: number
}

export interface UserStats {
  total_users: number
  users_created_today: number
  latest_user: User | null
}

export interface CreateUserData {
  name: string
  email: string
  password: string
}

export interface UpdateUserData {
  name: string
  email: string
}

export interface RoleUpdateData {
  role: 'admin' | 'user'
}

export interface GetUsersOptions {
  skip?: number
  limit?: number
  search?: string
}

export async function getUsers(
  options: GetUsersOptions = {},
): Promise<UserPage> {
  const {
    skip = 0,
    limit = 10,
    search = '',
  } = options

  const response = await api.get<UserPage>(
    '/users/',
    {
      params: {
        skip,
        limit,
        ...(search.trim()
          ? { search: search.trim() }
          : {}),
      },
    },
  )

  return response.data
}

export async function getUserStats(): Promise<UserStats> {
  const response = await api.get<UserStats>(
    '/users/stats',
  )

  return response.data
}

export async function createUser(
  data: CreateUserData,
): Promise<User> {
  const response = await api.post<User>(
    '/users/',
    data,
  )

  return response.data
}

export async function deleteUser(
  id: number,
): Promise<void> {
  await api.delete(`/users/${id}`)
}

export async function updateUser(
  id: number,
  data: UpdateUserData,
): Promise<User> {
  const response = await api.put<User>(
    `/users/${id}`,
    data,
  )

  return response.data
}

export async function updateUserRole(
  id: number,
  data: RoleUpdateData,
): Promise<User> {
  const response = await api.patch<User>(
    `/users/${id}/role`,
    data,
  )

  return response.data
}
