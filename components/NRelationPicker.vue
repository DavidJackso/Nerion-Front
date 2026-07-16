<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { listRecords } from '~/api/records'
import { getTable } from '~/api/schema'

const props = defineProps<{
  modelValue: number | number[] | null
  spaceSlug: string
  relatedTableSlug: string
  fieldName: string
  many: boolean
}>()

const emit = defineEmits<{ 'update:modelValue': [value: number | number[] | null] }>()

const open = ref(false)
const search = ref('')
const loading = ref(false)
const relatedTableName = ref('')
const inputRef = ref<HTMLInputElement | null>(null)

interface RelRecord { id: number; label: string; sub: string }
const records = ref<RelRecord[]>([])

const selected = computed<number[]>(() => {
  if (props.many) return Array.isArray(props.modelValue) ? props.modelValue : (props.modelValue ? [props.modelValue as number] : [])
  return props.modelValue != null ? [props.modelValue as number] : []
})

const filtered = computed(() =>
  search.value
    ? records.value.filter(r => r.label.toLowerCase().includes(search.value.toLowerCase()))
    : records.value
)

const selCount = computed(() => selected.value.length)
const hasValue = computed(() => selCount.value > 0)

const isChecked = (id: number) => selected.value.includes(id)

function labelById(id: number) {
  return records.value.find(r => r.id === id)?.label ?? String(id)
}


function toggle(id: number) {
  if (props.many) {
    const sel = selected.value
    emit('update:modelValue', sel.includes(id) ? sel.filter(x => x !== id) : [...sel, id])
  } else {
    emit('update:modelValue', id)
    open.value = false
    search.value = ''
  }
}

function remove(id: number) {
  if (props.many) emit('update:modelValue', selected.value.filter(x => x !== id))
  else emit('update:modelValue', null)
}

function openPicker() {
  open.value = true
  setTimeout(() => inputRef.value?.focus(), 40)
}

async function fetchRelated() {
  if (!props.relatedTableSlug || loading.value) return
  loading.value = true
  try {
    const [tableRes, recsRes] = await Promise.all([
      getTable(props.spaceSlug, props.relatedTableSlug),
      listRecords(props.spaceSlug, props.relatedTableSlug, { limit: 200 }),
    ])
    relatedTableName.value = tableRes.name
    const displaySlug = tableRes.fields[0]?.slug ?? 'id'
    const subSlug = tableRes.fields[1]?.slug
    records.value = recsRes.data.map(r => ({
      id: r.id,
      label: String(r[displaySlug] ?? r.id),
      sub: subSlug ? String(r[subSlug] ?? '') : '',
    }))
  } catch {
    records.value = []
  } finally {
    loading.value = false
  }
}

onMounted(fetchRelated)
</script>

