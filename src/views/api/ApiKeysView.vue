<script setup>
import { ref } from 'vue'
import AppShell from '@/components/shell/AppShell.vue'
import NButton from '@/components/primitives/NButton.vue'
import NIcon from '@/components/primitives/NIcon.vue'
import NBadge from '@/components/primitives/NBadge.vue'
import NToast from '@/components/primitives/NToast.vue'
import { API_KEYS } from '@/data/mock.js'

const keys = ref(API_KEYS.map(k => ({ ...k })))
const toast = ref(null)
const showFreshKey = ref(false)
const freshKey = 'nrn_live_8a72f9b1c4e5d6a3f2a9b8c7d6e5f4a3b2c1d0'

function show(msg) {
  toast.value = msg
  setTimeout(() => { toast.value = null }, 2500)
}

function createKey() {
  showFreshKey.value = true
  show('Ключ создан — скопируй сейчас')
}

function copyFreshKey() {
  show('Ключ скопирован')
}
</script>

<template>
  <AppShell :breadcrumb="['Кафедра математики', 'REST API', 'Ключи']">
    <div style="max-width: 880px; margin: 0 auto; padding: 32px 32px 80px">
      <div style="display: flex; align-items: flex-end; justify-content: space-between; margin-bottom: 24px">
        <div>
          <h1 style="font-size: 24px; font-weight: 700; margin-bottom: 6px; letter-spacing: -0.01em">Ключи API</h1>
          <p style="font-size: 13px; color: var(--fg-2)">Используй в заголовке <code style="font-size: 12px; font-family: var(--font-mono)">Authorization: Bearer …</code></p>
        </div>
        <NButton variant="primary" size="md" @click="createKey">
          <NIcon name="plus" :size="14" color="#fff" />
          Создать ключ
        </NButton>
      </div>

      <!-- Fresh key banner -->
      <div v-if="showFreshKey" style="background: var(--bg-0); border: 1.5px solid var(--brand-primary); border-radius: 8px; padding: 16px 20px; margin-bottom: 20px">
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px">
          <NIcon name="key" :size="14" color="var(--purple-600)" />
          <span style="font-size: 13px; font-weight: 600">Ключ создан — скопируй сейчас</span>
          <NBadge tone="warning" :dot="true">видно один раз</NBadge>
        </div>
        <div style="display: flex; gap: 8px; align-items: center">
          <code style="flex: 1; padding: 10px 14px; background: var(--bg-2); border-radius: 6px; font-size: 12px; color: var(--fg-1); font-family: var(--font-mono); border: 0.5px solid var(--border-default); overflow: hidden; text-overflow: ellipsis; white-space: nowrap">{{ freshKey }}</code>
          <NButton variant="primary" size="md" @click="copyFreshKey">
            <NIcon name="copy" :size="13" color="#fff" />
            Копировать
          </NButton>
        </div>
      </div>

      <!-- Keys table -->
      <div style="background: var(--bg-0); border: 0.5px solid var(--border-default); border-radius: 8px; overflow: hidden">
        <div style="display: grid; grid-template-columns: 1fr 1fr 120px 140px 160px 80px; padding: 0 16px; height: 38px; align-items: center; background: var(--bg-1); border-bottom: 0.5px solid var(--border-default); font-size: 10px; color: var(--fg-3); text-transform: uppercase; letter-spacing: 0.06em; font-weight: 600">
          <div>Имя</div><div>Ключ</div><div>Scope</div><div style="text-align: right">Запросов / 24ч</div><div>Последнее использование</div><div></div>
        </div>
        <div
          v-for="(k, i) in keys" :key="i"
          :style="{
            display: 'grid', gridTemplateColumns: '1fr 1fr 120px 140px 160px 80px',
            padding: '12px 16px', alignItems: 'center',
            borderTop: i ? '0.5px solid var(--border-default)' : '0',
          }"
        >
          <div style="font-size: 13px; font-weight: 500; color: var(--fg-1)">{{ k.name }}</div>
          <div><code style="font-size: 11px; font-family: var(--font-mono); color: var(--fg-2)">{{ k.key.slice(0, 14) }}…</code></div>
          <div><NBadge :tone="k.scope.includes('write') ? 'warning' : 'neutral'">{{ k.scope }}</NBadge></div>
          <div style="text-align: right; font-family: var(--font-mono); font-variant-numeric: tabular-nums; font-size: 13px; color: var(--fg-1)">{{ k.req.toLocaleString('ru') }}</div>
          <div style="font-size: 13px; color: var(--fg-2)">{{ k.last }}</div>
          <div style="display: flex; gap: 4px; justify-content: flex-end">
            <button @click="show('Ключ обновлён')" style="background: 0; border: 0; padding: 5px; cursor: pointer; color: var(--fg-3); display: flex">
              <NIcon name="refresh" :size="13" />
            </button>
            <button style="background: 0; border: 0; padding: 5px; cursor: pointer; color: var(--red-500); display: flex">
              <NIcon name="trash" :size="13" />
            </button>
          </div>
        </div>
      </div>

      <!-- Security note -->
      <div style="margin-top: 20px; padding: 14px 16px; background: #FFFBEB; border: 0.5px solid #FDE68A; border-radius: 8px; display: flex; gap: 10px; align-items: flex-start">
        <NIcon name="lock" :size="15" color="#92400E" style="flex-shrink: 0; margin-top: 1px" />
        <div style="font-size: 12px; color: #78350F; line-height: 1.55"><strong>Безопасность.</strong> Test-ключи работают только на localhost. Live-ключи держи в переменных окружения, никогда — в коде.</div>
      </div>
    </div>
  </AppShell>

  <NToast v-if="toast" tone="success" :title="toast" @close="toast = null" />
</template>
