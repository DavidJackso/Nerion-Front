import { get, post } from './client.js'

const BASE_URL = import.meta.env.VITE_API_URL || ''

export const listTemplates = (spaceSlug) =>
  get(`/spaces/${spaceSlug}/pdf/templates`)

export async function uploadTemplate(spaceSlug, name, file) {
  const token = localStorage.getItem('nerion_access_token')
  const fd = new FormData()
  fd.append('name', name)
  fd.append('file', file)
  const res = await fetch(`${BASE_URL}/spaces/${spaceSlug}/pdf/templates`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: fd,
  })
  if (!res.ok) {
    const d = await res.json().catch(() => ({}))
    throw new Error(d?.error?.message || 'Ошибка загрузки')
  }
  return res.json()
}

export const saveMapping = (spaceSlug, templateId, mappings) =>
  post(`/spaces/${spaceSlug}/pdf/templates/${templateId}/mapping`, { mappings })

export const generatePDF = (spaceSlug, data) =>
  post(`/spaces/${spaceSlug}/pdf/generate`, data)

export const getJob = (spaceSlug, jobId) =>
  get(`/spaces/${spaceSlug}/pdf/jobs/${jobId}`)

export const listArchive = (spaceSlug) =>
  get(`/spaces/${spaceSlug}/pdf/archive`)
