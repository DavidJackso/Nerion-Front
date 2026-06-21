<script setup>
import { ref, computed } from 'vue'
import AppShell from '@/components/shell/AppShell.vue'
import NButton from '@/components/primitives/NButton.vue'
import NIcon from '@/components/primitives/NIcon.vue'
import NBadge from '@/components/primitives/NBadge.vue'
import NToast from '@/components/primitives/NToast.vue'
import { MY_TEMPLATES, LIB_CATS, LIB_TPLS, PDF_RECORDS, PDF_FORMATS, BIND_TABLES, INITIAL_MAPPING, PDF_ARCHIVE } from '@/data/mock.js'

// ── View state ─────────────────────────────────────────────────
const view = ref('templates') // templates | library | editor | generate | archive
const activeTpl = ref(null)
const toast = ref(null)

// Library state
const libCat = ref('all')
const libSearch = ref('')

// Editor state
const mapping = ref(INITIAL_MAPPING.map(m => ({ ...m })))
const zoom = ref(78)
const previewRec = ref(PDF_RECORDS[0])
const showBanner = ref(true)

// Generate state
const genMode = ref('single')
const genRec = ref(PDF_RECORDS[0])
const genNum = ref('184/2025')
const genPhase = ref('idle')
const genProgress = ref(0)
let genTimer = null

const RECORDS = PDF_RECORDS
const FILE_MASK = '{{ФИО}}'
function phLabel(ph) { return '{' + '{' + ph + '}' + '}' }

// Archive state
const archiveSearch = ref('')

// ── Computed ───────────────────────────────────────────────────
const breadcrumb = computed(() => {
  const map = {
    templates: ['PDF', 'Мои шаблоны'],
    library:   ['PDF', 'Библиотека'],
    archive:   ['PDF', 'Архив'],
    editor:    ['PDF', activeTpl.value?.name || 'Шаблон', 'Настройка'],
    generate:  ['PDF', activeTpl.value?.name || 'Шаблон', 'Генерация'],
  }
  return ['Кафедра математики', ...(map[view.value] || [])]
})

const isDeep = computed(() => view.value === 'editor' || view.value === 'generate')

const filteredLib = computed(() =>
  LIB_TPLS.filter(t => (libCat.value === 'all' || t.cat === libCat.value) && (!libSearch.value || t.name.toLowerCase().includes(libSearch.value.toLowerCase())))
)

const boundCount = computed(() => mapping.value.filter(m => m.field).length)
const unbound = computed(() => mapping.value.length - boundCount.value)

const filteredArchive = computed(() =>
  PDF_ARCHIVE.filter(a => !archiveSearch.value || a.name.toLowerCase().includes(archiveSearch.value.toLowerCase()) || a.rec.toLowerCase().includes(archiveSearch.value.toLowerCase()))
)

const genTotal = 14
const genDoneCount = computed(() => Math.round(genProgress.value / 100 * genTotal))

// ── Spravka doc helpers ────────────────────────────────────────
function spravkaData(rec) {
  const parts = rec.split(' ')
  const last = parts[0]
  const init = parts.slice(1).map(w => w[0] + '.').join(' ')
  const datelny = last.endsWith('а') ? last.slice(0, -1) + 'ой' : last + 'у'
  return { datelny, init }
}

// ── Methods ────────────────────────────────────────────────────
function show(msg) {
  toast.value = msg
  setTimeout(() => { toast.value = null }, 2600)
}

function setMapRow(i, patch) {
  mapping.value = mapping.value.map((m, j) => j === i ? { ...m, ...patch } : m)
}

function onBindChange(i, val) {
  const [table, field] = val.split('::')
  setMapRow(i, { table: table || '', field: field || '', sample: field ? mapping.value[i].sample : '—' })
}

function openEditor(tpl) {
  activeTpl.value = tpl
  view.value = 'editor'
}

function openGenerate(tpl) {
  activeTpl.value = tpl
  genPhase.value = 'idle'
  genProgress.value = 0
  view.value = 'generate'
}

function startGenerate() {
  genPhase.value = 'running'
  genProgress.value = 0
  const step = genMode.value === 'bulk' ? 4 : 12
  const interval = genMode.value === 'bulk' ? 90 : 70
  clearInterval(genTimer)
  genTimer = setInterval(() => {
    genProgress.value = Math.min(genProgress.value + step, 100)
    if (genProgress.value >= 100) {
      clearInterval(genTimer)
      genPhase.value = 'done'
    }
  }, interval)
}
</script>

