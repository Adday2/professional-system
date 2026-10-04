import api from './api'

export interface User {
  id: number
  name: string
  email: string
  created_at: string
}

export interface CreateUserData {
  name: string
  email: string
}

export async function getUsers(): Promise<User[]> {
  const response = await api.get<User[]>('/users/')
  return response.data
}

export async function createUser(
  data: CreateUserData,
): Promise<User> {
  const response = await api.post<User>('/users/', data)
  return response.data
}