import { get, post, del } from './client.js'

export const listKeys = (slug) => get(`/spaces/${slug}/api-keys`)
export const createKey = (slug, name, scope) => post(`/spaces/${slug}/api-keys`, { name, scope })
export const revokeKey = (slug, id) => del(`/spaces/${slug}/api-keys/${id}`)
