import axios from 'axios'

const apiUrl = import.meta.env.VITE_API_URL

const api = axios.create({
  baseURL: apiUrl,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('access_token')

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response?.status === 401 &&
      sessionStorage.getItem('access_token')
    ) {
      sessionStorage.removeItem('access_token')

      window.dispatchEvent(
        new Event('auth:session-expired'),
      )
    }

    return Promise.reject(error)
  },
)

export default api