import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { useQueryClient } from '@tanstack/react-query'
import {
  getCurrentUser,
  login as loginRequest,
  type CurrentUser,
} from '../services/auth'

interface AuthContextValue {
  user: CurrentUser | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<
  AuthContextValue | undefined
>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({
  children,
}: AuthProviderProps) {
  const queryClient = useQueryClient()

  const [user, setUser] = useState<CurrentUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const token = sessionStorage.getItem('access_token')

    if (!token) {
      setIsLoading(false)
      return
    }

    getCurrentUser()
      .then((currentUser) => {
        setUser(currentUser)
      })
      .catch(() => {
        sessionStorage.removeItem('access_token')
        queryClient.clear()
        setUser(null)
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [queryClient])

  async function login(
    email: string,
    password: string,
  ) {
    const response = await loginRequest(
      email,
      password,
    )

    sessionStorage.setItem(
      'access_token',
      response.access_token,
    )

    queryClient.clear()

    const currentUser = await getCurrentUser()

    setUser(currentUser)
  }

  function logout() {
    sessionStorage.removeItem('access_token')
    queryClient.clear()
    setUser(null)
  }

  const value: AuthContextValue = {
    user,
    isLoading,
    isAuthenticated: user !== null,
    login,
    logout,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error(
      'useAuth must be used inside an AuthProvider.',
    )
  }

  return context
}