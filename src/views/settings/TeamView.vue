<script setup>
import { ref } from 'vue'
import AppShell from '@/components/shell/AppShell.vue'
import NButton from '@/components/primitives/NButton.vue'
import NIcon from '@/components/primitives/NIcon.vue'
import NBadge from '@/components/primitives/NBadge.vue'
import NToast from '@/components/primitives/NToast.vue'
import { MEMBERS } from '@/data/mock.js'

const toast = ref(null)

function show(msg) {
  toast.value = msg
  setTimeout(() => { toast.value = null }, 2500)
}

function initials(name) {
  return name.split(' ').map(p => p[0]).join('').slice(0, 2)
}
</script>

<template>
  <AppShell :breadcrumb="['Кафедра математики', 'Настройки', 'Команда']">
    <template #actions>
      <NButton variant="primary" size="sm" @click="show('Приглашение отправлено')">
        <NIcon name="plus" :size="14" color="#fff" />
        Добавить участника
      </NButton>
    </template>

    <div style="max-width: 860px; margin: 0 auto; padding: 32px 32px 80px">
      <div style="margin-bottom: 24px">
        <h1 style="font-size: 24px; font-weight: 700; margin-bottom: 6px; letter-spacing: -0.01em">Команда</h1>
        <p style="font-size: 13px; color: var(--fg-2)">4 из 10 мест на тарифе Pro</p>
      </div>

      <div style="background: var(--bg-0); border: 0.5px solid var(--border-default); border-radius: 8px; overflow: hidden">
        <div
          v-for="(m, i) in MEMBERS" :key="m.email"
          :style="{
            display: 'flex', alignItems: 'center', padding: '12px 16px', gap: 12,
            borderTop: i ? '0.5px solid var(--border-default)' : '0',
          }"
        >
          <div :style="{
            width: '32px', height: '32px', borderRadius: '50%',
            background: m.color, color: m.fg,
            display: 'grid', placeItems: 'center',
            fontWeight: 700, fontSize: '12px', flexShrink: 0,
          }">{{ initials(m.name) }}</div>
          <div style="flex: 1; min-width: 0">
            <div style="font-size: 13px; font-weight: 500; display: flex; align-items: center; gap: 6px">
              {{ m.name }}
              <NBadge v-if="m.you" tone="brand">это ты</NBadge>
            </div>
            <div style="font-size: 11px; color: var(--fg-3); font-family: var(--font-mono)">{{ m.email }}</div>
          </div>
          <NBadge :tone="m.role === 'Admin' ? 'brand' : 'neutral'">{{ m.role }}</NBadge>
          <span style="font-size: 12px; color: var(--fg-3); white-space: nowrap">с {{ m.joined }}</span>
          <button
            :disabled="m.you"
            :style="{
              background: 0, border: 0, padding: '6px', display: 'flex',
              cursor: m.you ? 'default' : 'pointer',
              color: m.you ? 'var(--neutral-300)' : 'var(--fg-3)',
            }"
          >
            <NIcon name="more" :size="14" />
          </button>
        </div>
      </div>

      <!-- Role descriptions -->
      <div style="margin-top: 24px; padding: 16px 20px; background: var(--bg-0); border: 0.5px solid var(--border-default); border-radius: 8px">
        <div style="font-size: 13px; font-weight: 600; margin-bottom: 10px">Что умеет каждая роль</div>
        <div style="display: grid; grid-template-columns: 100px 1fr; gap: 8px 16px; font-size: 12px">
          <div style="color: var(--fg-1); font-weight: 500">Admin</div>
          <div style="color: var(--fg-2)">Всё: таблицы, API-ключи, биллинг, состав команды, настройки пространства.</div>
          <div style="color: var(--fg-1); font-weight: 500">Member</div>
          <div style="color: var(--fg-2)">Чтение и редактирование записей, генерация PDF.</div>
        </div>
      </div>
    </div>
  </AppShell>

  <NToast v-if="toast" tone="success" :title="toast" @close="toast = null" />
</template>
