<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useSchemaStore } from '@/stores/schema.js'
import * as pdfApi from '@/api/pdf.js'
import { useSpaceSlug } from '@/composables/useSpaceSlug.js'
import { useToast } from '@/composables/useToast.js'
import { fmtDate } from '@/utils/fmt.js'
import AppShell from '@/components/shell/AppShell.vue'
import NButton from '@/components/primitives/NButton.vue'
import NIcon from '@/components/primitives/NIcon.vue'
import NBadge from '@/components/primitives/NBadge.vue'
import NToast from '@/components/primitives/NToast.vue'
import NModal from '@/components/primitives/NModal.vue'
import NInput from '@/components/primitives/NInput.vue'
import NSelect from '@/components/primitives/NSelect.vue'
import { LIB_CATS, LIB_TPLS, PDF_FORMATS, BIND_TABLES, INITIAL_MAPPING } from '@/data/mock.js'

const { slug, space } = useSpaceSlug()
const { toast, show } = useToast()
const schemaStore = useSchemaStore()

// ── View state ─────────────────────────────────────────────────
const view = ref('templates') // templates | library | editor | generate | archive
const activeTpl = ref(null)

// Real templates & archive
const templates = ref([])
const archive = ref([])
const templatesLoading = ref(false)
const archiveLoading = ref(false)

// Upload template modal
const showUpload = ref(false)
const uploadName = ref('')
const uploadFile = ref(null)
const uploadLoading = ref(false)
const uploadError = ref('')

// Library state
const libCat = ref('all')
const libSearch = ref('')

// Editor state
const mapping = ref(INITIAL_MAPPING.map(m => ({ ...m })))
const zoom = ref(78)
const showBanner = ref(true)
const pdfSize = ref('a4')

// Generate state
const genTableSlug = ref('')
const genRecordIds = ref('')
const genPhase = ref('idle') // idle | running | done | error
const genProgress = ref(0)
const genJobId = ref(null)
let genPollTimer = null

const bindOptions = computed(() =>
  Object.entries(BIND_TABLES).map(([tbl, fields]) => ({
    group: tbl,
    items: fields.map(f => ({ value: `${tbl}::${f}`, label: f })),
  }))
)

// Archive state
const archiveSearch = ref('')

onMounted(async () => {
  templatesLoading.value = true
  try {
    await Promise.all([
      pdfApi.listTemplates(slug.value).then(r => { templates.value = r }),
      schemaStore.fetchTables(slug.value),
    ])
  } catch (e) {
    show(e.message)
  } finally {
    templatesLoading.value = false
  }
})

watch(view, async (v) => {
  if (v === 'archive' && !archive.value.length) {
    archiveLoading.value = true
    try { archive.value = await pdfApi.listArchive(slug.value) }
    catch (e) { show(e.message) }
    finally { archiveLoading.value = false }
  }
})

const FILE_MASK = '{{ФИО}}'
function phLabel(ph) { return '{' + '{' + ph + '}' + '}' }

// ── Computed ───────────────────────────────────────────────────
const breadcrumb = computed(() => {
  const map = {
    templates: ['PDF', 'Мои шаблоны'],
    library:   ['PDF', 'Библиотека'],
    archive:   ['PDF', 'Архив'],
    editor:    ['PDF', activeTpl.value?.Name || 'Шаблон', 'Настройка'],
    generate:  ['PDF', activeTpl.value?.Name || 'Шаблон', 'Генерация'],
  }
  return [space.value?.name || slug.value, ...(map[view.value] || [])]
})

const isDeep = computed(() => view.value === 'editor' || view.value === 'generate')

const filteredLib = computed(() =>
  LIB_TPLS.filter(t => (libCat.value === 'all' || t.cat === libCat.value) && (!libSearch.value || t.name.toLowerCase().includes(libSearch.value.toLowerCase())))
)

const boundCount = computed(() => mapping.value.filter(m => m.field).length)
const unbound = computed(() => mapping.value.length - boundCount.value)

const filteredArchive = computed(() =>
  archive.value.filter(a => !archiveSearch.value || String(a.ID).includes(archiveSearch.value))
)

