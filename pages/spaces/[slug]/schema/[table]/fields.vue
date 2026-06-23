<script setup lang="ts">
import { useSchemaStore } from '~/stores/schema'
import { useSpacesStore } from '~/stores/spaces'
import { useSpaceSlug } from '~/composables/useSpaceSlug'

definePageMeta({ layout: 'app', middleware: [] })

interface FieldConfig {
  id?: string
  name: string
  slug: string
  type: string
  required: boolean
  enumValues?: string[]
  relation?: { cardinality: 'one' | 'many'; targetTable: string }
  _slugEdited?: boolean
  error?: string
}

const route = useRoute()
const router = useRouter()
const schemaStore = useSchemaStore()
const spacesStore = useSpacesStore()

const spaceSlug = computed(() => route.params.slug as string)
const tableSlug = computed(() => route.params.table as string)
const space = computed(() => spacesStore.spaces.find((s: any) => s.slug === spaceSlug.value))

const fields = ref<FieldConfig[]>([])
const loading = ref(false)
const saveLoading = ref(false)
const error = ref('')
const fieldErrors = ref<(string | null)[]>([])

const FIELD_SLUG_RE = /^[a-z][a-z0-9_-]{1,63}$/

const FIELD_TYPES: Record<string, string> = {
  text: 'Текст',
  longtext: 'Длинный текст',
  number: 'Число',
  date: 'Дата',
  datetime: 'Дата и время',
  boolean: 'Булево',
  enum: 'Перечисление',
  email: 'Email',
  phone: 'Телефон',
  url: 'URL',
  file: 'Файл',
  relation: 'Связь',
}

const fieldTypeOptions = computed(() =>
  Object.entries(FIELD_TYPES).map(([value, label]) => ({
    value,
    label,
    color: value === 'relation' ? 'var(--purple-700)' : undefined,
  }))
)

onMounted(async () => {
  loading.value = true
  try {
    await schemaStore.fetchTables(spaceSlug.value)
    const t = await schemaStore.fetchTable(spaceSlug.value, tableSlug.value)
    fields.value = (t.fields || []).map((f: any): FieldConfig => ({
      id: f.id,
      name: f.name,
      slug: f.slug,
      type: f.type,
      required: f.required,
      enumValues: f.enum_values || [],
      relation: f.relation_cardinality
        ? { cardinality: f.relation_cardinality, targetTable: f.relation_target || '' }
        : undefined,
    }))
  } catch (e: any) {
    error.value = e.message
  } finally {
    loading.value = false
  }
})

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9_-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^[^a-z]+/, '')
    .slice(0, 50)
}

function addField() {
  fields.value.push({ name: '', slug: '', type: 'text', required: false, enumValues: [] })
}

function addRelation() {
  fields.value.push({
    name: '',
    slug: '',
    type: 'relation',
    required: false,
    enumValues: [],
    relation: { cardinality: 'one', targetTable: '' },
  })
}

function del(i: number) {
  fields.value.splice(i, 1)
  fieldErrors.value.splice(i, 1)
}

function onNameInput(i: number, v: string) {
  fields.value[i].name = v
  if (!fields.value[i]._slugEdited) {
    fields.value[i].slug = slugify(v)
  }
  fieldErrors.value[i] = null
}

function onSlugInput(i: number, v: string) {
  fields.value[i].slug = v
  fields.value[i]._slugEdited = true
  fieldErrors.value[i] = null
}

function onTypeChange(i: number, v: string) {
  fields.value[i].type = v
  if (v === 'enum' && !fields.value[i].enumValues?.length) {
    fields.value[i].enumValues = []
  }
  if (v === 'relation' && !fields.value[i].relation) {
    fields.value[i].relation = { cardinality: 'one', targetTable: '' }
  }
}

function setEnumValues(i: number, raw: string) {
  fields.value[i].enumValues = raw.split(',').map((v) => v.trim()).filter(Boolean)
}

function setRelationCardinality(i: number, v: 'one' | 'many') {
  if (!fields.value[i].relation) {
    fields.value[i].relation = { cardinality: v, targetTable: '' }
  } else {
    fields.value[i].relation!.cardinality = v
  }
}

function setRelationTarget(i: number, v: string) {
  if (!fields.value[i].relation) {
    fields.value[i].relation = { cardinality: 'one', targetTable: v }
  } else {
    fields.value[i].relation!.targetTable = v
  }
}

const otherTables = computed(() =>
  schemaStore.tables
    .filter((t) => t.slug !== tableSlug.value)
    .map((t) => ({ value: t.slug, label: t.name }))
)

