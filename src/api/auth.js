import { get, post } from './client.js'

export const login = (email, password) => post('/auth/login', { email, password })
export const register = (name, email, password) => post('/auth/register', { name, email, password })
export const logout = (refreshToken) => post('/auth/logout', { refresh_token: refreshToken })
export const resetRequest = (email) => post('/auth/password/reset-request', { email })
export const resetPassword = (token, password) => post('/auth/password/reset', { token, password })
export const getMe = () => get('/me')
