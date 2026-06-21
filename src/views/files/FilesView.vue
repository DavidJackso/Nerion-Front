<script setup>
import { ref, computed } from 'vue'
import AppShell from '@/components/shell/AppShell.vue'
import NButton from '@/components/primitives/NButton.vue'
import NIcon from '@/components/primitives/NIcon.vue'
import NBadge from '@/components/primitives/NBadge.vue'
import NModal from '@/components/primitives/NModal.vue'
import NInput from '@/components/primitives/NInput.vue'
import NToast from '@/components/primitives/NToast.vue'
import { F_FILES, F_LISTS_INITIAL, FILE_TONE } from '@/data/mock.js'

// ── State ──────────────────────────────────────────────────────
const tab = ref('lists')
const activeList = ref(null)
const lists = ref(F_LISTS_INITIAL.map(l => ({ ...l })))
const showCreate = ref(false)
const toast = ref(null)

// All files state
const search = ref('')
const filterTypes = ref(new Set())
const filterSrcs = ref(new Set())
const sortBy = ref('date')
const showTypeFilter = ref(false)
const showSrcFilter = ref(false)
const showSortFilter = ref(false)

// Create list modal state
const newName = ref('')
const newIsPublic = ref(true)
const newConds = ref([{ field: 'src', op: 'eq', value: 'gen' }])

// ── Constants ──────────────────────────────────────────────────
const BASE = 'https://app.nerion.ru/api/math-dept/lists'

const F_TYPES = {
  pdf:   { label: 'PDF',  bg: 'var(--red-50)',      fg: 'var(--red-600)',     bd: 'var(--red-100)' },
  docx:  { label: 'DOCX', bg: 'var(--blue-50)',     fg: 'var(--blue-600)',    bd: '#DBEAFE' },
  pptx:  { label: 'PPTX', bg: 'var(--amber-50)',    fg: 'var(--amber-700)',   bd: 'var(--amber-100)' },
  zip:   { label: 'ZIP',  bg: 'var(--neutral-100)', fg: 'var(--neutral-600)', bd: 'var(--border-default)' },
  img:   { label: 'IMG',  bg: 'var(--brand-tint)',  fg: 'var(--purple-600)',  bd: 'var(--purple-100)' },
  video: { label: 'MP4',  bg: 'var(--purple-50)',   fg: 'var(--purple-700)',  bd: 'var(--purple-100)' },
}

const SRC_LABEL = { gen: 'Сгенерировано', course: 'Курс', upload: 'Загружено' }

const F_COURSES = [...new Set(F_FILES.filter(f => f.course).map(f => f.course))]

const FIELD_DEFS = {
  src:    { label: 'Источник',  kind: 'select', opts: [['gen','Генерация'],['course','Курсы'],['upload','Загрузки']] },
  type:   { label: 'Тип файла', kind: 'select', opts: Object.entries(F_TYPES).map(([k, v]) => [k, v.label]) },
  tpl:    { label: 'Шаблон',    kind: 'select', opts: [['Справка','Справка'],['Ведомость','Ведомость'],['Приказ','Приказ'],['Нагрузка','Нагрузка']] },
  course: { label: 'Курс',      kind: 'select', opts: F_COURSES.map(c => [c, c]) },
  name:   { label: 'Имя файла', kind: 'text' },
}

const TRANSLIT = { а:'a',б:'b',в:'v',г:'g',д:'d',е:'e',ё:'e',ж:'zh',з:'z',и:'i',й:'y',к:'k',л:'l',м:'m',н:'n',о:'o',п:'p',р:'r',с:'s',т:'t',у:'u',ф:'f',х:'h',ц:'c',ч:'ch',ш:'sh',щ:'sch',ъ:'',ы:'y',ь:'',э:'e',ю:'yu',я:'ya' }
function slugify(s) {
  return (s || '').toLowerCase().split('').map(ch => TRANSLIT[ch] ?? (/[a-z0-9]/.test(ch) ? ch : ' ')).join('').trim().replace(/\s+/g, '-').replace(/-+/g, '-').slice(0, 32) || 'novyy-spisok'
}

function fmtSize(kb) {
  return kb >= 1024 ? `${(kb / 1024).toFixed(kb >= 10240 ? 0 : 1)} МБ` : `${kb} КБ`
}

function typeIcon(t) {
  return t === 'img' ? 'image' : t === 'video' ? 'play' : t === 'zip' ? 'folder' : 'file'
}

function condMatch(f, c) {
  if (!c.value) return true
  if (FIELD_DEFS[c.field]?.kind === 'text') return String(f.name || '').toLowerCase().includes(String(c.value).toLowerCase())
  const eq = String(f[c.field] ?? '') === String(c.value)
  return c.op === 'ne' ? !eq : eq
}

function makePred(conds) {
  return (f) => conds.every(c => condMatch(f, c))
}

// ── Computed ───────────────────────────────────────────────────
const newSlug = computed(() => slugify(newName.value))

const previewMatches = computed(() => F_FILES.filter(makePred(newConds.value)))

const filteredFiles = computed(() => {
  let list = [...F_FILES]
  if (search.value) list = list.filter(f => f.name.toLowerCase().includes(search.value.toLowerCase()))
  if (filterTypes.value.size) list = list.filter(f => filterTypes.value.has(f.type))
  if (filterSrcs.value.size) list = list.filter(f => filterSrcs.value.has(f.src))
  if (sortBy.value === 'name') list.sort((a, b) => a.name.localeCompare(b.name, 'ru'))
  else if (sortBy.value === 'size') list.sort((a, b) => b.kb - a.kb)
  return list
})