async function save() {
  error.value = ''
  fieldErrors.value = []

  const errs: (string | null)[] = fields.value.map((f) => {
    if (!f.name.trim()) return 'Введите имя поля'
    const s = f.slug || slugify(f.name)
    if (!s) return 'Не удалось создать slug из имени'
    if (!FIELD_SLUG_RE.test(s))
      return 'Slug: строчные лат. буквы, цифры, "-" или "_", начало — буква (2–64 символа)'
    return null
  })

  if (errs.some(Boolean)) {
    fieldErrors.value = errs
    error.value = 'Исправь ошибки в полях выше'
    return
  }

  saveLoading.value = true
  try {
    const payload = fields.value.map((f) => ({
      name: f.name,
      slug: f.slug || slugify(f.name),
      type: f.type,
      required: f.required,
      unique: false,
      enum_values: f.type === 'enum' ? (f.enumValues || []) : undefined,
      relation_cardinality:
        f.type === 'relation' ? (f.relation?.cardinality || 'one') : undefined,
      relation_target: f.type === 'relation' ? (f.relation?.targetTable || '') : undefined,
    }))
    await schemaStore.updateFields(spaceSlug.value, tableSlug.value, payload)
    await navigateTo(`/spaces/${spaceSlug.value}/tables/${tableSlug.value}`)
  } catch (e: any) {
    if (e.fields) {
      error.value = Object.entries(e.fields as Record<string, string>)
        .map(([k, v]) => `${k}: ${v}`)
        .join('\n')
    } else {
      error.value = e.message
    }
  } finally {
    saveLoading.value = false
  }
}
</script>