<template>
  <div style="position: relative">
    <!-- Label -->
    <label style="font-size: 12px; color: var(--fg-2); font-weight: 500; display: flex; align-items: center; gap: 6px; margin-bottom: 6px">
      {{ fieldName }}
      <NBadge tone="brand">↔ {{ relatedTableName || relatedTableSlug }}</NBadge>
      <NBadge v-if="many" tone="neutral">список</NBadge>
    </label>

    <!-- Trigger -->
    <div @click="openPicker" :style="{
      minHeight: '38px',
      border: `0.5px solid ${open ? 'var(--purple-400)' : 'var(--purple-200)'}`,
      borderRadius: '8px',
      padding: '5px 34px 5px 8px',
      background: 'var(--brand-tint)',
      cursor: 'pointer',
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: '5px',
      boxShadow: open ? 'var(--ring-focus)' : 'none',
      transition: 'box-shadow 140ms, border-color 140ms',
    }">
      <!-- Single: avatar + name -->
      <span v-if="!many && selected.length" style="display: inline-flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 500; color: var(--purple-800)">
        <span :style="{ width: '28px', height: '28px', borderRadius: '7px', background: avatarHue(labelById(selected[0])).bg, display: 'grid', placeItems: 'center', fontSize: '10px', fontWeight: '700', color: avatarHue(labelById(selected[0])).fg, flexShrink: '0' }">
          {{ initials(labelById(selected[0])) }}
        </span>
        {{ labelById(selected[0]) }}
      </span>

      <!-- Many: pills -->
      <span v-if="many" v-for="id in selected" :key="id"
        style="display: inline-flex; align-items: center; gap: 4px; padding: 3px 4px 3px 8px; border-radius: 999px; background: var(--purple-100); border: 0.5px solid var(--purple-200); font-size: 12px; font-weight: 500; color: var(--purple-800); white-space: nowrap">
        {{ labelById(id) }}
        <button @click.stop="remove(id)" style="background: none; border: 0; cursor: pointer; color: var(--purple-500); padding: 2px; display: flex; border-radius: 50%; line-height: 0">
          <NIcon name="x" :size="11" />
        </button>
      </span>

      <span v-if="!hasValue" style="font-size: 13px; color: var(--fg-3)">
        {{ many ? `Выбери из «${relatedTableName || relatedTableSlug}»…` : 'Выбери запись…' }}
      </span>

      <!-- Clear single -->
      <button v-if="!many && selected.length" @click.stop="remove(selected[0])"
        style="position: absolute; right: 30px; top: 50%; transform: translateY(-50%); background: none; border: 0; cursor: pointer; color: var(--purple-400); padding: 3px; display: flex; border-radius: 4px">
        <NIcon name="x" :size="13" />
      </button>

      <NIcon name="chevd" :size="11" color="var(--purple-500)"
        :style="{ position: 'absolute', right: '10px', top: '50%', transform: `translateY(-50%) rotate(${open ? 180 : 0}deg)`, pointerEvents: 'none', transition: 'transform 140ms' }" />
    </div>

    <!-- Dropdown -->
    <template v-if="open">
      <div @click="open = false; search = ''" style="position: fixed; inset: 0; z-index: 40" />
      <div style="position: absolute; top: calc(100% + 4px); left: 0; right: 0; z-index: 41; background: var(--bg-0); border: 0.5px solid var(--border-default); border-radius: 10px; box-shadow: var(--shadow-3); overflow: hidden">
        <!-- Search bar -->
        <div style="padding: 8px 10px; border-bottom: 0.5px solid var(--border-default); display: flex; align-items: center; gap: 7px">
          <NIcon name="search" :size="13" color="var(--fg-3)" />
          <input ref="inputRef" v-model="search"
            :placeholder="`Поиск в «${relatedTableName || relatedTableSlug}»…`"
            style="flex: 1; border: 0; outline: 0; font-size: 13px; color: var(--fg-1); background: transparent; font-family: inherit" />
          <button v-if="search" @click="search = ''" style="background: none; border: 0; cursor: pointer; color: var(--fg-3); padding: 2px; display: flex">
            <NIcon name="x" :size="12" />
          </button>
        </div>

        <!-- Record list -->
        <div style="max-height: 224px; overflow: auto">
          <div v-if="loading" style="padding: 16px 14px; text-align: center; font-size: 12px; color: var(--fg-3)"><NSpinner :size="13" label="Загрузка…" /></div>
          <div v-else-if="!filtered.length" style="padding: 16px 14px; text-align: center; font-size: 12px; color: var(--fg-3)">Ничего не найдено</div>
          <button v-else v-for="rec in filtered" :key="rec.id" @click="toggle(rec.id)"
            :style="{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', border: '0', cursor: 'pointer', background: isChecked(rec.id) ? 'var(--brand-tint)' : 'transparent', fontFamily: 'inherit', textAlign: 'left', transition: 'background 80ms' }">
            <span :style="{ width: '28px', height: '28px', borderRadius: '7px', background: avatarHue(rec.label).bg, display: 'grid', placeItems: 'center', fontSize: '10px', fontWeight: '700', color: avatarHue(rec.label).fg, flexShrink: '0', letterSpacing: '-0.01em' }">
              {{ initials(rec.label) }}
            </span>
            <div style="flex: 1; min-width: 0">
              <div :style="{ fontSize: '13px', fontWeight: isChecked(rec.id) ? '600' : '400', color: isChecked(rec.id) ? 'var(--purple-800)' : 'var(--fg-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }">
                {{ rec.label }}
              </div>
              <div v-if="rec.sub" style="font-size: 11px; color: var(--fg-3); margin-top: 1px">{{ rec.sub }}</div>
            </div>
            <!-- Checkbox (many) / checkmark (one) -->
            <span v-if="many" :style="{ width: '16px', height: '16px', borderRadius: '4px', border: `1.5px solid ${isChecked(rec.id) ? 'var(--brand-primary)' : 'var(--border-strong)'}`, background: isChecked(rec.id) ? 'var(--brand-primary)' : 'transparent', display: 'grid', placeItems: 'center', flexShrink: '0', transition: 'all 100ms' }">
              <NIcon v-if="isChecked(rec.id)" name="check" :size="10" color="#fff" />
            </span>
            <span v-else style="width: 20px; display: flex; justify-content: center">
              <NIcon v-if="isChecked(rec.id)" name="check" :size="14" color="var(--purple-600)" />
            </span>
          </button>
        </div>

        <!-- Footer -->
        <div style="padding: 8px 12px; border-top: 0.5px solid var(--border-default); display: flex; align-items: center; gap: 8px">
          <span style="font-size: 11px; color: var(--fg-3); flex: 1">
            {{ many ? `Выбрано: ${selCount} из ${records.length}` : `${records.length} записей` }}
          </span>
          <button v-if="many && selCount > 0" @click="emit('update:modelValue', [])"
            style="background: none; border: 0; cursor: pointer; color: var(--fg-3); font-size: 12px; font-family: inherit">Сбросить</button>
          <button v-if="many" @click="open = false; search = ''"
            style="height: 26px; padding: 0 14px; border: 0; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 600; font-family: inherit; background: var(--brand-primary); color: #fff">
            {{ selCount > 0 ? `Готово · ${selCount}` : 'Готово' }}
          </button>
        </div>
      </div>
    </template>

    <p style="font-size: 11px; color: var(--fg-3); margin-top: 5px; margin-bottom: 0">Выбирается из связанной таблицы, не вводится вручную.</p>
  </div>
</template>
