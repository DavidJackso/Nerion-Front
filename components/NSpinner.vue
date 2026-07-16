<script setup lang="ts">
withDefaults(defineProps<{ size?: number; label?: string }>(), { size: 16 })
</script>

<template>
  <span style="display: inline-flex; align-items: center; gap: 8px">
    <span
      :style="{
        width: `${size}px`,
        height: `${size}px`,
        border: '2px solid var(--border-strong)',
        borderTopColor: 'var(--brand-primary)',
        borderRadius: '50%',
        animation: 'spin 0.7s linear infinite',
        flexShrink: 0,
      }"
    />
    <span v-if="label" style="font-size: 13px; color: var(--fg-3)">{{ label }}</span>
  </span>
</template>
