<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSchemaStore } from '@/stores/schema.js'
import { useRecordsStore } from '@/stores/records.js'
import { useSpacesStore } from '@/stores/spaces.js'
import AppShell from '@/components/shell/AppShell.vue'
import NButton from '@/components/primitives/NButton.vue'
import NIcon from '@/components/primitives/NIcon.vue'
import NBadge from '@/components/primitives/NBadge.vue'
import NStatusDot from '@/components/primitives/NStatusDot.vue'
import NModal from '@/components/primitives/NModal.vue'
import NToast from '@/components/primitives/NToast.vue'
import NToggle from '@/components/primitives/NToggle.vue'
import NInput from '@/components/primitives/NInput.vue'
import NSelect from '@/components/primitives/NSelect.vue'
import NDatePicker from '@/components/primitives/NDatePicker.vue'

const route = useRoute()
const router = useRouter()
const schemaStore = useSchemaStore()
const recordsStore = useRecordsStore()
const spacesStore = useSpacesStore()

const spaceSlug = computed(() => route.params.slug)
const tableSlug = computed(() => route.params.table)
const space = computed(() => spacesStore.spaces.find(s => s.slug === spaceSlug.value))
const table = computed(() => schemaStore.activeTable)
const fields = computed(() => table.value?.fields || [])

const sel = ref(new Set())
const bulkDeleting = ref(false)
const search = ref('')
const sortBy = ref(null)
const sortDir = ref('asc')
const page = ref(0)
const LIMIT = 50
const showCreate = ref(false)
const deleteRecordId = ref(null)
const showDeleteTable = ref(false)
const deleteTableLoading = ref(false)
const createVals = ref({})
const createError = ref('')

function datePickerToStr(val, mode) {
  if (!val?.date) return ''
  if (mode === 'date') return val.date
  return val.time ? `${val.date}T${val.time}` : val.date
}

function strToDatePicker(str, mode) {
  if (!str) return null
  if (mode === 'date') return { date: str.slice(0, 10) }
  const iso = str.includes('T') ? str : str.replace(' ', 'T')
  const [date, timeFull] = iso.split('T')
  return { date, time: timeFull ? timeFull.slice(0, 5) : '00:00' }
}

const toast = ref(null)
function showToast(title, tone = 'success') {
  toast.value = { title, tone }
  setTimeout(() => { toast.value = null }, 3000)
}

let loadSeq = 0

async function load() {
  if (!spaceSlug.value || !tableSlug.value) return
  const seq = ++loadSeq
  sel.value = new Set()
  try {
    await schemaStore.fetchTable(spaceSlug.value, tableSlug.value)
  } catch (e) {
    if (seq === loadSeq) router.replace({ name: 'not-found' })
    return
  }
  if (seq !== loadSeq) return
  await fetchRecords()
}

async function fetchRecords() {
  if (!spaceSlug.value || !tableSlug.value) return
  await recordsStore.fetchRecords(spaceSlug.value, tableSlug.value, {
    limit: LIMIT,
    offset: page.value * LIMIT,
    search: search.value,
    sortBy: sortBy.value,
    sortDir: sortDir.value,
  })
}

watch([spaceSlug, tableSlug], load, { immediate: true })

let searchTimer = null
watch(search, () => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => { page.value = 0; fetchRecords() }, 300)
})

function toggleSort(fieldSlug) {
  if (sortBy.value !== fieldSlug) { sortBy.value = fieldSlug; sortDir.value = 'asc' }
  else if (sortDir.value === 'asc') sortDir.value = 'desc'
  else { sortBy.value = null; sortDir.value = 'asc' }
  fetchRecords()
}

function toggleSel(id, e) {
  const s = new Set(sel.value)
  e.target.checked ? s.add(id) : s.delete(id)
  sel.value = s
}
const allSel = computed(() => {
  const ids = recordsStore.records.map(r => r.id)
  return ids.length > 0 && ids.every(id => sel.value.has(id))
})
function toggleAll(e) {
  const s = new Set(sel.value)
  recordsStore.records.forEach(r => e.target.checked ? s.add(r.id) : s.delete(r.id))
  sel.value = s
}

function prevPage() {
  if (page.value > 0) { page.value--; fetchRecords() }
}
function nextPage() {
  if ((page.value + 1) * LIMIT < recordsStore.total) { page.value++; fetchRecords() }
}

