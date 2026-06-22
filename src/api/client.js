const BASE_URL = import.meta.env.VITE_API_URL || ''
const API_BASE = BASE_URL + '/api/v1'

class ApiError extends Error {
  constructor(code, message, fields = null) {
    super(message)
    this.code = code
    this.fields = fields
  }
}

let _refreshing = null

async function request(method, path, body, retried = false) {
  const token = localStorage.getItem('nerion_access_token')
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(API_BASE + path, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  if (res.status === 401 && !retried) {
    if (!_refreshing) {
      _refreshing = (async () => {
        const rt = localStorage.getItem('nerion_refresh_token')
        if (!rt) throw new ApiError('unauthorized', 'Требуется авторизация')
        const r = await fetch(API_BASE + '/auth/refresh', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token: rt }),
        })
        if (!r.ok) throw new ApiError('unauthorized', 'Сессия истекла')
        const d = await r.json()
        localStorage.setItem('nerion_access_token', d.access_token)
        localStorage.setItem('nerion_refresh_token', d.refresh_token)
      })()
    }
    try {
      await _refreshing
    } finally {
      _refreshing = null
    }
    return request(method, path, body, true)
  }

  if (res.status === 204) return null

  const text = await res.text()
  if (!text) throw new ApiError('error', 'Ошибка сервера: пустой ответ')

  let data
  try {
    data = JSON.parse(text)
  } catch {
    throw new ApiError('error', `Ошибка сервера (${res.status})`)
  }

  if (!res.ok) {
    const err = data?.error || {}
    throw new ApiError(err.code || 'error', err.message || 'Ошибка сервера', err.fields || null)
  }

  return data
}

export const get = (path) => request('GET', path)
export const post = (path, body) => request('POST', path, body)
export const put = (path, body) => request('PUT', path, body)
export const del = (path, body) => request('DELETE', path, body)
