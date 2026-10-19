import api from './api'

export interface LoginResponse {
  access_token: string
  token_type: string
}

export interface CurrentUser {
  id: number
  name: string
  email: string
  role: 'admin' | 'user'
  created_at: string
}

export interface ChangePasswordData {
  current_password: string
  new_password: string
}

export async function login(
  email: string,
  password: string,
): Promise<LoginResponse> {
  const formData = new URLSearchParams()

  formData.append('username', email)
  formData.append('password', password)

  const response = await api.post<LoginResponse>(
    '/auth/login',
    formData,
    {
      headers: {
        'Content-Type':
          'application/x-www-form-urlencoded',
      },
    },
  )

  return response.data
}

export async function getCurrentUser(): Promise<CurrentUser> {
  const response = await api.get<CurrentUser>(
    '/auth/me',
  )

  return response.data
}

export async function changePassword(
  data: ChangePasswordData,
): Promise<{
  message: string
  access_token: string
  token_type: string
}> {
  const response = await api.post<{
    message: string
    access_token: string
    token_type: string
  }>('/auth/change-password', data)

  return response.data
}