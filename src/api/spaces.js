import { get, post, put, del } from './client.js'

export const listSpaces = () => get('/spaces')
export const createSpace = (name, slug) => post('/spaces', { name, slug })
export const renameSpace = (slug, name) => put(`/spaces/${slug}`, { name })
export const deleteSpace = (slug, confirmName) => del(`/spaces/${slug}`, { confirm_name: confirmName })
