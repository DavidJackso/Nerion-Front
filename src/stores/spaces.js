import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as spacesApi from '@/api/spaces.js'

export const useSpacesStore = defineStore('spaces', () => {
  const spaces = ref([])
  const loading = ref(false)

  async function fetchSpaces() {
    loading.value = true
    try { spaces.value = await spacesApi.listSpaces() }
    finally { loading.value = false }
  }

  async function createSpace(name, slug) {
    const sp = await spacesApi.createSpace(name, slug)
    spaces.value.push(sp)
    return sp
  }

  async function renameSpace(slug, name) {
    await spacesApi.renameSpace(slug, name)
    const s = spaces.value.find(s => s.slug === slug)
    if (s) s.name = name
  }

  async function deleteSpace(slug, confirmName) {
    await spacesApi.deleteSpace(slug, confirmName)
    spaces.value = spaces.value.filter(s => s.slug !== slug)
  }

  return { spaces, loading, fetchSpaces, createSpace, renameSpace, deleteSpace }
})
