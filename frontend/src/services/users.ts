import api from './api'

export interface User {
  id: number
  name: string
  email: string
  role: 'admin' | 'user'
  created_at: string
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

export async function getUsers(): Promise<User[]> {
  const response = await api.get<User[]>('/users/')
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