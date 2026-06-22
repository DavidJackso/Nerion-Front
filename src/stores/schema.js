import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as schemaApi from '@/api/schema.js'

export const useSchemaStore = defineStore('schema', () => {
  const tables = ref([])
  const activeTable = ref(null)
  const templates = ref([])
  const loading = ref(false)

  async function fetchTables(spaceSlug) {
    loading.value = true
    try { tables.value = await schemaApi.listTables(spaceSlug) ?? [] }
    finally { loading.value = false }
  }

  async function fetchTable(spaceSlug, tableSlug) {
    activeTable.value = await schemaApi.getTable(spaceSlug, tableSlug)
    return activeTable.value
  }

  async function createTable(spaceSlug, name, tableSlug, templateId) {
    const t = await schemaApi.createTable(spaceSlug, name, tableSlug, templateId)
    tables.value.push(t)
    return t
  }

  async function deleteTable(spaceSlug, tableSlug) {
    await schemaApi.deleteTable(spaceSlug, tableSlug)
    tables.value = tables.value.filter(t => t.slug !== tableSlug)
  }

  async function updateFields(spaceSlug, tableSlug, fields) {
    await schemaApi.updateFields(spaceSlug, tableSlug, fields)
    await fetchTable(spaceSlug, tableSlug)
  }

  async function fetchTemplates() {
    if (templates.value.length) return
    templates.value = await schemaApi.listTemplates()
  }

  return { tables, activeTable, templates, loading, fetchTables, fetchTable, createTable, deleteTable, updateFields, fetchTemplates }
})
