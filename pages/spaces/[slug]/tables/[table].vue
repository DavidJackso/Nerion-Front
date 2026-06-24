<script setup lang="ts">
import { useSchemaStore } from '~/stores/schema'
import { useRecordsStore } from '~/stores/records'
import { useSpacesStore } from '~/stores/spaces'
import { useSpaceSlug } from '~/composables/useSpaceSlug'
import { useToast } from '~/composables/useToast'
import { presignFile } from '~/api/files'

definePageMeta({ layout: 'app', middleware: [] })

const route = useRoute()
const router = useRouter()
const schemaStore = useSchemaStore()
const recordsStore = useRecordsStore()
const spacesStore = useSpacesStore()
const { toast, show: showToast } = useToast(3000)

const spaceSlug = computed(() => route.params.slug as string)
const tableSlug = computed(() => route.params.table as string)
const space = computed(() => spacesStore.spaces.find((s: any) => s.slug === spaceSlug.value))
const table = computed(() => schemaStore.activeTable)
const fields = computed(() => (table.value as any)?.fields || [])

// ── Selection ────────────────────────────────────────────────────────────────

const sel = ref(new Set<string | number>())

const allSel = computed(() => {
  const ids = recordsStore.records.map((r: any) => r.id)
  return ids.length > 0 && ids.every((id: any) => sel.value.has(id))
})

function toggleSel(id: string | number, e: Event) {
  const s = new Set(sel.value)
  ;(e.target as HTMLInputElement).checked ? s.add(id) : s.delete(id)
  sel.value = s
}

function toggleAll(e: Event) {
  const s = new Set(sel.value)
  recordsStore.records.forEach((r: any) =>
    (e.target as HTMLInputElement).checked ? s.add(r.id) : s.delete(r.id)
  )
  sel.value = s
}

// ── Pagination ────────────────────────────────────────────────────────────────

const page = ref(0)
const LIMIT = 50
const pageStart = computed(() => page.value * LIMIT + 1)
const pageEnd = computed(() => Math.min((page.value + 1) * LIMIT, recordsStore.total))
const hasPrev = computed(() => page.value > 0)
const hasNext = computed(() => (page.value + 1) * LIMIT < recordsStore.total)

function prevPage() {
  if (page.value > 0) { page.value--; fetchRecords() }
}
function nextPage() {
  if ((page.value + 1) * LIMIT < recordsStore.total) { page.value++; fetchRecords() }
}

// ── Debounced search (300ms) ──────────────────────────────────────────────────

const search = ref('')
let searchTimer: ReturnType<typeof setTimeout> | null = null

watch(search, () => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => { page.value = 0; fetchRecords() }, 300)
})

// ── Sort: asc → desc → none ──────────────────────────────────────────────────

const sortBy = ref<string | null>(null)
const sortDir = ref<'asc' | 'desc'>('asc')

function toggleSort(fieldSlug: string) {
  if (sortBy.value !== fieldSlug) {
    sortBy.value = fieldSlug
    sortDir.value = 'asc'
  } else if (sortDir.value === 'asc') {
    sortDir.value = 'desc'
  } else {
    sortBy.value = null
    sortDir.value = 'asc'
  }
  fetchRecords()
}

// ── Bulk delete ───────────────────────────────────────────────────────────────

const bulkDeleting = ref(false)

async function bulkDelete() {
  if (bulkDeleting.value) return
  bulkDeleting.value = true
  try {
    const ids = [...sel.value]
    await recordsStore.bulkDelete(spaceSlug.value, tableSlug.value, ids)
    sel.value = new Set()
    showToast({ title: `Удалено ${ids.length} записей`, tone: 'error' })
  } catch (e: any) {
    showToast({ title: e.message || 'Ошибка удаления', tone: 'error' })
  } finally {
    bulkDeleting.value = false
  }
}

// ── CSV export ────────────────────────────────────────────────────────────────

