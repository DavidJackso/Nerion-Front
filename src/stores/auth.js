import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as authApi from '@/api/auth.js'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const accessToken = ref(localStorage.getItem('nerion_access_token'))
  const refreshToken = ref(localStorage.getItem('nerion_refresh_token'))

  async function login(email, password) {
    const data = await authApi.login(email, password)
    accessToken.value = data.access_token
    refreshToken.value = data.refresh_token
    localStorage.setItem('nerion_access_token', data.access_token)
    localStorage.setItem('nerion_refresh_token', data.refresh_token)
    await fetchMe()
  }

  async function logout() {
    try { await authApi.logout(refreshToken.value) } catch {}
    accessToken.value = null
    refreshToken.value = null
    user.value = null
    localStorage.removeItem('nerion_access_token')
    localStorage.removeItem('nerion_refresh_token')
  }

  async function fetchMe() {
    try {
      user.value = await authApi.getMe()
    } catch {
      user.value = null
    }
  }

  function initials() {
    if (!user.value?.name) return '?'
    return user.value.name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()
  }

  return { user, accessToken, refreshToken, login, logout, fetchMe, initials }
})