<template>
  <div style="max-width: 860px; margin: 0 auto; padding: 32px 32px 80px">
    <div style="margin-bottom: 24px">
      <div style="font-size: 11px; color: var(--fg-3); margin-bottom: 8px; font-family: var(--font-mono); text-transform: uppercase; letter-spacing: 0.06em">Шаг 2 / 2</div>
      <h1 style="font-size: 24px; font-weight: 700; margin-bottom: 6px; letter-spacing: -0.01em">
        Поля таблицы «{{ schemaStore.activeTable?.name || tableSlug }}»
      </h1>
      <p style="font-size: 13px; color: var(--fg-2)">Добавь и настрой поля. Связи ссылаются на другие таблицы.</p>
    </div>

    <div v-if="loading" style="text-align: center; padding: 32px; color: var(--fg-3)">Загрузка…</div>

    <template v-else>
      <div style="display: grid; grid-template-columns: 18px 1fr 140px 140px 80px 28px; gap: 10px; padding: 0 12px 8px; font-size: 10px; color: var(--fg-3); text-transform: uppercase; letter-spacing: 0.06em; font-weight: 600">
        <div /><div>Имя поля</div><div>Slug</div><div>Тип</div><div /><div />
      </div>

      <div style="display: flex; flex-direction: column; gap: 6px">
        <div
          v-for="(f, i) in fields"
          :key="i"
          :style="{
            padding: '8px 12px',
            background: fieldErrors[i] ? 'var(--red-50, #fef2f2)' : f.type === 'relation' ? 'var(--brand-tint)' : f.type === 'file' ? 'var(--bg-1)' : 'var(--bg-0)',
            border: `0.5px solid ${fieldErrors[i] ? 'var(--red-400, #f87171)' : f.type === 'relation' ? 'var(--purple-200)' : f.type === 'file' ? 'var(--border-strong)' : 'var(--border-default)'}`,
            borderRadius: '6px',
          }"
        >
          <div style="display: grid; grid-template-columns: 18px 1fr 140px 140px 80px 28px; gap: 10px; align-items: center">
            <NIcon name="drag" :size="13" color="var(--fg-3)" style="cursor: grab" />
            <input
              :value="f.name"
              @input="onNameInput(i, ($event.target as HTMLInputElement).value)"
              placeholder="Имя поля"
              :style="{
                height: '30px', padding: '0 10px', borderRadius: '6px',
                border: '0.5px solid var(--border-strong)',
                background: 'var(--bg-0)', color: 'var(--fg-1)',
                fontSize: '13px', outline: '0', fontFamily: 'inherit', boxSizing: 'border-box', width: '100%',
              }"
            />
            <input
              :value="f.slug"
              @input="onSlugInput(i, ($event.target as HTMLInputElement).value)"
              placeholder="slug"
              :style="{
                height: '30px', padding: '0 10px', borderRadius: '6px',
                border: '0.5px solid var(--border-strong)',
                background: 'var(--bg-0)', color: 'var(--fg-2)',
                fontSize: '12px', outline: '0', fontFamily: 'var(--font-mono)', boxSizing: 'border-box', width: '100%',
              }"
            />
            <NSelect
              :model-value="f.type"
              @update:model-value="onTypeChange(i, $event)"
              size="sm"
              :options="fieldTypeOptions"
            />
            <div style="display: flex; align-items: center; gap: 6px">
              <NToggle :model-value="f.required" @update:model-value="fields[i].required = $event" />
              <span style="font-size: 11px; color: var(--fg-3)">обяз.</span>
            </div>
            <button
              @click="del(i)"
              style="background: 0; border: 0; cursor: pointer; color: var(--fg-3); padding: 2px; display: flex"
            >
              <NIcon name="x" :size="14" />
            </button>
          </div>

          <!-- Per-field error -->
          <div
            v-if="fieldErrors[i]"
            style="margin-top: 6px; margin-left: 28px; font-size: 12px; color: var(--red-600, #dc2626)"
          >
            {{ fieldErrors[i] }}
          </div>

          <!-- Enum values config -->
          <div
            v-if="f.type === 'enum'"
            style="margin-top: 8px; margin-left: 28px; padding: 8px 10px; background: var(--bg-0); border: 0.5px solid var(--border-strong); border-radius: 6px"
          >
            <div style="font-size: 12px; color: var(--fg-2); font-weight: 500; margin-bottom: 6px">Значения (через запятую)</div>
            <input
              :value="(f.enumValues || []).join(', ')"
              @input="setEnumValues(i, ($event.target as HTMLInputElement).value)"
              placeholder="Значение 1, Значение 2, …"
              :style="{
                height: '30px', padding: '0 10px', borderRadius: '6px',
                border: '0.5px solid var(--border-strong)',
                background: 'var(--bg-0)', color: 'var(--fg-1)',
                fontSize: '13px', outline: '0', fontFamily: 'inherit', boxSizing: 'border-box', width: '100%',
              }"
            />
          </div>

          <!-- Relation config -->
          <div
            v-if="f.type === 'relation'"
            style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap; row-gap: 8px; margin-top: 8px; margin-left: 28px; padding: 8px 10px; background: var(--bg-0); border: 0.5px solid var(--purple-200); border-radius: 6px"
          >
            <span style="font-size: 12px; color: var(--purple-700); font-weight: 500; white-space: nowrap">↔ Ссылается на</span>
            <NSelect
              :model-value="f.relation?.targetTable || ''"
              @update:model-value="setRelationTarget(i, $event)"
              size="sm"
              :options="otherTables"
              placeholder="Выбери таблицу"
              style="min-width: 160px"
            />
            <div style="display: flex; gap: 2px; padding: 2px; background: var(--bg-2); border-radius: 6px">
              <button
                v-for="[v, l] in ([['one', 'одно значение'], ['many', 'список']] as [string, string][])"
                :key="v"
                @click="setRelationCardinality(i, v as 'one' | 'many')"
                :style="{
                  height: '24px', padding: '0 10px', border: '0', borderRadius: '4px', cursor: 'pointer',
                  fontSize: '11px', fontWeight: '500', fontFamily: 'inherit',
                  background: f.relation?.cardinality === v ? 'var(--bg-0)' : 'transparent',
                  color: f.relation?.cardinality === v ? 'var(--purple-700)' : 'var(--fg-3)',
                  boxShadow: f.relation?.cardinality === v ? 'var(--shadow-1)' : 'none',
                }"
              >{{ l }}</button>
            </div>
          </div>
        </div>
      </div>

      <div style="display: flex; gap: 8px; margin-top: 12px">
        <button
          @click="addField"
          style="flex: 1; padding: 10px 14px; background: transparent; border: 0.5px dashed var(--border-strong); border-radius: 6px; color: var(--fg-2); font-size: 13px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; font-family: inherit"
        >
          <NIcon name="plus" :size="14" />Добавить поле
        </button>
        <button
          @click="addRelation"
          style="flex: 1; padding: 10px 14px; background: var(--brand-tint); border: 0.5px dashed var(--purple-300); border-radius: 6px; color: var(--purple-700); font-size: 13px; font-weight: 500; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; font-family: inherit"
        >
          ↔ Добавить связь
        </button>
      </div>

      <pre
        v-if="error"
        style="color: var(--red-600, #dc2626); font-size: 13px; margin-top: 12px; white-space: pre-wrap; font-family: inherit; margin-bottom: 0"
      >{{ error }}</pre>

      <div style="margin-top: 32px; display: flex; justify-content: space-between">
        <NButton variant="ghost" size="md" @click="navigateTo(`/spaces/${spaceSlug}/schema/new`)">← Назад</NButton>
        <NButton variant="primary" size="md" :disabled="saveLoading" @click="save">
          {{ saveLoading ? 'Сохранение…' : 'Создать таблицу' }}
        </NButton>
      </div>
    </template>
  </div>
</template>
