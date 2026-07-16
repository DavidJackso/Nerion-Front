<script setup lang="ts">
import { uploadFile } from '~/api/files'

const props = defineProps<{
  spaceSlug: string
  modelValue: string | string[] | null
  multiple?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string | string[] | null]
}>()

const fileInput = ref<HTMLInputElement | null>(null)
const uploading = ref(false)
const uploadingCount = ref(0)
const error = ref('')
const uploadedSize = ref(0)
const sizeMap = ref<Record<string, number>>({})
const dragging = ref(false)
let dragDepth = 0

function filename(key: string | null): string {
  if (!key) return ''
  const last = key.split('/').pop() ?? key
  return last.replace(/^\d+_/, '')
}

function fmtSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} МБ`
  return `${Math.round(bytes / 1024)} КБ`
}

const multipleValues = computed<string[]>(() =>
  props.multiple ? ((props.modelValue as string[]) ?? []) : []
)

function pluralFiles(n: number): string {
  if (n % 10 === 1 && n % 100 !== 11) return 'файл'
  if (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20)) return 'файла'
  return 'файлов'
}

async function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  await processFiles(Array.from(input.files ?? []))
  if (fileInput.value) fileInput.value.value = ''
}

function onDragEnter(e: DragEvent) {
  if (!e.dataTransfer?.types.includes('Files')) return
  dragDepth++
  dragging.value = true
}

function onDragLeave() {
  dragDepth = Math.max(0, dragDepth - 1)
  if (dragDepth === 0) dragging.value = false
}

async function onDrop(e: DragEvent) {
  dragDepth = 0
  dragging.value = false
  if ((props.multiple ? uploadingCount.value : uploading.value)) return
  await processFiles(Array.from(e.dataTransfer?.files ?? []))
}

async function processFiles(files: File[]) {
  if (!files.length) return
  error.value = ''

  if (props.multiple) {
    uploadingCount.value = files.length
    const results = await Promise.allSettled(
      files.map(f => uploadFile(props.spaceSlug, f))
    )
    const newKeys: string[] = []
    for (const r of results) {
      if (r.status === 'fulfilled') {
        sizeMap.value[r.value.key] = r.value.size
        newKeys.push(r.value.key)
      } else {
        error.value = (r.reason as any)?.message ?? 'Ошибка загрузки'
      }
    }
    emit('update:modelValue', [...multipleValues.value, ...newKeys])
    uploadingCount.value = 0
  } else {
    uploading.value = true
    try {
      const result = await uploadFile(props.spaceSlug, files[0])
      uploadedSize.value = result.size
      emit('update:modelValue', result.key)
    } catch (err: any) {
      error.value = err?.message ?? 'Ошибка загрузки'
    } finally {
      uploading.value = false
    }
  }
}

function remove() {
  emit('update:modelValue', null)
  uploadedSize.value = 0
  error.value = ''
}

function removeOne(key: string) {
  const updated = multipleValues.value.filter(k => k !== key)
  delete sizeMap.value[key]
  emit('update:modelValue', updated)
}
</script>

<template>
  <div>
    <input
      ref="fileInput"
      type="file"
      style="display:none"
      :multiple="multiple"
      @change="onFileChange"
    />

    <!-- Multiple mode -->
    <template v-if="multiple">
      <div
        v-for="key in multipleValues"
        :key="key"
        style="display:flex;align-items:center;gap:10px;padding:8px 12px;border:0.5px solid var(--border-default);border-radius:8px;background:var(--bg-0);margin-bottom:4px"
      >
        <NIcon name="file" :size="15" color="var(--fg-2)" />
        <span style="flex:1;font-size:13px;font-family:var(--font-mono);color:var(--fg-1);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
          {{ filename(key) }}
        </span>
        <span v-if="sizeMap[key]" style="font-size:11px;color:var(--fg-3);white-space:nowrap;flex-shrink:0">
          {{ fmtSize(sizeMap[key]) }}
        </span>
        <button
          type="button"
          @click="removeOne(key)"
          style="background:0;border:0;padding:4px;cursor:pointer;color:var(--fg-3);display:flex;border-radius:4px;flex-shrink:0"
        >
          <NIcon name="x" :size="14" />
        </button>
      </div>

      <div
        @click="!uploadingCount && fileInput?.click()"
        @dragenter.prevent="onDragEnter"
        @dragleave.prevent="onDragLeave"
        @dragover.prevent
        @drop.prevent="onDrop"
        :style="{
          border: `1px dashed ${error ? 'var(--red-400,#f87171)' : dragging ? 'var(--brand-primary)' : 'var(--border-strong)'}`,
          borderRadius: '8px',
          padding: '12px 14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          background: dragging ? 'var(--brand-tint)' : 'var(--bg-1)',
          cursor: uploadingCount ? 'default' : 'pointer',
          fontSize: '13px',
          color: 'var(--fg-2)',
          marginTop: multipleValues.length ? '4px' : '0',
          transition: 'background 100ms, border-color 100ms',
        }"
      >
        <span
          v-if="uploadingCount"
          style="width:15px;height:15px;border:2px solid var(--border-strong);border-top-color:var(--brand-primary);border-radius:50%;animation:spin 0.7s linear infinite;flex-shrink:0"
        />
        <NIcon v-else name="upload" :size="15" color="var(--fg-3)" />
        <span v-if="uploadingCount">Загрузка {{ uploadingCount }} {{ pluralFiles(uploadingCount) }}…</span>
        <span v-else>
          Перетащи или <span style="color:var(--brand-primary);font-weight:500">выбери</span>
        </span>
      </div>
    </template>

    <!-- Single mode (unchanged) -->
    <template v-else>
      <div
        v-if="modelValue && !uploading"
        style="display:flex;align-items:center;gap:10px;padding:8px 12px;border:0.5px solid var(--border-default);border-radius:8px;background:var(--bg-0)"
      >
        <NIcon name="file" :size="15" color="var(--fg-2)" />
        <span style="flex:1;font-size:13px;font-family:var(--font-mono);color:var(--fg-1);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
          {{ filename(modelValue as string) }}
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

      <div
        v-else
        @click="!uploading && fileInput?.click()"
        @dragenter.prevent="onDragEnter"
        @dragleave.prevent="onDragLeave"
        @dragover.prevent
        @drop.prevent="onDrop"
        :style="{
          border: `1px dashed ${error ? 'var(--red-400,#f87171)' : dragging ? 'var(--brand-primary)' : 'var(--border-strong)'}`,
          borderRadius: '8px',
          padding: '12px 14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          background: dragging ? 'var(--brand-tint)' : 'var(--bg-1)',
          cursor: uploading ? 'default' : 'pointer',
          fontSize: '13px',
          color: 'var(--fg-2)',
          transition: 'background 100ms, border-color 100ms',
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
    </template>

    <p v-if="error" style="font-size:12px;color:var(--red-600,#dc2626);margin:4px 0 0">{{ error }}</p>
  </div>
</template>