const genTotal = computed(() => {
  const ids = genRecordIds.value.split(',').map(s => s.trim()).filter(Boolean)
  return ids.length || 1
})

// ── Methods ────────────────────────────────────────────────────
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
  genJobId.value = null
  clearInterval(genPollTimer)
  view.value = 'generate'
}

async function saveMapping() {
  try {
    await pdfApi.saveMapping(slug.value, activeTpl.value.ID, mapping.value.map(m => ({
      placeholder: m.ph,
      expression: m.field ? `${m.table}::${m.field}` : undefined,
    })))
    show('Маппинг сохранён')
  } catch (e) {
    show(e.message)
  }
}

async function startGenerate() {
  const recordIds = genRecordIds.value.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n))
  if (!genTableSlug.value) { show('Выбери таблицу'); return }
  genPhase.value = 'running'
  genProgress.value = 0
  try {
    const job = await pdfApi.generatePDF(slug.value, {
      template_id: activeTpl.value.ID,
      table_slug: genTableSlug.value,
      record_ids: recordIds,
    })
    genJobId.value = job.ID
    pollJob()
  } catch (e) {
    genPhase.value = 'error'
    show(e.message)
  }
}

function pollJob() {
  clearInterval(genPollTimer)
  genPollTimer = setInterval(async () => {
    try {
      const job = await pdfApi.getJob(slug.value, genJobId.value)
      if (job.TotalRecords && job.TotalRecords > 0) {
        genProgress.value = Math.round((job.Processed / job.TotalRecords) * 100)
      }
      if (job.Status === 'done') {
        clearInterval(genPollTimer)
        genProgress.value = 100
        genPhase.value = 'done'
        archive.value = []
      } else if (job.Status === 'error') {
        clearInterval(genPollTimer)
        genPhase.value = 'error'
        show('Ошибка генерации')
      }
    } catch (e) {
      clearInterval(genPollTimer)
      genPhase.value = 'error'
    }
  }, 1500)
}

function onUploadFileChange(e) {
  uploadFile.value = e.target.files[0] || null
  if (!uploadName.value && uploadFile.value) {
    uploadName.value = uploadFile.value.name.replace(/\.pdf$/i, '')
  }
}

async function doUploadTemplate() {
  uploadError.value = ''
  if (!uploadName.value.trim()) { uploadError.value = 'Введи название'; return }
  if (!uploadFile.value) { uploadError.value = 'Выбери PDF файл'; return }
  uploadLoading.value = true
  try {
    const tpl = await pdfApi.uploadTemplate(slug.value, uploadName.value.trim(), uploadFile.value)
    templates.value = [...templates.value, tpl]
    showUpload.value = false
    uploadName.value = ''
    uploadFile.value = null
    show('Шаблон загружен')
  } catch (e) {
    uploadError.value = e.message
  } finally {
    uploadLoading.value = false
  }
}

function tplStatus(t) { return t.Status === 'ready' ? 'ready' : 'setup' }
function tplStatusLabel(t) { return t.Status === 'ready' ? 'Готов' : 'Настройка' }
function tplStatusTone(t) { return t.Status === 'ready' ? 'success' : 'warning' }

