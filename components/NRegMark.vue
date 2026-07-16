<script setup lang="ts">
type Status = 'active' | 'warning' | 'inactive' | 'error'

const props = defineProps<{
  value: string | number
  label?: string
  status?: Status
}>()

const DOT: Record<Status, string> = {
  active: 'var(--green-500)',
  warning: 'var(--amber-500)',
  inactive: 'var(--fg-mute)',
  error: 'var(--red-500)',
}
</script>

<template>
  <span
    :style="{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--text-xs)',
      color: 'var(--stamp-ink)',
      background: 'var(--stamp-ink-tint)',
      padding: '3px 8px',
      borderRadius: '4px',
      lineHeight: 1,
      whiteSpace: 'nowrap',
    }"
  >
    <span :style="{ width: '5px', height: '5px', borderRadius: '50%', background: DOT[status ?? 'active'], flexShrink: 0 }" />
    <span style="font-weight: 700; font-variant-numeric: tabular-nums">{{ value }}</span>
    <span
      v-if="label"
      style="font-weight: 400; opacity: 0.75; text-transform: uppercase; letter-spacing: 0.04em; font-size: 10px"
    >{{ label }}</span>
  </span>
</template>
