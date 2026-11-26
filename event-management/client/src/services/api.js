import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token')
    const isAuthRequest = error.config?.url?.includes('/auth/login') || error.config?.url?.includes('/auth/register')
    if (error.response?.status === 401 && token && !isAuthRequest) {
      localStorage.removeItem('token')
      sessionStorage.removeItem('token')
      localStorage.removeItem('refreshToken')
      window.location.assign('/login')
    }
    return Promise.reject(error)
  },
)

export default api
