import { createContext } from 'react'
import type { CurrentUser } from '../services/auth'

export interface AuthContextValue {
  user: CurrentUser | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

export const AuthContext = createContext<
  AuthContextValue | undefined
>(undefined)