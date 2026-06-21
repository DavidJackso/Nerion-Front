<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import AppShell from '@/components/shell/AppShell.vue'
import NButton from '@/components/primitives/NButton.vue'
import NIcon from '@/components/primitives/NIcon.vue'
import NBadge from '@/components/primitives/NBadge.vue'
import NStatusDot from '@/components/primitives/NStatusDot.vue'
import NModal from '@/components/primitives/NModal.vue'
import NToast from '@/components/primitives/NToast.vue'
import NToggle from '@/components/primitives/NToggle.vue'
import NInput from '@/components/primitives/NInput.vue'
import { TABLE_DATA, COL_META } from '@/data/mock.js'

const props = defineProps({ tableKey: { type: String, default: 'data-prep' } })
const router = useRouter()

const td = computed(() => TABLE_DATA[props.tableKey] || TABLE_DATA['data-prep'])
const rows = ref(null)
const getRows = () => {
  if (!rows.value) rows.value = td.value.rows.map(r => [...r])
  return rows.value
}

const sel = ref(new Set())
const search = ref('')
const filters = ref([])
const sort = ref({ col: null, dir: 'asc' })
const showFilter = ref(false)
const showSort = ref(false)
const showCreate = ref(false)
const deleteRow = ref(null)
const gallery = ref(null)
const toast = ref(null)
const createVals = ref({})

function showToast(title, tone = 'success') {
  toast.value = { title, tone }
  setTimeout(() => toast.value = null, 3000)
}

// File tone map
const FILE_TONE = {
  img:   { label: 'IMG', bg: 'var(--brand-tint)',  fg: 'var(--purple-600)',  bd: 'var(--purple-100)', icon: 'image' },
  pdf:   { label: 'PDF', bg: 'var(--red-50)',       fg: 'var(--red-600)',     bd: 'var(--red-100)',    icon: 'file' },
  doc:   { label: 'DOC', bg: 'var(--blue-50)',      fg: 'var(--blue-600)',    bd: '#DBEAFE',           icon: 'file' },
  ppt:   { label: 'PPT', bg: 'var(--amber-50)',     fg: 'var(--amber-700)',   bd: 'var(--amber-100)',  icon: 'file' },
  video: { label: 'MP4', bg: 'var(--purple-50)',    fg: 'var(--purple-700)',  bd: 'var(--purple-100)', icon: 'play' },
  zip:   { label: 'ZIP', bg: 'var(--neutral-100)',  fg: 'var(--neutral-600)', bd: 'var(--border-default)', icon: 'folder' },
}

function imgGradient(name) {
  let h = 0; for (const c of String(name)) h = (h * 31 + c.charCodeAt(0)) >>> 0
  const a = h % 360, b = (a + 38) % 360
  return `linear-gradient(135deg, hsl(${a} 58% 70%), hsl(${b} 62% 54%))`
}

const NUM_COLS = new Set(['Часов', 'Ставка'])
const STATUS_OPTS = [['active', 'Работает'], ['setup', 'Настройка'], ['offline', 'Недоступен']]
const OPS = {
  text:   [['contains', 'содержит'], ['ncontains', 'не содержит']],
  select: [['eq', 'равно'], ['ne', 'не равно']],
  number: [['eq', '='], ['gt', 'больше'], ['lt', 'меньше']],
  bool:   [['eq', 'равно']],
}

function colFilterMeta(col, ci) {
  const m = COL_META[col]
  if (m?.kind === 'bool') return { type: 'bool' }
  if (col === 'Статус') return { type: 'select', options: STATUS_OPTS }
  if ((m?.kind === 'select' || m?.kind === 'relation') && m.options) return { type: 'select', options: m.options.map(o => [o, o]) }
  if (m?.kind === 'number' || NUM_COLS.has(col)) return { type: 'number' }
  const r = getRows()
  const vals = [...new Set(r.map(row => String(row[ci])))]
  if (vals.length > 1 && vals.length <= 8 && vals.every(v => v.length <= 24)) return { type: 'select', options: vals.map(v => [v, v]) }
  return { type: 'text' }
}

function defaultFilter(col) {
  const ci = td.value.cols.indexOf(col)
  const meta = colFilterMeta(col, ci)
  return { col, op: OPS[meta.type][0][0], value: meta.type === 'bool' ? 'true' : '' }
}

function filterActive(f) {
  const ci = td.value.cols.indexOf(f.col)
  const meta = colFilterMeta(f.col, ci)
  return meta.type === 'bool' || String(f.value).trim() !== ''
}

function matchOne(cell, f, meta) {
  if (meta.type === 'bool') return String(cell) === f.value
  if (meta.type === 'number') {
    const n = parseFloat(cell), v = parseFloat(f.value)
    if (isNaN(v)) return true
    return f.op === 'gt' ? n > v : f.op === 'lt' ? n < v : n === v
  }
  if (meta.type === 'select') return f.op === 'ne' ? String(cell) !== f.value : String(cell) === f.value
  const s = String(cell).toLowerCase(), v = String(f.value).toLowerCase()
  return f.op === 'ncontains' ? !s.includes(v) : s.includes(v)
}

