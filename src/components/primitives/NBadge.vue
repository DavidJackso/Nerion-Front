<script setup>
defineProps({
  tone: { type: String, default: 'neutral' },
  dot: { type: Boolean, default: false },
})

const tones = {
  neutral: { bg: 'var(--bg-2)', fg: 'var(--fg-2)', dot: 'var(--fg-3)' },
  brand:   { bg: 'var(--brand-tint)', fg: 'var(--purple-700)', dot: 'var(--purple-500)' },
  success: { bg: 'var(--green-100)', fg: 'var(--green-700)', dot: 'var(--green-500)' },
  warning: { bg: 'var(--amber-100)', fg: 'var(--amber-700)', dot: 'var(--amber-500)' },
  danger:  { bg: 'var(--red-100)', fg: 'var(--red-700)', dot: 'var(--red-500)' },
}
</script>

<template>
  <span :style="{
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    padding: '3px 8px',
    borderRadius: '999px',
    background: tones[tone]?.bg || tones.neutral.bg,
    color: tones[tone]?.fg || tones.neutral.fg,
    fontSize: '11px',
    fontWeight: 500,
  }">
    <span v-if="dot" :style="{
      width: '6px', height: '6px', borderRadius: '50%',
      background: tones[tone]?.dot || tones.neutral.dot,
      flexShrink: 0,
    }"/>
    <slot />
  </span>
</template>
