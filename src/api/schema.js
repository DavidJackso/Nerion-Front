import { get, post, put, del } from './client.js'

export const listTables = (slug) => get(`/spaces/${slug}/tables`)
export const createTable = (slug, name, tableSlug, templateId) =>
  post(`/spaces/${slug}/tables`, { name, slug: tableSlug, ...(templateId ? { template_id: templateId } : {}) })
export const getTable = (slug, table) => get(`/spaces/${slug}/tables/${table}`)
export const updateFields = (slug, table, fields) => put(`/spaces/${slug}/tables/${table}/fields`, { fields })
export const deleteTable = (slug, table) => del(`/spaces/${slug}/tables/${table}`)
export const listTemplates = () => get('/templates')
