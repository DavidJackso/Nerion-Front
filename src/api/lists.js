import { get, post, put } from './client.js'

export const listLists = (spaceSlug) =>
  get(`/spaces/${spaceSlug}/lists`)

export const createList = (spaceSlug, data) =>
  post(`/spaces/${spaceSlug}/lists`, data)

export const updateList = (spaceSlug, listSlug, data) =>
  put(`/spaces/${spaceSlug}/lists/${listSlug}`, data)
