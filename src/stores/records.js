import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as recordsApi from '@/api/records.js'

export const useRecordsStore = defineStore('records', () => {
  const records = ref([])
  const total = ref(0)
  const loading = ref(false)

  async function fetchRecords(spaceSlug, tableSlug, params = {}) {
    loading.value = true
    try {
      const res = await recordsApi.listRecords(spaceSlug, tableSlug, params)
      records.value = res.data
      total.value = res.meta.total
    } finally {
      loading.value = false
    }
  }

  async function createRecord(spaceSlug, tableSlug, data) {
    const rec = await recordsApi.createRecord(spaceSlug, tableSlug, data)
    records.value.unshift(rec)
    total.value++
    return rec
  }

  async function updateRecord(spaceSlug, tableSlug, id, data) {
    const rec = await recordsApi.updateRecord(spaceSlug, tableSlug, id, data)
    const idx = records.value.findIndex(r => r.id === id)
    if (idx !== -1) records.value[idx] = rec
    return rec
  }

  async function deleteRecord(spaceSlug, tableSlug, id) {
    await recordsApi.deleteRecord(spaceSlug, tableSlug, id)
    records.value = records.value.filter(r => r.id !== id)
    total.value--
  }

  async function bulkDelete(spaceSlug, tableSlug, ids) {
    await Promise.all(ids.map(id => recordsApi.deleteRecord(spaceSlug, tableSlug, id)))
    records.value = records.value.filter(r => !ids.includes(r.id))
    total.value -= ids.length
  }

  return { records, total, loading, fetchRecords, createRecord, updateRecord, deleteRecord, bulkDelete }
})
