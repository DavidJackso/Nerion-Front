<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { useSpacesStore } from '~/stores/spaces'
import { useSchemaStore } from '~/stores/schema'

const route = useRoute()
const router = useRouter()

const auth = useAuthStore()
const spacesStore = useSpacesStore()
const schemaStore = useSchemaStore()

const slug = computed(() => route.params.slug as string)
const space = computed(() => spacesStore.spaces.find((s: { slug: string }) => s.slug === slug.value))

onMounted(async () => {
  if (!spacesStore.spaces.length) await spacesStore.fetchSpaces()
  if (slug.value) await schemaStore.fetchTables(slug.value)
})

watch(slug, async (val) => {
  if (val) await schemaStore.fetchTables(val)
})

function isActive(name: string): boolean {
  return route.name === name
}

function tableActive(t: { slug: string }): boolean {
  return route.name === 'spaces-slug-tables-table' && route.params.table === t.slug
}

async function logout() {
  await auth.logout()
  navigateTo('/login')
}

interface NavItem {
  icon: string
  label: string
  name: string
  path: string
}

// Recomputed on slug change so paths stay in sync with the active space
const outputNav = computed<NavItem[]>(() => [
  { icon: 'code',   label: 'REST API', name: 'api-docs', path: `/spaces/${slug.value}/api/docs` },
  { icon: 'folder', label: 'Файлы',    name: 'files',    path: `/spaces/${slug.value}/files`    },
  { icon: 'file',   label: 'PDF',      name: 'pdf',      path: `/spaces/${slug.value}/pdf`      },
])

const spaceNav = computed<NavItem[]>(() => [
  { icon: 'users',    label: 'Команда',    name: 'team',     path: `/spaces/${slug.value}/team`     },
  { icon: 'settings', label: 'Настройки', name: 'settings', path: `/spaces/${slug.value}/settings` },
])
</script>

<template>
  <aside class="sidebar">
    <!-- Space switcher -->
    <NuxtLink to="/spaces" class="space-switcher">
      <div class="space-badge">N</div>
      <div class="space-info">
        <span class="space-name">{{ space?.name || slug }}</span>
        <span class="space-slug">{{ slug }}</span>
      </div>
      <NIcon name="chevd" :size="12" color="var(--fg-3)" />
    </NuxtLink>

    <!-- Tables section -->
    <div class="section-label">Таблицы</div>

    <NuxtLink
      v-for="t in schemaStore.tables"
      :key="t.slug"
      :to="`/spaces/${slug}/tables/${t.slug}`"
      class="nav-item"
      :class="{ active: tableActive(t) }"
    >
      <NIcon name="table" :size="14" :style="{ opacity: tableActive(t) ? 1 : 0.65 }" />
      <span class="nav-label">{{ t.name }}</span>
    </NuxtLink>

    <div v-if="schemaStore.loading && !schemaStore.tables.length" class="loading-row">
      <NSpinner :size="13" label="Загрузка…" />
    </div>

    <NuxtLink
      :to="`/spaces/${slug}/schema/new`"
      class="nav-item nav-item--muted"
      :class="{ active: isActive('spaces-slug-schema-new') }"
    >
      <NIcon name="plus" :size="14" :style="{ opacity: 0.65 }" />
      <span>Новая таблица</span>
    </NuxtLink>

    <!-- Outputs section -->
    <div class="section-label">Выходы</div>

    <NuxtLink
      v-for="item in outputNav"
      :key="item.name"
      :to="item.path"
      class="nav-item"
      :class="{ active: isActive(item.name) }"
    >
      <NIcon :name="item.icon" :size="14" :style="{ opacity: isActive(item.name) ? 1 : 0.65 }" />
      <span>{{ item.label }}</span>
    </NuxtLink>

    <!-- Space section -->
    <div class="section-label">Пространство</div>

    <NuxtLink
      v-for="item in spaceNav"
      :key="item.name"
      :to="item.path"
      class="nav-item"
      :class="{ active: isActive(item.name) }"
    >
      <NIcon :name="item.icon" :size="14" :style="{ opacity: isActive(item.name) ? 1 : 0.65 }" />
      <span>{{ item.label }}</span>
    </NuxtLink>

    <div class="spacer" />

    <!-- User footer -->
    <div class="footer">
      <div class="user-avatar">{{ auth.initials() }}</div>
      <div class="user-info">
        <div class="user-name">{{ auth.user?.name }}</div>
        <div class="user-role">{{ auth.user?.role === 'admin' ? 'Администратор' : 'Участник' }}</div>
      </div>
      <button class="logout-btn" @click="logout">
        <NIcon name="logout" :size="14" />
      </button>
    </div>
  </aside>
</template>

<style scoped>
.sidebar {
  background: var(--bg-0);
  border-right: 0.5px solid var(--border-default);
  padding: 12px 8px;
  display: flex;
  flex-direction: column;
  position: sticky;
  top: 0;
  height: 100vh;
  overflow: auto;
  box-sizing: border-box;
}

.space-switcher {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px 12px;
  cursor: pointer;
  border-bottom: 0.5px solid var(--border-default);
  margin-bottom: 4px;
  text-decoration: none;
}

.space-badge {
  width: 26px;
  height: 26px;
  border-radius: 6px;
  background: var(--brand-primary);
  color: #fff;
  display: grid;
  place-items: center;
  font-weight: 700;
  font-size: 13px;
  flex-shrink: 0;
}

.space-info {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
  overflow: hidden;
  flex: 1;
}

.space-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--fg-1);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.space-slug {
  font-size: 10px;
  color: var(--fg-3);
  font-family: var(--font-mono);
}

.section-label {
  font-size: 10px;
  font-weight: 600;
  color: var(--fg-3);
  text-transform: uppercase;
  letter-spacing: 0.07em;
  padding: 14px 10px 5px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 30px;
  padding: 0 10px;
  border-radius: 6px;
  cursor: pointer;
  margin-bottom: 1px;
  color: var(--fg-1);
  font-size: 13px;
  font-weight: 400;
  transition: background 100ms;
  text-decoration: none;
}

.nav-item--muted {
  color: var(--fg-2);
}

.nav-item:hover:not(.active) {
  background: var(--bg-1);
}

.nav-item.active {
  background: var(--brand-tint);
  color: var(--purple-700);
  font-weight: 500;
}

.nav-label {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.loading-row {
  padding: 6px 10px;
  font-size: 12px;
  color: var(--fg-3);
}

.spacer {
  flex: 1;
}

.footer {
  border-top: 0.5px solid var(--border-default);
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 10px 4px;
}

.user-avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--purple-200);
  color: var(--purple-700);
  display: grid;
  place-items: center;
  font-weight: 700;
  font-size: 11px;
  flex-shrink: 0;
}

.user-info {
  flex: 1;
  overflow: hidden;
}

.user-name {
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-role {
  font-size: 10px;
  color: var(--fg-3);
}

.logout-btn {
  cursor: pointer;
  color: var(--fg-3);
  padding: 4px;
  background: transparent;
  border: none;
}
</style>