function valLabel(f, meta) {
  if (meta.type === 'bool') return f.value === 'true' ? 'да' : 'нет'
  if (f.col === 'Статус') return (STATUS_OPTS.find(s => s[0] === f.value) || [, f.value])[1]
  return f.value
}

function opLabel(f, meta) {
  return (OPS[meta.type].find(o => o[0] === f.op) || [, ''])[1]
}

const fileCols = computed(() => {
  const r = getRows()
  return new Set(td.value.cols.filter((c, i) => r.some(row => Array.isArray(row[i]))))
})

const activeFilters = computed(() => filters.value.filter(f => filterActive(f)))

const viewRows = computed(() => {
  const r = getRows()
  let view = r.map((row, idx) => ({ row, idx }))
  const q = search.value.toLowerCase()
  if (q) view = view.filter(({ row }) => row.some(c => (Array.isArray(c) ? c.map(x => x.name).join(' ') : String(c)).toLowerCase().includes(q)))
  for (const f of activeFilters.value) {
    const ci = td.value.cols.indexOf(f.col)
    const meta = colFilterMeta(f.col, ci)
    view = view.filter(({ row }) => matchOne(row[ci], f, meta))
  }
  if (sort.value.col) {
    const ci = td.value.cols.indexOf(sort.value.col)
    view = [...view].sort((a, b) => {
      let x = a.row[ci], y = b.row[ci]
      if (typeof x === 'boolean') { x = x ? 1 : 0; y = y ? 1 : 0 }
      const nx = parseFloat(x), ny = parseFloat(y)
      const cmp = (!isNaN(nx) && !isNaN(ny)) ? nx - ny : String(x).localeCompare(String(y), 'ru')
      return sort.value.dir === 'desc' ? -cmp : cmp
    })
  }
  return view
})

const allSel = computed(() => {
  const idxs = viewRows.value.map(v => v.idx)
  return idxs.length > 0 && idxs.every(i => sel.value.has(i))
})

function toggleAll(e) {
  const s = new Set(sel.value)
  viewRows.value.forEach(({ idx }) => e.target.checked ? s.add(idx) : s.delete(idx))
  sel.value = s
}

function toggleSel(idx, e) {
  const s = new Set(sel.value)
  e.target.checked ? s.add(idx) : s.delete(idx)
  sel.value = s
}

function toggleSort(col) {
  if (fileCols.value.has(col)) return
  if (sort.value.col !== col) sort.value = { col, dir: 'asc' }
  else if (sort.value.dir === 'asc') sort.value = { col, dir: 'desc' }
  else sort.value = { col: null, dir: 'asc' }
}

function addFilter() {
  const col = td.value.cols.find(c => !fileCols.value.has(c))
  filters.value.push(defaultFilter(col))
}

function confirmDelete() {
  const idx = deleteRow.value
  getRows().splice(idx, 1)
  rows.value = [...getRows()]
  deleteRow.value = null
  showToast('Запись удалена', 'error')
}

// Monogram
const MONO_HUES = ['var(--purple-400)', 'var(--green-500)', 'var(--amber-500)', 'var(--blue-500)', 'var(--purple-600)']
function monogram(name) {
  const parts = String(name).trim().split(/\s+/)
  const initials = (parts[0]?.[0] || '') + (parts[1]?.[0] || '')
  let h = 0; for (const ch of String(name)) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  return { initials, color: MONO_HUES[h % MONO_HUES.length] }
}

function fileWord(n) {
  return n % 10 === 1 && n % 100 !== 11 ? 'файл'
    : (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20)) ? 'файла'
    : 'файлов'
}

function kbFmt(kb) { return kb >= 1024 ? `${(kb / 1024).toFixed(1)} МБ` : `${kb} КБ` }
function fakeKb(name) { let h = 0; for (const c of String(name)) h = (h * 31 + c.charCodeAt(0)) >>> 0; return 60 + h % 1900 }

const galleryCopied = ref(false)
function copyGallery() {
  galleryCopied.value = true
  showToast('Сниппет скопирован')
  setTimeout(() => galleryCopied.value = false, 1600)
}
</script>

