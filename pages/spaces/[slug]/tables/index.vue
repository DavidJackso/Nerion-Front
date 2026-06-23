<script setup lang="ts">
import { useSchemaStore } from '~/stores/schema'
import { useRecordsStore } from '~/stores/records'
import { useSpacesStore } from '~/stores/spaces'
import { useSpaceSlug } from '~/composables/useSpaceSlug'
import { useToast } from '~/composables/useToast'

definePageMeta({ layout: 'app', middleware: [] })

const route = useRoute()
const router = useRouter()
const schemaStore = useSchemaStore()
const recordsStore = useRecordsStore()
const spacesStore = useSpacesStore()
const { toast, show: showToast } = useToast(3000)

const spaceSlug = computed(() => route.params.slug as string)
// No active table on the index page
const tableSlug = computed(() => '')

const space = computed(() => spacesStore.spaces.find((s: any) => s.slug === spaceSlug.value))
const table = computed(() => schemaStore.activeTable)
const fields = computed(() => (table.value as any)?.fields || [])

// ── Selection (unused on index, kept for structural parity) ──────────────────

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
  if (bulkDeleting.value || !tableSlug.value) return
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
  if (!tableSlug.value) return
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
  a.download = `export.csv`
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
  if (!tableSlug.value) return
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
  if (!tableSlug.value) return
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
  if (!tableSlug.value) return
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

function monogram(name: any) {
  const s = String(name || '')
  const parts = s.trim().split(/\s+/)
  const initials = (parts[0]?.[0] || '') + (parts[1]?.[0] || '')
  let h = 0
  for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  return { initials: initials.toUpperCase(), color: MONO_HUES[h % MONO_HUES.length] }
}

// ── Data loading (no-op when no table selected) ───────────────────────────────

async function fetchRecords() {
  // No table selected on the index page — nothing to load
}

onUnmounted(() => {
  if (searchTimer) clearTimeout(searchTimer)
})
</script>

<template>
  <div>
    <div style="padding: 20px 32px 48px">
      <!-- Toolbar (disabled on index — no table selected) -->
      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px">
        <div style="position: relative; flex: 0 0 260px; opacity: 0.4; pointer-events: none">
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
            disabled
          />
        </div>
        <div style="flex: 1" />
      </div>

      <!-- Table container — empty state shown when no table is selected -->
      <div
        style="background: var(--bg-0); border: 0.5px solid var(--border-default); border-radius: 8px; overflow: hidden"
      >
        <!-- No table selected -->
        <div style="padding: 64px; text-align: center; color: var(--fg-3)">
          <div
            style="width: 48px; height: 48px; border-radius: 12px; background: var(--bg-2); display: grid; place-items: center; margin: 0 auto 16px; color: var(--fg-3)"
          >
            <NIcon name="table" :size="22" />
          </div>
          <div style="font-size: 14px; font-weight: 600; margin-bottom: 6px; color: var(--fg-1)">
            Выбери таблицу
          </div>
          <div style="font-size: 13px; color: var(--fg-3); max-width: 280px; margin: 0 auto">
            Выбери таблицу из боковой панели или создай новую.
          </div>
        </div>
      </div>
    </div>

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
table.dt tbody tr { transition: background 90ms; }
table.dt tbody tr:hover td { background: var(--bg-1); }
table.dt th.sortable { cursor: pointer; user-select: none; transition: color 100ms; }
table.dt th.sortable:hover { color: var(--fg-1); }
</style>
