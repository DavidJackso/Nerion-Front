<script setup>
import NIcon from './NIcon.vue'

defineProps({
  tone: { type: String, default: 'success' },
  title: { type: String, default: '' },
  body: { type: String, default: '' },
})

defineEmits(['close'])

const tones = {
  success: { border: 'var(--green-100)', solid: 'var(--green-500)', icon: 'check' },
  error:   { border: 'var(--red-100)',   solid: 'var(--red-500)',   icon: 'x' },
  warning: { border: 'var(--amber-100)', solid: 'var(--amber-500)', icon: 'warn' },
  info:    { border: 'var(--blue-50)',   solid: 'var(--blue-500)',  icon: 'code' },
}
</script>

<template>
  <Teleport to="body">
    <div :style="{
      position: 'fixed', top: '72px', right: '24px', zIndex: 300,
      background: 'var(--bg-0)',
      border: `0.5px solid ${tones[tone]?.border || tones.success.border}`,
      borderRadius: '12px',
      boxShadow: 'var(--shadow-3)',
      padding: '14px 16px',
      display: 'flex',
      gap: '12px',
      alignItems: 'flex-start',
      minWidth: '280px',
      maxWidth: '380px',
      animation: 'toastIn 200ms',
    }">
      <div :style="{
        width: '32px', height: '32px', borderRadius: '8px',
        background: tones[tone]?.border || tones.success.border,
        display: 'grid', placeItems: 'center', flexShrink: 0,
      }">
        <NIcon :name="tones[tone]?.icon || 'check'" :size="14" :color="tones[tone]?.solid || tones.success.solid" />
      </div>
      <div style="flex: 1">
        <div style="font-size: 13px; font-weight: 600; color: var(--fg-1)">{{ title }}</div>
        <div v-if="body" style="font-size: 12px; color: var(--fg-2); margin-top: 2px">{{ body }}</div>
      </div>
      <button @click="$emit('close')" :style="{
        background: 0, border: 0, color: 'var(--fg-3)', cursor: 'pointer', padding: '2px',
      }">
        <NIcon name="x" :size="14" />
      </button>
    </div>
  </Teleport>
</template>