<template>
  <AppShell :breadcrumb="breadcrumb">
    <!-- Tab bar (only on top-level views) -->
    <div v-if="!isDeep" style="background: var(--bg-0); border-bottom: 0.5px solid var(--border-default); display: flex; align-items: center; padding: 0 32px; gap: 4px; height: 44px">
      <button
        v-for="[k, l] in [['templates','Мои шаблоны'],['library','Библиотека'],['archive','Архив']]" :key="k"
        @click="view = k"
        :style="{
          height: '100%', padding: '0 14px', border: 0,
          borderBottom: `2px solid ${view === k ? 'var(--brand-primary)' : 'transparent'}`,
          background: 'transparent',
          color: view === k ? 'var(--fg-1)' : 'var(--fg-2)',
          fontSize: '13px', fontWeight: view === k ? 600 : 500,
          cursor: 'pointer', fontFamily: 'inherit',
        }"
      >{{ l }}</button>
    </div>

    <!-- ═══════════════════════════════════════════════════════════
         VIEW: My Templates
    ════════════════════════════════════════════════════════════ -->
    <div v-if="view === 'templates'" style="max-width: 1100px; margin: 0 auto; padding: 28px 32px 80px">
      <div style="display: flex; align-items: flex-end; justify-content: space-between; margin-bottom: 24px">
        <div>
          <h1 style="font-size: 24px; font-weight: 700; margin-bottom: 6px; letter-spacing: -0.01em">Мои шаблоны</h1>
          <p style="font-size: 13px; color: var(--fg-2)">4 шаблона подключены к таблицам · 585 документов сгенерировано</p>
        </div>
        <NButton variant="secondary" size="md" @click="view = 'library'">
          <NIcon name="plus" :size="14" />Из библиотеки
        </NButton>
      </div>

      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px">
        <div
          v-for="t in MY_TEMPLATES" :key="t.id"
          style="background: var(--bg-0); border: 0.5px solid var(--border-default); border-radius: 10px; padding: 18px; display: flex; gap: 16px; transition: box-shadow 160ms"
          @mouseenter="e => e.currentTarget.style.boxShadow = 'var(--shadow-2)'"
          @mouseleave="e => e.currentTarget.style.boxShadow = 'none'"
        >
          <!-- Mini doc icon -->
          <div style="width: 56px; height: 72px; background: linear-gradient(180deg,#fff 0%,var(--neutral-100) 100%); border: 0.5px solid var(--border-default); border-radius: 3px; position: relative; flex-shrink: 0">
            <div style="position: absolute; inset: 6px 5px; display: flex; flex-direction: column; gap: 2.5px">
              <div style="height: 2px; background: #cfc8eb; width: 70%; margin: 0 auto 3px"></div>
              <div v-for="w in [100,88,95,70,90,60]" :key="w" :style="{ height: '1.5px', background: '#ddd', width: `${w}%` }"></div>
            </div>
          </div>
          <div style="flex: 1; min-width: 0; display: flex; flex-direction: column">
            <div style="display: flex; align-items: flex-start; gap: 8px">
              <div style="font-size: 14px; font-weight: 600; flex: 1; line-height: 1.3">{{ t.name }}</div>
              <NBadge v-if="t.status === 'ready'" tone="success" :dot="true">готов</NBadge>
              <NBadge v-else tone="warning" :dot="true">{{ t.fields - t.bound }} поля</NBadge>
            </div>
            <div style="font-size: 10px; color: var(--fg-3); font-family: var(--font-mono); margin-top: 3px">{{ t.gost }}</div>
            <div style="display: flex; align-items: center; gap: 8px; margin-top: 8px; font-size: 11px; color: var(--fg-2)">
              <span style="display: inline-flex; align-items: center; gap: 4px"><NIcon name="table" :size="11" color="var(--fg-3)" />{{ t.table }}</span>
              <span style="color: var(--fg-3)">·</span>
              <span>{{ t.bound }}/{{ t.fields }} полей связано</span>
            </div>
            <div style="flex: 1"></div>
            <div style="display: flex; align-items: center; gap: 8px; margin-top: 14px; padding-top: 12px; border-top: 0.5px solid var(--border-default)">
              <span style="font-size: 11px; color: var(--fg-3); flex: 1">{{ t.docs }}× · {{ t.last }}</span>
              <NButton variant="ghost" size="sm" @click="openEditor(t)">
                <NIcon name="sliders" :size="12" />Настроить
              </NButton>
              <NButton variant="primary" size="sm" :disabled="t.status !== 'ready'" @click="openGenerate(t)">
                <NIcon name="file" :size="12" color="#fff" />Сгенерировать
              </NButton>
            </div>
          </div>
        </div>
      </div>

      <!-- CTA banner -->
      <div style="margin-top: 24px; padding: 20px; background: var(--brand-tint); border: 0.5px solid var(--purple-200); border-radius: 10px; display: flex; align-items: center; gap: 16px">
        <div style="width: 40px; height: 40px; border-radius: 8px; background: var(--brand-primary); color: #fff; display: grid; place-items: center; flex-shrink: 0">
          <NIcon name="plus" :size="20" color="#fff" />
        </div>
        <div style="flex: 1">
          <div style="font-size: 14px; font-weight: 600; margin-bottom: 2px">Нужен другой документ?</div>
          <div style="font-size: 12px; color: var(--fg-2)">Возьми из библиотеки 47 шаблонов под ГОСТ или загрузи свой .docx — Nerion разметит поля автоматически.</div>
        </div>
        <NButton variant="secondary" size="md" @click="show('Загрузка .docx — скоро')">Загрузить .docx</NButton>
        <NButton variant="primary" size="md" @click="view = 'library'">Открыть библиотеку</NButton>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════════════════════
         VIEW: Library
    ════════════════════════════════════════════════════════════ -->
    <div v-else-if="view === 'library'" style="max-width: 1100px; margin: 0 auto; padding: 28px 32px 80px">
      <button @click="view = 'templates'" style="background: 0; border: 0; color: var(--fg-3); font-size: 12px; cursor: pointer; display: flex; align-items: center; gap: 6px; margin-bottom: 14px; padding: 0; font-family: inherit">
        <NIcon name="arrow" :size="12" style="transform: rotate(180deg)" />К моим шаблонам
      </button>
      <h1 style="font-size: 24px; font-weight: 700; margin-bottom: 8px; letter-spacing: -0.01em">Библиотека шаблонов</h1>
      <p style="font-size: 13px; color: var(--fg-2); margin-bottom: 22px; max-width: 560px; line-height: 1.5">47 шаблонов под российские нормативы. Зелёный значок — официальный документ, принимаемый регуляторами.</p>

      <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 20px; flex-wrap: wrap">
        <div style="position: relative">
          <NIcon name="search" :size="14" color="var(--fg-3)" style="position: absolute; left: 10px; top: 50%; transform: translateY(-50%)" />
          <input v-model="libSearch" placeholder="Поиск по библиотеке…" style="height: 36px; width: 280px; padding: 0 12px 0 32px; border: 0.5px solid var(--border-strong); border-radius: 6px; background: var(--bg-0); font-size: 13px; outline: 0; font-family: inherit" />
        </div>
        <div style="display: flex; gap: 6px">
          <button
            v-for="c in LIB_CATS" :key="c.id"
            @click="libCat = c.id"
            :style="{
              padding: '6px 12px', borderRadius: '999px', fontSize: '12px', cursor: 'pointer',
              border: '0.5px solid var(--border-default)',
              background: libCat === c.id ? 'var(--fg-1)' : 'var(--bg-0)',
              color: libCat === c.id ? 'var(--bg-0)' : 'var(--fg-2)',
              fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '5px',
            }"
          >{{ c.label }} <span style="opacity: .6">{{ c.count }}</span></button>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px">
        <div
          v-for="(t, i) in filteredLib" :key="i"
          style="background: var(--bg-0); border: 0.5px solid var(--border-default); border-radius: 10px; overflow: hidden; transition: all 160ms"
          @mouseenter="e => { e.currentTarget.style.boxShadow = 'var(--shadow-2)'; e.currentTarget.style.transform = 'translateY(-2px)'; }"
          @mouseleave="e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; }"
        >
          <div style="background: linear-gradient(180deg,var(--neutral-100),var(--neutral-200)); padding: 18px; display: grid; place-items: center; border-bottom: 0.5px solid var(--border-default)">
            <div style="width: 72px; height: 94px; background: linear-gradient(180deg,#fff 0%,var(--neutral-100) 100%); border: 0.5px solid var(--border-default); border-radius: 3px; position: relative">
              <div style="position: absolute; inset: 8px 6px; display: flex; flex-direction: column; gap: 3px">
                <div style="height: 2.5px; background: #cfc8eb; width: 70%; margin: 0 auto 4px"></div>
                <div v-for="w in [100,88,95,70,90,60]" :key="w" :style="{ height: '2px', background: '#ddd', width: `${w}%` }"></div>
              </div>
            </div>
          </div>
          <div style="padding: 14px">
            <div style="display: flex; align-items: flex-start; gap: 6px; margin-bottom: 4px">
              <div style="font-size: 13px; font-weight: 600; flex: 1; line-height: 1.3">{{ t.name }}</div>
              <div v-if="t.official" style="width: 14px; height: 14px; border-radius: 50%; background: var(--green-100); color: var(--green-700); display: grid; place-items: center; flex-shrink: 0">
                <NIcon name="check" :size="9" color="var(--green-700)" />
              </div>
            </div>
            <div style="font-size: 10px; color: var(--fg-3); font-family: var(--font-mono); margin-bottom: 6px">{{ t.gost }}</div>
            <div style="font-size: 12px; color: var(--fg-2); line-height: 1.4; margin-bottom: 10px; min-height: 32px">{{ t.desc }}</div>
            <NButton variant="primary" size="sm" style="width: 100%" @click="show('Шаблон добавлен в мои')">Взять за основу</NButton>
          </div>
        </div>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════════════════════
         VIEW: Editor (field mapping + live preview)
    ════════════════════════════════════════════════════════════ -->
    <div v-else-if="view === 'editor'" style="display: flex; flex-direction: column; height: calc(100vh - 56px)">
      <!-- Toolbar -->
      <div style="height: 46px; background: var(--bg-0); border-bottom: 0.5px solid var(--border-default); display: flex; align-items: center; padding: 0 20px; gap: 14px; font-size: 12px; flex-shrink: 0">
        <button @click="view = 'templates'" style="background: 0; border: 0; color: var(--fg-2); font-size: 12px; cursor: pointer; display: flex; align-items: center; gap: 5px; padding: 0; font-family: inherit">
          <NIcon name="arrow" :size="12" style="transform: rotate(180deg)" />Шаблоны
        </button>
        <div style="width: 1px; height: 16px; background: var(--border-default)"></div>
        <div style="display: flex; align-items: center; gap: 6px; color: var(--fg-2)">
          <NIcon name="file" :size="12" color="var(--fg-3)" />
          <select style="background: 0; border: 0; color: var(--fg-1); font-size: 12px; font-family: inherit; outline: 0; cursor: pointer">
            <option>A4 · 210×297</option><option>A5</option>
          </select>
        </div>
        <div style="width: 1px; height: 16px; background: var(--border-default)"></div>
        <span style="color: var(--fg-2)">Шрифт <span style="color: var(--fg-1)">PT Serif · 12pt</span></span>
        <div style="width: 1px; height: 16px; background: var(--border-default)"></div>
        <span style="color: var(--fg-2)">Поля <span style="font-family: var(--font-mono); color: var(--fg-1)">2 / 2.5 см</span></span>
        <NButton variant="ghost" size="sm">
          <NIcon name="users" :size="12" />Подписант: Архипов Г. И.
        </NButton>
        <div style="flex: 1"></div>
        <NButton variant="ghost" size="sm">
          <NIcon name="check" :size="12" color="var(--green-600)" />Сохранено
        </NButton>
        <NButton variant="primary" size="sm" @click="openGenerate(activeTpl)">Сгенерировать →</NButton>
      </div>

      <div style="display: grid; grid-template-columns: 440px 1fr; flex: 1; min-height: 0">
        <!-- Left: field mapping -->
        <aside style="background: var(--bg-0); border-right: 0.5px solid var(--border-default); display: flex; flex-direction: column; overflow: hidden">
          <!-- Banner -->
          <div v-if="showBanner" style="background: linear-gradient(90deg,var(--brand-tint),#F8F4FF); border-bottom: 0.5px solid var(--purple-200); padding: 12px 18px; display: flex; align-items: flex-start; gap: 10px">
            <div style="width: 22px; height: 22px; border-radius: 50%; background: var(--brand-primary); display: grid; place-items: center; flex-shrink: 0; margin-top: 1px">
              <NIcon name="check" :size="11" color="#fff" />
            </div>
            <div style="flex: 1; font-size: 12px; color: var(--fg-1); line-height: 1.45">
              Nerion распознал <strong>7 из 8 полей</strong> и связал их с таблицей «Преподаватели». Поле <strong>«Подписант»</strong> нужно выбрать вручную.
            </div>
            <button @click="showBanner = false" style="background: 0; border: 0; color: var(--fg-3); cursor: pointer; padding: 2px">
              <NIcon name="x" :size="12" />
            </button>
          </div>

          <div style="padding: 14px 18px 8px; display: flex; align-items: center; justify-content: space-between">
            <div style="font-size: 11px; color: var(--fg-3); text-transform: uppercase; letter-spacing: 0.06em; font-weight: 600">Поля документа</div>
            <span :style="{ fontSize: '11px', color: unbound ? 'var(--amber-600)' : 'var(--green-600)', display: 'flex', alignItems: 'center', gap: '5px' }">
              <span :style="{ width: '6px', height: '6px', borderRadius: '50%', background: unbound ? 'var(--amber-500)' : 'var(--green-500)' }"></span>
              {{ boundCount }}/{{ mapping.length }} связано
            </span>
          </div>

          <div style="flex: 1; overflow: auto; padding: 4px 14px 20px; display: flex; flex-direction: column; gap: 8px">
            <div
              v-for="(m, i) in mapping" :key="m.ph"
              :style="{
                background: !m.field ? 'var(--amber-50)' : 'var(--bg-1)',
                border: `0.5px solid ${!m.field ? '#FDE68A' : 'var(--border-default)'}`,
                borderRadius: '8px', padding: '10px 12px',
              }"
            >
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px">
                <NIcon v-if="!m.field" name="warn" :size="12" color="var(--amber-600)" />
                <span style="font-size: 12px; font-weight: 600; flex: 1">{{ m.label }}</span>
                <code style="font-size: 10px; background: var(--bg-2); color: var(--fg-2); padding: 1px 6px; border-radius: 3px">{{ phLabel(m.ph) }}</code>
              </div>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px">
                <select
                  :value="m.table && m.field ? `${m.table}::${m.field}` : ''"
                  @change="onBindChange(i, $event.target.value)"
                  :style="{
                    height: '30px', borderRadius: '5px',
                    border: `0.5px solid ${!m.field ? '#F59E0B' : 'var(--border-strong)'}`,
                    padding: '0 8px', fontSize: '12px', background: 'var(--bg-0)',
                    color: !m.field ? 'var(--amber-700)' : 'var(--fg-1)',
                    outline: 0, fontFamily: 'inherit',
                  }"
                >
                  <option value="">— не связано —</option>
                  <optgroup v-for="(fields, tbl) in BIND_TABLES" :key="tbl" :label="tbl">
                    <option v-for="f in fields" :key="f" :value="`${tbl}::${f}`">{{ f }}</option>
                  </optgroup>
                </select>
                <select
                  :value="m.fmt"
                  @change="setMapRow(i, { fmt: $event.target.value })"
                  style="height: 30px; border-radius: 5px; border: 0.5px solid var(--border-strong); padding: 0 8px; font-size: 12px; background: var(--bg-0); color: var(--fg-2); outline: 0; font-family: inherit"
                >
                  <option v-for="f in PDF_FORMATS" :key="f" :value="f">{{ f === '—' ? 'без формата' : f }}</option>
                </select>
              </div>
              <div v-if="m.field" style="font-size: 11px; color: var(--fg-3); margin-top: 7px; display: flex; align-items: center; gap: 5px">
                <NIcon name="arrow" :size="10" color="var(--green-500)" />
                <span style="font-family: var(--font-mono)">{{ m.sample }}</span>
              </div>
            </div>
            <button @click="show('Поле добавлено')" style="padding: 9px 12px; background: transparent; border: 0.5px dashed var(--border-strong); border-radius: 6px; color: var(--fg-2); font-size: 12px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; font-family: inherit">
              <NIcon name="plus" :size="11" />Добавить поле
            </button>
          </div>
        </aside>

        <!-- Right: live ГОСТ preview -->
        <section style="background: var(--neutral-200); display: flex; flex-direction: column; overflow: hidden">
          <div style="height: 40px; background: var(--bg-0); border-bottom: 0.5px solid var(--border-default); display: flex; align-items: center; padding: 0 16px; gap: 10px; font-size: 12px; flex-shrink: 0">
            <span style="color: var(--fg-3)">Превью на:</span>
            <select v-model="previewRec" style="background: var(--bg-1); border: 0.5px solid var(--border-default); border-radius: 4px; padding: 3px 8px; font-size: 12px; color: var(--fg-1); outline: 0; font-family: inherit; cursor: pointer">
              <option v-for="(r, i) in RECORDS" :key="r" :value="r">{{ r }}{{ i === 0 ? ' (1/14)' : '' }}</option>
            </select>
            <div style="flex: 1"></div>
            <button @click="zoom = Math.max(50, zoom - 8)" style="background: 0; border: 0; cursor: pointer; color: var(--fg-2); font-size: 14px; padding: 4px">−</button>
            <span style="font-size: 11px; color: var(--fg-2); font-family: var(--font-mono); min-width: 34px; text-align: center">{{ zoom }}%</span>
            <button @click="zoom = Math.min(140, zoom + 8)" style="background: 0; border: 0; cursor: pointer; color: var(--fg-2); font-size: 14px; padding: 4px">+</button>
            <div style="width: 1px; height: 16px; background: var(--border-default); margin: 0 4px"></div>
            <span style="display: flex; align-items: center; gap: 5px; font-size: 11px; color: var(--fg-3)">
              <span style="width: 6px; height: 6px; border-radius: 50%; background: var(--green-500)"></span>Live
            </span>
          </div>
          <div style="flex: 1; overflow: auto; display: grid; place-items: start center; padding: 28px">
            <!-- SpravkaDoc inline at scale -->
            <div :style="{
              width: `${560 * zoom / 100}px`,
              background: '#fff',
              boxShadow: '0 8px 28px rgba(0,0,0,.10)',
              padding: `${70 * zoom / 100}px ${58 * zoom / 100}px ${56 * zoom / 100}px`,
              fontFamily: '\'Times New Roman\', Georgia, serif',
              fontSize: `${14 * zoom / 100}px`,
              lineHeight: 1.55,
              color: '#1a1a1a',
              boxSizing: 'border-box',
            }">
              <div style="display: flex; align-items: flex-start; gap: 16px; margin-bottom: 20px">
                <div :style="{ width: `${52 * zoom / 100}px`, height: `${52 * zoom / 100}px`, borderRadius: '50%', border: '1px solid #1a1a1a', display: 'grid', placeItems: 'center', fontSize: `${8 * zoom / 100}px`, textAlign: 'center', lineHeight: 1.2, color: '#444', flexShrink: 0 }">МГУ<br/>1755</div>
                <div style="flex: 1; text-align: center">
                  <div :style="{ fontWeight: 700, fontSize: `${12.5 * zoom / 100}px`, letterSpacing: '0.04em' }">МИНОБРНАУКИ РОССИИ</div>
                  <div :style="{ fontSize: `${12 * zoom / 100}px`, fontWeight: 700, marginTop: `${2 * zoom / 100}px` }">МГУ им. М.В. Ломоносова</div>
                  <div :style="{ fontSize: `${10.5 * zoom / 100}px`, marginTop: `${2 * zoom / 100}px` }">Механико-математический факультет</div>
                  <div :style="{ fontSize: `${9 * zoom / 100}px`, marginTop: `${4 * zoom / 100}px`, color: '#666' }">Ленинские горы, д. 1, Москва, 119991</div>
                </div>
              </div>
              <div style="border-top: 0.5px solid #1a1a1a; margin-bottom: 22px"></div>
              <div :style="{ display: 'flex', justifyContent: 'space-between', marginBottom: `${28 * zoom / 100}px`, fontSize: `${12.5 * zoom / 100}px` }">
                <span>«15»&nbsp;сентября&nbsp;2025 г. № <span style="background: #FFFAEB; padding: 0 2px; border-radius: 2px">184/2025</span></span>
                <span style="text-align: right">По месту требования</span>
              </div>
              <div :style="{ textAlign: 'center', fontSize: `${16 * zoom / 100}px`, fontWeight: 700, letterSpacing: '0.1em', marginBottom: `${24 * zoom / 100}px` }">СПРАВКА</div>
              <div :style="{ textIndent: `${28 * zoom / 100}px`, textAlign: 'justify', marginBottom: `${14 * zoom / 100}px` }">
                Настоящая справка выдана <span style="background: #FFFAEB; padding: 0 2px; border-radius: 2px"><u>{{ spravkaData(previewRec).datelny }} {{ spravkaData(previewRec).init }}</u></span> в том, что он(а) работает в МГУ им. М.В. Ломоносова на механико-математическом факультете в должности <span style="background: #FFFAEB; padding: 0 2px; border-radius: 2px"><u>профессора</u></span> кафедры <span style="background: #FFFAEB; padding: 0 2px; border-radius: 2px"><u>математического анализа</u></span> с <span style="background: #FFFAEB; padding: 0 2px; border-radius: 2px"><u>1 сентября 2008 года</u></span> по настоящее время.
              </div>
              <div :style="{ textIndent: `${28 * zoom / 100}px`, textAlign: 'justify', marginBottom: `${14 * zoom / 100}px` }">
                Ставка: <span style="background: #FFFAEB; padding: 0 2px; border-radius: 2px"><u>полная</u></span>. Имеет учёную степень доктора физико-математических наук.
              </div>
              <div :style="{ textIndent: `${28 * zoom / 100}px`, textAlign: 'justify', marginBottom: `${48 * zoom / 100}px` }">
                Справка выдана <span style="background: #FFFAEB; padding: 0 2px; border-radius: 2px"><u>15 сентября 2025 г.</u></span> для предъявления по месту требования.
              </div>
              <div :style="{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: `${50 * zoom / 100}px` }">
                <div>
                  <div>Декан факультета</div>
                  <div :style="{ marginTop: `${16 * zoom / 100}px`, display: 'flex', alignItems: 'center', gap: `${8 * zoom / 100}px` }">
                    <span :style="{ borderBottom: '0.5px solid #1a1a1a', display: 'inline-block', width: `${90 * zoom / 100}px` }"></span>
                    <span :style="{ fontSize: `${12 * zoom / 100}px` }">Г. И. Архипов</span>
                  </div>
                </div>
                <div :style="{ width: `${72 * zoom / 100}px`, height: `${72 * zoom / 100}px`, borderRadius: '50%', border: '1.5px dashed #c0c0c0', display: 'grid', placeItems: 'center', fontSize: `${9 * zoom / 100}px`, color: '#999', letterSpacing: '0.08em' }">М.П.</div>
              </div>
            </div>
          </div>
          <div style="height: 26px; border-top: 0.5px solid var(--border-default); background: var(--bg-0); display: flex; align-items: center; justify-content: space-between; padding: 0 16px; font-size: 11px; color: var(--fg-3); flex-shrink: 0">
            <span>Стр. 1 / 1 · 142 КБ · подсветка = подставленные поля</span>
            <span>обновлено 0.3 с назад</span>
          </div>
        </section>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════════════════════
         VIEW: Generate
    ════════════════════════════════════════════════════════════ -->
    <div v-else-if="view === 'generate'" style="display: grid; grid-template-columns: 420px 1fr; height: calc(100vh - 56px)">
      <!-- Form panel -->
      <div style="border-right: 0.5px solid var(--border-default); background: var(--bg-1); display: flex; flex-direction: column; overflow: hidden">
        <div style="padding: 18px 24px 14px; border-bottom: 0.5px solid var(--border-default); background: var(--bg-0)">
          <button @click="view = 'templates'" style="background: 0; border: 0; color: var(--fg-3); font-size: 12px; cursor: pointer; display: flex; align-items: center; gap: 6px; margin-bottom: 12px; padding: 0; font-family: inherit">
            <NIcon name="arrow" :size="12" style="transform: rotate(180deg)" />К шаблонам
          </button>
          <div style="display: flex; align-items: center; gap: 12px">
            <div style="width: 36px; height: 46px; background: linear-gradient(180deg,#fff 0%,var(--neutral-100) 100%); border: 0.5px solid var(--border-default); border-radius: 3px; flex-shrink: 0"></div>
            <div>
              <h1 style="font-size: 16px; font-weight: 700">{{ activeTpl?.name || 'Справка с места работы' }}</h1>
              <div style="font-size: 11px; color: var(--fg-3); font-family: var(--font-mono)">{{ activeTpl?.gost || 'ГОСТ Р 7.0.97-2016' }}</div>
            </div>
          </div>
        </div>

        <!-- Mode switch -->
        <div style="padding: 16px 24px 0">
          <div style="display: flex; gap: 4px; padding: 3px; background: var(--bg-2); border-radius: 8px">
            <button
              v-for="[k, l] in [['single','Одна запись'],['bulk','Вся таблица']]" :key="k"
              @click="genMode = k; genPhase = 'idle'"
              :style="{
                flex: 1, height: '32px', border: 0, borderRadius: '6px', cursor: 'pointer',
                fontSize: '13px', fontWeight: 500, fontFamily: 'inherit',
                background: genMode === k ? 'var(--bg-0)' : 'transparent',
                color: genMode === k ? 'var(--fg-1)' : 'var(--fg-2)',
                boxShadow: genMode === k ? 'var(--shadow-1)' : 'none',
                transition: 'all 120ms',
              }"
            >{{ l }}</button>
          </div>
        </div>

        <div style="flex: 1; overflow: auto; padding: 18px 24px">
          <!-- Single mode -->
          <template v-if="genMode === 'single'">
            <div style="font-size: 11px; color: var(--fg-3); text-transform: uppercase; letter-spacing: 0.06em; font-weight: 600; margin-bottom: 8px">Для кого</div>
            <select v-model="genRec" style="width: 100%; height: 36px; border-radius: 6px; border: 0.5px solid var(--border-strong); padding: 0 12px; font-size: 13px; background: var(--bg-0); color: var(--fg-1); outline: 0; font-family: inherit; margin-bottom: 20px">
              <option v-for="r in RECORDS" :key="r" :value="r">{{ r }}</option>
            </select>
            <div style="font-size: 11px; color: var(--fg-3); text-transform: uppercase; letter-spacing: 0.06em; font-weight: 600; margin-bottom: 8px">Ручные поля</div>
            <div style="background: var(--bg-0); border: 0.5px solid var(--border-default); border-radius: 8px; padding: 4px 14px; margin-bottom: 16px">
              <div v-for="([lbl, val, editable], i) in [['Номер документа', genNum, true], ['Дата выдачи', '15.09.2025', false], ['Кому адресовано', 'По месту требования', false]]" :key="lbl"
                :style="{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: '10px', alignItems: 'center', padding: '9px 0', borderBottom: i < 2 ? '0.5px solid var(--border-default)' : '0' }"
              >
                <span style="font-size: 12px; color: var(--fg-3)">{{ lbl }}</span>
                <input v-if="editable" v-model="genNum" :style="{ height: '28px', border: '0.5px solid var(--border-strong)', borderRadius: '4px', padding: '0 8px', fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--fg-1)', background: 'var(--bg-0)', outline: 0 }" />
                <span v-else style="font-size: 12px; font-family: var(--font-mono); color: var(--fg-1)">{{ val }}</span>
              </div>
            </div>
            <div style="display: flex; align-items: center; gap: 8px; padding: 10px 12px; background: var(--brand-tint); border-radius: 6px; font-size: 12px; color: var(--purple-700)">
              <NIcon name="check" :size="13" color="var(--green-600)" />Все обязательные поля заполнены
            </div>
          </template>

          <!-- Bulk mode -->
          <template v-else>
            <div style="font-size: 11px; color: var(--fg-3); text-transform: uppercase; letter-spacing: 0.06em; font-weight: 600; margin-bottom: 8px">Источник</div>
            <div style="background: var(--bg-0); border: 0.5px solid var(--border-default); border-radius: 8px; padding: 14px; margin-bottom: 16px; display: flex; align-items: center; gap: 12px">
              <div style="width: 36px; height: 36px; border-radius: 8px; background: var(--brand-tint); color: var(--purple-600); display: grid; place-items: center; flex-shrink: 0">
                <NIcon name="table" :size="18" />
              </div>
              <div style="flex: 1">
                <div style="font-size: 13px; font-weight: 600">Преподаватели</div>
                <div style="font-size: 11px; color: var(--fg-3)">14 записей · 1 неактивная исключена</div>
              </div>
              <NBadge tone="brand">14 PDF</NBadge>
            </div>
            <div style="font-size: 11px; color: var(--fg-3); text-transform: uppercase; letter-spacing: 0.06em; font-weight: 600; margin-bottom: 8px">Фильтр</div>
            <div style="display: flex; gap: 6px; margin-bottom: 16px; flex-wrap: wrap">
              <NBadge tone="neutral" :dot="true">Активен · да</NBadge>
              <button style="padding: 3px 8px; border-radius: 999px; font-size: 11px; border: 0.5px dashed var(--border-strong); background: transparent; color: var(--fg-3); cursor: pointer; font-family: inherit">+ условие</button>
            </div>
            <div style="font-size: 11px; color: var(--fg-3); text-transform: uppercase; letter-spacing: 0.06em; font-weight: 600; margin-bottom: 8px">Имя файла</div>
            <div style="display: flex; align-items: center; height: 36px; border: 0.5px solid var(--border-strong); border-radius: 6px; overflow: hidden; font-family: var(--font-mono); font-size: 12px; margin-bottom: 16px">
              <span style="padding: 0 8px; background: var(--bg-2); color: var(--fg-3); height: 100%; display: flex; align-items: center">Справка_</span>
              <span style="padding: 0 4px; background: var(--brand-tint); color: var(--purple-700); margin: 0 2px; border-radius: 3px; font-size: 11px">{{ FILE_MASK }}</span>
              <span style="padding: 0 8px; color: var(--fg-3)">.pdf</span>
            </div>
            <div style="display: flex; align-items: center; gap: 8px; padding: 10px 12px; background: var(--brand-tint); border-radius: 6px; font-size: 12px; color: var(--purple-700)">
              <NIcon name="check" :size="13" color="var(--green-600)" />Будет создано 14 документов в один .zip
            </div>
          </template>
        </div>

        <!-- Footer action -->
        <div style="padding: 16px; border-top: 0.5px solid var(--border-default); background: var(--bg-0)">
          <div v-if="genPhase === 'idle'" style="display: flex; gap: 8px">
            <NButton v-if="genMode === 'single'" variant="ghost" size="md">
              <NIcon name="download" :size="13" />Печать
            </NButton>
            <NButton variant="primary" size="md" style="flex: 1" @click="startGenerate">
              <NIcon name="file" :size="13" color="#fff" />
              {{ genMode === 'single' ? 'Скачать PDF' : 'Сгенерировать 14 документов' }}
            </NButton>
          </div>
          <div v-else-if="genPhase === 'running'">
            <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 8px">
              <span style="color: var(--fg-2)">{{ genMode === 'bulk' ? `Генерация ${genDoneCount} / ${genTotal}…` : 'Рендер документа…' }}</span>
              <span style="font-family: var(--font-mono); color: var(--fg-1)">{{ genProgress }}%</span>
            </div>
            <div style="height: 6px; background: var(--bg-2); border-radius: 3px; overflow: hidden">
              <div :style="{ height: '100%', width: `${genProgress}%`, background: 'var(--brand-primary)', borderRadius: '3px', transition: 'width 80ms linear' }"></div>
            </div>
          </div>
          <div v-else>
            <div style="display: flex; align-items: center; gap: 10px; padding: 10px 12px; background: var(--green-50); border: 0.5px solid var(--green-100); border-radius: 6px; margin-bottom: 10px">
              <div style="width: 20px; height: 20px; border-radius: 50%; background: var(--green-500); display: grid; place-items: center; flex-shrink: 0">
                <NIcon name="check" :size="12" color="#fff" />
              </div>
              <span style="font-size: 12px; color: var(--green-700); font-weight: 500">{{ genMode === 'single' ? 'Документ готов и скачан.' : '14 документов готовы. Архив скачан.' }}</span>
            </div>
            <div style="display: flex; gap: 8px">
              <NButton variant="secondary" size="md" style="flex: 1" @click="genPhase = 'idle'">Ещё раз</NButton>
              <NButton variant="primary" size="md" style="flex: 1" @click="view = 'archive'">
                <NIcon name="file" :size="13" color="#fff" />В архив
              </NButton>
            </div>
          </div>
        </div>
      </div>

      <!-- Preview -->
      <div style="background: var(--neutral-200); display: flex; flex-direction: column; overflow: hidden">
        <div style="height: 40px; background: var(--bg-0); border-bottom: 0.5px solid var(--border-default); display: flex; align-items: center; padding: 0 20px; gap: 12px; font-size: 12px; flex-shrink: 0">
          <span style="font-weight: 500">Предпросмотр</span>
          <NBadge tone="success" :dot="true">свежий рендер</NBadge>
          <div style="flex: 1"></div>
          <span v-if="genMode === 'bulk'" style="font-size: 11px; color: var(--fg-3)">показан 1-й из 14</span>
        </div>
        <div style="flex: 1; overflow: auto; display: grid; place-items: start center; padding: 32px">
          <!-- Compact ГОСТ preview at 86% -->
          <div :style="{
            width: `${560 * 0.86}px`,
            background: '#fff',
            boxShadow: '0 8px 28px rgba(0,0,0,.10)',
            padding: `${70 * 0.86}px ${58 * 0.86}px ${56 * 0.86}px`,
            fontFamily: '\'Times New Roman\', Georgia, serif',
            fontSize: `${14 * 0.86}px`,
            lineHeight: 1.55,
            color: '#1a1a1a',
            boxSizing: 'border-box',
          }">
            <div style="display: flex; align-items: flex-start; gap: 13px; margin-bottom: 16px">
              <div style="width: 44px; height: 44px; border-radius: 50%; border: 1px solid #1a1a1a; display: grid; place-items: center; font-size: 6.5px; text-align: center; line-height: 1.2; color: #444; flex-shrink: 0">МГУ<br/>1755</div>
              <div style="flex: 1; text-align: center">
                <div style="font-weight: 700; font-size: 10.5px; letter-spacing: 0.04em">МИНОБРНАУКИ РОССИИ</div>
                <div style="font-size: 10px; font-weight: 700; margin-top: 1px">МГУ им. М.В. Ломоносова</div>
                <div style="font-size: 9px; margin-top: 1px">Механико-математический факультет</div>
              </div>
            </div>
            <div style="border-top: 0.5px solid #1a1a1a; margin-bottom: 18px"></div>
            <div style="text-align: center; font-size: 13.5px; font-weight: 700; letter-spacing: 0.1em; margin-bottom: 18px">СПРАВКА</div>
            <div style="text-indent: 24px; text-align: justify; margin-bottom: 11px; font-size: 12px">
              Настоящая справка выдана <u>{{ spravkaData(genMode === 'single' ? genRec : RECORDS[0]).datelny }} {{ spravkaData(genMode === 'single' ? genRec : RECORDS[0]).init }}</u> в том, что он(а) работает в МГУ им. М.В. Ломоносова в должности <u>профессора</u> кафедры <u>математического анализа</u>.
            </div>
            <div style="text-indent: 24px; text-align: justify; margin-bottom: 36px; font-size: 12px">
              Ставка: <u>полная</u>. Справка выдана <u>15 сентября 2025 г.</u> для предъявления по месту требования.
            </div>
            <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 36px; font-size: 12px">
              <div>
                <div>Декан факультета</div>
                <div style="margin-top: 12px; display: flex; align-items: center; gap: 6px">
                  <span style="border-bottom: 0.5px solid #1a1a1a; display: inline-block; width: 76px"></span>
                  <span style="font-size: 10px">Г. И. Архипов</span>
                </div>
              </div>
              <div style="width: 60px; height: 60px; border-radius: 50%; border: 1.5px dashed #c0c0c0; display: grid; place-items: center; font-size: 7px; color: #999; letter-spacing: 0.08em">М.П.</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════════════════════
         VIEW: Archive
    ════════════════════════════════════════════════════════════ -->
    <div v-else-if="view === 'archive'" style="max-width: 1000px; margin: 0 auto; padding: 28px 32px 80px">
      <h1 style="font-size: 24px; font-weight: 700; margin-bottom: 6px; letter-spacing: -0.01em">Архив документов</h1>
      <p style="font-size: 13px; color: var(--fg-2); margin-bottom: 22px">Все сгенерированные PDF хранятся 90 дней. Скачивай, делись по ссылке или генерируй заново.</p>

      <div style="position: relative; margin-bottom: 16px; max-width: 320px">
        <NIcon name="search" :size="14" color="var(--fg-3)" style="position: absolute; left: 10px; top: 50%; transform: translateY(-50%)" />
        <input v-model="archiveSearch" placeholder="Поиск по имени или записи…" style="height: 36px; width: 100%; padding: 0 12px 0 32px; border: 0.5px solid var(--border-strong); border-radius: 6px; background: var(--bg-0); font-size: 13px; outline: 0; font-family: inherit; box-sizing: border-box" />
      </div>

      <div style="background: var(--bg-0); border: 0.5px solid var(--border-default); border-radius: 8px; overflow: hidden">
        <div style="display: grid; grid-template-columns: 1fr 160px 180px 120px 80px 96px; padding: 0 16px; height: 36px; align-items: center; background: var(--bg-1); border-bottom: 0.5px solid var(--border-default); font-size: 10px; color: var(--fg-3); text-transform: uppercase; letter-spacing: 0.06em; font-weight: 600">
          <div>Документ</div><div>Шаблон</div><div>Запись</div><div>Создан</div><div style="text-align: right">Размер</div><div></div>
        </div>
        <div
          v-for="(a, i) in filteredArchive" :key="i"
          style="display: grid; grid-template-columns: 1fr 160px 180px 120px 80px 96px; padding: 12px 16px; align-items: center; border-top: 0.5px solid var(--border-default)"
        >
          <div style="display: flex; align-items: center; gap: 10px">
            <div :style="{
              width: '26px', height: '32px', borderRadius: '3px',
              background: a.kind === 'bulk' ? 'var(--amber-50)' : 'var(--red-50)',
              border: `0.5px solid ${a.kind === 'bulk' ? 'var(--amber-100)' : 'var(--red-100)'}`,
              display: 'grid', placeItems: 'center', flexShrink: 0,
            }">
              <span :style="{ fontSize: '7px', fontWeight: 700, color: a.kind === 'bulk' ? 'var(--amber-700)' : 'var(--red-600)', fontFamily: 'var(--font-mono)' }">{{ a.kind === 'bulk' ? 'ZIP' : 'PDF' }}</span>
            </div>
            <div style="min-width: 0">
              <div style="font-size: 13px; font-weight: 500; font-family: var(--font-mono); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 220px">{{ a.name }}</div>
              <div style="font-size: 11px; color: var(--fg-3)">{{ a.by }}</div>
            </div>
          </div>
          <div style="font-size: 13px; color: var(--fg-2)">{{ a.tpl }}</div>
          <div style="font-size: 13px; color: var(--fg-2)">{{ a.rec }}</div>
          <div style="font-size: 13px; color: var(--fg-2); white-space: nowrap">{{ a.date }}</div>
          <div style="text-align: right; font-family: var(--font-mono); font-size: 12px; color: var(--fg-2)">{{ a.size }}</div>
          <div style="display: flex; gap: 2px; justify-content: flex-end">
            <button @click="show('Скачивание начато')" style="background: 0; border: 0; padding: 5px; cursor: pointer; color: var(--fg-2); display: flex; border-radius: 4px">
              <NIcon name="download" :size="14" />
            </button>
            <button @click="show('Ссылка скопирована')" style="background: 0; border: 0; padding: 5px; cursor: pointer; color: var(--fg-2); display: flex; border-radius: 4px">
              <NIcon name="extlink" :size="14" />
            </button>
            <button style="background: 0; border: 0; padding: 5px; cursor: pointer; color: var(--fg-2); display: flex; border-radius: 4px">
              <NIcon name="more" :size="14" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </AppShell>

  <NToast v-if="toast" tone="success" :title="toast" @close="toast = null" />
</template>
