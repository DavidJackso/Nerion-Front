import { get, post, put, del } from './client.js'

export const listMembers = (slug) => get(`/spaces/${slug}/members`)
export const inviteMember = (slug, email) => post(`/spaces/${slug}/members/invite`, { email })
export const changeMemberRole = (slug, userId, role) => put(`/spaces/${slug}/members/${userId}/role`, { role })
export const removeMember = (slug, userId) => del(`/spaces/${slug}/members/${userId}`)
