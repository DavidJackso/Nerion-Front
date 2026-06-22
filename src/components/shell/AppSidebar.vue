<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth.js'
import { useSpacesStore } from '@/stores/spaces.js'
import { useSchemaStore } from '@/stores/schema.js'
import NIcon from '@/components/primitives/NIcon.vue'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const spacesStore = useSpacesStore()
const schemaStore = useSchemaStore()

const slug = computed(() => route.params.slug)
const space = computed(() => spacesStore.spaces.find(s => s.slug === slug.value))

onMounted(async () => {
  if (!spacesStore.spaces.length) await spacesStore.fetchSpaces()
  if (slug.value) await schemaStore.fetchTables(slug.value)
})

watch(slug, async (val) => {
  if (val) await schemaStore.fetchTables(val)
})

function go(path) { router.push(path) }
function isActive(name) { return route.name === name }
function tableActive(t) { return route.name === 'table' && route.params.table === t.slug }

async function logout() {
  await auth.logout()
  router.push('/login')
}

const hovered = ref(null)
</script>

<template>
  <aside :style="{
    background: 'var(--bg-0)',
    borderRight: '0.5px solid var(--border-default)',
    padding: '12px 8px',
    display: 'flex',
    flexDirection: 'column',
    position: 'sticky',
    top: 0,
    height: '100vh',
    overflow: 'auto',
    boxSizing: 'border-box',
  }">
    <!-- Space switcher -->
    <div @click="go('/spaces')" :style="{
      display: 'flex', alignItems: 'center', gap: '8px',
      padding: '6px 10px 12px',
      cursor: 'pointer',
      borderBottom: '0.5px solid var(--border-default)',
      marginBottom: '4px',
    }">
      <div style="width: 26px; height: 26px; border-radius: 6px; background: var(--brand-primary); color: #fff; display: grid; place-items: center; font-weight: 700; font-size: 13px; flex-shrink: 0">N</div>
      <div style="display: flex; flex-direction: column; line-height: 1.2; overflow: hidden; flex: 1">
        <span style="font-size: 13px; font-weight: 600; color: var(--fg-1); white-space: nowrap; overflow: hidden; text-overflow: ellipsis">{{ space?.name || slug }}</span>
        <span style="font-size: 10px; color: var(--fg-3); font-family: var(--font-mono)">{{ slug }}</span>
      </div>
      <NIcon name="chevd" :size="12" color="var(--fg-3)" />
    </div>

    <!-- Tables section -->
    <div :style="{ fontSize: '10px', fontWeight: 600, color: 'var(--fg-3)', textTransform: 'uppercase', letterSpacing: '0.07em', padding: '14px 10px 5px' }">Таблицы</div>

    <div
      v-for="t in schemaStore.tables" :key="t.slug"
      @click="go(`/spaces/${slug}/tables/${t.slug}`)"
      @mouseenter="hovered = t.slug"
      @mouseleave="hovered = null"
      :style="{
        display: 'flex', alignItems: 'center', gap: '8px',
        height: '30px', padding: '0 10px',
        borderRadius: '6px', cursor: 'pointer', marginBottom: '1px',
        background: tableActive(t) ? 'var(--brand-tint)' : hovered === t.slug ? 'var(--bg-1)' : 'transparent',
        color: tableActive(t) ? 'var(--purple-700)' : 'var(--fg-1)',
        fontSize: '13px',
        fontWeight: tableActive(t) ? 500 : 400,
        transition: 'background 100ms',
      }"
    >
      <NIcon name="table" :size="14" :style="{ opacity: tableActive(t) ? 1 : 0.65 }" />
      <span style="flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap">{{ t.name }}</span>
    </div>

    <div
      v-if="schemaStore.loading && !schemaStore.tables.length"
      style="padding: 6px 10px; font-size: 12px; color: var(--fg-3)"
    >Загрузка…</div>

    <div
      @click="go(`/spaces/${slug}/schema/new`)"
      @mouseenter="hovered = '__new'"
      @mouseleave="hovered = null"
      :style="{
        display: 'flex', alignItems: 'center', gap: '8px',
        height: '30px', padding: '0 10px',
        borderRadius: '6px', cursor: 'pointer', marginBottom: '1px',
        background: isActive('schema-new') ? 'var(--brand-tint)' : hovered === '__new' ? 'var(--bg-1)' : 'transparent',
        color: isActive('schema-new') ? 'var(--purple-700)' : 'var(--fg-2)',
        fontSize: '13px',
        transition: 'background 100ms',
      }"
    >
      <NIcon name="plus" :size="14" :style="{ opacity: 0.65 }" />
      <span>Новая таблица</span>
    </div>

    <!-- Outputs section -->
    <div :style="{ fontSize: '10px', fontWeight: 600, color: 'var(--fg-3)', textTransform: 'uppercase', letterSpacing: '0.07em', padding: '14px 10px 5px' }">Выходы</div>

    <template v-for="item in [
      { icon: 'code', label: 'REST API', name: 'api-docs', path: `/spaces/${slug}/api/docs` },
      { icon: 'folder', label: 'Файлы', name: 'files', path: `/spaces/${slug}/files` },
      { icon: 'file', label: 'PDF', name: 'pdf', path: `/spaces/${slug}/pdf` },
    ]" :key="item.name">
      <div
        @click="go(item.path)"
        @mouseenter="hovered = item.name"
        @mouseleave="hovered = null"
        :style="{
          display: 'flex', alignItems: 'center', gap: '8px',
          height: '30px', padding: '0 10px',
          borderRadius: '6px', cursor: 'pointer', marginBottom: '1px',
          background: isActive(item.name) ? 'var(--brand-tint)' : hovered === item.name ? 'var(--bg-1)' : 'transparent',
          color: isActive(item.name) ? 'var(--purple-700)' : 'var(--fg-1)',
          fontSize: '13px',
          fontWeight: isActive(item.name) ? 500 : 400,
          transition: 'background 100ms',
        }"
      >
        <NIcon :name="item.icon" :size="14" :style="{ opacity: isActive(item.name) ? 1 : 0.65 }" />
        <span>{{ item.label }}</span>
      </div>
    </template>

    <!-- Space section -->
    <div :style="{ fontSize: '10px', fontWeight: 600, color: 'var(--fg-3)', textTransform: 'uppercase', letterSpacing: '0.07em', padding: '14px 10px 5px' }">Пространство</div>

    <template v-for="item in [
      { icon: 'users', label: 'Команда', name: 'team', path: `/spaces/${slug}/team` },
      { icon: 'settings', label: 'Настройки', name: 'settings', path: `/spaces/${slug}/settings` },
    ]" :key="item.name">
      <div
        @click="go(item.path)"
        @mouseenter="hovered = item.name"
        @mouseleave="hovered = null"
        :style="{
          display: 'flex', alignItems: 'center', gap: '8px',
          height: '30px', padding: '0 10px',
          borderRadius: '6px', cursor: 'pointer', marginBottom: '1px',
          background: isActive(item.name) ? 'var(--brand-tint)' : hovered === item.name ? 'var(--bg-1)' : 'transparent',
          color: isActive(item.name) ? 'var(--purple-700)' : 'var(--fg-1)',
          fontSize: '13px',
          fontWeight: isActive(item.name) ? 500 : 400,
          transition: 'background 100ms',
        }"
      >
        <NIcon :name="item.icon" :size="14" :style="{ opacity: isActive(item.name) ? 1 : 0.65 }" />
        <span>{{ item.label }}</span>
      </div>
    </template>

    <div style="flex: 1" />

    <!-- User footer -->
    <div style="border-top: 0.5px solid var(--border-default); display: flex; align-items: center; gap: 8px; padding: 10px 10px 4px">
      <div style="width: 24px; height: 24px; border-radius: 50%; background: var(--purple-200); color: var(--purple-700); display: grid; place-items: center; font-weight: 700; font-size: 11px; flex-shrink: 0">{{ auth.initials() }}</div>
      <div style="flex: 1; overflow: hidden">
        <div style="font-size: 12px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis">{{ auth.user?.name }}</div>
        <div style="font-size: 10px; color: var(--fg-3)">{{ auth.user?.role === 'admin' ? 'Администратор' : 'Участник' }}</div>
      </div>
      <div @click="logout" style="cursor: pointer; color: var(--fg-3); padding: 4px">
        <NIcon name="logout" :size="14" />
      </div>
    </div>
  </aside>
</template>
