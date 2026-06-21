<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  variant: { type: String, default: 'primary' },
  size: { type: String, default: 'md' },
  disabled: { type: Boolean, default: false },
  type: { type: String, default: 'button' },
})

const hov = ref(false)

const sizes = {
  sm: { height: '28px', padding: '0 10px', fontSize: '13px' },
  md: { height: '36px', padding: '0 14px', fontSize: '14px' },
  lg: { height: '44px', padding: '0 20px', fontSize: '15px' },
}

const vars = {
  primary: { background: 'var(--brand-primary)', color: '#fff', border: 'none' },
  secondary: { background: 'var(--bg-0)', color: 'var(--fg-1)', border: '0.5px solid var(--border-strong)' },
  ghost: { background: 'transparent', color: 'var(--fg-1)', border: 'none' },
  danger: { background: 'var(--danger-solid)', color: '#fff', border: 'none' },
  'danger-ghost': { background: 'transparent', color: 'var(--danger-fg)', border: '0.5px solid var(--danger-border)' },
}

const hovStyles = {
  primary: { background: 'var(--brand-primary-hover)' },
  secondary: { background: 'var(--bg-2)' },
  ghost: { background: 'var(--bg-2)' },
  danger: { background: 'var(--red-600)' },
  'danger-ghost': { background: 'var(--danger-bg)' },
}

const style = computed(() => ({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '6px',
  border: vars[props.variant]?.border || 'none',
  borderRadius: '6px',
  cursor: props.disabled ? 'not-allowed' : 'pointer',
  fontFamily: 'var(--font-sans)',
  fontWeight: 500,
  lineHeight: 1,
  transition: 'background 120ms, transform 80ms',
  opacity: props.disabled ? 0.5 : 1,
  whiteSpace: 'nowrap',
  boxSizing: 'border-box',
  ...sizes[props.size],
  ...vars[props.variant],
  ...(hov.value && !props.disabled ? hovStyles[props.variant] : {}),
}))
</script>

<template>
  <button
    :type="type"
    :disabled="disabled"
    :style="style"
    @mouseenter="hov = true"
    @mouseleave="hov = false"
    @click="$emit('click', $event)"
  >
    <slot />
  </button>
</template>
