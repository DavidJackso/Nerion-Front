import { apiClient } from '~/utils/apiClient'

export interface FileUploadResult {
  key: string
  url: string
  content_type: string
  size: number
  expires_at: string
}

function getApiBaseUrl(): string {
  try {
    const config = useRuntimeConfig()
    if (config.public.apiUrl) return String(config.public.apiUrl) + '/api/v1'
  } catch {
    // outside Nuxt context
  }
  return (
    (typeof process !== 'undefined' && process.env?.NUXT_PUBLIC_API_URL
      ? process.env.NUXT_PUBLIC_API_URL
      : '') + '/api/v1'
  )
}

export async function uploadFile(spaceSlug: string, file: File): Promise<FileUploadResult> {
  const token = import.meta.client ? localStorage.getItem('nerion_access_token') : null
  const fd = new FormData()
  fd.append('file', file)
  const res = await fetch(`${getApiBaseUrl()}/spaces/${spaceSlug}/files/upload`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: fd,
  })
  if (!res.ok) {
    const d = await res.json().catch(() => ({}))
    throw new Error(
      (d as { error?: { message?: string } })?.error?.message ?? 'Ошибка загрузки файла'
    )
  }
  return res.json() as Promise<FileUploadResult>
}

export const presignFile = (
  spaceSlug: string,
  key: string
): Promise<{ url: string; expires_at: string }> =>
  apiClient.get(`/spaces/${spaceSlug}/files/presign?key=${encodeURIComponent(key)}`)
