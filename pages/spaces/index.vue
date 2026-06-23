<script setup lang="ts">
import { useSpacesStore } from '~/stores/spaces'
import { useAuthStore } from '~/stores/auth'

definePageMeta({ layout: 'default', middleware: [] })

const spacesStore = useSpacesStore()
const auth = useAuthStore()
const showCreate = ref(false)
const newName = ref('')
const newSlug = ref('')
const hovered = ref<string | null>(null)
const error = ref('')

onMounted(() => spacesStore.fetchSpaces())

function openSpace(s: { slug: string }) {
  navigateTo(`/spaces/${s.slug}/tables`)
}

async function createSpace() {
  error.value = ''
  try {
    const sp = await spacesStore.createSpace(newName.value, newSlug.value)
    showCreate.value = false
    newName.value = ''
    newSlug.value = ''
    navigateTo(`/spaces/${sp.slug}/tables`)
  } catch (e: any) {
    error.value = e.message
  }
}

function logout() {
  auth.logout().then(() => navigateTo('/login'))
}

const PALETTE = [
  { color: 'var(--purple-100)', fg: 'var(--purple-700)' },
  { color: '#FFE4E6', fg: '#9F1239' },
  { color: '#DBEAFE', fg: '#1E40AF' },
  { color: '#D1FAE5', fg: 'var(--green-700)' },
]
function palette(i: number) { return PALETTE[i % PALETTE.length] }
</script>

<template>
  <div style="min-height: 100vh; background: var(--bg-1)">
    <header style="height: 56px; background: var(--bg-0); border-bottom: 0.5px solid var(--border-default); display: flex; align-items: center; padding: 0 32px; gap: 14px">
      <div style="width: 26px; height: 26px; border-radius: 6px; background: var(--brand-primary); color: #fff; display: grid; place-items: center; font-weight: 700; font-size: 13px">N</div>
      <span style="font-size: 14px; font-weight: 700; letter-spacing: -0.01em">Nerion</span>
      <div style="flex: 1" />
      <span style="font-size: 13px; color: var(--fg-2)">{{ auth.user?.email }}</span>
      <div style="width: 28px; height: 28px; border-radius: 50%; background: var(--purple-200); color: var(--purple-700); display: grid; place-items: center; font-weight: 700; font-size: 12px">{{ auth.initials() }}</div>
      <button @click="logout" style="background: 0; border: 0; cursor: pointer; color: var(--fg-3); padding: 6px; display: flex">
        <NIcon name="logout" :size="14" />
      </button>
    </header>

    <main style="max-width: 960px; margin: 0 auto; padding: 48px 32px">
      <div style="display: flex; align-items: flex-end; justify-content: space-between; margin-bottom: 32px">
        <div>
          <h1 style="font-size: 28px; font-weight: 700; margin-bottom: 6px; letter-spacing: -0.02em">Пространства</h1>
          <p style="font-size: 14px; color: var(--fg-2)">Каждое пространство — изолированная база с API и командой.</p>
        </div>
        <NButton variant="primary" size="md" @click="showCreate = true">
          <NIcon name="plus" :size="14" color="#fff" />
          Новое пространство
        </NButton>
      </div>

      <div v-if="spacesStore.loading" style="text-align: center; padding: 64px; color: var(--fg-3); font-size: 14px">Загрузка…</div>

      <div v-else-if="!spacesStore.spaces.length" style="text-align: center; padding: 64px; color: var(--fg-3)">
        <div style="font-size: 14px; font-weight: 600; margin-bottom: 8px">Нет пространств</div>
        <div style="font-size: 13px">Создай первое пространство, чтобы начать работу.</div>
      </div>

      <div v-else style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px">
        <div
          v-for="(s, i) in spacesStore.spaces" :key="s.id"
          @click="openSpace(s)"
          @mouseenter="hovered = s.id"
          @mouseleave="hovered = null"
          :style="{
            background: 'var(--bg-0)',
            border: '0.5px solid var(--border-default)',
            borderRadius: '12px', padding: '24px', cursor: 'pointer',
            boxShadow: hovered === s.id ? 'var(--shadow-2)' : 'var(--shadow-1)',
            transition: 'box-shadow 180ms, transform 120ms',
            transform: hovered === s.id ? 'translateY(-2px)' : 'none',
          }"
        >
          <div style="display: flex; align-items: center; gap: 14px; margin-bottom: 16px">
            <div :style="{
              width: '44px', height: '44px', borderRadius: '10px',
              background: palette(i).color, color: palette(i).fg,
              display: 'grid', placeItems: 'center', flexShrink: '0',
            }">
              <NIcon name="box" :size="20" />
            </div>
            <div style="flex: 1; min-width: 0">
              <div style="font-size: 15px; font-weight: 600; color: var(--fg-1); margin-bottom: 4px">{{ s.name }}</div>
              <span style="display: inline-block; padding: 2px 8px; border-radius: 4px; background: var(--bg-2); font-family: var(--font-mono); font-size: 12px; color: var(--fg-1)">{{ s.slug }}</span>
            </div>
            <NIcon name="chev" :size="14" color="var(--fg-3)" :style="{ opacity: hovered === s.id ? 1 : 0, transition: 'opacity 120ms' }" />
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; padding-top: 14px; border-top: 0.5px solid var(--border-default)">
            <div>
              <div style="font-size: 18px; font-weight: 600; font-variant-numeric: tabular-nums">{{ s.table_count }}</div>
              <div style="font-size: 11px; color: var(--fg-3)">таблиц</div>
            </div>
            <div>
              <div style="font-size: 13px; font-weight: 500; color: var(--fg-2)">ID {{ s.id }}</div>
              <div style="font-size: 11px; color: var(--fg-3)">пространство</div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <NModal :open="showCreate" @close="showCreate = false" title="Новое пространство" subtitle="Изолированная база с собственным API и командой.">
      <div style="display: flex; flex-direction: column; gap: 18px">
        <div>
          <label style="font-size: 12px; color: var(--fg-2); font-weight: 500; display: block; margin-bottom: 6px">Название</label>
          <NInput v-model="newName" placeholder="Кафедра математики" />
          <p style="font-size: 11px; color: var(--fg-3); margin-top: 5px">Видно только команде. Можно изменить позже.</p>
        </div>
        <div>
          <label style="font-size: 12px; color: var(--fg-2); font-weight: 500; display: block; margin-bottom: 6px">Slug</label>
          <div style="display: flex; align-items: center; height: 36px; border: 0.5px solid var(--border-strong); border-radius: 6px; overflow: hidden; font-family: var(--font-mono); font-size: 13px">
            <span style="padding: 0 10px; background: var(--bg-2); color: var(--fg-3); height: 100%; display: flex; align-items: center; border-right: 0.5px solid var(--border-default); white-space: nowrap">app.nerion.ru/</span>
            <input v-model="newSlug" style="flex: 1; height: 100%; padding: 0 10px; border: 0; outline: 0; font-family: inherit; font-size: 13px; color: var(--fg-1); background: transparent" placeholder="my-space" />
          </div>
          <p style="font-size: 11px; color: var(--fg-3); margin-top: 5px">Используется в URL API. a–z, 0–9, дефис.</p>
        </div>
        <p v-if="error" style="color: var(--red-600, #dc2626); font-size: 13px; margin: 0">{{ error }}</p>
      </div>
      <template #footer>
        <NButton variant="ghost" size="md" @click="showCreate = false">Отмена</NButton>
        <NButton variant="primary" size="md" @click="createSpace">Создать пространство</NButton>
      </template>
    </NModal>
  </div>
</template>
