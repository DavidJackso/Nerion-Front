<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import NIcon from '@/components/primitives/NIcon.vue'

const router = useRouter()
const route = useRoute()

const ROUTE_MAP = {
  'spaces':       '/spaces',
  'data-prep':    { name: 'data-prep' },
  'data-courses': { name: 'data-courses' },
  'data-plans':   { name: 'data-plans' },
  'sch02':        { name: 'sch02' },
  'sch03':        { name: 'sch03' },
  'api01':        { name: 'api01' },
  'api02':        { name: 'api02' },
  'files':        { name: 'files' },
  'pdf01':        { name: 'pdf01' },
  'set01':        { name: 'set01' },
  'set02':        { name: 'set02' },
  'login':        '/login',
}

function navigate(id) {
  const target = ROUTE_MAP[id]
  if (!target) return
  typeof target === 'string' ? router.push(target) : router.push(target)
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
    <div @click="navigate('spaces')" :style="{
      display: 'flex', alignItems: 'center', gap: '8px',
      padding: '6px 10px 12px',
      cursor: 'pointer',
      borderBottom: '0.5px solid var(--border-default)',
      marginBottom: '4px',
    }">
      <div style="width: 26px; height: 26px; border-radius: 6px; background: var(--brand-primary); color: #fff; display: grid; place-items: center; font-weight: 700; font-size: 13px; flex-shrink: 0">N</div>
      <div style="display: flex; flex-direction: column; line-height: 1.2; overflow: hidden; flex: 1">
        <span style="font-size: 13px; font-weight: 600; color: var(--fg-1); white-space: nowrap; overflow: hidden; text-overflow: ellipsis">Кафедра математики</span>
        <span style="font-size: 10px; color: var(--fg-3); font-family: var(--font-mono)">math-dept</span>
      </div>
      <NIcon name="chevd" :size="12" color="var(--fg-3)" />
    </div>

    <!-- Nav label -->
    <template v-for="section in [
      { label: 'Таблицы', items: [
        { icon: 'table', label: 'Преподаватели', count: 14, id: 'data-prep' },
        { icon: 'table', label: 'Курсы', count: 42, id: 'data-courses' },
        { icon: 'table', label: 'Учебные планы', count: 8, id: 'data-plans' },
        { icon: 'plus', label: 'Новая таблица', id: 'sch02' },
      ]},
      { label: 'Выходы', items: [
        { icon: 'code', label: 'REST API', id: 'api01' },
        { icon: 'folder', label: 'Файлы', count: 4, id: 'files' },
        { icon: 'file', label: 'PDF', id: 'pdf01' },
      ]},
      { label: 'Пространство', items: [
        { icon: 'users', label: 'Команда', id: 'set01' },
        { icon: 'settings', label: 'Настройки', id: 'set02' },
      ]},
    ]" :key="section.label">
      <div :style="{
        fontSize: '10px', fontWeight: 600, color: 'var(--fg-3)',
        textTransform: 'uppercase', letterSpacing: '0.07em',
        padding: '14px 10px 5px',
      }">{{ section.label }}</div>
      <div v-for="item in section.items" :key="item.id"
        @click="navigate(item.id)"
        @mouseenter="hovered = item.id"
        @mouseleave="hovered = null"
        :style="{
          display: 'flex', alignItems: 'center', gap: '8px',
          height: '30px', padding: '0 10px',
          borderRadius: '6px', cursor: 'pointer', marginBottom: '1px',
          background: route.name === item.id ? 'var(--brand-tint)' : hovered === item.id ? 'var(--bg-1)' : 'transparent',
          color: route.name === item.id ? 'var(--purple-700)' : 'var(--fg-1)',
          fontSize: '13px',
          fontWeight: route.name === item.id ? 500 : 400,
          transition: 'background 100ms',
        }"
      >
        <NIcon :name="item.icon" :size="14" :style="{ opacity: route.name === item.id ? 1 : 0.65 }" />
        <span style="flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap">{{ item.label }}</span>
        <span v-if="item.count != null" :style="{
          fontSize: '11px',
          color: route.name === item.id ? 'var(--purple-600)' : 'var(--fg-3)',
          fontVariantNumeric: 'tabular-nums',
        }">{{ item.count }}</span>
      </div>
    </template>

    <div style="flex: 1" />

    <!-- User footer -->
    <div style="border-top: 0.5px solid var(--border-default); display: flex; align-items: center; gap: 8px; padding: 10px 10px 4px">
      <div style="width: 24px; height: 24px; border-radius: 50%; background: var(--purple-200); color: var(--purple-700); display: grid; place-items: center; font-weight: 700; font-size: 11px; flex-shrink: 0">АИ</div>
      <div style="flex: 1; overflow: hidden">
        <div style="font-size: 12px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis">Анна Иванова</div>
        <div style="font-size: 10px; color: var(--fg-3)">Админ</div>
      </div>
      <div @click="navigate('login')" style="cursor: pointer; color: var(--fg-3); padding: 4px">
        <NIcon name="logout" :size="14" />
      </div>
    </div>
  </aside>
</template>
