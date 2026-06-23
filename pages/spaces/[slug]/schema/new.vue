<script setup lang="ts">
import { useSchemaStore } from '~/stores/schema'
import { useSpacesStore } from '~/stores/spaces'

definePageMeta({ layout: 'app', middleware: 'auth' })

const route = useRoute()
const router = useRouter()
const schemaStore = useSchemaStore()
const spacesStore = useSpacesStore()

const spaceSlug = computed(() => route.params.slug as string)
const space = computed(() => spacesStore.spaces.find((s: any) => s.slug === spaceSlug.value))

const picked = ref<string | null>(null)
const tableName = ref('')
const tableSlugInput = ref('')
const error = ref('')
const loading = ref(false)

onMounted(async () => {
  await schemaStore.fetchTemplates()
})

function pick(t: { id: string; name: string }) {
  picked.value = t.id
  if (t.id !== 'blank') {
    tableName.value = t.name
    tableSlugInput.value = t.id
  }
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .slice(0, 50)
}

function onNameInput(v: string) {
  tableName.value = v
  tableSlugInput.value = slugify(v)
}

async function proceed() {
  if (loading.value) return
  error.value = ''
  if (!tableName.value.trim()) {
    error.value = 'Введи название таблицы'
    return
  }
  loading.value = true
  try {
    const t = await schemaStore.createTable(
      spaceSlug.value,
      tableName.value.trim(),
      tableSlugInput.value || slugify(tableName.value),
      picked.value && picked.value !== 'blank' ? picked.value : undefined,
    )
    await navigateTo(`/spaces/${spaceSlug.value}/schema/${t.slug}/fields`)
  } catch (e: any) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div style="max-width: 860px; margin: 0 auto; padding: 40px 32px 80px">
    <div style="margin-bottom: 32px">
      <div style="font-size: 11px; color: var(--fg-3); margin-bottom: 8px; font-family: var(--font-mono); text-transform: uppercase; letter-spacing: 0.06em">Шаг 1 / 2</div>
      <h1 style="font-size: 26px; font-weight: 700; margin-bottom: 8px; letter-spacing: -0.02em">С чего начнём?</h1>
      <p style="font-size: 14px; color: var(--fg-2)">Выбери шаблон с готовыми полями или начни с пустой таблицы.</p>
    </div>

    <div v-if="schemaStore.loading" style="text-align: center; padding: 32px; color: var(--fg-3)">Загрузка шаблонов…</div>

    <div v-else style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 28px">
      <!-- Backend templates -->
      <div
        v-for="t in schemaStore.templates"
        :key="t.id"
        @click="pick(t)"
        :style="{
          background: 'var(--bg-0)',
          border: `${picked === t.id ? 1.5 : 0.5}px solid ${picked === t.id ? 'var(--brand-primary)' : 'var(--border-default)'}`,
          borderRadius: '12px', padding: '18px', cursor: 'pointer',
          boxShadow: picked === t.id ? 'var(--shadow-2)' : 'var(--shadow-1)',
          transition: 'all 140ms', position: 'relative',
        }"
      >
        <div :style="{
          width: '36px', height: '36px', borderRadius: '8px',
          background: picked === t.id ? 'var(--brand-tint)' : 'var(--bg-1)',
          display: 'grid', placeItems: 'center', marginBottom: '14px',
          color: picked === t.id ? 'var(--purple-600)' : 'var(--fg-3)',
        }">
          <NIcon name="table" :size="18" />
        </div>
        <div style="font-size: 14px; font-weight: 600; margin-bottom: 4px">{{ t.name }}</div>
        <div style="font-size: 12px; color: var(--fg-2); line-height: 1.45; margin-bottom: 10px; min-height: 34px">{{ t.description }}</div>
      </div>

      <!-- Blank option -->
      <div
        @click="pick({ id: 'blank', name: '' })"
        :style="{
          background: 'var(--bg-0)',
          border: `${picked === 'blank' ? 1.5 : 0.5}px solid ${picked === 'blank' ? 'var(--brand-primary)' : 'var(--border-default)'}`,
          borderRadius: '12px', padding: '18px', cursor: 'pointer',
          boxShadow: picked === 'blank' ? 'var(--shadow-2)' : 'var(--shadow-1)',
          transition: 'all 140ms',
        }"
      >
        <div :style="{
          width: '36px', height: '36px', borderRadius: '8px',
          background: picked === 'blank' ? 'var(--brand-tint)' : 'var(--bg-1)',
          display: 'grid', placeItems: 'center', marginBottom: '14px',
          color: picked === 'blank' ? 'var(--purple-600)' : 'var(--fg-3)',
        }">
          <NIcon name="plus" :size="18" />
        </div>
        <div style="font-size: 14px; font-weight: 600; margin-bottom: 4px">С нуля</div>
        <div style="font-size: 12px; color: var(--fg-2); line-height: 1.45; margin-bottom: 10px; min-height: 34px">Пустая таблица — определи поля сам</div>
      </div>
    </div>

    <div style="background: var(--bg-0); border: 0.5px solid var(--border-default); border-radius: 10px; padding: 20px; display: flex; flex-direction: column; gap: 14px">
      <div style="display: flex; gap: 16px; align-items: flex-end">
        <div style="flex: 1">
          <label style="font-size: 12px; color: var(--fg-2); font-weight: 500; display: block; margin-bottom: 6px">Название таблицы</label>
          <NInput :model-value="tableName" @update:model-value="onNameInput" placeholder="Например: Преподаватели" />
        </div>
        <div style="flex: 1">
          <label style="font-size: 12px; color: var(--fg-2); font-weight: 500; display: block; margin-bottom: 6px">Slug</label>
          <NInput v-model="tableSlugInput" placeholder="teachers" style="font-family: var(--font-mono)" />
        </div>
        <NButton variant="primary" size="md" :disabled="!tableName || loading" @click="proceed">
          {{ loading ? 'Создание…' : 'Настроить поля →' }}
        </NButton>
      </div>
      <p v-if="error" style="color: var(--red-600, #dc2626); font-size: 13px; margin: 0">{{ error }}</p>
    </div>
  </div>
</template>
