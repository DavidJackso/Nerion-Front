import { get, post, put, del } from './client.js'

export const listRecords = (slug, table, params = {}) => {
  const q = new URLSearchParams()
  if (params.limit) q.set('limit', String(params.limit))
  if (params.offset) q.set('offset', String(params.offset))
  if (params.search) q.set('search', params.search)
  if (params.sortBy) q.set('sort_by', params.sortBy)
  if (params.sortDir) q.set('sort_dir', params.sortDir)
  const qs = q.toString()
  return get(`/spaces/${slug}/tables/${table}/records${qs ? '?' + qs : ''}`)
}
export const createRecord = (slug, table, data) => post(`/spaces/${slug}/tables/${table}/records`, data)
export const updateRecord = (slug, table, id, data) => put(`/spaces/${slug}/tables/${table}/records/${id}`, data)
export const deleteRecord = (slug, table, id) => del(`/spaces/${slug}/tables/${table}/records/${id}`)