function archiveName(a) {
  return a.StoragePath ? a.StoragePath.split('/').pop() : `job_${a.ID}`
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
          <p style="font-size: 13px; color: var(--fg-2)">{{ templates.length }} шаблонов · {{ templates.filter(t => t.Status === 'ready').length }} готовы</p>
        </div>
        <div style="display: flex; gap: 8px">
          <NButton variant="ghost" size="md" @click="showUpload = true">
            <NIcon name="plus" :size="14" />Загрузить PDF
          </NButton>
          <NButton variant="secondary" size="md" @click="view = 'library'">
            <NIcon name="plus" :size="14" />Из библиотеки
          </NButton>
        </div>
      </div>

      <div v-if="templatesLoading" style="text-align: center; padding: 48px 0; color: var(--fg-3); font-size: 14px">Загрузка…</div>

      <div v-else style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px">
        <div
          v-for="t in templates" :key="t.ID"
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
              <div style="font-size: 14px; font-weight: 600; flex: 1; line-height: 1.3">{{ t.Name }}</div>
              <NBadge :tone="tplStatusTone(t)" :dot="true">{{ tplStatusLabel(t) }}</NBadge>
            </div>
            <div style="display: flex; align-items: center; gap: 8px; margin-top: 8px; font-size: 11px; color: var(--fg-2)">
              <span>{{ t.Placeholders?.length || 0 }} полей</span>
            </div>
            <div style="flex: 1"></div>
            <div style="display: flex; align-items: center; gap: 8px; margin-top: 14px; padding-top: 12px; border-top: 0.5px solid var(--border-default)">
              <span style="font-size: 11px; color: var(--fg-3); flex: 1">{{ fmtDate(t.CreatedAt) }}</span>
              <NButton variant="ghost" size="sm" @click="openEditor(t)">
                <NIcon name="sliders" :size="12" />Настроить
              </NButton>
              <NButton variant="primary" size="sm" :disabled="tplStatus(t) !== 'ready'" @click="openGenerate(t)">
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
          <div style="font-size: 12px; color: var(--fg-2)">Возьми из библиотеки 47 шаблонов под ГОСТ или загрузи свой PDF — Nerion разметит поля автоматически.</div>
        </div>
        <NButton variant="secondary" size="md" @click="showUpload = true">Загрузить PDF</NButton>
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
          <NSelect
            v-model="pdfSize"
            size="sm"
            style="width: 120px"
            :options="[{value:'a4',label:'A4 · 210×297'},{value:'a5',label:'A5'}]"
          />
        </div>
        <div style="width: 1px; height: 16px; background: var(--border-default)"></div>
        <span style="color: var(--fg-2)">Шрифт <span style="color: var(--fg-1)">PT Serif · 12pt</span></span>
        <div style="width: 1px; height: 16px; background: var(--border-default)"></div>
        <span style="color: var(--fg-2)">Поля <span style="font-family: var(--font-mono); color: var(--fg-1)">2 / 2.5 см</span></span>
        <NButton variant="ghost" size="sm">
          <NIcon name="users" :size="12" />Подписант: Архипов Г. И.
        </NButton>
        <div style="flex: 1"></div>
        <NButton variant="ghost" size="sm" @click="saveMapping">
          <NIcon name="check" :size="12" color="var(--green-600)" />Сохранить
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
                <NSelect
                  :model-value="m.table && m.field ? `${m.table}::${m.field}` : ''"
                  @update:model-value="onBindChange(i, $event)"
                  size="sm"
                  placeholder="— не связано —"
                  :options="bindOptions"
                  :style="{ borderColor: !m.field ? '#F59E0B' : undefined }"
                />
                <NSelect
                  :model-value="m.fmt"
                  @update:model-value="setMapRow(i, { fmt: $event })"
                  size="sm"
                  :options="PDF_FORMATS.map(f => ({ value: f, label: f === '—' ? 'без формата' : f }))"
                />
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
            <!-- Preview placeholder -->
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
                Настоящая справка выдана <span style="background: #FFFAEB; padding: 0 2px; border-radius: 2px"><u>сотруднику</u></span> в том, что он(а) работает в МГУ им. М.В. Ломоносова на механико-математическом факультете в должности <span style="background: #FFFAEB; padding: 0 2px; border-radius: 2px"><u>профессора</u></span> кафедры <span style="background: #FFFAEB; padding: 0 2px; border-radius: 2px"><u>математического анализа</u></span>.
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
            <span>Стр. 1 / 1 · подсветка = подставленные поля</span>
            <span>{{ activeTpl?.Name || '' }}</span>
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
              <h1 style="font-size: 16px; font-weight: 700">{{ activeTpl?.Name || 'Шаблон' }}</h1>
            </div>
          </div>
        </div>

        <div style="flex: 1; overflow: auto; padding: 18px 24px">
          <div style="font-size: 11px; color: var(--fg-3); text-transform: uppercase; letter-spacing: 0.06em; font-weight: 600; margin-bottom: 8px">Таблица</div>
          <NSelect
            v-model="genTableSlug"
            placeholder="— выбери таблицу —"
            :options="schemaStore.tables.map(t => ({ value: t.slug, label: t.name || t.slug }))"
            style="margin-bottom: 20px"
          />

          <div style="font-size: 11px; color: var(--fg-3); text-transform: uppercase; letter-spacing: 0.06em; font-weight: 600; margin-bottom: 8px">ID записей (через запятую)</div>
          <textarea
            v-model="genRecordIds"
            placeholder="1, 2, 3"
            style="width: 100%; min-height: 80px; border-radius: 6px; border: 0.5px solid var(--border-strong); padding: 8px 12px; font-size: 13px; background: var(--bg-0); color: var(--fg-1); outline: 0; font-family: var(--font-mono); resize: vertical; box-sizing: border-box; margin-bottom: 16px"
          ></textarea>

          <div v-if="genTableSlug && genRecordIds.trim()" style="display: flex; align-items: center; gap: 8px; padding: 10px 12px; background: var(--brand-tint); border-radius: 6px; font-size: 12px; color: var(--purple-700)">
            <NIcon name="check" :size="13" color="var(--green-600)" />Будет создано {{ genTotal }} документов
          </div>
        </div>

        <!-- Footer action -->
        <div style="padding: 16px; border-top: 0.5px solid var(--border-default); background: var(--bg-0)">
          <div v-if="genPhase === 'idle'" style="display: flex; gap: 8px">
            <NButton variant="primary" size="md" style="flex: 1" @click="startGenerate">
              <NIcon name="file" :size="13" color="#fff" />
              Сгенерировать
            </NButton>
          </div>
          <div v-else-if="genPhase === 'running'">
            <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 8px">
              <span style="color: var(--fg-2)">Генерация…</span>
              <span style="font-family: var(--font-mono); color: var(--fg-1)">{{ genProgress }}%</span>
            </div>
            <div style="height: 6px; background: var(--bg-2); border-radius: 3px; overflow: hidden">
              <div :style="{ height: '100%', width: `${genProgress}%`, background: 'var(--brand-primary)', borderRadius: '3px', transition: 'width 80ms linear' }"></div>
            </div>
          </div>
          <div v-else-if="genPhase === 'done'">
            <div style="display: flex; align-items: center; gap: 10px; padding: 10px 12px; background: var(--green-50); border: 0.5px solid var(--green-100); border-radius: 6px; margin-bottom: 10px">
              <div style="width: 20px; height: 20px; border-radius: 50%; background: var(--green-500); display: grid; place-items: center; flex-shrink: 0">
                <NIcon name="check" :size="12" color="#fff" />
              </div>
              <span style="font-size: 12px; color: var(--green-700); font-weight: 500">Документы готовы.</span>
            </div>
            <div style="display: flex; gap: 8px">
              <NButton variant="secondary" size="md" style="flex: 1" @click="genPhase = 'idle'">Ещё раз</NButton>
              <NButton variant="primary" size="md" style="flex: 1" @click="view = 'archive'">
                <NIcon name="file" :size="13" color="#fff" />В архив
              </NButton>
            </div>
          </div>
          <div v-else-if="genPhase === 'error'">
            <div style="display: flex; align-items: center; gap: 10px; padding: 10px 12px; background: var(--red-50); border: 0.5px solid var(--red-100); border-radius: 6px; margin-bottom: 10px">
              <span style="font-size: 12px; color: var(--red-700); font-weight: 500">Ошибка генерации.</span>
            </div>
            <NButton variant="secondary" size="md" style="width: 100%" @click="genPhase = 'idle'">Повторить</NButton>
          </div>
        </div>
      </div>

      <!-- Preview -->
      <div style="background: var(--neutral-200); display: flex; flex-direction: column; overflow: hidden">
        <div style="height: 40px; background: var(--bg-0); border-bottom: 0.5px solid var(--border-default); display: flex; align-items: center; padding: 0 20px; gap: 12px; font-size: 12px; flex-shrink: 0">
          <span style="font-weight: 500">Предпросмотр</span>
          <NBadge tone="success" :dot="true">свежий рендер</NBadge>
          <div style="flex: 1"></div>
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
              Настоящая справка выдана сотруднику в том, что он(а) работает в МГУ им. М.В. Ломоносова в должности <u>профессора</u> кафедры <u>математического анализа</u>.
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
        <input v-model="archiveSearch" placeholder="Поиск по ID задачи…" style="height: 36px; width: 100%; padding: 0 12px 0 32px; border: 0.5px solid var(--border-strong); border-radius: 6px; background: var(--bg-0); font-size: 13px; outline: 0; font-family: inherit; box-sizing: border-box" />
      </div>

      <div v-if="archiveLoading" style="text-align: center; padding: 48px 0; color: var(--fg-3); font-size: 14px">Загрузка…</div>

      <div v-else style="background: var(--bg-0); border: 0.5px solid var(--border-default); border-radius: 8px; overflow: hidden">
        <div style="display: grid; grid-template-columns: 1fr 160px 160px 120px 96px; padding: 0 16px; height: 36px; align-items: center; background: var(--bg-1); border-bottom: 0.5px solid var(--border-default); font-size: 10px; color: var(--fg-3); text-transform: uppercase; letter-spacing: 0.06em; font-weight: 600">
          <div>Файл</div><div>Статус</div><div>Записей</div><div>Создан</div><div></div>
        </div>
        <div
          v-for="(a, i) in filteredArchive" :key="a.ID"
          style="display: grid; grid-template-columns: 1fr 160px 160px 120px 96px; padding: 12px 16px; align-items: center; border-top: 0.5px solid var(--border-default)"
        >
          <div style="display: flex; align-items: center; gap: 10px">
            <div style="width: 26px; height: 32px; border-radius: 3px; background: var(--red-50); border: 0.5px solid var(--red-100); display: grid; place-items: center; flex-shrink: 0">
              <span style="font-size: 7px; font-weight: 700; color: var(--red-600); font-family: var(--font-mono)">PDF</span>
            </div>
            <div style="min-width: 0">
              <div style="font-size: 13px; font-weight: 500; font-family: var(--font-mono); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 220px">{{ archiveName(a) }}</div>
            </div>
          </div>
          <div style="font-size: 13px; color: var(--fg-2)">
            <NBadge :tone="a.Status === 'done' ? 'success' : a.Status === 'error' ? 'danger' : 'neutral'" :dot="true">{{ a.Status }}</NBadge>
          </div>
          <div style="font-size: 13px; color: var(--fg-2)">{{ a.Processed }} записей</div>
          <div style="font-size: 13px; color: var(--fg-2); white-space: nowrap">{{ fmtDate(a.CreatedAt) }}</div>
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

  <NModal :open="showUpload" @close="showUpload = false; uploadError = ''" title="Загрузить PDF-шаблон" :width="440">
    <div style="display:flex;flex-direction:column;gap:14px">
      <div>
        <label style="font-size:12px;color:var(--fg-2);font-weight:500;display:block;margin-bottom:6px">Название</label>
        <NInput v-model="uploadName" placeholder="Справка с места работы" />
      </div>
      <div>
        <label style="font-size:12px;color:var(--fg-2);font-weight:500;display:block;margin-bottom:6px">PDF файл</label>
        <input type="file" accept=".pdf" @change="onUploadFileChange" style="font-size:13px;color:var(--fg-1)" />
      </div>
      <p v-if="uploadError" style="color:var(--red-600,#dc2626);font-size:13px;margin:0">{{ uploadError }}</p>
    </div>
    <template #footer>
      <NButton variant="ghost" size="md" @click="showUpload = false; uploadError = ''">Отмена</NButton>
      <NButton variant="primary" size="md" :disabled="uploadLoading" @click="doUploadTemplate">
        {{ uploadLoading ? 'Загрузка…' : 'Загрузить' }}
      </NButton>
    </template>
  </NModal>

  <NToast v-if="toast" tone="success" :title="toast" @close="toast = null" />
</template>