const typeItems = computed(() =>
  Object.entries(F_TYPES).map(([k, v]) => ({ key: k, label: v.label, hint: F_FILES.filter(f => f.type === k).length })).filter(t => t.hint > 0)
)
const srcItems = computed(() =>
  Object.entries(SRC_LABEL).map(([k, l]) => ({ key: k, label: l, hint: F_FILES.filter(f => f.src === k).length }))
)
const sortLabel = computed(() => ({ date: 'Сначала новые', name: 'По имени', size: 'По размеру' }[sortBy.value]))

const heroList = computed(() => lists.value.find(l => l.hero) || lists.value[0])
const heroFiles = computed(() => heroList.value ? F_FILES.filter(f => heroList.value.pred(f)) : [])

const crumb = computed(() => activeList.value
  ? ['Кафедра математики', 'Файлы', activeList.value.name]
  : ['Кафедра математики', 'Файлы']
)

// ── Methods ────────────────────────────────────────────────────
function show(msg) {
  toast.value = msg
  setTimeout(() => { toast.value = null }, 2200)
}

function listFiles(list) {
  return F_FILES.filter(f => list.pred(f))
}

function toggleType(k) {
  const s = new Set(filterTypes.value)
  s.has(k) ? s.delete(k) : s.add(k)
  filterTypes.value = s
}

function toggleSrc(k) {
  const s = new Set(filterSrcs.value)
  s.has(k) ? s.delete(k) : s.add(k)
  filterSrcs.value = s
}

function addCond() {
  newConds.value = [...newConds.value, { field: 'type', op: 'eq', value: '' }]
}

function removeCond(i) {
  if (newConds.value.length > 1) newConds.value = newConds.value.filter((_, j) => j !== i)
}

function setCond(i, patch) {
  newConds.value = newConds.value.map((c, j) => j === i ? { ...c, ...patch } : c)
}

function onCondField(i, field) {
  setCond(i, { field, op: 'eq', value: '' })
}

function ruleOf(conds) {
  const active = conds.filter(c => c.value)
  if (active.length === 0) return ['Все файлы', '']
  if (active.length === 1) {
    const c = active[0], d = FIELD_DEFS[c.field]
    const vl = d.kind === 'text' ? `«${c.value}»` : (d.opts.find(o => o[0] === c.value)?.[1] || c.value)
    return [d.label, vl]
  }
  return ['Правило', `${active.length} условия`]
}

function iconOf(conds) {
  if (conds.some(c => c.field === 'type' && c.value === 'img')) return 'image'
  if (conds.some(c => c.field === 'src' && c.value === 'course')) return 'folder'
  return 'file'
}

function createList() {
  const pred = makePred(newConds.value)
  const slug = newSlug.value
  const name = newName.value.trim() || 'Новый список'
  const newList = {
    slug, name, icon: iconOf(newConds.value),
    rule: ruleOf(newConds.value),
    pred,
    public: newIsPublic.value,
    custom: true,
  }
  lists.value = [...lists.value, newList]
  showCreate.value = false
  activeList.value = newList
  show(`Список «${name}» создан`)
  newName.value = ''
  newConds.value = [{ field: 'src', op: 'eq', value: 'gen' }]
  newIsPublic.value = true
}

function copyEndpoint(slug) {
  show('Адрес скопирован')
}

function copyCode() {
  show('Код скопирован')
}

function closeAllPopovers() {
  showTypeFilter.value = false
  showSrcFilter.value = false
  showSortFilter.value = false
}

function listCodeSnippet(list) {
  const auth = list.public ? '' : ", { headers: { Authorization: 'Bearer KEY' } }"
  return `const res = await fetch('${BASE}/${list.slug}'${auth});
const { data } = await res.json();   // массив файлов

const box = document.querySelector('#files');
data.forEach(f => {
  const a = document.createElement('a');
  a.href = f.url;            // прямая CDN-ссылка
  a.textContent = f.name;
  a.target = '_blank';
  box.append(a);
});`
}

function listResponseSnippet(list) {
  const files = listFiles(list)
  const first = files[0]
  return `{
  "list": "${list.slug}",
  "count": ${files.length},
  "data": [
    {
      "name": "${first?.name || 'file.pdf'}",
      "size": ${(first?.kb || 142) * 1024},
      "url": "https://cdn.nerion.ru/math-dept/file_7b3e9a.pdf",
      "created_at": "2025-06-21T14:32:00Z"
    }
    // … ещё ${Math.max(0, files.length - 1)}
  ]
}`
}

function heroCodeSnippet() {
  if (!heroList.value) return ''
  return `const { data } = await (await fetch('${BASE}/${heroList.value.slug}')).json();
data.forEach(f => render('<a href="' + f.url + '">' + f.name + '</a>'));   // ${heroFiles.value.length} ссылок, без хардкода`
}
</script>

