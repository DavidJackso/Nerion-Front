<script setup>
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import NIcon from '@/components/primitives/NIcon.vue'

const emit = defineEmits(['close'])
const router = useRouter()
const route = useRoute()
const q = ref('')

const ALL = [
  { id: 'sch02',  icon: 'plus',     label: 'Создать таблицу',        hint: 'Из шаблона или с нуля',   group: 'Действия' },
  { id: 'api01',  icon: 'code',     label: 'REST API',               hint: 'Документация эндпоинтов', group: 'Выходы' },
  { id: 'api02',  icon: 'key',      label: 'Ключи API',              hint: 'Создать или отозвать',    group: 'Выходы' },
  { id: 'files',  icon: 'folder',   label: 'Файлы и списки',         hint: 'Списки для фронта · API', group: 'Выходы' },
  { id: 'pdf01',  icon: 'file',     label: 'PDF',                    hint: 'Шаблоны и генерация',     group: 'Выходы' },
  { id: 'set01',  icon: 'users',    label: 'Команда',                hint: 'Участники и роли',        group: 'Настройки' },
  { id: 'set02',  icon: 'settings', label: 'Настройки пространства', hint: 'Имя, slug, удаление',     group: 'Настройки' },
  { id: 'spaces', icon: 'box',      label: 'Все пространства',       hint: 'Сменить пространство',    group: 'Навигация' },
]

const filtered = computed(() => {
  const qv = q.value.trim().toLowerCase()
  return qv ? ALL.filter(i => i.label.toLowerCase().includes(qv) || i.hint.toLowerCase().includes(qv)) : ALL
})

const groups = computed(() => {
  const acc = {}
  for (const item of filtered.value) {
    (acc[item.group] = acc[item.group] || []).push(item)
  }
  return acc
})

function go(id) {
  const s = route.params.slug
  const paths = {
    'spaces': '/spaces',
    'api01':  `/spaces/${s}/api/docs`,
    'api02':  `/spaces/${s}/api/keys`,
    'files':  `/spaces/${s}/files`,
    'pdf01':  `/spaces/${s}/pdf`,
    'set01':  `/spaces/${s}/team`,
    'set02':  `/spaces/${s}/settings`,
    'sch02':  `/spaces/${s}/schema/new`,
  }
  const path = paths[id]
  if (path) router.push(path)
  emit('close')
}
</script>

<template>
  <Teleport to="body">
    <div @click="emit('close')" :style="{
      position: 'fixed', inset: 0,
      background: 'var(--overlay)',
      backdropFilter: 'blur(2px)',
      display: 'grid', placeItems: 'start center',
      zIndex: 200, paddingTop: '100px',
    }">
      <div @click.stop :style="{
        background: 'var(--bg-0)',
        borderRadius: '12px',
        boxShadow: 'var(--shadow-3)',
        width: '560px',
        maxWidth: 'calc(100vw - 32px)',
        maxHeight: '60vh',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
        animation: 'modalIn 200ms',
      }">
        <div style="display: flex; align-items: center; gap: 12px; padding: 14px 18px; border-bottom: 0.5px solid var(--border-default)">
          <NIcon name="search" :size="16" color="var(--fg-3)" />
          <input
            v-model="q"
            autofocus
            placeholder="Поиск или команда…"
            style="flex: 1; border: 0; outline: 0; font-size: 15px; background: transparent; color: var(--fg-1); font-family: inherit"
          />
          <span style="font-size: 11px; color: var(--fg-3); font-family: var(--font-mono)">esc</span>
        </div>

        <div style="overflow: auto; padding: 8px">
          <div v-if="!Object.keys(groups).length" style="padding: 32px; text-align: center; color: var(--fg-3); font-size: 13px">
            Ничего не найдено
          </div>
          <div v-for="(items, group) in groups" :key="group" style="margin-bottom: 4px">
            <div style="font-size: 10px; font-weight: 600; color: var(--fg-3); text-transform: uppercase; letter-spacing: 0.07em; padding: 8px 12px 4px">{{ group }}</div>
            <div
              v-for="item in items" :key="item.id"
              @click="go(item.id)"
              style="display: flex; align-items: center; gap: 10px; padding: 7px 12px; border-radius: 6px; cursor: pointer"
              @mouseenter="e => e.currentTarget.style.background = 'var(--bg-1)'"
              @mouseleave="e => e.currentTarget.style.background = 'transparent'"
            >
              <NIcon :name="item.icon" :size="14" color="var(--fg-3)" />
              <span style="font-size: 13px; font-weight: 500; color: var(--fg-1)">{{ item.label }}</span>
              <span style="font-size: 12px; color: var(--fg-3); margin-left: 4px">{{ item.hint }}</span>
            </div>
          </div>
        </div>

        <div style="border-top: 0.5px solid var(--border-default); padding: 8px 16px; font-size: 11px; color: var(--fg-3); display: flex; gap: 16px">
          <span>↵ открыть</span><span>↑↓ навигация</span><span>esc закрыть</span>
        </div>
      </div>
    </div>
  </Teleport>
</template>