<template>
  <AppShell :breadcrumb="['Кафедра математики', td.title]">
    <template #actions>
      <NButton variant="primary" size="sm" @click="showCreate = true">
        <NIcon name="plus" :size="13" color="#fff" />
        Добавить запись
      </NButton>
    </template>

    <div style="padding: 20px 32px 48px">
      <!-- Header -->
      <div style="margin-bottom: 16px">
        <h1 style="font-size: 20px; font-weight: 700; line-height: 1.2; margin-bottom: 4px">{{ td.title }}</h1>
        <div style="font-size: 12px; color: var(--fg-3); display: flex; align-items: center; gap: 8px">
          <span style="font-variant-numeric: tabular-nums">{{ td.count }} записей</span>
          <span>·</span>
          <span>Обновлено 5 минут назад</span>
          <span>·</span>
          <span @click="router.push({ name: 'api01' })" style="color: var(--brand-primary); cursor: pointer; display: flex; align-items: center; gap: 3px">
            API <NIcon name="extlink" :size="11" />
          </span>
        </div>
      </div>

      <!-- Toolbar -->
      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px">
        <div style="position: relative; flex: 0 0 260px">
          <NIcon name="search" :size="14" color="var(--fg-3)" style="position: absolute; left: 10px; top: 50%; transform: translateY(-50%)" />
          <input v-model="search" placeholder="Поиск по всем полям…" :style="{
            height: '32px', width: '100%', padding: '0 10px 0 32px',
            border: '0.5px solid var(--border-strong)', borderRadius: '6px',
            background: 'var(--bg-0)', fontSize: '13px', color: 'var(--fg-1)',
            outline: 0, fontFamily: 'inherit', boxSizing: 'border-box',
          }" />
        </div>

        <!-- Filter -->
        <div style="position: relative">
          <button @click="showFilter = !showFilter; showSort = false" :style="{
            display: 'inline-flex', alignItems: 'center', gap: '6px', height: '32px', padding: '0 12px',
            borderRadius: '6px', fontSize: '13px', fontWeight: 500, fontFamily: 'inherit', cursor: 'pointer',
            border: `0.5px solid ${showFilter || activeFilters.length ? 'var(--purple-300)' : 'var(--border-strong)'}`,
            background: showFilter || activeFilters.length ? 'var(--brand-tint)' : 'var(--bg-0)',
            color: showFilter || activeFilters.length ? 'var(--purple-700)' : 'var(--fg-1)',
          }">
            <NIcon name="filter" :size="12" />Фильтр
            <span v-if="activeFilters.length" style="min-width: 16px; height: 16px; padding: 0 4px; border-radius: 999px; background: var(--brand-primary); color: #fff; font-size: 10px; font-weight: 700; display: inline-flex; align-items: center; justify-content: center">{{ activeFilters.length }}</span>
          </button>
          <div v-if="showFilter" @click.stop>
            <div @click="showFilter = false" style="position: fixed; inset: 0; z-index: 40" />
            <div style="position: absolute; top: calc(100% + 6px); left: 0; z-index: 41; width: 360px; background: var(--bg-0); border: 0.5px solid var(--border-default); border-radius: 10px; box-shadow: var(--shadow-3); animation: slideUp 130ms ease-out">
              <div style="padding: 12px 14px; border-bottom: 0.5px solid var(--border-default); font-size: 12px; font-weight: 600; color: var(--fg-1)">Фильтры</div>
              <div style="padding: 14px; display: flex; flex-direction: column; gap: 10px; max-height: 280px; overflow: auto">
                <div v-if="!filters.length" style="font-size: 12px; color: var(--fg-3); text-align: center; padding: 8px 0">Условий пока нет</div>
                <template v-for="(f, fi) in filters" :key="fi">
                  <div v-if="fi > 0" style="font-size: 10px; color: var(--fg-3); font-family: var(--font-mono); text-transform: uppercase; letter-spacing: 0.08em; margin-left: 2px">и</div>
                  <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap">
                    <select :value="f.col" @change="filters[fi] = defaultFilter($event.target.value)" style="height: 30px; border-radius: 6px; border: 0.5px solid var(--border-strong); padding: 0 8px; font-size: 12px; background: var(--bg-0); color: var(--fg-1); outline: 0; font-family: inherit; font-weight: 500; max-width: 120px">
                      <option v-for="c in td.cols.filter(c => !fileCols.has(c))" :key="c" :value="c">{{ c }}</option>
                    </select>
                    <select :value="f.op" @change="filters[fi] = { ...f, op: $event.target.value }" style="height: 30px; border-radius: 6px; border: 0.5px solid var(--border-strong); padding: 0 8px; font-size: 12px; background: var(--bg-0); color: var(--fg-2); outline: 0; font-family: inherit">
                      <option v-for="[k, l] in OPS[colFilterMeta(f.col, td.cols.indexOf(f.col)).type]" :key="k" :value="k">{{ l }}</option>
                    </select>
                    <template v-if="colFilterMeta(f.col, td.cols.indexOf(f.col)).type === 'bool'">
                      <div style="display: flex; gap: 2px; padding: 2px; background: var(--bg-2); border-radius: 6px">
                        <button v-for="[v, l] in [['true', 'да'], ['false', 'нет']]" :key="v" @click="filters[fi] = { ...f, value: v }" :style="{ height: '24px', padding: '0 10px', border: 0, borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: 500, fontFamily: 'inherit', background: f.value === v ? 'var(--bg-0)' : 'transparent', color: f.value === v ? 'var(--fg-1)' : 'var(--fg-3)', boxShadow: f.value === v ? 'var(--shadow-1)' : 'none' }">{{ l }}</button>
                      </div>
                    </template>
                    <template v-else-if="colFilterMeta(f.col, td.cols.indexOf(f.col)).type === 'select'">
                      <select :value="f.value" @change="filters[fi] = { ...f, value: $event.target.value }" style="height: 30px; border-radius: 6px; border: 0.5px solid var(--border-strong); padding: 0 8px; font-size: 12px; background: var(--bg-0); color: var(--fg-1); outline: 0; font-family: inherit; flex: 1; min-width: 110px">
                        <option value="">значение…</option>
                        <option v-for="[v, l] in colFilterMeta(f.col, td.cols.indexOf(f.col)).options" :key="v" :value="v">{{ l }}</option>
                      </select>
                    </template>
                    <template v-else>
                      <input :value="f.value" @input="filters[fi] = { ...f, value: $event.target.value }" :type="colFilterMeta(f.col, td.cols.indexOf(f.col)).type === 'number' ? 'number' : 'text'" placeholder="значение…" style="flex: 1; min-width: 90px; height: 30px; border-radius: 6px; border: 0.5px solid var(--border-strong); padding: 0 9px; font-size: 12px; background: var(--bg-0); color: var(--fg-1); outline: 0; font-family: inherit; box-sizing: border-box" />
                    </template>
                    <button @click="filters.splice(fi, 1)" style="background: 0; border: 0; cursor: pointer; color: var(--fg-3); padding: 4px; display: flex; flex-shrink: 0">
                      <NIcon name="x" :size="13" />
                    </button>
                  </div>
                </template>
              </div>
              <div style="padding: 10px 14px; border-top: 0.5px solid var(--border-default); display: flex; justify-content: space-between; align-items: center">
                <button @click="addFilter" style="background: 0; border: 0; cursor: pointer; color: var(--brand-primary); font-size: 12px; font-weight: 500; font-family: inherit; display: flex; align-items: center; gap: 5px">
                  <NIcon name="plus" :size="12" />Добавить условие
                </button>
                <button v-if="filters.length" @click="filters = []" style="background: 0; border: 0; cursor: pointer; color: var(--fg-3); font-size: 12px; font-family: inherit">Сбросить всё</button>
              </div>
            </div>
          </div>
        </div>

        <!-- Sort -->
        <div style="position: relative">
          <button @click="showSort = !showSort; showFilter = false" :style="{
            display: 'inline-flex', alignItems: 'center', gap: '6px', height: '32px', padding: '0 12px',
            borderRadius: '6px', fontSize: '13px', fontWeight: 500, fontFamily: 'inherit', cursor: 'pointer',
            border: `0.5px solid ${showSort || sort.col ? 'var(--purple-300)' : 'var(--border-strong)'}`,
            background: showSort || sort.col ? 'var(--brand-tint)' : 'var(--bg-0)',
            color: showSort || sort.col ? 'var(--purple-700)' : 'var(--fg-1)',
          }">
            <NIcon name="sliders" :size="12" />Сортировка
          </button>
          <div v-if="showSort" @click.stop>
            <div @click="showSort = false" style="position: fixed; inset: 0; z-index: 40" />
            <div style="position: absolute; top: calc(100% + 6px); left: 0; z-index: 41; width: 240px; background: var(--bg-0); border: 0.5px solid var(--border-default); border-radius: 10px; box-shadow: var(--shadow-3); animation: slideUp 130ms ease-out">
              <div style="padding: 12px 14px; border-bottom: 0.5px solid var(--border-default); font-size: 12px; font-weight: 600">Сортировать по</div>
              <div style="padding: 8px; max-height: 260px; overflow: auto">
                <button v-for="c in td.cols.filter(c => !fileCols.has(c))" :key="c"
                  @click="sort.col === c ? sort = { col: null, dir: 'asc' } : sort = { col: c, dir: sort.dir }"
                  :style="{
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    gap: '8px', padding: '7px 10px', border: 0, borderRadius: '6px', cursor: 'pointer',
                    background: sort.col === c ? 'var(--brand-tint)' : 'transparent',
                    color: sort.col === c ? 'var(--purple-700)' : 'var(--fg-1)',
                    fontSize: '13px', fontFamily: 'inherit', fontWeight: sort.col === c ? 500 : 400, textAlign: 'left',
                  }">
                  <span>{{ c }}</span>
                  <NIcon v-if="sort.col === c" name="check" :size="13" color="var(--purple-600)" />
                </button>
              </div>
              <div v-if="sort.col" style="padding: 8px; border-top: 0.5px solid var(--border-default); display: flex; gap: 6px">
                <button v-for="[d, l] in [['asc', '↑ По возрастанию'], ['desc', '↓ По убыванию']]" :key="d"
                  @click="sort = { ...sort, dir: d }" :style="{
                    flex: 1, height: '30px', border: 0, borderRadius: '6px', cursor: 'pointer',
                    fontSize: '12px', fontFamily: 'inherit', fontWeight: 500,
                    background: sort.dir === d ? 'var(--brand-primary)' : 'var(--bg-2)',
                    color: sort.dir === d ? '#fff' : 'var(--fg-2)',
                  }">{{ l }}</button>
              </div>
            </div>
          </div>
        </div>

        <div style="flex: 1" />
        <NButton variant="ghost" size="sm" @click="showToast('Данные обновлены')">
          <NIcon name="refresh" :size="12" />Обновить
        </NButton>
      </div>

      <!-- Active filter chips -->
      <div v-if="activeFilters.length || sort.col" style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap; margin-bottom: 12px">
        <span v-for="(f, fi) in activeFilters" :key="fi" style="display: inline-flex; align-items: center; gap: 6px; padding: 4px 4px 4px 10px; border-radius: 999px; background: var(--brand-tint); font-size: 12px; font-weight: 500; white-space: nowrap">
          <span style="color: var(--fg-3)">{{ f.col }}</span>
          <span style="color: var(--fg-3); font-weight: 400">{{ opLabel(f, colFilterMeta(f.col, td.cols.indexOf(f.col))) }}</span>
          <span style="color: var(--purple-700)">{{ valLabel(f, colFilterMeta(f.col, td.cols.indexOf(f.col))) }}</span>
          <button @click="filters = filters.filter(x => x !== f)" style="background: 0; border: 0; cursor: pointer; color: var(--purple-500); padding: 2px; display: flex; border-radius: 50%; line-height: 0">
            <NIcon name="x" :size="11" />
          </button>
        </span>
        <span v-if="sort.col" style="display: inline-flex; align-items: center; gap: 6px; padding: 4px 4px 4px 10px; border-radius: 999px; background: var(--bg-2); font-size: 12px; font-weight: 500; white-space: nowrap">
          <NIcon name="sliders" :size="11" color="var(--fg-3)" />
          <span style="color: var(--fg-2)">{{ sort.col }} {{ sort.dir === 'asc' ? '↑' : '↓' }}</span>
          <button @click="sort = { col: null, dir: 'asc' }" style="background: 0; border: 0; cursor: pointer; color: var(--purple-500); padding: 2px; display: flex; border-radius: 50%; line-height: 0">
            <NIcon name="x" :size="11" />
          </button>
        </span>
        <button v-if="activeFilters.length" @click="filters = []" style="background: 0; border: 0; cursor: pointer; color: var(--fg-3); font-size: 12px; font-family: inherit; text-decoration: underline; text-underline-offset: 2px">Очистить</button>
      </div>

      <!-- Table -->
      <div style="background: var(--bg-0); border: 0.5px solid var(--border-default); border-radius: 8px; overflow: hidden">
        <table class="dt">
          <thead>
            <tr>
              <th style="width: 36px">
                <input type="checkbox" :checked="allSel" @change="toggleAll" style="accent-color: var(--brand-primary)" />
              </th>
              <th v-for="(c, ci) in td.cols" :key="ci"
                @click="!fileCols.has(c) && toggleSort(c)"
                :class="!fileCols.has(c) ? 'sortable' : ''"
                :style="{ textAlign: NUM_COLS.has(c) ? 'right' : 'left' }"
              >
                <span :style="{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: sort.col === c ? 'var(--purple-700)' : undefined }">
                  {{ c }}
                  <span v-if="!fileCols.has(c)" style="width: 9px; font-size: 9px; line-height: 1; color: var(--neutral-300)" :style="{ color: sort.col === c ? 'var(--purple-500)' : 'var(--neutral-300)' }">
                    {{ sort.col === c ? (sort.dir === 'asc' ? '▲' : '▼') : '↕' }}
                  </span>
                </span>
              </th>
              <th style="width: 72px"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="{ row, idx } in viewRows" :key="idx" :style="{ background: sel.has(idx) ? 'var(--brand-tint)' : undefined }">
              <td style="padding: 8px 12px">
                <input type="checkbox" :checked="sel.has(idx)" @change="toggleSel(idx, $event)" style="accent-color: var(--brand-primary)" />
              </td>
              <!-- First column with optional monogram -->
              <td style="font-weight: 500">
                <span style="display: flex; align-items: center; gap: 10px">
                  <span v-if="td.cols[0] === 'ФИО'" :style="{
                    width: '26px', height: '26px', borderRadius: '50%', flexShrink: 0,
                    display: 'grid', placeItems: 'center', fontSize: '10.5px', fontWeight: 700,
                    color: '#fff', background: monogram(row[0]).color,
                    letterSpacing: '0.02em', textTransform: 'uppercase',
                  }">{{ monogram(row[0]).initials }}</span>
                  <span>{{ String(row[0]) }}</span>
                </span>
              </td>
              <!-- Other columns -->
              <td v-for="(cell, ci) in row.slice(1)" :key="ci" :style="{ textAlign: NUM_COLS.has(td.cols[ci + 1]) ? 'right' : 'left' }">
                <!-- File array -->
                <template v-if="Array.isArray(cell)">
                  <button @click="gallery = { rowName: String(row[0]), col: td.cols[ci + 1], files: cell }" :style="{
                    display: 'inline-flex', alignItems: 'center', gap: '9px',
                    background: 0, border: 0, cursor: 'pointer', padding: '2px 4px',
                    margin: '-2px -4px', borderRadius: '6px', fontFamily: 'inherit',
                  }">
                    <span style="display: inline-flex">
                      <span v-for="(f, fi) in cell.slice(0, 3)" :key="fi" :style="{ marginLeft: fi ? '-9px' : 0, position: 'relative', zIndex: 3 - fi }">
                        <span :style="{
                          width: '26px', height: '26px', borderRadius: '5px', flexShrink: 0,
                          boxSizing: 'border-box', display: 'block',
                          ...(f.type === 'img'
                            ? { background: imgGradient(f.name), border: '1.5px solid var(--bg-0)', boxShadow: 'var(--shadow-1)' }
                            : { background: FILE_TONE[f.type]?.bg || 'var(--bg-2)', border: '1.5px solid var(--bg-0)', boxShadow: 'var(--shadow-1)', display: 'grid', placeItems: 'center' })
                        }">
                          <NIcon v-if="f.type !== 'img'" :name="FILE_TONE[f.type]?.icon || 'file'" :size="13" :color="FILE_TONE[f.type]?.fg || 'var(--fg-3)'" />
                        </span>
                      </span>
                    </span>
                    <span style="font-size: 12.5px; color: var(--fg-2); font-weight: 500; white-space: nowrap">{{ cell.length }} {{ fileWord(cell.length) }}</span>
                    <NIcon name="chev" :size="12" color="var(--fg-3)" />
                  </button>
                </template>
                <!-- Boolean -->
                <template v-else-if="typeof cell === 'boolean'">
                  <NBadge :tone="cell ? 'success' : 'neutral'" dot>{{ cell ? 'да' : 'нет' }}</NBadge>
                </template>
                <!-- Status dot -->
                <template v-else-if="cell === 'active'"><NStatusDot status="online" /></template>
                <template v-else-if="cell === 'setup'"><NStatusDot status="setup" /></template>
                <template v-else-if="cell === 'offline'"><NStatusDot status="offline" /></template>
                <!-- Regular -->
                <template v-else>
                  <span :style="{
                    fontFamily: (NUM_COLS.has(td.cols[ci + 1]) || typeof cell === 'number') ? 'var(--font-mono)' : 'inherit',
                    fontVariantNumeric: 'tabular-nums',
                    color: String(cell).includes('@') ? 'var(--brand-primary)' : 'inherit',
                    fontSize: String(cell).includes('@') ? '12px' : 'inherit',
                  }">{{ String(cell) }}</span>
                </template>
              </td>
              <!-- Row actions -->
              <td>
                <div class="row-actions" style="display: flex; gap: 2px; opacity: 0; transition: opacity 100ms">
                  <button @click="showToast('Изменения сохранены')" style="background: 0; border: 0; padding: 5px; cursor: pointer; color: var(--fg-2); border-radius: 4px">
                    <NIcon name="pencil" :size="13" />
                  </button>
                  <button @click="deleteRow = idx" style="background: 0; border: 0; padding: 5px; cursor: pointer; color: var(--fg-2); border-radius: 4px">
                    <NIcon name="trash" :size="13" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-if="!viewRows.length" style="padding: 48px 20px; text-align: center">
          <div style="width: 40px; height: 40px; border-radius: 10px; background: var(--bg-2); display: grid; place-items: center; margin: 0 auto 12px; color: var(--fg-3)">
            <NIcon name="search" :size="18" />
          </div>
          <div style="font-size: 14px; font-weight: 600; margin-bottom: 4px">Ничего не найдено</div>
          <div style="font-size: 13px; color: var(--fg-3); margin-bottom: 14px">Попробуй изменить фильтры или поисковый запрос.</div>
          <NButton variant="secondary" size="sm" @click="filters = []; search = ''">Сбросить фильтры</NButton>
        </div>
      </div>

      <!-- Pagination -->
      <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 14px; font-size: 12px; color: var(--fg-3)">
        <span>{{ viewRows.length > 0 ? `Показано 1–${viewRows.length}` : 'Нет записей' }}{{ (activeFilters.length || search) ? ` из ${getRows().length}` : ` из ${td.count}` }}</span>
        <div style="display: flex; gap: 4px">
          <NButton variant="ghost" size="sm" :disabled="true">← Назад</NButton>
          <NButton variant="secondary" size="sm" style="min-width: 32px">1</NButton>
          <NButton variant="ghost" size="sm" :disabled="true">Вперёд →</NButton>
        </div>
      </div>
    </div>

    <!-- Selection bar -->
    <div v-if="sel.size > 0" :style="{
      position: 'fixed', bottom: '24px', left: '50%',
      transform: 'translateX(calc(-50% + 110px))',
      background: 'var(--neutral-900)', color: '#fff',
      padding: '10px 16px', borderRadius: '8px',
      boxShadow: 'var(--shadow-3)',
      display: 'flex', alignItems: 'center', gap: '16px',
      fontSize: '13px', zIndex: 30,
    }">
      <span style="font-weight: 500">Выбрано: {{ sel.size }}</span>
      <div style="width: 1px; height: 16px; background: rgba(255,255,255,.15)" />
      <button @click="showToast('Экспорт готов')" style="background: 0; border: 0; color: #fff; cursor: pointer; font-size: 13px; display: flex; align-items: center; gap: 5px">
        <NIcon name="download" :size="13" />Экспорт
      </button>
      <button style="background: 0; border: 0; color: var(--red-500); cursor: pointer; font-size: 13px; display: flex; align-items: center; gap: 5px">
        <NIcon name="trash" :size="13" />Удалить
      </button>
      <button @click="sel = new Set()" style="background: 0; border: 0; color: rgba(255,255,255,.5); cursor: pointer; padding: 4px">
        <NIcon name="x" :size="13" />
      </button>
    </div>

    <!-- Create record modal -->
    <NModal :open="showCreate" @close="showCreate = false" :title="`Новая запись — ${td.title}`" subtitle="Поля-связи и перечисления выбираются из списка." :width="520">
      <div style="display: flex; flex-direction: column; gap: 14px">
        <div v-for="col in td.cols" :key="col">
          <label style="font-size: 12px; color: var(--fg-2); font-weight: 500; display: block; margin-bottom: 6px">{{ col }}</label>
          <template v-if="COL_META[col]?.kind === 'bool'">
            <div style="display: flex; align-items: center; gap: 8px">
              <NToggle :model-value="createVals[col] ?? true" @update:model-value="createVals[col] = $event" />
              <span style="font-size: 13px; color: var(--fg-2)">{{ (createVals[col] ?? true) ? 'да' : 'нет' }}</span>
            </div>
          </template>
          <template v-else-if="COL_META[col]?.kind === 'select'">
            <select :value="createVals[col] || ''" @change="createVals[col] = $event.target.value" style="width: 100%; height: 36px; border-radius: 6px; border: 0.5px solid var(--border-strong); padding: 0 12px; font-size: 14px; background: var(--bg-0); color: var(--fg-1); outline: 0; font-family: inherit">
              <option value="">Выбери значение…</option>
              <option v-for="o in COL_META[col].options" :key="o" :value="o">{{ o }}</option>
            </select>
          </template>
          <template v-else-if="COL_META[col]?.kind === 'file'">
            <div style="border: 1px dashed var(--border-strong); border-radius: 8px; padding: 18px 14px; display: flex; flex-direction: column; align-items: center; gap: 7px; background: var(--bg-1); text-align: center; cursor: pointer">
              <NIcon name="upload" :size="16" color="var(--fg-3)" />
              <div style="font-size: 13px; color: var(--fg-2)">Перетащи файлы или <span style="color: var(--brand-primary); font-weight: 500">выбери</span></div>
            </div>
          </template>
          <template v-else>
            <NInput :model-value="createVals[col] || ''" @update:model-value="createVals[col] = $event" :placeholder="`Введи ${col.toLowerCase()}…`" />
          </template>
        </div>
      </div>
      <template #footer>
        <NButton variant="ghost" size="md" @click="showCreate = false">Отмена</NButton>
        <NButton variant="primary" size="md" @click="showCreate = false; showToast('Запись добавлена')">Добавить запись</NButton>
      </template>
    </NModal>

    <!-- Delete confirm modal -->
    <NModal :open="deleteRow !== null" @close="deleteRow = null" title="Удалить запись?" :width="440">
      <p style="font-size: 14px; color: var(--fg-1); line-height: 1.5">
        Запись <strong>«{{ deleteRow !== null ? String(getRows()[deleteRow]?.[0]) : '' }}»</strong> будет удалена без возможности восстановления.
      </p>
      <div style="margin-top: 16px; padding: 12px 14px; background: var(--red-50); border: 0.5px solid var(--red-100); border-radius: 6px; font-size: 12px; color: var(--red-700)">
        Это действие нельзя отменить.
      </div>
      <template #footer>
        <NButton variant="ghost" size="md" @click="deleteRow = null">Отмена</NButton>
        <NButton variant="danger" size="md" @click="confirmDelete">Удалить</NButton>
      </template>
    </NModal>

    <!-- File gallery modal -->
    <NModal v-if="gallery" :open="true" @close="gallery = null" :width="620"
      :title="`${gallery.col} — ${gallery.rowName}`"
      :subtitle="`${gallery.files.length} ${fileWord(gallery.files.length)} · прямые CDN-ссылки для твоего сайта`">
      <template v-if="gallery.files.filter(f => f.type === 'img').length">
        <div style="font-size: 11px; color: var(--fg-3); text-transform: uppercase; letter-spacing: 0.06em; font-weight: 600; margin-bottom: 10px">
          Изображения · {{ gallery.files.filter(f => f.type === 'img').length }}
        </div>
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 22px">
          <div v-for="(f, i) in gallery.files.filter(f => f.type === 'img')" :key="i" :style="{
            position: 'relative', borderRadius: '8px', overflow: 'hidden',
            aspectRatio: '4 / 3', background: imgGradient(f.name),
            boxShadow: 'var(--shadow-1)',
          }">
            <div style="position: absolute; left: 0; right: 0; bottom: 0; padding: 16px 8px 6px; background: linear-gradient(transparent, rgba(0,0,0,.5)); color: #fff; font-size: 10.5px; font-family: var(--font-mono); white-space: nowrap; overflow: hidden; text-overflow: ellipsis">{{ f.name }}</div>
          </div>
        </div>
      </template>
      <template v-if="gallery.files.filter(f => f.type !== 'img').length">
        <div style="font-size: 11px; color: var(--fg-3); text-transform: uppercase; letter-spacing: 0.06em; font-weight: 600; margin-bottom: 8px">
          Документы · {{ gallery.files.filter(f => f.type !== 'img').length }}
        </div>
        <div style="border: 0.5px solid var(--border-default); border-radius: 8px; overflow: hidden; margin-bottom: 20px">
          <div v-for="(f, i) in gallery.files.filter(f => f.type !== 'img')" :key="i" :style="{
            display: 'flex', alignItems: 'center', gap: '11px', padding: '9px 12px',
            borderTop: i ? '0.5px solid var(--border-default)' : 0,
          }">
            <div :style="{
              width: '30px', height: '30px', borderRadius: '5px', flexShrink: 0,
              background: FILE_TONE[f.type]?.bg || 'var(--bg-2)',
              border: `0.5px solid ${FILE_TONE[f.type]?.bd || 'var(--border-default)'}`,
              display: 'grid', placeItems: 'center',
            }">
              <NIcon :name="FILE_TONE[f.type]?.icon || 'file'" :size="15" :color="FILE_TONE[f.type]?.fg || 'var(--fg-3)'" />
            </div>
            <span style="flex: 1; font-size: 13px; font-family: var(--font-mono); color: var(--fg-1); overflow: hidden; text-overflow: ellipsis; white-space: nowrap">{{ f.name }}</span>
            <span style="font-size: 12px; color: var(--fg-3); font-variant-numeric: tabular-nums; white-space: nowrap">{{ kbFmt(fakeKb(f.name)) }}</span>
            <button @click="showToast('Скачивание начато')" style="background: 0; border: 0; padding: 5px; cursor: pointer; color: var(--fg-2)"><NIcon name="download" :size="15" /></button>
            <button @click="showToast('Ссылка скопирована')" style="background: 0; border: 0; padding: 5px; cursor: pointer; color: var(--fg-2)"><NIcon name="link" :size="15" /></button>
          </div>
        </div>
      </template>
      <div style="background: var(--brand-tint); border: 0.5px solid var(--purple-200); border-radius: 10px; padding: 16px">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 10px">
          <NIcon name="code" :size="14" color="var(--purple-600)" />
          <span style="font-size: 13px; font-weight: 600; color: var(--fg-1)">Забрать на свой сайт</span>
          <NBadge tone="brand" style="margin-left: auto">массив ссылок</NBadge>
        </div>
        <div style="position: relative; background: var(--neutral-900); border-radius: 8px; overflow: hidden">
          <button @click="copyGallery" style="position: absolute; top: 8px; right: 8px; background: rgba(255,255,255,.08); border: 0; color: rgba(255,255,255,.7); padding: 4px 9px; border-radius: 4px; cursor: pointer; font-size: 11px; display: flex; align-items: center; gap: 4px">
            <NIcon :name="galleryCopied ? 'check' : 'copy'" :size="11" color="rgba(255,255,255,.7)" />{{ galleryCopied ? 'Готово' : 'Копировать' }}
          </button>
          <pre style="margin: 0; padding: 16px 18px; color: rgba(255,255,255,.9); font-size: 12px; font-family: var(--font-mono); line-height: 1.6; overflow: auto; white-space: pre-wrap">GET /api/math-dept/{{ td.slug }}/{record}/files

const { data } = await (await fetch(url, { headers })).json();
data.filter(f => f.type.startsWith("image"))
    .forEach(f => slider.add(f.url));</pre>
        </div>
      </div>
    </NModal>

    <NToast v-if="toast" :tone="toast.tone" :title="toast.title" @close="toast = null" />
  </AppShell>

  <style>
  tr:hover .row-actions { opacity: 1 !important; }
  table.dt tbody tr { transition: background 90ms; }
  table.dt tbody tr:hover td { background: var(--bg-1); }
  table.dt th.sortable { cursor: pointer; user-select: none; transition: color 100ms; }
  table.dt th.sortable:hover { color: var(--fg-1); }
  </style>
</template>