<template>
  <AppShell :breadcrumb="crumb">
    <template #actions>
      <NButton variant="primary" size="sm" @click="showCreate = true; activeList = null; tab = 'lists'">
        <NIcon name="plus" :size="13" color="#fff" />
        Новый список
      </NButton>
    </template>

    <!-- Tab bar (only when not viewing list detail) -->
    <div v-if="!activeList" style="background: var(--bg-0); border-bottom: 0.5px solid var(--border-default); display: flex; align-items: center; padding: 0 32px; gap: 4px; height: 44px">
      <button
        v-for="[k, l] in [['lists','Списки'],['all','Все файлы']]" :key="k"
        @click="tab = k"
        :style="{
          height: '100%', padding: '0 14px', border: 0,
          borderBottom: `2px solid ${tab === k ? 'var(--brand-primary)' : 'transparent'}`,
          background: 'transparent',
          color: tab === k ? 'var(--fg-1)' : 'var(--fg-2)',
          fontSize: '13px', fontWeight: tab === k ? 600 : 500,
          cursor: 'pointer', fontFamily: 'inherit',
        }"
      >{{ l }}</button>
    </div>

    <!-- LIST DETAIL -->
    <div v-if="activeList" style="padding: 20px 32px 56px; max-width: 1080px">
      <button @click="activeList = null" style="background: 0; border: 0; color: var(--fg-3); font-size: 12px; cursor: pointer; display: flex; align-items: center; gap: 6px; margin-bottom: 14px; padding: 0; font-family: inherit">
        <NIcon name="arrow" :size="12" style="transform: rotate(180deg)" />Все списки
      </button>
      <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 6px">
        <h1 style="font-size: 22px; font-weight: 700; letter-spacing: -0.01em">{{ activeList.name }}</h1>
        <NBadge tone="brand">{{ activeList.rule[0] }} · {{ activeList.rule[1] }}</NBadge>
      </div>
      <p style="font-size: 13px; color: var(--fg-2); margin-bottom: 18px">
        Список собирается автоматически по правилу. Фронт запрашивает его по постоянному адресу — id файлов знать не нужно, выдача обновляется сама.
      </p>

      <!-- Endpoint bar -->
      <div style="display: flex; align-items: center; gap: 10px; background: var(--bg-0); border: 0.5px solid var(--border-strong); border-radius: 8px; padding: 8px 8px 8px 12px; margin-bottom: 20px">
        <span style="font-size: 9px; font-weight: 700; padding: 2px 6px; border-radius: 3px; background: #DBEAFE; color: #1E40AF; font-family: var(--font-mono)">GET</span>
        <code style="flex: 1; font-size: 12.5px; font-family: var(--font-mono); color: var(--fg-1); overflow: hidden; text-overflow: ellipsis; white-space: nowrap">/api/math-dept/lists/{{ activeList.slug }}</code>
        <NBadge :tone="activeList.public ? 'success' : 'neutral'" :dot="true">{{ activeList.public ? 'публичный' : 'по ключу' }}</NBadge>
        <NButton variant="secondary" size="sm" @click="copyEndpoint(activeList.slug)">
          <NIcon name="copy" :size="12" />Копировать
        </NButton>
      </div>

      <!-- Code panel -->
      <div style="margin-bottom: 28px">
        <div style="font-size: 11px; color: var(--fg-3); text-transform: uppercase; letter-spacing: 0.06em; font-weight: 600; margin-bottom: 10px">Получить на фронте</div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px">
          <div style="position: relative; background: #111827; border-radius: 8px; overflow: hidden">
            <button @click="copyCode" style="position: absolute; top: 8px; right: 8px; background: rgba(255,255,255,.08); border: 0; color: rgba(255,255,255,.7); padding: 4px 9px; border-radius: 4px; cursor: pointer; font-size: 11px; display: flex; align-items: center; gap: 4px; font-family: inherit; z-index: 1">
              <NIcon name="copy" :size="11" color="rgba(255,255,255,.7)" />Копировать
            </button>
            <pre style="margin: 0; padding: 16px 18px; color: rgba(255,255,255,.9); font-size: 12px; font-family: var(--font-mono); line-height: 1.6; overflow: auto; white-space: pre-wrap">{{ listCodeSnippet(activeList) }}</pre>
          </div>
          <div>
            <div style="font-size: 10px; color: var(--fg-3); font-family: var(--font-mono); margin-bottom: 6px">200 OK · application/json</div>
            <div style="background: #111827; border-radius: 8px; padding: 16px 18px">
              <pre style="margin: 0; color: rgba(255,255,255,.9); font-size: 12px; font-family: var(--font-mono); line-height: 1.6; white-space: pre-wrap">{{ listResponseSnippet(activeList) }}</pre>
            </div>
          </div>
        </div>
      </div>

      <!-- Files in list -->
      <div style="font-size: 11px; color: var(--fg-3); text-transform: uppercase; letter-spacing: 0.06em; font-weight: 600; margin-bottom: 10px">В списке · {{ listFiles(activeList).length }}</div>
      <div style="background: var(--bg-0); border: 0.5px solid var(--border-default); border-radius: 8px; overflow: hidden">
        <div style="display: grid; grid-template-columns: 1fr 140px 140px 100px 72px; padding: 0 16px; height: 36px; align-items: center; background: var(--bg-1); border-bottom: 0.5px solid var(--border-default); font-size: 10px; color: var(--fg-3); text-transform: uppercase; letter-spacing: 0.06em; font-weight: 600">
          <div>Файл</div><div>Источник</div><div>Создан</div><div style="text-align: right">Размер</div><div></div>
        </div>
        <div
          v-for="(f, i) in listFiles(activeList)" :key="i"
          style="display: grid; grid-template-columns: 1fr 140px 140px 100px 72px; padding: 10px 16px; align-items: center; border-top: 0.5px solid var(--border-default)"
        >
          <div style="display: flex; align-items: center; gap: 11px">
            <div :style="{
              width: '26px', height: '32px', borderRadius: '3px', flexShrink: 0,
              background: (F_TYPES[f.type] || F_TYPES.pdf).bg,
              border: `0.5px solid ${(F_TYPES[f.type] || F_TYPES.pdf).bd}`,
              display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: '3px',
            }">
              <span :style="{ fontSize: '7px', fontWeight: 700, color: (F_TYPES[f.type] || F_TYPES.pdf).fg, fontFamily: 'var(--font-mono)' }">{{ (F_TYPES[f.type] || F_TYPES.pdf).label }}</span>
            </div>
            <span style="font-weight: 500; font-family: var(--font-mono); font-size: 12.5px; color: var(--fg-1)">{{ f.name }}</span>
          </div>
          <div>
            <NBadge :tone="f.src === 'gen' ? 'brand' : 'neutral'">{{ f.src === 'course' ? f.course : f.tpl ? `${SRC_LABEL[f.src]} · ${f.tpl}` : SRC_LABEL[f.src] }}</NBadge>
          </div>
          <div style="font-size: 13px; color: var(--fg-3)">{{ f.date }}</div>
          <div style="text-align: right; font-family: var(--font-mono); font-size: 12px; color: var(--fg-2)">{{ fmtSize(f.kb) }}</div>
          <div style="display: flex; gap: 2px; justify-content: flex-end">
            <button @click="show('Скачивание начато')" style="background: 0; border: 0; padding: 5px; cursor: pointer; color: var(--fg-2); display: flex; border-radius: 4px">
              <NIcon name="download" :size="14" />
            </button>
            <button @click="show('Ссылка скопирована')" style="background: 0; border: 0; padding: 5px; cursor: pointer; color: var(--fg-2); display: flex; border-radius: 4px">
              <NIcon name="link" :size="14" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- LISTS OVERVIEW -->
    <div v-else-if="tab === 'lists'" style="padding: 20px 32px 56px; max-width: 1080px">
      <div style="margin-bottom: 18px">
        <h1 style="font-size: 20px; font-weight: 700; margin-bottom: 4px">Списки файлов</h1>
        <div style="font-size: 12px; color: var(--fg-3)">Опубликованный список = постоянный адрес, по которому фронт забирает файлы массивом</div>
      </div>

      <!-- Hero snippet -->
      <div style="background: linear-gradient(90deg,var(--brand-tint),#F8F4FF); border: 0.5px solid var(--purple-200); border-radius: 12px; padding: 18px; margin-bottom: 22px">
        <div style="display: flex; align-items: center; gap: 14px; margin-bottom: 12px">
          <div style="width: 38px; height: 38px; border-radius: 9px; background: var(--brand-primary); color: #fff; display: grid; place-items: center; flex-shrink: 0">
            <NIcon name="code" :size="19" color="#fff" />
          </div>
          <div style="flex: 1">
            <div style="font-size: 14px; font-weight: 600; margin-bottom: 2px">Сгенерировал {{ heroFiles.length }} документов — как вывести на сайте?</div>
            <div style="font-size: 12.5px; color: var(--fg-2)">Не нужно знать id или вставлять ссылки руками. Один запрос к списку — и фронт рендерит всё, что в нём лежит.</div>
          </div>
          <NButton v-if="heroList" variant="primary" size="md" @click="activeList = heroList">Открыть список</NButton>
        </div>
        <div style="background: #111827; border-radius: 8px; padding: 12px 16px">
          <pre style="margin: 0; color: rgba(255,255,255,.9); font-size: 12px; font-family: var(--font-mono); line-height: 1.55; white-space: pre-wrap">{{ heroCodeSnippet() }}</pre>
        </div>
      </div>

      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px">
        <div style="font-size: 11px; color: var(--fg-3); text-transform: uppercase; letter-spacing: 0.06em; font-weight: 600">Списки · {{ lists.length }}</div>
        <NButton variant="secondary" size="sm" @click="showCreate = true">
          <NIcon name="plus" :size="13" />Новый список
        </NButton>
      </div>
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 12px">
        <div
          v-for="l in lists" :key="l.slug"
          @click="activeList = l"
          style="background: var(--bg-0); border: 0.5px solid var(--border-default); border-radius: 10px; padding: 16px; cursor: pointer; transition: box-shadow 160ms, transform 160ms; display: flex; flex-direction: column; gap: 12px"
          @mouseenter="e => { e.currentTarget.style.boxShadow = 'var(--shadow-2)'; e.currentTarget.style.transform = 'translateY(-2px)'; }"
          @mouseleave="e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; }"
        >
          <div style="display: flex; align-items: flex-start; gap: 12px">
            <div style="width: 38px; height: 38px; border-radius: 9px; background: var(--brand-tint); color: var(--purple-600); display: grid; place-items: center; flex-shrink: 0">
              <NIcon :name="l.icon" :size="19" />
            </div>
            <div style="flex: 1; min-width: 0">
              <div style="font-size: 14px; font-weight: 600; line-height: 1.3">{{ l.name }}</div>
              <div style="font-size: 11.5px; color: var(--fg-3); margin-top: 3px; display: flex; align-items: center; gap: 5px">
                <NIcon name="filter" :size="10" />
                <span>{{ l.rule[0] }} · {{ l.rule[1] }}</span>
              </div>
            </div>
            <NBadge :tone="l.public ? 'success' : 'neutral'" :dot="true">{{ l.public ? 'публичный' : 'по ключу' }}</NBadge>
          </div>
          <div style="display: flex; align-items: center; gap: 8px; padding-top: 12px; border-top: 0.5px solid var(--border-default)">
            <code style="flex: 1; font-size: 11px; font-family: var(--font-mono); color: var(--fg-2); background: var(--bg-1); padding: 4px 8px; border-radius: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap">/lists/{{ l.slug }}</code>
            <span style="font-size: 12px; color: var(--fg-2); font-weight: 500; white-space: nowrap">{{ listFiles(l).length }} файл.</span>
            <NIcon name="chev" :size="14" color="var(--fg-3)" />
          </div>
        </div>
      </div>
    </div>

    <!-- ALL FILES -->
    <div v-else style="padding: 20px 32px 56px; max-width: 1080px">
      <div style="margin-bottom: 16px">
        <h1 style="font-size: 20px; font-weight: 700; margin-bottom: 4px">Все файлы</h1>
        <div style="font-size: 12px; color: var(--fg-3)">{{ F_FILES.length }} файлов в пространстве · из них собираются списки</div>
      </div>

      <!-- Filter bar -->
      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px; flex-wrap: wrap" @click.self="closeAllPopovers">
        <div style="position: relative; flex: 0 0 240px">
          <NIcon name="search" :size="14" color="var(--fg-3)" style="position: absolute; left: 10px; top: 50%; transform: translateY(-50%)" />
          <input v-model="search" placeholder="Поиск по файлам…" style="height: 32px; width: 100%; padding: 0 10px 0 32px; border: 0.5px solid var(--border-strong); border-radius: 6px; background: var(--bg-0); font-size: 13px; color: var(--fg-1); outline: 0; font-family: inherit; box-sizing: border-box" />
        </div>

        <!-- Source filter -->
        <div style="position: relative">
          <button
            @click.stop="showSrcFilter = !showSrcFilter; showTypeFilter = false; showSortFilter = false"
            :style="{
              display: 'inline-flex', alignItems: 'center', gap: '6px', height: '32px', padding: '0 12px',
              borderRadius: '6px', fontSize: '13px', fontWeight: 500, fontFamily: 'inherit', cursor: 'pointer',
              border: `0.5px solid ${showSrcFilter || filterSrcs.size > 0 ? 'var(--purple-300)' : 'var(--border-strong)'}`,
              background: showSrcFilter || filterSrcs.size > 0 ? 'var(--brand-tint)' : 'var(--bg-0)',
              color: showSrcFilter || filterSrcs.size > 0 ? 'var(--purple-700)' : 'var(--fg-1)',
            }"
          >
            <NIcon name="folder" :size="12" />Источник
            <span v-if="filterSrcs.size > 0" style="min-width: 16px; height: 16px; padding: 0 4px; border-radius: 999px; background: var(--brand-primary); color: #fff; font-size: 10px; font-weight: 700; display: inline-flex; align-items: center; justify-content: center">{{ filterSrcs.size }}</span>
            <NIcon name="chevd" :size="11" />
          </button>
          <div v-if="showSrcFilter" style="position: absolute; top: calc(100% + 6px); left: 0; z-index: 41; width: 220px; background: var(--bg-0); border: 0.5px solid var(--border-default); border-radius: 10px; box-shadow: var(--shadow-3)">
            <div style="padding: 8px; max-height: 260px; overflow: auto">
              <button v-for="item in srcItems" :key="item.key" @click="toggleSrc(item.key)" :style="{ width: '100%', display: 'flex', alignItems: 'center', gap: '9px', padding: '7px 8px', border: 0, borderRadius: '6px', cursor: 'pointer', background: filterSrcs.has(item.key) ? 'var(--brand-tint)' : 'transparent', textAlign: 'left', fontFamily: 'inherit' }">
                <span :style="{ width: '16px', height: '16px', borderRadius: '4px', border: `1.5px solid ${filterSrcs.has(item.key) ? 'var(--brand-primary)' : 'var(--border-strong)'}`, background: filterSrcs.has(item.key) ? 'var(--brand-primary)' : 'transparent', display: 'grid', placeItems: 'center', flexShrink: 0 }">
                  <NIcon v-if="filterSrcs.has(item.key)" name="check" :size="10" color="#fff" />
                </span>
                <span style="flex: 1; font-size: 13px; color: var(--fg-1)">{{ item.label }}</span>
                <span style="font-size: 11px; color: var(--fg-3)">{{ item.hint }}</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Type filter -->
        <div style="position: relative">
          <button
            @click.stop="showTypeFilter = !showTypeFilter; showSrcFilter = false; showSortFilter = false"
            :style="{
              display: 'inline-flex', alignItems: 'center', gap: '6px', height: '32px', padding: '0 12px',
              borderRadius: '6px', fontSize: '13px', fontWeight: 500, fontFamily: 'inherit', cursor: 'pointer',
              border: `0.5px solid ${showTypeFilter || filterTypes.size > 0 ? 'var(--purple-300)' : 'var(--border-strong)'}`,
              background: showTypeFilter || filterTypes.size > 0 ? 'var(--brand-tint)' : 'var(--bg-0)',
              color: showTypeFilter || filterTypes.size > 0 ? 'var(--purple-700)' : 'var(--fg-1)',
            }"
          >
            <NIcon name="filter" :size="12" />Тип
            <span v-if="filterTypes.size > 0" style="min-width: 16px; height: 16px; padding: 0 4px; border-radius: 999px; background: var(--brand-primary); color: #fff; font-size: 10px; font-weight: 700; display: inline-flex; align-items: center; justify-content: center">{{ filterTypes.size }}</span>
            <NIcon name="chevd" :size="11" />
          </button>
          <div v-if="showTypeFilter" style="position: absolute; top: calc(100% + 6px); left: 0; z-index: 41; width: 200px; background: var(--bg-0); border: 0.5px solid var(--border-default); border-radius: 10px; box-shadow: var(--shadow-3)">
            <div style="padding: 8px">
              <button v-for="item in typeItems" :key="item.key" @click="toggleType(item.key)" :style="{ width: '100%', display: 'flex', alignItems: 'center', gap: '9px', padding: '7px 8px', border: 0, borderRadius: '6px', cursor: 'pointer', background: filterTypes.has(item.key) ? 'var(--brand-tint)' : 'transparent', textAlign: 'left', fontFamily: 'inherit' }">
                <span :style="{ width: '16px', height: '16px', borderRadius: '4px', border: `1.5px solid ${filterTypes.has(item.key) ? 'var(--brand-primary)' : 'var(--border-strong)'}`, background: filterTypes.has(item.key) ? 'var(--brand-primary)' : 'transparent', display: 'grid', placeItems: 'center', flexShrink: 0 }">
                  <NIcon v-if="filterTypes.has(item.key)" name="check" :size="10" color="#fff" />
                </span>
                <span style="flex: 1; font-size: 13px; color: var(--fg-1)">{{ item.label }}</span>
                <span style="font-size: 11px; color: var(--fg-3)">{{ item.hint }}</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Sort -->
        <div style="position: relative">
          <button
            @click.stop="showSortFilter = !showSortFilter; showSrcFilter = false; showTypeFilter = false"
            :style="{
              display: 'inline-flex', alignItems: 'center', gap: '6px', height: '32px', padding: '0 12px',
              borderRadius: '6px', fontSize: '13px', fontWeight: 500, fontFamily: 'inherit', cursor: 'pointer',
              border: `0.5px solid ${showSortFilter ? 'var(--purple-300)' : 'var(--border-strong)'}`,
              background: showSortFilter ? 'var(--brand-tint)' : 'var(--bg-0)',
              color: showSortFilter ? 'var(--purple-700)' : 'var(--fg-1)',
            }"
          >
            <NIcon name="sliders" :size="12" />{{ sortLabel }}<NIcon name="chevd" :size="11" />
          </button>
          <div v-if="showSortFilter" style="position: absolute; top: calc(100% + 6px); left: 0; z-index: 41; width: 190px; background: var(--bg-0); border: 0.5px solid var(--border-default); border-radius: 10px; box-shadow: var(--shadow-3)">
            <div style="padding: 8px">
              <button v-for="[k, l] in [['date','Сначала новые'],['name','По имени (А–Я)'],['size','По размеру']]" :key="k"
                @click="sortBy = k; showSortFilter = false"
                :style="{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', border: 0, borderRadius: '6px', cursor: 'pointer', background: sortBy === k ? 'var(--brand-tint)' : 'transparent', color: sortBy === k ? 'var(--purple-700)' : 'var(--fg-1)', fontSize: '13px', fontFamily: 'inherit', fontWeight: sortBy === k ? 500 : 400, textAlign: 'left' }"
              >{{ l }}<NIcon v-if="sortBy === k" name="check" :size="13" color="var(--purple-600)" /></button>
            </div>
          </div>
        </div>
      </div>

      <!-- Files table -->
      <div style="background: var(--bg-0); border: 0.5px solid var(--border-default); border-radius: 8px; overflow: hidden">
        <div style="display: grid; grid-template-columns: 1fr 160px 140px 100px 72px; padding: 0 16px; height: 36px; align-items: center; background: var(--bg-1); border-bottom: 0.5px solid var(--border-default); font-size: 10px; color: var(--fg-3); text-transform: uppercase; letter-spacing: 0.06em; font-weight: 600">
          <div>Файл</div><div>Источник</div><div>Создан</div><div style="text-align: right">Размер</div><div></div>
        </div>
        <div
          v-for="(f, i) in filteredFiles" :key="i"
          style="display: grid; grid-template-columns: 1fr 160px 140px 100px 72px; padding: 10px 16px; align-items: center; border-top: 0.5px solid var(--border-default)"
        >
          <div style="display: flex; align-items: center; gap: 11px">
            <div :style="{
              width: '26px', height: '32px', borderRadius: '3px', flexShrink: 0,
              background: (F_TYPES[f.type] || F_TYPES.pdf).bg,
              border: `0.5px solid ${(F_TYPES[f.type] || F_TYPES.pdf).bd}`,
              display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: '3px',
            }">
              <span :style="{ fontSize: '7px', fontWeight: 700, color: (F_TYPES[f.type] || F_TYPES.pdf).fg, fontFamily: 'var(--font-mono)' }">{{ (F_TYPES[f.type] || F_TYPES.pdf).label }}</span>
            </div>
            <span style="font-weight: 500; font-family: var(--font-mono); font-size: 12.5px; color: var(--fg-1)">{{ f.name }}</span>
          </div>
          <div>
            <NBadge :tone="f.src === 'gen' ? 'brand' : 'neutral'">{{ f.src === 'course' ? f.course : f.tpl ? `${SRC_LABEL[f.src]} · ${f.tpl}` : SRC_LABEL[f.src] }}</NBadge>
          </div>
          <div style="font-size: 13px; color: var(--fg-3)">{{ f.date }}</div>
          <div style="text-align: right; font-family: var(--font-mono); font-size: 12px; color: var(--fg-2)">{{ fmtSize(f.kb) }}</div>
          <div style="display: flex; gap: 2px; justify-content: flex-end">
            <button @click="show('Скачивание начато')" style="background: 0; border: 0; padding: 5px; cursor: pointer; color: var(--fg-2); display: flex; border-radius: 4px">
              <NIcon name="download" :size="14" />
            </button>
            <button @click="show('Ссылка скопирована')" style="background: 0; border: 0; padding: 5px; cursor: pointer; color: var(--fg-2); display: flex; border-radius: 4px">
              <NIcon name="link" :size="14" />
            </button>
          </div>
        </div>
        <div v-if="filteredFiles.length === 0" style="padding: 44px 20px; text-align: center">
          <div style="width: 40px; height: 40px; border-radius: 10px; background: var(--bg-2); display: grid; place-items: center; margin: 0 auto 12px; color: var(--fg-3)">
            <NIcon name="folder" :size="18" />
          </div>
          <div style="font-size: 14px; font-weight: 600; margin-bottom: 4px">Файлы не найдены</div>
          <NButton variant="secondary" size="sm" style="margin-top: 10px" @click="filterTypes = new Set(); filterSrcs = new Set(); search = ''">Сбросить фильтры</NButton>
        </div>
      </div>
    </div>
  </AppShell>

  <!-- Create list modal -->
  <NModal :open="showCreate" @close="showCreate = false" title="Новый список файлов" subtitle="Задай правило — Nerion соберёт подходящие файлы и даст постоянный адрес для фронта." :width="580">
    <!-- Name + slug -->
    <div style="margin-bottom: 20px">
      <label style="font-size: 12px; color: var(--fg-2); font-weight: 500; display: block; margin-bottom: 6px">Название</label>
      <NInput v-model="newName" placeholder="Например: Справки для портала" />
      <div style="font-size: 11px; color: var(--fg-3); margin-top: 6px; display: flex; align-items: center; gap: 5px">
        Адрес: <code style="font-size: 11px; font-family: var(--font-mono); background: var(--bg-2); padding: 1px 6px; border-radius: 3px">/lists/{{ newSlug }}</code>
      </div>
    </div>

    <!-- Conditions -->
    <label style="font-size: 12px; color: var(--fg-2); font-weight: 500; display: block; margin-bottom: 8px">Правило отбора</label>
    <div style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 10px">
      <div v-for="(c, i) in newConds" :key="i">
        <div v-if="i > 0" style="font-size: 10px; color: var(--fg-3); font-family: var(--font-mono); text-transform: uppercase; letter-spacing: 0.08em; margin: 0 0 6px 2px">и</div>
        <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap">
          <div style="position: relative">
            <select :value="c.field" @change="onCondField(i, $event.target.value)" style="height: 32px; border-radius: 6px; border: 0.5px solid var(--border-strong); padding: 0 26px 0 10px; font-size: 13px; background: var(--bg-0); color: var(--fg-1); outline: 0; appearance: none; cursor: pointer; font-family: inherit; font-weight: 500">
              <option v-for="[k, v] in Object.entries(FIELD_DEFS)" :key="k" :value="k">{{ v.label }}</option>
            </select>
            <NIcon name="chevd" :size="11" color="var(--fg-3)" style="position: absolute; right: 9px; top: 50%; transform: translateY(-50%); pointer-events: none" />
          </div>
          <template v-if="FIELD_DEFS[c.field]?.kind === 'select'">
            <div style="position: relative">
              <select :value="c.op" @change="setCond(i, { op: $event.target.value })" style="height: 32px; border-radius: 6px; border: 0.5px solid var(--border-strong); padding: 0 26px 0 10px; font-size: 13px; background: var(--bg-0); color: var(--fg-2); outline: 0; appearance: none; cursor: pointer; font-family: inherit; width: 110px">
                <option value="eq">равно</option>
                <option value="ne">не равно</option>
              </select>
              <NIcon name="chevd" :size="11" color="var(--fg-3)" style="position: absolute; right: 9px; top: 50%; transform: translateY(-50%); pointer-events: none" />
            </div>
            <div style="position: relative; flex: 1; min-width: 130px">
              <select :value="c.value" @change="setCond(i, { value: $event.target.value })" style="height: 32px; border-radius: 6px; border: 0.5px solid var(--border-strong); padding: 0 26px 0 10px; font-size: 13px; background: var(--bg-0); outline: 0; appearance: none; cursor: pointer; font-family: inherit; width: 100%" :style="{ color: c.value ? 'var(--fg-1)' : 'var(--fg-3)' }">
                <option value="">выбери значение…</option>
                <option v-for="[k, l] in FIELD_DEFS[c.field]?.opts || []" :key="k" :value="k">{{ l }}</option>
              </select>
              <NIcon name="chevd" :size="11" color="var(--fg-3)" style="position: absolute; right: 9px; top: 50%; transform: translateY(-50%); pointer-events: none" />
            </div>
          </template>
          <template v-else>
            <span style="font-size: 13px; color: var(--fg-2); padding: 0 4px">содержит</span>
            <input :value="c.value" @input="setCond(i, { value: $event.target.value })" placeholder="текст…" style="flex: 1; min-width: 130px; height: 32px; border-radius: 6px; border: 0.5px solid var(--border-strong); padding: 0 10px; font-size: 13px; background: var(--bg-0); color: var(--fg-1); outline: 0; font-family: inherit; box-sizing: border-box" />
          </template>
          <button @click="removeCond(i)" :disabled="newConds.length === 1" :style="{ background: 0, border: 0, cursor: newConds.length === 1 ? 'default' : 'pointer', color: newConds.length === 1 ? 'var(--neutral-300)' : 'var(--fg-3)', padding: '4px', display: 'flex', flexShrink: 0 }">
            <NIcon name="x" :size="14" />
          </button>
        </div>
      </div>
    </div>
    <button @click="addCond" style="background: 0; border: 0; cursor: pointer; color: var(--brand-primary); font-size: 12px; font-weight: 500; font-family: inherit; display: flex; align-items: center; gap: 5px; margin-bottom: 22px; padding: 0">
      <NIcon name="plus" :size="12" />Добавить условие
    </button>

    <!-- Access -->
    <label style="font-size: 12px; color: var(--fg-2); font-weight: 500; display: block; margin-bottom: 8px">Доступ</label>
    <div style="display: flex; gap: 8px; margin-bottom: 22px">
      <button v-for="[v, t, h] in [[true,'Публичный','Фронт читает без ключа'],[false,'По ключу','Нужен Bearer-токен']]" :key="String(v)"
        @click="newIsPublic = v"
        :style="{
          flex: 1, textAlign: 'left', padding: '10px 12px', borderRadius: '8px', cursor: 'pointer',
          background: newIsPublic === v ? 'var(--brand-tint)' : 'var(--bg-0)',
          border: `1px solid ${newIsPublic === v ? 'var(--brand-primary)' : 'var(--border-default)'}`,
          fontFamily: 'inherit',
        }"
      >
        <div :style="{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, color: newIsPublic === v ? 'var(--purple-700)' : 'var(--fg-1)' }">
          <NIcon :name="v ? 'extlink' : 'lock'" :size="13" />{{ t }}
        </div>
        <div style="font-size: 11px; color: var(--fg-3); margin-top: 3px">{{ h }}</div>
      </button>
    </div>

    <!-- Live preview -->
    <div style="background: var(--brand-tint); border: 0.5px solid var(--purple-200); border-radius: 10px; padding: 14px">
      <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 0">
        <div style="display: flex">
          <div
            v-for="(f, i) in previewMatches.slice(0, 5)" :key="i"
            :style="{ marginLeft: i ? '-8px' : '0', position: 'relative', zIndex: 5 - i, width: '22px', height: '27px', borderRadius: '3px', background: (F_TYPES[f.type] || F_TYPES.pdf).bg, border: `0.5px solid ${(F_TYPES[f.type] || F_TYPES.pdf).bd}`, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: '2px', flexShrink: 0 }"
          >
            <span :style="{ fontSize: '5px', fontWeight: 700, color: (F_TYPES[f.type] || F_TYPES.pdf).fg, fontFamily: 'var(--font-mono)' }">{{ (F_TYPES[f.type] || F_TYPES.pdf).label }}</span>
          </div>
        </div>
        <div style="flex: 1; font-size: 13px; color: var(--fg-1)">
          Подойдёт <strong :style="{ color: 'var(--purple-700)', fontVariantNumeric: 'tabular-nums' }">{{ previewMatches.length }}</strong> {{ previewMatches.length === 1 ? 'файл' : 'файлов' }}
          <span v-if="previewMatches.length === 0" style="color: var(--fg-3)"> — ослабь условия</span>
        </div>
        <NBadge :tone="newIsPublic ? 'success' : 'neutral'" :dot="true">{{ newIsPublic ? 'публичный' : 'по ключу' }}</NBadge>
      </div>
      <code v-if="previewMatches.length > 0" style="display: block; font-size: 11px; font-family: var(--font-mono); color: var(--purple-700); background: var(--bg-0); border: 0.5px solid var(--purple-100); padding: 6px 9px; border-radius: 5px; margin-top: 10px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap">GET /api/math-dept/lists/{{ newSlug }}</code>
    </div>

    <template #footer>
      <NButton variant="ghost" size="md" @click="showCreate = false">Отмена</NButton>
      <NButton variant="primary" size="md" @click="createList">
        <NIcon name="check" :size="13" color="#fff" />Создать список
      </NButton>
    </template>
  </NModal>

  <NToast v-if="toast" tone="success" :title="toast" @close="toast = null" />
</template>
