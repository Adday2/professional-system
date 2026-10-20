import {
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
import {
  AuthContext,
  type AuthContextValue,
} from './auth-context'

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({
  children,
}: AuthProviderProps) {
  const queryClient = useQueryClient()

  const [user, setUser] =
    useState<CurrentUser | null>(null)

  const [isLoading, setIsLoading] = useState(
    () => sessionStorage.getItem('access_token') !== null,
  )

  useEffect(() => {
    const token =
      sessionStorage.getItem('access_token')

    // Initial loading state is already false when there is no token.
    if (!token) {
      return
    }

    let cancelled = false

    getCurrentUser()
      .then((currentUser) => {
        if (!cancelled) {
          setUser(currentUser)
        }
      })
      .catch(() => {
        if (cancelled) {
          return
        }

        sessionStorage.removeItem('access_token')
        queryClient.clear()
        setUser(null)
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [queryClient])

  useEffect(() => {
    function handleSessionExpired() {
      sessionStorage.removeItem('access_token')
      queryClient.clear()
      setUser(null)
      setIsLoading(false)
    }

    window.addEventListener(
      'auth:session-expired',
      handleSessionExpired,
    )

    return () => {
      window.removeEventListener(
        'auth:session-expired',
        handleSessionExpired,
      )
    }
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
    setIsLoading(false)
  }

  function logout() {
    sessionStorage.removeItem('access_token')
    queryClient.clear()
    setUser(null)
    setIsLoading(false)
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