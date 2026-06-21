<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import AppShell from '@/components/shell/AppShell.vue'
import NButton from '@/components/primitives/NButton.vue'
import NInput from '@/components/primitives/NInput.vue'
import NBadge from '@/components/primitives/NBadge.vue'
import NIcon from '@/components/primitives/NIcon.vue'
import { TEMPLATES } from '@/data/mock.js'

const router = useRouter()
const picked = ref('teachers')
const name = ref('Преподаватели')

function pick(t) {
  picked.value = t.id
  if (t.id !== 'blank') name.value = t.title
}
</script>

<template>
  <AppShell :breadcrumb="['Кафедра математики', 'Новая таблица']">
    <div style="max-width: 860px; margin: 0 auto; padding: 40px 32px 80px">
      <div style="margin-bottom: 32px">
        <div style="font-size: 11px; color: var(--fg-3); margin-bottom: 8px; font-family: var(--font-mono); text-transform: uppercase; letter-spacing: 0.06em">Шаг 1 / 2</div>
        <h1 style="font-size: 26px; font-weight: 700; margin-bottom: 8px; letter-spacing: -0.02em">С чего начнём?</h1>
        <p style="font-size: 14px; color: var(--fg-2)">Выбери шаблон с готовыми полями или начни с пустой таблицы.</p>
      </div>

      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 28px">
        <div
          v-for="t in TEMPLATES" :key="t.id"
          @click="pick(t)"
          :style="{
            background: 'var(--bg-0)',
            border: `${picked === t.id ? 1.5 : 0.5}px solid ${picked === t.id ? 'var(--brand-primary)' : 'var(--border-default)'}`,
            borderRadius: '12px', padding: '18px', cursor: 'pointer',
            boxShadow: picked === t.id ? 'var(--shadow-2)' : 'var(--shadow-1)',
            transition: 'all 140ms', position: 'relative',
          }"
        >
          <div v-if="t.tag" style="position: absolute; top: 12px; right: 12px">
            <NBadge tone="brand">{{ t.tag }}</NBadge>
          </div>
          <div :style="{
            width: '36px', height: '36px', borderRadius: '8px',
            background: picked === t.id ? 'var(--brand-tint)' : 'var(--bg-1)',
            display: 'grid', placeItems: 'center', marginBottom: '14px',
            color: picked === t.id ? 'var(--purple-600)' : 'var(--fg-3)',
          }">
            <NIcon :name="t.icon" :size="18" />
          </div>
          <div style="font-size: 14px; font-weight: 600; margin-bottom: 4px">{{ t.title }}</div>
          <div style="font-size: 12px; color: var(--fg-2); line-height: 1.45; margin-bottom: 10px; min-height: 34px">{{ t.desc }}</div>
          <div style="font-size: 11px; color: var(--fg-3); font-family: var(--font-mono)">{{ t.fields > 0 ? `${t.fields} полей` : 'Без полей' }}</div>
        </div>
      </div>

      <div style="background: var(--bg-0); border: 0.5px solid var(--border-default); border-radius: 10px; padding: 20px; display: flex; gap: 16px; align-items: flex-end">
        <div style="flex: 1">
          <label style="font-size: 12px; color: var(--fg-2); font-weight: 500; display: block; margin-bottom: 6px">Название таблицы</label>
          <NInput v-model="name" placeholder="Например: Преподаватели" />
        </div>
        <NButton variant="primary" size="md" :disabled="!picked" @click="router.push({ name: 'sch03' })">Настроить поля →</NButton>
      </div>
    </div>
  </AppShell>
</template>
