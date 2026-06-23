<script setup lang="ts">
import { useSchemaStore } from '~/stores/schema'
import { useRecordsStore } from '~/stores/records'
import { useSpacesStore } from '~/stores/spaces'
import { useSpaceSlug } from '~/composables/useSpaceSlug'
import { useToast } from '~/composables/useToast'

definePageMeta({ layout: 'app', middleware: 'auth' })

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
      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px">
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
        <div style="flex: 1" />
        <NButton variant="ghost" size="sm" @click="fetchRecords">
          <NIcon name="refresh" :size="12" />Обновить
        </NButton>
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
                    :style="{ color: sortBy === f.slug ? 'var(--purple-500)' : 'var(--neutral-300)' }"
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
              v-for="rec in recordsStore.records"
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
                    @click="showToast({ title: 'Редактирование в разработке', tone: 'neutral' })"
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
          v-if="!recordsStore.loading && !recordsStore.records.length"
          style="padding: 48px 20px; text-align: center"
        >
          <div
            style="width: 40px; height: 40px; border-radius: 10px; background: var(--bg-2); display: grid; place-items: center; margin: 0 auto 12px; color: var(--fg-3)"
          >
            <NIcon name="search" :size="18" />
          </div>
          <div style="font-size: 14px; font-weight: 600; margin-bottom: 4px">Нет записей</div>
          <div style="font-size: 13px; color: var(--fg-3); margin-bottom: 14px">
            {{ search ? 'Ничего не найдено. Попробуй изменить запрос.' : 'Добавь первую запись.' }}
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

          <!-- File upload placeholder -->
          <template v-else-if="f.type === 'file'">
            <div
              style="border: 1px dashed var(--border-strong); border-radius: 8px; padding: 18px 14px; display: flex; flex-direction: column; align-items: center; gap: 7px; background: var(--bg-1); text-align: center; cursor: pointer"
            >
              <NIcon name="upload" :size="16" color="var(--fg-3)" />
              <div style="font-size: 13px; color: var(--fg-2)">
                Перетащи файлы или <span style="color: var(--brand-primary); font-weight: 500">выбери</span>
              </div>
            </div>
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

          <!-- All other field types -->
          <template v-else>
            <NInput
              :model-value="createVals[f.slug] || ''"
              @update:model-value="createVals[f.slug] = $event"
              :type="
                f.type === 'number' ? 'number'
                : f.type === 'email' ? 'email'
                : f.type === 'date' ? 'date'
                : f.type === 'datetime' ? 'datetime-local'
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
</style>
