<script setup>
import { ref } from 'vue'
import AppShell from '@/components/shell/AppShell.vue'
import NButton from '@/components/primitives/NButton.vue'
import NIcon from '@/components/primitives/NIcon.vue'
import NInput from '@/components/primitives/NInput.vue'
import NToast from '@/components/primitives/NToast.vue'

const spaceName = ref('Кафедра математики')
const slug = ref('math-dept')
const toast = ref(null)
const dangerInput = ref('')

function show(msg) {
  toast.value = msg
  setTimeout(() => { toast.value = null }, 2500)
}
</script>

<template>
  <AppShell :breadcrumb="['Кафедра математики', 'Настройки']">
    <div style="max-width: 700px; margin: 0 auto; padding: 32px 32px 80px">
      <h1 style="font-size: 24px; font-weight: 700; margin-bottom: 28px; letter-spacing: -0.01em">Настройки пространства</h1>

      <!-- Main settings -->
      <div style="background: var(--bg-0); border: 0.5px solid var(--border-default); border-radius: 8px; padding: 24px; margin-bottom: 16px">
        <div style="font-size: 14px; font-weight: 600; margin-bottom: 18px">Основное</div>
        <div style="display: flex; flex-direction: column; gap: 18px">
          <div>
            <label style="font-size: 12px; color: var(--fg-2); font-weight: 500; display: block; margin-bottom: 6px">Название пространства</label>
            <NInput v-model="spaceName" />
          </div>
          <div>
            <label style="font-size: 12px; color: var(--fg-2); font-weight: 500; display: block; margin-bottom: 6px">Slug</label>
            <div style="display: flex; align-items: center; height: 36px; border: 0.5px solid var(--border-strong); border-radius: 6px; overflow: hidden; font-family: var(--font-mono); font-size: 13px">
              <span style="padding: 0 10px; background: var(--bg-2); color: var(--fg-3); height: 100%; display: flex; align-items: center; border-right: 0.5px solid var(--border-default); white-space: nowrap">app.nerion.ru/</span>
              <input v-model="slug" style="flex: 1; height: 100%; padding: 0 10px; border: 0; outline: 0; font-family: inherit; font-size: 13px; color: var(--fg-1); background: transparent" />
            </div>
            <p style="font-size: 11px; color: var(--fg-3); margin-top: 5px">Изменение slug изменит все URL API — обнови ключи в интеграциях.</p>
          </div>
        </div>
        <div style="margin-top: 20px; display: flex; justify-content: flex-end">
          <NButton variant="primary" size="md" @click="show('Настройки сохранены')">Сохранить</NButton>
        </div>
      </div>

      <!-- Danger zone -->
      <div style="border: 0.5px solid #FECACA; background: #FFF5F5; border-radius: 8px; padding: 24px">
        <div style="font-size: 13px; font-weight: 600; color: #B91C1C; margin-bottom: 16px; display: flex; align-items: center; gap: 8px">
          <NIcon name="warn" :size="14" color="#B91C1C" />
          Опасная зона
        </div>
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 14px 0; border-top: 0.5px solid #FECACA">
          <div>
            <div style="font-size: 13px; font-weight: 500; color: var(--fg-1)">Удалить пространство</div>
            <div style="font-size: 12px; color: var(--fg-2); margin-top: 2px">Все таблицы, записи и API-ключи будут удалены без возможности восстановления.</div>
          </div>
        </div>
        <div style="margin-top: 10px">
          <label style="font-size: 12px; color: var(--fg-2); font-weight: 500; display: block; margin-bottom: 6px">
            Введи <code style="font-size: 11px; font-family: var(--font-mono)">{{ slug }}</code> для подтверждения
          </label>
          <div style="display: flex; gap: 8px">
            <NInput v-model="dangerInput" :placeholder="slug" style="flex: 1" />
            <NButton variant="danger" size="md" :disabled="dangerInput !== slug">Удалить пространство</NButton>
          </div>
        </div>
      </div>
    </div>
  </AppShell>

  <NToast v-if="toast" tone="success" :title="toast" @close="toast = null" />
</template>