function exportCSV() {
  const rows = recordsStore.records.filter((r: any) => sel.value.has(r.id))
  if (!rows.length) return
  const cols = ['id', ...fields.value.map((f: any) => f.slug)]
  const header = cols.join(',')
  const lines = rows.map((r: any) =>
    cols.map((c: string) => {
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

// ── Delete record modal ───────────────────────────────────────────────────────

const deleteRecordId = ref<string | number | null>(null)

function getDeleteName(): string {
  const rec = recordsStore.records.find((r: any) => r.id === deleteRecordId.value) as any
  if (!rec || !fields.value.length) return String(deleteRecordId.value)
  const first = fields.value[0]
  return first ? String(rec[first.slug] ?? rec.id) : String(rec.id)
}

async function confirmDelete() {
  try {
    await recordsStore.deleteRecord(spaceSlug.value, tableSlug.value, deleteRecordId.value as any)
    deleteRecordId.value = null
    showToast({ title: 'Запись удалена', tone: 'error' })
  } catch (e: any) {
    showToast({ title: e.message || 'Ошибка удаления', tone: 'error' })
  }
}

// ── Delete table modal ────────────────────────────────────────────────────────

const showDeleteTable = ref(false)
const deleteTableLoading = ref(false)

async function confirmDeleteTable() {
  deleteTableLoading.value = true
  try {
    await schemaStore.deleteTable(spaceSlug.value, tableSlug.value)
    router.push(`/spaces/${spaceSlug.value}/tables`)
  } catch (e: any) {
    showToast({ title: e.message || 'Ошибка удаления', tone: 'error' })
    deleteTableLoading.value = false
    showDeleteTable.value = false
  }
}

// ── Create record modal ───────────────────────────────────────────────────────

const showCreate = ref(false)
const createVals = ref<Record<string, any>>({})
const createError = ref('')

async function createRecord() {
  createError.value = ''
  try {
    await recordsStore.createRecord(spaceSlug.value, tableSlug.value, createVals.value)
    showCreate.value = false
    createVals.value = {}
    showToast({ title: 'Запись добавлена', tone: 'success' })
  } catch (e: any) {
    createError.value = e.message
  }
}

// ── Edit record modal ─────────────────────────────────────────────────────────

const editRecordId = ref<number | null>(null)
const editVals = ref<Record<string, any>>({})
const editError = ref('')
const editLoading = ref(false)

function openEdit(rec: any) {
  editRecordId.value = rec.id
  const vals: Record<string, any> = {}
  fields.value.forEach((f: any) => { vals[f.slug] = rec[f.slug] ?? null })
  editVals.value = vals
  editError.value = ''
}

async function saveEdit() {
  if (!editRecordId.value) return
  editLoading.value = true
  editError.value = ''
  try {
    await recordsStore.updateRecord(spaceSlug.value, tableSlug.value, editRecordId.value, editVals.value)
    editRecordId.value = null
    showToast({ title: 'Изменения сохранены', tone: 'success' })
  } catch (e: any) {
    editError.value = e.message
  } finally {
    editLoading.value = false
  }
}

function closeEdit() {
  editRecordId.value = null
  editVals.value = {}
  editError.value = ''
}

// ── Cell helpers ──────────────────────────────────────────────────────────────

function cellValue(rec: any, field: any) {
  const v = rec[field.slug]
  if (v === null || v === undefined) return ''
  return v
}

function isNumeric(field: any) {
  return field.type === 'number'
}

function isBoolean(field: any) {
  return field.type === 'boolean'
}

const MONO_HUES = [
  'var(--purple-400)',
  'var(--green-500)',
  'var(--amber-500)',
  'var(--blue-500)',
  'var(--purple-600)',
]

function fileKeyName(key: string): string {
  const last = key.split('/').pop() ?? key
  return last.replace(/^\d+_/, '')
}

async function openFileCell(key: string) {
  try {
    const { url } = await presignFile(spaceSlug.value, key)
    window.open(url, '_blank')
  } catch {
    showToast({ title: 'Не удалось получить ссылку', tone: 'error' })
  }
}

function monogram(name: any) {
  const s = String(name || '')
  const parts = s.trim().split(/\s+/)
  const initials = (parts[0]?.[0] || '') + (parts[1]?.[0] || '')
  let h = 0
  for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  return { initials: initials.toUpperCase(), color: MONO_HUES[h % MONO_HUES.length] }
}

// ── Breadcrumb ────────────────────────────────────────────────────────────────

const breadcrumb = useState<Array<string | { label: string; to?: string }>>('breadcrumb', () => [])
watchEffect(() => {
  breadcrumb.value = [
    { label: space.value?.name || (spaceSlug.value as string), to: `/spaces/${spaceSlug.value}/tables` },
    (table.value as any)?.name || (tableSlug.value as string) || '…',
  ]
})

// ── Filters (client-side) ─────────────────────────────────────────────────────

interface Filter { field: string; op: string; value: string }
const filters = ref<Filter[]>([])
const showFilter = ref(false)

function fieldBySlug(slug: string) {
  return (fields.value as any[]).find((f: any) => f.slug === slug)
}

function defaultOp(field: any): string {
  if (!field) return 'contains'
  if (['number'].includes(field.type)) return 'eq'
  if (field.type === 'boolean') return 'eq'
  if (field.type === 'enum') return 'eq'
  return 'contains'
}

function opsForField(slug: string): [string, string][] {
  const f = fieldBySlug(slug)
  if (!f) return [['contains', 'содержит'], ['ncontains', 'не содержит']]
  if (f.type === 'number') return [['eq', '='], ['gt', 'больше'], ['lt', 'меньше']]
  if (f.type === 'boolean') return [['eq', 'равно']]
  if (f.type === 'enum') return [['eq', 'равно'], ['ne', 'не равно']]
  return [['contains', 'содержит'], ['ncontains', 'не содержит']]
}

function addFilter() {
  const f = (fields.value as any[])[0]
  if (!f) return
  filters.value.push({ field: f.slug, op: defaultOp(f), value: '' })
}

function removeFilter(i: number) { filters.value.splice(i, 1) }
function clearFilters() { filters.value = [] }

function onFilterFieldChange(i: number, slug: string) {
  const f = fieldBySlug(slug)
  filters.value[i] = { field: slug, op: defaultOp(f), value: '' }
}

const activeFilters = computed(() =>
  filters.value.filter((f: Filter) => {
    const field = fieldBySlug(f.field)
    return field?.type === 'boolean' || String(f.value).trim() !== ''
  })
)

function matchFilter(rec: any, filter: Filter): boolean {
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
  return recordsStore.records.filter((rec: any) => activeFilters.value.every((f: Filter) => matchFilter(rec, f)))
})

// ── Data loading ──────────────────────────────────────────────────────────────

let loadSeq = 0

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

async function load() {
  if (!spaceSlug.value || !tableSlug.value) return
  const seq = ++loadSeq
  sel.value = new Set()
  try {
    await schemaStore.fetchTable(spaceSlug.value, tableSlug.value)
  } catch {
    if (seq === loadSeq) router.replace('/not-found')
    return
  }
  if (seq !== loadSeq) return
  await fetchRecords()
}

watch([spaceSlug, tableSlug], load, { immediate: true })

onUnmounted(() => {
  if (searchTimer) clearTimeout(searchTimer)
})
</script>

<template>
  <div>
    <div style="padding: 20px 32px 48px">
      <!-- Page header -->
      <div
        style="display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 16px; gap: 12px"
      >
        <div>
          <h1 style="font-size: 20px; font-weight: 700; line-height: 1.2; margin-bottom: 4px">
            {{ (table as any)?.name || '…' }}
          </h1>
          <div
            style="font-size: 12px; color: var(--fg-3); display: flex; align-items: center; gap: 8px"
          >
            <span style="font-variant-numeric: tabular-nums">{{ recordsStore.total }} записей</span>
            <span>·</span>
            <span
              @click="router.push(`/spaces/${spaceSlug}/api`)"
              style="color: var(--brand-primary); cursor: pointer; display: flex; align-items: center; gap: 3px"
            >
              API <NIcon name="extlink" :size="11" />
            </span>
          </div>
        </div>
        <div style="display: flex; align-items: center; gap: 6px; flex-shrink: 0">
          <NButton
            variant="ghost"
            size="sm"
            @click="router.push(`/spaces/${spaceSlug}/schema/${tableSlug}/fields`)"
          >
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
        </div>
      </div>

      <!-- Toolbar -->
      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px">
        <div style="position: relative; flex: 0 0 260px">
          <NIcon
            name="search"
            :size="14"
            color="var(--fg-3)"
            style="position: absolute; left: 10px; top: 50%; transform: translateY(-50%)"
          />
          <input
            v-model="search"
            placeholder="Поиск по всем полям…"
            :style="{
              height: '32px',
              width: '100%',
              padding: '0 10px 0 32px',
              border: '0.5px solid var(--border-strong)',
              borderRadius: '6px',
              background: 'var(--bg-0)',
              fontSize: '13px',
              color: 'var(--fg-1)',
              outline: '0',
              fontFamily: 'inherit',
              boxSizing: 'border-box',
            }"
          />
        </div>

        <!-- Filter button + popover -->
        <div style="position: relative">
          <button @click="showFilter = !showFilter" :style="{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            height: '32px', padding: '0 12px', borderRadius: '6px', fontSize: '13px',
            fontWeight: '500', fontFamily: 'inherit', cursor: 'pointer', boxSizing: 'border-box',
            border: `0.5px solid ${showFilter || activeFilters.length ? 'var(--purple-300)' : 'var(--border-strong)'}`,
            background: showFilter || activeFilters.length ? 'var(--brand-tint)' : 'var(--bg-0)',
            color: showFilter || activeFilters.length ? 'var(--purple-700)' : 'var(--fg-1)',
          }">
            <NIcon name="filter" :size="12" />
            Фильтр
            <span v-if="activeFilters.length" :style="{
              minWidth: '16px', height: '16px', padding: '0 4px', borderRadius: '999px',
              background: 'var(--brand-primary)', color: '#fff',
              fontSize: '10px', fontWeight: '700',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            }">{{ activeFilters.length }}</span>
          </button>

          <div v-if="showFilter" style="position: absolute; top: calc(100% + 6px); left: 0; z-index: 41; width: 380px; background: var(--bg-0); border: 0.5px solid var(--border-default); border-radius: 10px; box-shadow: 0 12px 32px rgba(20,14,58,.12),0 2px 6px rgba(20,14,58,.06)">
            <div style="padding: 12px 14px; border-bottom: 0.5px solid var(--border-default); font-size: 12px; font-weight: 600; color: var(--fg-1)">Фильтры</div>
            <div style="padding: 14px; display: flex; flex-direction: column; gap: 10px; max-height: 280px; overflow: auto">
              <div v-if="!filters.length" style="font-size: 12px; color: var(--fg-3); text-align: center; padding: 8px 0">Условий пока нет</div>
              <div v-for="(f, i) in filters" :key="i" style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap">
                <NSelect
                  :modelValue="f.field"
                  @update:modelValue="onFilterFieldChange(i, $event as string)"
                  size="sm"
                  :options="(fields as any[]).map((fld: any) => ({ value: fld.slug, label: fld.name }))"
                  style="width: 120px"
                />
                <NSelect
                  :modelValue="f.op"
                  @update:modelValue="filters[i].op = $event as string"
                  size="sm"
                  :options="opsForField(f.field).map(([v, l]) => ({ value: v, label: l }))"
                  style="width: 120px"
                />
                <template v-if="fieldBySlug(f.field)?.type === 'boolean'">
                  <div style="display: flex; gap: 2px; padding: 2px; background: var(--bg-2); border-radius: 6px">
                    <button v-for="[v, l] in [['true','да'],['false','нет']]" :key="v"
                      @click="filters[i].value = v as string"
                      :style="{ height: '24px', padding: '0 10px', border: '0', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: '500', fontFamily: 'inherit', background: f.value === v ? 'var(--bg-0)' : 'transparent', color: f.value === v ? 'var(--fg-1)' : 'var(--fg-3)', boxShadow: f.value === v ? '0 1px 2px rgba(20,14,58,.04)' : 'none' }">{{ l }}</button>
                  </div>
                </template>
                <template v-else-if="fieldBySlug(f.field)?.type === 'enum'">
                  <NSelect
                    :modelValue="f.value || null"
                    @update:modelValue="filters[i].value = ($event as string) || ''"
                    size="sm"
                    placeholder="значение…"
                    :options="(fieldBySlug(f.field)?.enum_values || []).map((v: string) => ({ value: v, label: v }))"
                    style="flex: 1; min-width: 110px"
                  />
                </template>
                <template v-else>
                  <input :value="f.value" @input="filters[i].value = ($event.target as HTMLInputElement).value"
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
          <div v-if="showFilter" @click="showFilter = false" style="position: fixed; inset: 0; z-index: 40" />
        </div>

        <div style="flex: 1" />
        <NButton variant="ghost" size="sm" @click="fetchRecords">
          <NIcon name="refresh" :size="12" />Обновить
        </NButton>
      </div>

      <!-- Active filter / sort chips -->
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
          <span style="color: var(--fg-2)">{{ (fields as any[]).find(f => f.slug === sortBy)?.name }} {{ sortDir === 'asc' ? '↑' : '↓' }}</span>
          <button @click="sortBy = null; sortDir = 'asc'; fetchRecords()" style="background: 0; border: 0; cursor: pointer; color: var(--fg-3); padding: 2px; display: flex; border-radius: 50%; line-height: 0">
            <NIcon name="x" :size="11" />
          </button>
        </span>
        <button v-if="activeFilters.length" @click="clearFilters" style="background: 0; border: 0; cursor: pointer; color: var(--fg-3); font-size: 12px; font-family: inherit; text-decoration: underline; text-underline-offset: 2px">Очистить</button>
      </div>

      <!-- Table container -->
      <div
        style="background: var(--bg-0); border: 0.5px solid var(--border-default); border-radius: 8px; overflow: hidden"
      >
        <!-- Loading -->
        <div
          v-if="recordsStore.loading && !recordsStore.records.length"
          style="padding: 64px; text-align: center; color: var(--fg-3); font-size: 14px"
        >
          Загрузка…
        </div>

        <!-- Data table -->
        <table v-else class="dt" style="width: 100%">
          <thead>
            <tr>
              <th style="width: 36px">
                <input
                  type="checkbox"
                  :checked="allSel"
                  @change="toggleAll"
                  style="accent-color: var(--brand-primary)"
                />
              </th>
              <th
                v-for="f in fields"
                :key="f.slug"
                @click="toggleSort(f.slug)"
                class="sortable"
                :style="{ textAlign: isNumeric(f) ? 'right' : 'left' }"
              >
                <span
                  :style="{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    color: sortBy === f.slug ? 'var(--purple-700)' : undefined,
                  }"
                >
                  {{ f.name }}
                  <span
                    style="width: 9px; font-size: 9px; line-height: 1"
                    :style="{ color: sortBy === f.slug ? 'var(--purple-500)' : 'var(--neutral-400)' }"
                  >
                    {{ sortBy === f.slug ? (sortDir === 'asc' ? '▲' : '▼') : '↕' }}
                  </span>
                </span>
              </th>
              <th style="width: 72px"></th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="rec in filteredRecords"
              :key="rec.id"
              :style="{ background: sel.has(rec.id) ? 'var(--brand-tint)' : undefined }"
            >
              <td style="padding: 8px 12px">
                <input
                  type="checkbox"
                  :checked="sel.has(rec.id)"
                  @change="toggleSel(rec.id, $event)"
                  style="accent-color: var(--brand-primary)"
                />
              </td>
              <td
                v-for="(f, fi) in fields"
                :key="f.slug"
                :style="{ textAlign: isNumeric(f) ? 'right' : 'left', fontWeight: fi === 0 ? 500 : 400 }"
              >
                <!-- First column: monogram + value -->
                <span v-if="fi === 0" style="display: flex; align-items: center; gap: 10px">
                  <span
                    :style="{
                      width: '26px',
                      height: '26px',
                      borderRadius: '50%',
                      flexShrink: '0',
                      display: 'grid',
                      placeItems: 'center',
                      fontSize: '10.5px',
                      fontWeight: '700',
                      color: '#fff',
                      background: monogram(cellValue(rec, f)).color,
                      letterSpacing: '0.02em',
                      textTransform: 'uppercase',
                    }"
                  >{{ monogram(cellValue(rec, f)).initials }}</span>
                  <span>{{ cellValue(rec, f) }}</span>
                </span>

                <!-- Boolean: colored badge -->
                <template v-else-if="isBoolean(f)">
                  <NBadge :tone="cellValue(rec, f) ? 'success' : 'neutral'" dot>
                    {{ cellValue(rec, f) ? 'да' : 'нет' }}
                  </NBadge>
                </template>

                <!-- Numeric: monospace tabular -->
                <template v-else-if="isNumeric(f)">
                  <span style="font-family: var(--font-mono); font-variant-numeric: tabular-nums">
                    {{ cellValue(rec, f) }}
                  </span>
                </template>

                <!-- Email: brand color -->
                <template v-else-if="f.type === 'email'">
                  <span style="color: var(--brand-primary); font-size: 12px">{{ cellValue(rec, f) }}</span>
                </template>

                <!-- File: chip with name + open link -->
                <template v-else-if="f.type === 'file'">
                  <button
                    v-if="cellValue(rec, f)"
                    @click.stop="openFileCell(String(cellValue(rec, f)))"
                    class="filecell"
                    style="display:inline-flex;align-items:center;gap:6px;background:0;border:0;cursor:pointer;padding:2px 6px;margin:-2px -6px;border-radius:6px;font-family:inherit"
                  >
                    <NIcon name="file" :size="13" color="var(--fg-3)" />
                    <span style="font-size:12px;font-family:var(--font-mono);color:var(--fg-2);max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
                      {{ fileKeyName(String(cellValue(rec, f))) }}
                    </span>
                    <NIcon name="extlink" :size="10" color="var(--fg-3)" />
                  </button>
                  <span v-else style="color:var(--fg-3)">—</span>
                </template>

                <!-- Files: multiple chips -->
                <template v-else-if="f.type === 'files'">
                  <span v-if="!cellValue(rec, f) || !(cellValue(rec, f) as string[]).length" style="color:var(--fg-3)">—</span>
                  <span v-else style="display:inline-flex;gap:4px;flex-wrap:wrap">
                    <button
                      v-for="key in (cellValue(rec, f) as string[])"
                      :key="key"
                      @click.stop="openFileCell(key)"
                      class="filecell"
                      style="display:inline-flex;align-items:center;gap:4px;background:0;border:0;cursor:pointer;padding:2px 6px;margin:-2px 0;border-radius:6px;font-family:inherit"
                    >
                      <NIcon name="file" :size="13" color="var(--fg-3)" />
                      <span style="font-size:12px;font-family:var(--font-mono);color:var(--fg-2);max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{{ fileKeyName(key) }}</span>
                    </button>
                  </span>
                </template>

                <!-- Default -->
                <template v-else>
                  <span>{{ cellValue(rec, f) }}</span>
                </template>
              </td>

              <!-- Row actions (visible on hover via CSS) -->
              <td>
                <div
                  class="row-actions"
                  style="display: flex; gap: 2px; opacity: 0; transition: opacity 100ms"
                >
                  <button
                    @click.stop="openEdit(rec)"
                    style="background: 0; border: 0; padding: 5px; cursor: pointer; color: var(--fg-2); border-radius: 4px"
                  >
                    <NIcon name="pencil" :size="13" />
                  </button>
                  <button
                    @click="deleteRecordId = rec.id"
                    style="background: 0; border: 0; padding: 5px; cursor: pointer; color: var(--fg-2); border-radius: 4px"
                  >
                    <NIcon name="trash" :size="13" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Empty state -->
        <div
          v-if="!recordsStore.loading && !filteredRecords.length"
          style="padding: 48px 20px; text-align: center"
        >
          <div
            style="width: 40px; height: 40px; border-radius: 10px; background: var(--bg-2); display: grid; place-items: center; margin: 0 auto 12px; color: var(--fg-3)"
          >
            <NIcon name="search" :size="18" />
          </div>
          <div style="font-size: 14px; font-weight: 600; margin-bottom: 4px">Нет записей</div>
          <div style="font-size: 13px; color: var(--fg-3); margin-bottom: 14px">
            {{ search || activeFilters.length ? 'Ничего не найдено. Попробуй изменить запрос или фильтры.' : 'Добавь первую запись.' }}
          </div>
          <NButton v-if="search" variant="secondary" size="sm" @click="search = ''">
            Сбросить поиск
          </NButton>
        </div>
      </div>

      <!-- Pagination -->
      <div
        style="display: flex; align-items: center; justify-content: space-between; margin-top: 14px; font-size: 12px; color: var(--fg-3)"
      >
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

    <!-- Selection bar (fixed bottom) -->
    <div
      v-if="sel.size > 0"
      :style="{
        position: 'fixed',
        bottom: '24px',
        left: '50%',
        transform: 'translateX(calc(-50% + 110px))',
        background: 'var(--neutral-900)',
        color: '#fff',
        padding: '8px 12px',
        borderRadius: '10px',
        boxShadow: 'var(--shadow-3)',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '13px',
        zIndex: '30',
      }"
    >
      <span style="font-weight: 500; padding: 0 6px">Выбрано: {{ sel.size }}</span>
      <div style="width: 1px; height: 20px; background: rgba(255,255,255,.15); flex-shrink: 0" />
      <button
        @click="exportCSV"
        :style="{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: 'rgba(255,255,255,.1)',
          border: '0.5px solid rgba(255,255,255,.18)',
          color: '#fff',
          borderRadius: '6px',
          padding: '5px 12px',
          fontSize: '13px',
          cursor: 'pointer',
          fontFamily: 'inherit',
          fontWeight: '500',
        }"
      >
        <NIcon name="download" :size="13" /> Экспорт
      </button>
      <button
        @click="bulkDelete"
        :disabled="bulkDeleting"
        :style="{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: 'rgba(239,68,68,.18)',
          border: '0.5px solid rgba(239,68,68,.35)',
          color: '#fca5a5',
          borderRadius: '6px',
          padding: '5px 12px',
          fontSize: '13px',
          cursor: bulkDeleting ? 'not-allowed' : 'pointer',
          fontFamily: 'inherit',
          fontWeight: '500',
          opacity: bulkDeleting ? '0.6' : '1',
        }"
      >
        <NIcon name="trash" :size="13" /> {{ bulkDeleting ? 'Удаление…' : 'Удалить' }}
      </button>
      <div style="width: 1px; height: 20px; background: rgba(255,255,255,.15); flex-shrink: 0" />
      <button
        @click="sel = new Set()"
        style="background: 0; border: 0; color: rgba(255,255,255,.5); cursor: pointer; padding: 4px; display: flex; align-items: center"
      >
        <NIcon name="x" :size="13" />
      </button>
    </div>

    <!-- Create record modal -->
    <NModal
      :open="showCreate"
      @close="showCreate = false; createVals = {}; createError = ''"
      :title="`Новая запись — ${(table as any)?.name || ''}`"
      subtitle="Заполни поля новой записи."
      :width="520"
    >
      <div style="display: flex; flex-direction: column; gap: 14px">
        <div v-for="f in fields" :key="f.slug">
          <label
            style="font-size: 12px; color: var(--fg-2); font-weight: 500; display: block; margin-bottom: 6px"
          >
            {{ f.name }}<span v-if="f.required" style="color: var(--red-500); margin-left: 2px">*</span>
          </label>

          <!-- Boolean toggle -->
          <template v-if="f.type === 'boolean'">
            <div style="display: flex; align-items: center; gap: 8px">
              <NToggle
                :model-value="createVals[f.slug] ?? false"
                @update:model-value="createVals[f.slug] = $event"
              />
              <span style="font-size: 13px; color: var(--fg-2)">{{ createVals[f.slug] ? 'да' : 'нет' }}</span>
            </div>
          </template>

          <!-- Enum select -->
          <template v-else-if="f.type === 'enum' && f.enum_values?.length">
            <NSelect
              :model-value="createVals[f.slug] || ''"
              @update:model-value="createVals[f.slug] = $event"
              placeholder="Выбери значение…"
              :options="f.enum_values.map((v: string) => ({ value: v, label: v }))"
            />
          </template>

          <!-- File upload -->
          <template v-else-if="f.type === 'file'">
            <NFileInput
              :space-slug="spaceSlug"
              :model-value="createVals[f.slug] || null"
              @update:model-value="createVals[f.slug] = $event"
            />
          </template>

          <!-- Files upload (multiple) -->
          <template v-else-if="f.type === 'files'">
            <NFileInput
              :space-slug="spaceSlug"
              :model-value="createVals[f.slug] || []"
              :multiple="true"
              @update:model-value="createVals[f.slug] = $event"
            />
          </template>

          <!-- Long text textarea -->
          <template v-else-if="f.type === 'longtext'">
            <textarea
              :value="createVals[f.slug] || ''"
              @input="createVals[f.slug] = ($event.target as HTMLTextAreaElement).value"
              :placeholder="`Введи ${f.name.toLowerCase()}…`"
              style="width: 100%; min-height: 80px; border-radius: 6px; border: 0.5px solid var(--border-strong); padding: 8px 12px; font-size: 14px; background: var(--bg-0); color: var(--fg-1); outline: 0; font-family: inherit; resize: vertical; box-sizing: border-box"
            />
          </template>

          <!-- Date / datetime picker -->
          <template v-else-if="f.type === 'date' || f.type === 'datetime'">
            <NDatePicker
              :model-value="createVals[f.slug] || undefined"
              :type="f.type"
              :placeholder="`Введи ${f.name.toLowerCase()}…`"
              @update:model-value="createVals[f.slug] = $event"
            />
          </template>

          <!-- All other field types -->
          <template v-else>
            <NInput
              :model-value="createVals[f.slug] || ''"
              @update:model-value="createVals[f.slug] = $event"
              :type="
                f.type === 'number' ? 'number'
                : f.type === 'email' ? 'email'
                : f.type === 'url' ? 'url'
                : f.type === 'phone' ? 'tel'
                : 'text'
              "
              :placeholder="`Введи ${f.name.toLowerCase()}…`"
            />
          </template>
        </div>
        <p v-if="createError" style="color: var(--red-600, #dc2626); font-size: 13px; margin: 0">
          {{ createError }}
        </p>
      </div>
      <template #footer>
        <NButton
          variant="ghost"
          size="md"
          @click="showCreate = false; createVals = {}; createError = ''"
        >Отмена</NButton>
        <NButton variant="primary" size="md" @click="createRecord">Добавить запись</NButton>
      </template>
    </NModal>

    <!-- Edit record modal -->
    <NModal
      :open="editRecordId !== null"
      @close="closeEdit"
      :title="`Изменить запись — ${(table as any)?.name || ''}`"
      subtitle="Редактируй поля записи."
      :width="520"
    >
      <div style="display: flex; flex-direction: column; gap: 14px">
        <div v-for="f in fields" :key="f.slug">
          <label
            style="font-size: 12px; color: var(--fg-2); font-weight: 500; display: block; margin-bottom: 6px"
          >
            {{ f.name }}<span v-if="f.required" style="color: var(--red-500); margin-left: 2px">*</span>
          </label>

          <template v-if="f.type === 'boolean'">
            <div style="display: flex; align-items: center; gap: 8px">
              <NToggle
                :model-value="editVals[f.slug] ?? false"
                @update:model-value="editVals[f.slug] = $event"
              />
              <span style="font-size: 13px; color: var(--fg-2)">{{ editVals[f.slug] ? 'да' : 'нет' }}</span>
            </div>
          </template>

          <template v-else-if="f.type === 'enum' && f.enum_values?.length">
            <NSelect
              :model-value="editVals[f.slug] || ''"
              @update:model-value="editVals[f.slug] = $event"
              placeholder="Выбери значение…"
              :options="f.enum_values.map((v: string) => ({ value: v, label: v }))"
            />
          </template>

          <template v-else-if="f.type === 'file'">
            <NFileInput
              :space-slug="spaceSlug"
              :model-value="editVals[f.slug] || null"
              @update:model-value="editVals[f.slug] = $event"
            />
          </template>

          <template v-else-if="f.type === 'files'">
            <NFileInput
              :space-slug="spaceSlug"
              :model-value="editVals[f.slug] || []"
              :multiple="true"
              @update:model-value="editVals[f.slug] = $event"
            />
          </template>

          <template v-else-if="f.type === 'longtext'">
            <textarea
              :value="editVals[f.slug] || ''"
              @input="editVals[f.slug] = ($event.target as HTMLTextAreaElement).value"
              :placeholder="`Введи ${f.name.toLowerCase()}…`"
              style="width: 100%; min-height: 80px; border-radius: 6px; border: 0.5px solid var(--border-strong); padding: 8px 12px; font-size: 14px; background: var(--bg-0); color: var(--fg-1); outline: 0; font-family: inherit; resize: vertical; box-sizing: border-box"
            />
          </template>

          <!-- Date / datetime picker -->
          <template v-else-if="f.type === 'date' || f.type === 'datetime'">
            <NDatePicker
              :model-value="editVals[f.slug] || undefined"
              :type="f.type"
              :placeholder="`Введи ${f.name.toLowerCase()}…`"
              @update:model-value="editVals[f.slug] = $event"
            />
          </template>

          <template v-else>
            <NInput
              :model-value="editVals[f.slug] || ''"
              @update:model-value="editVals[f.slug] = $event"
              :type="
                f.type === 'number' ? 'number'
                : f.type === 'email' ? 'email'
                : f.type === 'url' ? 'url'
                : f.type === 'phone' ? 'tel'
                : 'text'
              "
              :placeholder="`Введи ${f.name.toLowerCase()}…`"
            />
          </template>
        </div>
        <p v-if="editError" style="color: var(--red-600, #dc2626); font-size: 13px; margin: 0">
          {{ editError }}
        </p>
      </div>
      <template #footer>
        <button
          @click="() => { deleteRecordId = editRecordId; closeEdit() }"
          style="margin-right:auto;display:inline-flex;align-items:center;gap:6px;height:36px;padding:0 12px;background:transparent;border:0.5px solid var(--border-strong);border-radius:6px;color:var(--red-600);font-size:14px;font-weight:500;font-family:inherit;cursor:pointer"
        >
          <NIcon name="trash" :size="14" color="var(--red-600)" />Удалить
        </button>
        <NButton variant="ghost" size="md" @click="closeEdit">Отмена</NButton>
        <NButton variant="primary" size="md" :disabled="editLoading" @click="saveEdit">
          {{ editLoading ? 'Сохранение…' : 'Сохранить' }}
        </NButton>
      </template>
    </NModal>

    <!-- Delete record confirm modal -->
    <NModal
      :open="deleteRecordId !== null"
      @close="deleteRecordId = null"
      title="Удалить запись?"
      :width="440"
    >
      <p style="font-size: 14px; color: var(--fg-1); line-height: 1.5">
        Запись <strong>«{{ getDeleteName() }}»</strong> будет удалена без возможности восстановления.
      </p>
      <div
        style="margin-top: 16px; padding: 12px 14px; background: var(--red-50); border: 0.5px solid var(--red-100); border-radius: 6px; font-size: 12px; color: var(--red-700)"
      >
        Это действие нельзя отменить.
      </div>
      <template #footer>
        <NButton variant="ghost" size="md" @click="deleteRecordId = null">Отмена</NButton>
        <NButton variant="danger" size="md" @click="confirmDelete">Удалить</NButton>
      </template>
    </NModal>

    <!-- Delete table confirm modal -->
    <NModal
      :open="showDeleteTable"
      @close="showDeleteTable = false"
      title="Удалить таблицу?"
      :width="440"
    >
      <p style="font-size: 14px; color: var(--fg-1); line-height: 1.5">
        Таблица <strong>«{{ (table as any)?.name }}»</strong> и все её записи будут удалены без возможности восстановления.
      </p>
      <div
        style="margin-top: 16px; padding: 12px 14px; background: var(--red-50); border: 0.5px solid var(--red-100); border-radius: 6px; font-size: 12px; color: var(--red-700)"
      >
        Это действие нельзя отменить.
      </div>
      <template #footer>
        <NButton variant="ghost" size="md" @click="showDeleteTable = false">Отмена</NButton>
        <NButton
          variant="danger"
          size="md"
          :disabled="deleteTableLoading"
          @click="confirmDeleteTable"
        >
          {{ deleteTableLoading ? 'Удаление…' : 'Удалить таблицу' }}
        </NButton>
      </template>
    </NModal>

    <!-- Toast notification -->
    <NToast
      v-if="toast"
      :tone="(toast as any).tone"
      :title="(toast as any).title"
      @close="toast = null"
    />
  </div>
</template>

<style scoped>
tr:hover :deep(.row-actions) { opacity: 1 !important; }
table.dt tbody tr { transition: background 90ms; }
table.dt tbody tr:hover td { background: var(--bg-1); }
table.dt th.sortable { cursor: pointer; user-select: none; transition: color 100ms; }
table.dt th.sortable:hover { color: var(--fg-1); }
.filecell:hover { background: var(--bg-2) !important; }
</style>
