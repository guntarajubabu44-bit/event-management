import api from './api'

export const register = (payload) => api.post('/auth/register', payload)
export const login = (payload) => api.post('/auth/login', payload)
export const requestLoginOtp = (payload) => api.post('/auth/login-otp/request', payload)
export const verifyLoginOtp = (payload) => api.post('/auth/login-otp/verify', payload)
export const getMe = () => api.get('/auth/me')
export const updateMe = (payload) => api.put('/auth/me', payload)
export const logout = () => api.post('/auth/logout')
export const forgotPassword = (payload) => api.post('/auth/forgot-password', payload)
export const resetPassword = (payload) => api.post('/auth/reset-password', payload)