async function confirmDelete() {
  try {
    await recordsStore.deleteRecord(spaceSlug.value, tableSlug.value, deleteRecordId.value)
    deleteRecordId.value = null
    showToast('Запись удалена', 'error')
  } catch (e) {
    showToast(e.message || 'Ошибка удаления', 'error')
  }
}

async function bulkDelete() {
  if (bulkDeleting.value) return
  bulkDeleting.value = true
  try {
    const ids = [...sel.value]
    await recordsStore.bulkDelete(spaceSlug.value, tableSlug.value, ids)
    sel.value = new Set()
    showToast(`Удалено ${ids.length} записей`, 'error')
  } catch (e) {
    showToast(e.message || 'Ошибка удаления', 'error')
  } finally {
    bulkDeleting.value = false
  }
}

function exportCSV() {
  const rows = recordsStore.records.filter(r => sel.value.has(r.id))
  if (!rows.length) return
  const cols = ['id', ...fields.value.map(f => f.slug)]
  const header = cols.join(',')
  const lines = rows.map(r =>
    cols.map(c => {
      const v = r[c] ?? ''
      const s = String(v)
      return s.includes(',') || s.includes('"') || s.includes('\n')
        ? '"' + s.replace(/"/g, '""') + '"'
        : s
    }).join(',')
  )
  const csv = [header, ...lines].join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${tableSlug.value}_export.csv`
  a.click()
  URL.revokeObjectURL(url)
}

function getDeleteName() {
  const rec = recordsStore.records.find(r => r.id === deleteRecordId.value)
  if (!rec || !fields.value.length) return String(deleteRecordId.value)
  const first = fields.value[0]
  return first ? String(rec[first.slug] ?? rec.id) : String(rec.id)
}

async function confirmDeleteTable() {
  deleteTableLoading.value = true
  try {
    await schemaStore.deleteTable(spaceSlug.value, tableSlug.value)
    router.push({ name: 'tables', params: { slug: spaceSlug.value } })
  } catch (e) {
    showToast(e.message || 'Ошибка удаления', 'error')
    deleteTableLoading.value = false
    showDeleteTable.value = false
  }
}

async function createRecord() {
  createError.value = ''
  try {
    await recordsStore.createRecord(spaceSlug.value, tableSlug.value, createVals.value)
    showCreate.value = false
    createVals.value = {}
    showToast('Запись добавлена')
  } catch (e) {
    createError.value = e.message
  }
}

function cellValue(rec, field) {
  const v = rec[field.slug]
  if (v === null || v === undefined) return ''
  return v
}

function isNumeric(field) {
  return field.type === 'number'
}

function isBoolean(field) {
  return field.type === 'boolean'
}

const popSelectStyle = {
  height: '30px', borderRadius: '6px', border: '0.5px solid var(--border-strong)',
  padding: '0 24px 0 9px', fontSize: '12px', background: 'var(--bg-0)',
  color: 'var(--fg-1)', outline: 0, appearance: 'none', cursor: 'pointer', fontFamily: 'inherit',
}

const MONO_HUES = ['var(--purple-400)', 'var(--green-500)', 'var(--amber-500)', 'var(--blue-500)', 'var(--purple-600)']
function monogram(name) {
  const s = String(name || '')
  const parts = s.trim().split(/\s+/)
  const initials = (parts[0]?.[0] || '') + (parts[1]?.[0] || '')
  let h = 0; for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  return { initials: initials.toUpperCase(), color: MONO_HUES[h % MONO_HUES.length] }
}

const breadcrumb = computed(() => [
  { label: space.value?.name || spaceSlug.value, to: { name: 'tables', params: { slug: spaceSlug.value } } },
  table.value?.name || tableSlug.value || '…',
])

// ── Filters ────────────────────────────────────────────────
const filters = ref([])
const showFilter = ref(false)

function fieldBySlug(slug) { return fields.value.find(f => f.slug === slug) }

function defaultOp(field) {
  if (!field) return 'contains'
  if (['number', 'date', 'datetime'].includes(field.type)) return 'eq'
  if (field.type === 'boolean') return 'eq'
  if (field.type === 'enum') return 'eq'
  return 'contains'
}

function opsForField(slug) {
  const f = fieldBySlug(slug)
  if (!f) return [['contains', 'содержит'], ['ncontains', 'не содержит']]
  if (['number'].includes(f.type)) return [['eq', '='], ['gt', 'больше'], ['lt', 'меньше']]
  if (f.type === 'boolean') return [['eq', 'равно']]
  if (f.type === 'enum') return [['eq', 'равно'], ['ne', 'не равно']]
  return [['contains', 'содержит'], ['ncontains', 'не содержит']]
}

function addFilter() {
  const f = fields.value[0]
  if (!f) return
  filters.value.push({ field: f.slug, op: defaultOp(f), value: '' })
}

function removeFilter(i) { filters.value.splice(i, 1) }
function clearFilters() { filters.value = [] }

function onFilterFieldChange(i, slug) {
  const f = fieldBySlug(slug)
  filters.value[i] = { field: slug, op: defaultOp(f), value: '' }
}

const activeFilters = computed(() =>
  filters.value.filter(f => {
    const field = fieldBySlug(f.field)
    return field?.type === 'boolean' || String(f.value).trim() !== ''
  })
)

function matchFilter(rec, filter) {
  const f = fieldBySlug(filter.field)
  if (!f) return true
  const cell = rec[filter.field]
  if (f.type === 'boolean') return Boolean(cell) === (filter.value === 'true')
  if (f.type === 'number') {
    const n = parseFloat(String(cell ?? ''))
    const v = parseFloat(String(filter.value))
    if (isNaN(v)) return true
    return filter.op === 'gt' ? n > v : filter.op === 'lt' ? n < v : n === v
  }
  const s = String(cell ?? '').toLowerCase()
  const v = String(filter.value).toLowerCase()
  if (filter.op === 'ne') return s !== v
  if (filter.op === 'eq') return s === v
  if (filter.op === 'ncontains') return !s.includes(v)
  return s.includes(v)
}

const filteredRecords = computed(() => {
  if (!activeFilters.value.length) return recordsStore.records
  return recordsStore.records.filter(rec => activeFilters.value.every(f => matchFilter(rec, f)))
})

const pageStart = computed(() => page.value * LIMIT + 1)
const pageEnd = computed(() => Math.min((page.value + 1) * LIMIT, recordsStore.total))
const hasPrev = computed(() => page.value > 0)
const hasNext = computed(() => (page.value + 1) * LIMIT < recordsStore.total)
</script>

<template>
  <AppShell :breadcrumb="breadcrumb">
    <template #actions>
      <NButton variant="ghost" size="sm" @click="router.push({ name: 'schema-fields', params: { slug: spaceSlug, table: tableSlug } })">
        <NIcon name="settings" :size="13" />
        Поля
      </NButton>
      <NButton variant="danger-ghost" size="sm" @click="showDeleteTable = true">
        <NIcon name="trash" :size="13" />
        Удалить таблицу
      </NButton>
      <NButton variant="primary" size="sm" @click="showCreate = true">
        <NIcon name="plus" :size="13" color="#fff" />
        Добавить запись
      </NButton>
    </template>

    <div style="padding: 20px 32px 48px">
      <!-- Header -->
      <div style="margin-bottom: 16px">
        <h1 style="font-size: 20px; font-weight: 700; line-height: 1.2; margin-bottom: 4px">
          {{ table?.name || '…' }}
        </h1>
        <div style="font-size: 12px; color: var(--fg-3); display: flex; align-items: center; gap: 8px">
          <span style="font-variant-numeric: tabular-nums">{{ recordsStore.total }} записей</span>
          <span>·</span>
          <span @click="router.push({ name: 'api-docs', params: { slug: spaceSlug } })"
            style="color: var(--brand-primary); cursor: pointer; display: flex; align-items: center; gap: 3px">
            API <NIcon name="extlink" :size="11" />
          </span>
        </div>
      </div>

      <!-- Toolbar -->
      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px">
        <div style="position: relative; flex: 0 0 260px">
          <NIcon name="search" :size="14" color="var(--fg-3)" style="position: absolute; left: 10px; top: 50%; transform: translateY(-50%)" />
          <input v-model="search" placeholder="Поиск по всем полям…" :style="{
            height: '32px', width: '100%', padding: '0 10px 0 32px',
            border: '0.5px solid var(--border-strong)', borderRadius: '6px',
            background: 'var(--bg-0)', fontSize: '13px', color: 'var(--fg-1)',
            outline: 0, fontFamily: 'inherit', boxSizing: 'border-box',
          }" />
        </div>

        <!-- Filter button -->
        <div style="position: relative">
          <button @click="showFilter = !showFilter" :style="{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            height: '32px', padding: '0 12px', borderRadius: '6px', fontSize: '13px',
            fontWeight: 500, fontFamily: 'inherit', cursor: 'pointer', boxSizing: 'border-box',
            border: `0.5px solid ${showFilter || activeFilters.length ? 'var(--purple-300)' : 'var(--border-strong)'}`,
            background: showFilter || activeFilters.length ? 'var(--brand-tint)' : 'var(--bg-0)',
            color: showFilter || activeFilters.length ? 'var(--purple-700)' : 'var(--fg-1)',
          }">
            <NIcon name="filter" :size="12" />
            Фильтр
            <span v-if="activeFilters.length" :style="{
              minWidth: '16px', height: '16px', padding: '0 4px', borderRadius: '999px',
              background: 'var(--brand-primary)', color: '#fff',
              fontSize: '10px', fontWeight: 700,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            }">{{ activeFilters.length }}</span>
          </button>

          <!-- Filter popover -->
          <div v-if="showFilter" style="position: absolute; top: calc(100% + 6px); left: 0; z-index: 41; width: 380px; background: var(--bg-0); border: 0.5px solid var(--border-default); border-radius: 10px; box-shadow: 0 12px 32px rgba(20,14,58,.12),0 2px 6px rgba(20,14,58,.06)">
            <div style="padding: 12px 14px; border-bottom: 0.5px solid var(--border-default); font-size: 12px; font-weight: 600; color: var(--fg-1)">Фильтры</div>
            <div style="padding: 14px; display: flex; flex-direction: column; gap: 10px; max-height: 280px; overflow: auto">
              <div v-if="!filters.length" style="font-size: 12px; color: var(--fg-3); text-align: center; padding: 8px 0">Условий пока нет</div>
              <div v-for="(f, i) in filters" :key="i" style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap">
                <!-- Field selector -->
                <div style="position: relative">
                  <select :value="f.field" @change="onFilterFieldChange(i, $event.target.value)" :style="popSelectStyle">
                    <option v-for="fld in fields" :key="fld.slug" :value="fld.slug">{{ fld.name }}</option>
                  </select>
                  <NIcon name="chevd" :size="10" color="var(--fg-3)" style="position: absolute; right: 8px; top: 50%; transform: translateY(-50%); pointer-events: none" />
                </div>
                <!-- Op selector -->
                <div style="position: relative">
                  <select :value="f.op" @change="filters[i].op = $event.target.value" :style="popSelectStyle">
                    <option v-for="[v, l] in opsForField(f.field)" :key="v" :value="v">{{ l }}</option>
                  </select>
                  <NIcon name="chevd" :size="10" color="var(--fg-3)" style="position: absolute; right: 8px; top: 50%; transform: translateY(-50%); pointer-events: none" />
                </div>
                <!-- Value input -->
                <template v-if="fieldBySlug(f.field)?.type === 'boolean'">
                  <div style="display: flex; gap: 2px; padding: 2px; background: var(--bg-2); border-radius: 6px">
                    <button v-for="[v, l] in [['true','да'],['false','нет']]" :key="v"
                      @click="filters[i].value = v"
                      :style="{ height: '24px', padding: '0 10px', border: 0, borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: 500, fontFamily: 'inherit', background: f.value === v ? 'var(--bg-0)' : 'transparent', color: f.value === v ? 'var(--fg-1)' : 'var(--fg-3)', boxShadow: f.value === v ? '0 1px 2px rgba(20,14,58,.04)' : 'none' }">{{ l }}</button>
                  </div>
                </template>
                <template v-else-if="fieldBySlug(f.field)?.type === 'enum'">
                  <div style="position: relative; flex: 1; min-width: 110px">
                    <select :value="f.value" @change="filters[i].value = $event.target.value" :style="{ ...popSelectStyle, width: '100%' }">
                      <option value="">значение…</option>
                      <option v-for="v in fieldBySlug(f.field)?.enum_values || []" :key="v" :value="v">{{ v }}</option>
                    </select>
                    <NIcon name="chevd" :size="10" color="var(--fg-3)" style="position: absolute; right: 8px; top: 50%; transform: translateY(-50%); pointer-events: none" />
                  </div>
                </template>
                <template v-else>
                  <input :value="f.value" @input="filters[i].value = $event.target.value"
                    :type="fieldBySlug(f.field)?.type === 'number' ? 'number' : 'text'"
                    placeholder="значение…"
                    style="flex: 1; min-width: 90px; height: 30px; border-radius: 6px; border: 0.5px solid var(--border-strong); padding: 0 9px; font-size: 12px; background: var(--bg-0); color: var(--fg-1); outline: 0; font-family: inherit; box-sizing: border-box" />
                </template>
                <button @click="removeFilter(i)" style="background: 0; border: 0; cursor: pointer; color: var(--fg-3); padding: 4px; display: flex; flex-shrink: 0">
                  <NIcon name="x" :size="13" />
                </button>
              </div>
            </div>
            <div style="padding: 10px 14px; border-top: 0.5px solid var(--border-default); display: flex; justify-content: space-between; align-items: center">
              <button @click="addFilter" style="background: 0; border: 0; cursor: pointer; color: var(--brand-primary); font-size: 12px; font-weight: 500; font-family: inherit; display: flex; align-items: center; gap: 5px">
                <NIcon name="plus" :size="12" />Добавить условие
              </button>
              <button v-if="filters.length" @click="clearFilters" style="background: 0; border: 0; cursor: pointer; color: var(--fg-3); font-size: 12px; font-family: inherit">Сбросить всё</button>
            </div>
          </div>
          <!-- Backdrop -->
          <div v-if="showFilter" @click="showFilter = false" style="position: fixed; inset: 0; z-index: 40" />
        </div>

        <div style="flex: 1" />

        <NButton variant="ghost" size="sm" @click="fetchRecords">
          <NIcon name="refresh" :size="12" />Обновить
        </NButton>
      </div>

      <!-- Active filter chips -->
      <div v-if="activeFilters.length || sortBy" style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap; margin-bottom: 10px">
        <span v-for="(f, i) in activeFilters" :key="i" style="display: inline-flex; align-items: center; gap: 6px; padding: 4px 4px 4px 10px; border-radius: 999px; background: var(--brand-tint); font-size: 12px; font-weight: 500; white-space: nowrap">
          <span style="color: var(--fg-3)">{{ fieldBySlug(f.field)?.name }}</span>
          <span style="color: var(--fg-3); font-weight: 400">{{ opsForField(f.field).find(([v]) => v === f.op)?.[1] }}</span>
          <span style="color: var(--purple-700)">{{ f.value === 'true' ? 'да' : f.value === 'false' ? 'нет' : f.value }}</span>
          <button @click="removeFilter(filters.indexOf(f))" style="background: 0; border: 0; cursor: pointer; color: var(--purple-500); padding: 2px; display: flex; border-radius: 50%; line-height: 0">
            <NIcon name="x" :size="11" />
          </button>
        </span>
        <span v-if="sortBy" style="display: inline-flex; align-items: center; gap: 6px; padding: 4px 4px 4px 10px; border-radius: 999px; background: var(--bg-2); font-size: 12px; font-weight: 500; white-space: nowrap">
          <NIcon name="sliders" :size="11" color="var(--fg-3)" />
          <span style="color: var(--fg-2)">{{ fields.find(f => f.slug === sortBy)?.name }} {{ sortDir === 'asc' ? '↑' : '↓' }}</span>
          <button @click="sortBy = null; sortDir = 'asc'; fetchRecords()" style="background: 0; border: 0; cursor: pointer; color: var(--fg-3); padding: 2px; display: flex; border-radius: 50%; line-height: 0">
            <NIcon name="x" :size="11" />
          </button>
        </span>
        <button v-if="activeFilters.length" @click="clearFilters" style="background: 0; border: 0; cursor: pointer; color: var(--fg-3); font-size: 12px; font-family: inherit; text-decoration: underline; text-underline-offset: 2px">Очистить</button>
      </div>

      <!-- Table -->
      <div style="background: var(--bg-0); border: 0.5px solid var(--border-default); border-radius: 8px; overflow: hidden">

        <!-- Loading -->
        <div v-if="recordsStore.loading && !recordsStore.records.length"
          style="padding: 64px; text-align: center; color: var(--fg-3); font-size: 14px">
          Загрузка…
        </div>

        <!-- No table selected -->
        <div v-else-if="!tableSlug"
          style="padding: 64px; text-align: center; color: var(--fg-3)">
          <div style="font-size: 14px; font-weight: 600; margin-bottom: 6px">Выбери таблицу</div>
          <div style="font-size: 13px">Выбери таблицу из боковой панели или создай новую.</div>
        </div>

        <table v-else class="dt" style="width: 100%">
          <thead>
            <tr>
              <th style="width: 36px">
                <input type="checkbox" :checked="allSel" @change="toggleAll" style="accent-color: var(--brand-primary)" />
              </th>
              <th v-for="f in fields" :key="f.slug"
                @click="toggleSort(f.slug)"
                class="sortable"
                :style="{ textAlign: isNumeric(f) ? 'right' : 'left' }"
              >
                <span :style="{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: sortBy === f.slug ? 'var(--purple-700)' : undefined }">
                  {{ f.name }}
                  <span style="width: 9px; font-size: 9px; line-height: 1" :style="{ color: sortBy === f.slug ? 'var(--purple-500)' : 'var(--neutral-400)' }">
                    {{ sortBy === f.slug ? (sortDir === 'asc' ? '▲' : '▼') : '↕' }}
                  </span>
                </span>
              </th>
              <th style="width: 72px"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="rec in filteredRecords" :key="rec.id"
              :style="{ background: sel.has(rec.id) ? 'var(--brand-tint)' : undefined }">
              <td style="padding: 8px 12px">
                <input type="checkbox" :checked="sel.has(rec.id)" @change="toggleSel(rec.id, $event)" style="accent-color: var(--brand-primary)" />
              </td>
              <td v-for="(f, fi) in fields" :key="f.slug"
                :style="{ textAlign: isNumeric(f) ? 'right' : 'left', fontWeight: fi === 0 ? 500 : 400 }">

                <!-- First column with monogram if text/name -->
                <span v-if="fi === 0" style="display: flex; align-items: center; gap: 10px">
                  <span :style="{
                    width: '26px', height: '26px', borderRadius: '50%', flexShrink: 0,
                    display: 'grid', placeItems: 'center', fontSize: '10.5px', fontWeight: 700,
                    color: '#fff', background: monogram(cellValue(rec, f)).color,
                    letterSpacing: '0.02em', textTransform: 'uppercase',
                  }">{{ monogram(cellValue(rec, f)).initials }}</span>
                  <span>{{ cellValue(rec, f) }}</span>
                </span>

                <!-- Boolean -->
                <template v-else-if="isBoolean(f)">
                  <NBadge :tone="cellValue(rec, f) ? 'success' : 'neutral'" dot>{{ cellValue(rec, f) ? 'да' : 'нет' }}</NBadge>
                </template>

                <!-- Numeric -->
                <template v-else-if="isNumeric(f)">
                  <span style="font-family: var(--font-mono); font-variant-numeric: tabular-nums">{{ cellValue(rec, f) }}</span>
                </template>

                <!-- Email -->
                <template v-else-if="f.type === 'email'">
                  <span style="color: var(--brand-primary); font-size: 12px">{{ cellValue(rec, f) }}</span>
                </template>

                <!-- Default -->
                <template v-else>
                  <span>{{ cellValue(rec, f) }}</span>
                </template>
              </td>

              <!-- Row actions -->
              <td>
                <div class="row-actions" style="display: flex; gap: 2px; opacity: 0; transition: opacity 100ms">
                  <button @click="showToast('Редактирование в разработке')"
                    style="background: 0; border: 0; padding: 5px; cursor: pointer; color: var(--fg-2); border-radius: 4px">
                    <NIcon name="pencil" :size="13" />
                  </button>
                  <button @click="deleteRecordId = rec.id"
                    style="background: 0; border: 0; padding: 5px; cursor: pointer; color: var(--fg-2); border-radius: 4px">
                    <NIcon name="trash" :size="13" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <div v-if="tableSlug && !recordsStore.loading && !filteredRecords.length"
          style="padding: 48px 20px; text-align: center">
          <div style="width: 40px; height: 40px; border-radius: 10px; background: var(--bg-2); display: grid; place-items: center; margin: 0 auto 12px; color: var(--fg-3)">
            <NIcon name="search" :size="18" />
          </div>
          <div style="font-size: 14px; font-weight: 600; margin-bottom: 4px">Нет записей</div>
          <div style="font-size: 13px; color: var(--fg-3); margin-bottom: 14px">
            {{ search || activeFilters.length ? 'Ничего не найдено. Попробуй изменить запрос или сбросить фильтры.' : 'Добавь первую запись.' }}
          </div>
          <NButton v-if="search || activeFilters.length" variant="secondary" size="sm" @click="search = ''; clearFilters()">Сбросить фильтры</NButton>
        </div>
      </div>

      <!-- Pagination -->
      <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 14px; font-size: 12px; color: var(--fg-3)">
        <span>
          {{ recordsStore.total > 0 ? `Показано ${pageStart}–${pageEnd} из ${recordsStore.total}` : 'Нет записей' }}
        </span>
        <div style="display: flex; gap: 4px">
          <NButton variant="ghost" size="sm" :disabled="!hasPrev" @click="prevPage">← Назад</NButton>
          <NButton variant="secondary" size="sm" style="min-width: 32px">{{ page + 1 }}</NButton>
          <NButton variant="ghost" size="sm" :disabled="!hasNext" @click="nextPage">Вперёд →</NButton>
        </div>
      </div>
    </div>

    <!-- Selection bar -->
    <div v-if="sel.size > 0" :style="{
      position: 'fixed', bottom: '24px', left: '50%',
      transform: 'translateX(calc(-50% + 110px))',
      background: 'var(--neutral-900)', color: '#fff',
      padding: '8px 12px', borderRadius: '10px',
      boxShadow: 'var(--shadow-3)',
      display: 'flex', alignItems: 'center', gap: '8px',
      fontSize: '13px', zIndex: 30,
    }">
      <span style="font-weight: 500; padding: 0 6px">Выбрано: {{ sel.size }}</span>
      <div style="width: 1px; height: 20px; background: rgba(255,255,255,.15); flex-shrink: 0" />
      <button @click="exportCSV" :style="{
        display: 'flex', alignItems: 'center', gap: '6px',
        background: 'rgba(255,255,255,.1)', border: '0.5px solid rgba(255,255,255,.18)',
        color: '#fff', borderRadius: '6px', padding: '5px 12px',
        fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500,
      }">
        <NIcon name="download" :size="13" /> Экспорт
      </button>
      <button @click="bulkDelete" :disabled="bulkDeleting" :style="{
        display: 'flex', alignItems: 'center', gap: '6px',
        background: 'rgba(239,68,68,.18)', border: '0.5px solid rgba(239,68,68,.35)',
        color: '#fca5a5', borderRadius: '6px', padding: '5px 12px',
        fontSize: '13px', cursor: bulkDeleting ? 'not-allowed' : 'pointer',
        fontFamily: 'inherit', fontWeight: 500, opacity: bulkDeleting ? 0.6 : 1,
      }">
        <NIcon name="trash" :size="13" /> {{ bulkDeleting ? 'Удаление…' : 'Удалить' }}
      </button>
      <div style="width: 1px; height: 20px; background: rgba(255,255,255,.15); flex-shrink: 0" />
      <button @click="sel = new Set()" style="background: 0; border: 0; color: rgba(255,255,255,.5); cursor: pointer; padding: 4px; display: flex; align-items: center">
        <NIcon name="x" :size="13" />
      </button>
    </div>

    <!-- Create record modal -->
    <NModal :open="showCreate" @close="showCreate = false; createVals = {}; createError = ''"
      :title="`Новая запись — ${table?.name || ''}`"
      subtitle="Заполни поля новой записи."
      :width="520">
      <div style="display: flex; flex-direction: column; gap: 14px">
        <div v-for="f in fields" :key="f.slug">
          <label style="font-size: 12px; color: var(--fg-2); font-weight: 500; display: block; margin-bottom: 6px">
            {{ f.name }}<span v-if="f.required" style="color: var(--red-500); margin-left: 2px">*</span>
          </label>

          <template v-if="f.type === 'boolean'">
            <div style="display: flex; align-items: center; gap: 8px">
              <NToggle :model-value="createVals[f.slug] ?? false" @update:model-value="createVals[f.slug] = $event" />
              <span style="font-size: 13px; color: var(--fg-2)">{{ createVals[f.slug] ? 'да' : 'нет' }}</span>
            </div>
          </template>

          <template v-else-if="f.type === 'enum' && f.enum_values?.length">
            <NSelect
              :model-value="createVals[f.slug] || ''"
              @update:model-value="createVals[f.slug] = $event"
              placeholder="Выбери значение…"
              :options="f.enum_values.map(v => ({ value: v, label: v }))"
            />
          </template>

          <template v-else-if="f.type === 'file'">
            <div style="border: 1px dashed var(--border-strong); border-radius: 8px; padding: 18px 14px; display: flex; flex-direction: column; align-items: center; gap: 7px; background: var(--bg-1); text-align: center; cursor: pointer">
              <NIcon name="upload" :size="16" color="var(--fg-3)" />
              <div style="font-size: 13px; color: var(--fg-2)">Перетащи файлы или <span style="color: var(--brand-primary); font-weight: 500">выбери</span></div>
            </div>
          </template>

          <template v-else-if="f.type === 'longtext'">
            <textarea :value="createVals[f.slug] || ''" @input="createVals[f.slug] = $event.target.value"
              :placeholder="`Введи ${f.name.toLowerCase()}…`"
              style="width: 100%; min-height: 80px; border-radius: 6px; border: 0.5px solid var(--border-strong); padding: 8px 12px; font-size: 14px; background: var(--bg-0); color: var(--fg-1); outline: 0; font-family: inherit; resize: vertical; box-sizing: border-box" />
          </template>

          <template v-else-if="f.type === 'date' || f.type === 'datetime'">
            <NDatePicker
              :model-value="strToDatePicker(createVals[f.slug], f.type)"
              @update:model-value="createVals[f.slug] = datePickerToStr($event, f.type)"
              :mode="f.type"
              :placeholder="`Введи ${f.name.toLowerCase()}…`"
            />
          </template>

          <template v-else>
            <NInput :model-value="createVals[f.slug] || ''" @update:model-value="createVals[f.slug] = $event"
              :type="f.type === 'number' ? 'number' : f.type === 'email' ? 'email' : f.type === 'url' ? 'url' : f.type === 'phone' ? 'tel' : 'text'"
              :placeholder="`Введи ${f.name.toLowerCase()}…`" />
          </template>
        </div>
        <p v-if="createError" style="color: var(--red-600, #dc2626); font-size: 13px; margin: 0">{{ createError }}</p>
      </div>
      <template #footer>
        <NButton variant="ghost" size="md" @click="showCreate = false; createVals = {}; createError = ''">Отмена</NButton>
        <NButton variant="primary" size="md" @click="createRecord">Добавить запись</NButton>
      </template>
    </NModal>

    <!-- Delete confirm modal -->
    <NModal :open="deleteRecordId !== null" @close="deleteRecordId = null" title="Удалить запись?" :width="440">
      <p style="font-size: 14px; color: var(--fg-1); line-height: 1.5">
        Запись <strong>«{{ getDeleteName() }}»</strong> будет удалена без возможности восстановления.
      </p>
      <div style="margin-top: 16px; padding: 12px 14px; background: var(--red-50); border: 0.5px solid var(--red-100); border-radius: 6px; font-size: 12px; color: var(--red-700)">
        Это действие нельзя отменить.
      </div>
      <template #footer>
        <NButton variant="ghost" size="md" @click="deleteRecordId = null">Отмена</NButton>
        <NButton variant="danger" size="md" @click="confirmDelete">Удалить</NButton>
      </template>
    </NModal>

    <NModal :open="showDeleteTable" @close="showDeleteTable = false" title="Удалить таблицу?" :width="440">
      <p style="font-size: 14px; color: var(--fg-1); line-height: 1.5">
        Таблица <strong>«{{ table?.name }}»</strong> и все её записи будут удалены без возможности восстановления.
      </p>
      <div style="margin-top: 16px; padding: 12px 14px; background: var(--red-50); border: 0.5px solid var(--red-100); border-radius: 6px; font-size: 12px; color: var(--red-700)">
        Это действие нельзя отменить.
      </div>
      <template #footer>
        <NButton variant="ghost" size="md" @click="showDeleteTable = false">Отмена</NButton>
        <NButton variant="danger" size="md" :disabled="deleteTableLoading" @click="confirmDeleteTable">
          {{ deleteTableLoading ? 'Удаление…' : 'Удалить таблицу' }}
        </NButton>
      </template>
    </NModal>

    <NToast v-if="toast" :tone="toast.tone" :title="toast.title" @close="toast = null" />
  </AppShell>
</template>

<style>
tr:hover .row-actions { opacity: 1 !important; }
table.dt tbody tr { transition: background 90ms; }
table.dt tbody tr:hover td { background: var(--bg-1); }
table.dt th.sortable { cursor: pointer; user-select: none; transition: color 100ms; }
table.dt th.sortable:hover { color: var(--fg-1); }
</style>
