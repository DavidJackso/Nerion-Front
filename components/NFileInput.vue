<script setup lang="ts">
import { uploadFile } from '~/api/files'

const props = defineProps<{
  spaceSlug: string
  modelValue: string | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string | null]
}>()

const fileInput = ref<HTMLInputElement | null>(null)
const uploading = ref(false)
const error = ref('')
const uploadedSize = ref(0)

function filename(key: string | null): string {
  if (!key) return ''
  const last = key.split('/').pop() ?? key
  return last.replace(/^\d+_/, '')
}

function fmtSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} МБ`
  return `${Math.round(bytes / 1024)} КБ`
}

async function onFileChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  uploading.value = true
  error.value = ''
  try {
    const result = await uploadFile(props.spaceSlug, file)
    uploadedSize.value = result.size
    emit('update:modelValue', result.key)
  } catch (err: any) {
    error.value = err?.message ?? 'Ошибка загрузки'
  } finally {
    uploading.value = false
    if (fileInput.value) fileInput.value.value = ''
  }
}

function remove() {
  emit('update:modelValue', null)
  uploadedSize.value = 0
  error.value = ''
}
</script>

<template>
  <div>
    <input ref="fileInput" type="file" style="display:none" @change="onFileChange" />

    <!-- Done: file info row -->
    <div
      v-if="modelValue && !uploading"
      style="display:flex;align-items:center;gap:10px;padding:8px 12px;border:0.5px solid var(--border-default);border-radius:8px;background:var(--bg-0)"
    >
      <NIcon name="file" :size="15" color="var(--fg-2)" />
      <span style="flex:1;font-size:13px;font-family:var(--font-mono);color:var(--fg-1);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
        {{ filename(modelValue) }}
      </span>
      <span v-if="uploadedSize" style="font-size:11px;color:var(--fg-3);white-space:nowrap;flex-shrink:0">
        {{ fmtSize(uploadedSize) }}
      </span>
      <button
        type="button"
        @click="remove"
        style="background:0;border:0;padding:4px;cursor:pointer;color:var(--fg-3);display:flex;border-radius:4px;flex-shrink:0"
      >
        <NIcon name="x" :size="14" />
      </button>
    </div>

    <!-- Idle / uploading -->
    <div
      v-else
      @click="!uploading && fileInput?.click()"
      :style="{
        border: `1px dashed ${error ? 'var(--red-400,#f87171)' : 'var(--border-strong)'}`,
        borderRadius: '8px',
        padding: '12px 14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        background: 'var(--bg-1)',
        cursor: uploading ? 'default' : 'pointer',
        fontSize: '13px',
        color: 'var(--fg-2)',
      }"
    >
      <span
        v-if="uploading"
        style="width:15px;height:15px;border:2px solid var(--border-strong);border-top-color:var(--brand-primary);border-radius:50%;animation:spin 0.7s linear infinite;flex-shrink:0"
      />
      <NIcon v-else name="upload" :size="15" color="var(--fg-3)" />
      <span v-if="uploading">Загрузка…</span>
      <span v-else>
        Перетащи или <span style="color:var(--brand-primary);font-weight:500">выбери</span>
      </span>
    </div>

    <p v-if="error" style="font-size:12px;color:var(--red-600,#dc2626);margin:4px 0 0">{{ error }}</p>
  </div>
</template>
