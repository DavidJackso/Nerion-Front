const BASE_URL = import.meta.env.VITE_API_URL || ''

class ApiError extends Error {
  constructor(code, message) {
    super(message)
    this.code = code
  }
}

let _refreshing = null

async function request(method, path, body, retried = false) {
  const token = localStorage.getItem('nerion_access_token')
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(BASE_URL + path, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  if (res.status === 401 && !retried) {
    if (!_refreshing) {
      _refreshing = (async () => {
        const rt = localStorage.getItem('nerion_refresh_token')
        if (!rt) throw new ApiError('unauthorized', 'Требуется авторизация')
        const r = await fetch(BASE_URL + '/auth/refresh', {
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
    throw new ApiError(err.code || 'error', err.message || 'Ошибка сервера')
  }

  return data
}

export const get = (path) => request('GET', path)
export const post = (path, body) => request('POST', path, body)
export const put = (path, body) => request('PUT', path, body)
export const del = (path, body) => request('DELETE', path, body)
