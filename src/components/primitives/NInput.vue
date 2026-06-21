<script setup>
import { ref } from 'vue'

const props = defineProps({
  modelValue: { type: String, default: '' },
  placeholder: { type: String, default: '' },
  type: { type: String, default: 'text' },
  error: { type: String, default: '' },
  mono: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
})

defineEmits(['update:modelValue'])

const focus = ref(false)
</script>

<template>
  <div style="display: flex; flex-direction: column; gap: 4px; width: 100%">
    <input
      :type="type"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :style="{
        height: '36px',
        padding: '0 12px',
        borderRadius: '6px',
        border: `0.5px solid ${error ? 'var(--danger-solid)' : focus ? 'var(--border-focus)' : 'var(--border-strong)'}`,
        boxShadow: focus ? 'var(--ring-focus)' : 'none',
        background: 'var(--bg-0)',
        color: 'var(--fg-1)',
        fontFamily: mono ? 'var(--font-mono)' : 'var(--font-sans)',
        fontSize: '14px',
        outline: 0,
        width: '100%',
        boxSizing: 'border-box',
        transition: 'border-color 120ms, box-shadow 120ms',
      }"
      @input="$emit('update:modelValue', $event.target.value)"
      @focus="focus = true"
      @blur="focus = false"
    />
    <div v-if="error" style="font-size: 11px; color: var(--danger-fg)">{{ error }}</div>
  </div>
</template>
