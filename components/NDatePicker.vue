<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'

const MONTHS = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь']
const MONTHS_SHORT = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек']
const DAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

defineOptions({ inheritAttrs: false })

const props = defineProps<{
  modelValue?: string
  type?: 'date' | 'datetime'
  placeholder?: string
  disabled?: boolean
  error?: string
  size?: 'sm' | 'md'
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string | undefined]
}>()

const open = ref(false)
const mode = ref<'days' | 'years'>('days')
const triggerRef = ref<HTMLElement | null>(null)
const dropRef = ref<HTMLElement | null>(null)
const dropPos = ref<{ top: number; left: number }>({ top: 0, left: 0 })
const hovered = ref(false)

const tempDate = ref<string | null>(null)
const tempHH = ref(0)
const tempMM = ref(0)

const now = new Date()
const todayY = now.getFullYear()
const todayM = now.getMonth()
const todayD = now.getDate()

function parseIso(s: string) {
  const [datePart, timePart] = s.split('T')
  const [y, m, d] = datePart.split('-').map(Number)
  const [hh, mm] = timePart ? timePart.split(':').map(Number) : [0, 0]
  return { y, m: m - 1, d, hh, mm }
}

const parsed = computed(() => props.modelValue ? parseIso(props.modelValue) : null)

const viewYear = ref(parsed.value?.y ?? todayY)
const viewMonth = ref(parsed.value?.m ?? todayM)

const h = computed(() => props.size === 'sm' ? '30px' : '36px')
const fs = computed(() => props.size === 'sm' ? '12px' : '14px')

const displayValue = computed(() => {
  if (!props.modelValue) return ''
  const p = parseIso(props.modelValue)
  const base = `${p.d} ${MONTHS_SHORT[p.m]} ${p.y}`
  if (props.type === 'datetime') {
    return `${base}, ${String(p.hh).padStart(2, '0')}:${String(p.mm).padStart(2, '0')}`
  }
  return base
})

const grid = computed(() => {
  const y = viewYear.value
  const m = viewMonth.value
  const firstDay = new Date(y, m, 1)
  const lastDay = new Date(y, m + 1, 0)

  let startDow = firstDay.getDay() - 1
  if (startDow < 0) startDow = 6

  const cells: { day: number; y: number; m: number; outside: boolean }[] = []

  const prevLast = new Date(y, m, 0)
  const pm = m === 0 ? 11 : m - 1
  const py = m === 0 ? y - 1 : y
  for (let i = startDow - 1; i >= 0; i--) {
    cells.push({ day: prevLast.getDate() - i, y: py, m: pm, outside: true })
  }

  for (let d = 1; d <= lastDay.getDate(); d++) {
    cells.push({ day: d, y, m, outside: false })
  }

  const nm = m === 11 ? 0 : m + 1
  const ny = m === 11 ? y + 1 : y
  let nd = 1
  while (cells.length < 42) {
    cells.push({ day: nd++, y: ny, m: nm, outside: true })
  }

  return cells
})

const yearsGrid = computed(() => {
  const years: number[] = []
  for (let i = viewYear.value - 6; i <= viewYear.value + 6; i++) years.push(i)
  return years
})

function isSelected(cell: { day: number; y: number; m: number }) {
  if (!parsed.value) return false
  return cell.y === parsed.value.y && cell.m === parsed.value.m && cell.day === parsed.value.d
}

function isToday(cell: { day: number; y: number; m: number }) {
  return cell.y === todayY && cell.m === todayM && cell.day === todayD
}

function isoDate(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

function pickDay(cell: { day: number; y: number; m: number }) {
  const dateStr = isoDate(cell.y, cell.m, cell.day)
  if (props.type === 'datetime') {
    tempDate.value = dateStr
    tempHH.value = parsed.value?.hh ?? 0
    tempMM.value = parsed.value?.mm ?? 0
  } else {
    emit('update:modelValue', dateStr)
    open.value = false
  }
}

function confirmTime() {
  if (!tempDate.value) return
  emit('update:modelValue', `${tempDate.value}T${String(tempHH.value).padStart(2, '0')}:${String(tempMM.value).padStart(2, '0')}`)
  open.value = false
  tempDate.value = null
}

function prevMonth() {
  if (viewMonth.value === 0) { viewMonth.value = 11; viewYear.value-- }
  else viewMonth.value--
}

function nextMonth() {
  if (viewMonth.value === 11) { viewMonth.value = 0; viewYear.value++ }
  else viewMonth.value++
}

function pickYear(y: number) {
  viewYear.value = y
  mode.value = 'days'
}

function toggle() {
  if (props.disabled) return
  open.value = !open.value
  if (open.value) {
    tempDate.value = null
    mode.value = 'days'
    viewYear.value = parsed.value?.y ?? todayY
    viewMonth.value = parsed.value?.m ?? todayM
    nextTick(position)
  }
}

function clear(e: MouseEvent) {
  e.stopPropagation()
  emit('update:modelValue', undefined)
}

function position() {
  const r = triggerRef.value?.getBoundingClientRect()
  if (!r) return
  dropPos.value = { top: r.bottom + 4, left: r.left }
}

function outside(e: MouseEvent) {
  if (!open.value) return
  if (triggerRef.value?.contains(e.target as Node) || dropRef.value?.contains(e.target as Node)) return
  open.value = false
}

function onEsc(e: KeyboardEvent) {
  if (e.key === 'Escape' && open.value) open.value = false
}

onMounted(() => {
  document.addEventListener('mousedown', outside)
  document.addEventListener('keydown', onEsc)
})
onUnmounted(() => {
  document.removeEventListener('mousedown', outside)
  document.removeEventListener('keydown', onEsc)
})
</script>

<template>
  <div style="display: flex; flex-direction: column; gap: 4px; width: 100%">
    <div
      ref="triggerRef"
      class="ndp-trigger"
      :class="{ 'ndp-open': open, 'ndp-error': !!error }"
      :style="{ height: h, opacity: disabled ? 0.5 : 1, cursor: disabled ? 'not-allowed' : 'pointer' }"
      @click="toggle"
      @mouseenter="hovered = true"
      @mouseleave="hovered = false"
    >
      <span :style="{ fontSize: fs, color: displayValue ? 'var(--fg-1)' : 'var(--fg-3)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }">
        {{ displayValue || placeholder || '—' }}
      </span>
      <NIcon
        v-if="modelValue && hovered"
        name="x"
        :size="12"
        color="var(--fg-3)"
        style="cursor: pointer; flex-shrink: 0"
        @click="clear"
      />
    </div>
    <div v-if="error" style="font-size: 11px; color: var(--danger-fg)">{{ error }}</div>

    <Teleport to="body">
      <div
        v-if="open"
        ref="dropRef"
        class="ndp-drop"
        :style="{ top: dropPos.top + 'px', left: dropPos.left + 'px' }"
      >
        <template v-if="!tempDate">
          <div class="ndp-header">
            <button class="ndp-nav" @click="prevMonth">
              <NIcon name="chev" :size="14" color="var(--fg-2)" style="transform: rotate(180deg)" />
            </button>
            <button class="ndp-month-label" @click="mode = mode === 'years' ? 'days' : 'years'">
              {{ mode === 'days' ? `${MONTHS[viewMonth]} ${viewYear}` : viewYear }}
            </button>
            <button class="ndp-nav" @click="nextMonth">
              <NIcon name="chev" :size="14" color="var(--fg-2)" />
            </button>
          </div>

          <template v-if="mode === 'years'">
            <div class="ndp-years">
              <button
                v-for="y in yearsGrid"
                :key="y"
                class="ndp-year"
                :class="{ 'ndp-year-sel': y === viewYear }"
                @click="pickYear(y)"
              >{{ y }}</button>
            </div>
          </template>

          <template v-else>
            <div class="ndp-weekdays">
              <span v-for="d in DAYS" :key="d" class="ndp-wd">{{ d }}</span>
            </div>
            <div class="ndp-grid">
              <button
                v-for="(cell, i) in grid"
                :key="i"
                class="ndp-day"
                :class="{
                  'ndp-outside': cell.outside,
                  'ndp-today': isToday(cell),
                  'ndp-selected': isSelected(cell),
                }"
                @click="pickDay(cell)"
              >{{ cell.day }}</button>
            </div>
          </template>
        </template>

        <template v-else>
          <div class="ndp-time-back">
            <button class="ndp-nav" @click="tempDate = null">
              <NIcon name="chev" :size="14" color="var(--fg-2)" style="transform: rotate(180deg)" />
            </button>
            <span style="font-size: 13px; color: var(--fg-1); font-weight: 500">{{ tempDate }}</span>
          </div>
          <div class="ndp-time">
            <div class="ndp-time-col">
              <button class="ndp-time-btn" @click="tempHH = (tempHH + 1) % 24">▲</button>
              <input
                class="ndp-time-input"
                type="number"
                min="0"
                max="23"
                :value="String(tempHH).padStart(2, '0')"
                @change="tempHH = Math.max(0, Math.min(23, +($event.target as HTMLInputElement).value))"
              />
              <button class="ndp-time-btn" @click="tempHH = (tempHH - 1 + 24) % 24">▼</button>
            </div>
            <span style="font-size: 22px; color: var(--fg-3); line-height: 1; align-self: center; padding-bottom: 2px">:</span>
            <div class="ndp-time-col">
              <button class="ndp-time-btn" @click="tempMM = (tempMM + 1) % 60">▲</button>
              <input
                class="ndp-time-input"
                type="number"
                min="0"
                max="59"
                :value="String(tempMM).padStart(2, '0')"
                @change="tempMM = Math.max(0, Math.min(59, +($event.target as HTMLInputElement).value))"
              />
              <button class="ndp-time-btn" @click="tempMM = (tempMM - 1 + 60) % 60">▼</button>
            </div>
          </div>
          <div style="padding: 0 8px 8px">
            <NButton variant="primary" size="sm" style="width: 100%" @click="confirmTime">Готово</NButton>
          </div>
        </template>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.ndp-trigger {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 8px 0 12px;
  border-radius: 6px;
  border: 0.5px solid var(--border-strong);
  background: var(--bg-0);
  box-sizing: border-box;
  width: 100%;
  transition: border-color 120ms, box-shadow 120ms;
  user-select: none;
}
.ndp-trigger:hover {
  border-color: var(--border-focus);
}
.ndp-open {
  border-color: var(--border-focus);
  box-shadow: var(--ring-focus);
}
.ndp-error {
  border-color: var(--danger-solid) !important;
}
.ndp-drop {
  position: fixed;
  width: 260px;
  background: var(--bg-0);
  border: 0.5px solid var(--border-strong);
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
  padding: 8px;
  z-index: 9999;
  box-sizing: border-box;
}
.ndp-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}
.ndp-nav {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  border-radius: 5px;
  cursor: pointer;
  transition: background 80ms;
  flex-shrink: 0;
}
.ndp-nav:hover {
  background: var(--bg-2);
}
.ndp-month-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--fg-1);
  border: none;
  background: transparent;
  cursor: pointer;
  border-radius: 5px;
  padding: 4px 8px;
  transition: background 80ms;
  font-family: inherit;
  flex: 1;
  text-align: center;
}
.ndp-month-label:hover {
  background: var(--bg-2);
}
.ndp-weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  margin-bottom: 2px;
}
.ndp-wd {
  text-align: center;
  font-size: 10px;
  font-weight: 600;
  color: var(--fg-3);
  padding: 4px 0;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}
.ndp-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 1px;
}
.ndp-day {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 32px;
  border: none;
  background: transparent;
  border-radius: 5px;
  font-size: 13px;
  color: var(--fg-1);
  cursor: pointer;
  transition: background 80ms;
  font-family: inherit;
  position: relative;
}
.ndp-day:hover {
  background: var(--bg-2);
}
.ndp-outside {
  color: var(--fg-3);
}
.ndp-today::after {
  content: '';
  position: absolute;
  bottom: 3px;
  left: 50%;
  transform: translateX(-50%);
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: var(--brand-primary);
}
.ndp-selected {
  background: var(--brand-tint) !important;
  color: var(--brand-primary) !important;
  font-weight: 600;
}
.ndp-years {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 2px;
  padding: 4px 0;
}
.ndp-year {
  padding: 6px 4px;
  border: none;
  background: transparent;
  border-radius: 5px;
  font-size: 13px;
  color: var(--fg-1);
  cursor: pointer;
  transition: background 80ms;
  font-family: inherit;
  text-align: center;
}
.ndp-year:hover {
  background: var(--bg-2);
}
.ndp-year-sel {
  background: var(--brand-tint);
  color: var(--brand-primary);
  font-weight: 600;
}
.ndp-time-back {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  padding: 0 4px;
}
.ndp-time {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 0 12px 12px;
}
.ndp-time-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}
.ndp-time-btn {
  width: 52px;
  height: 22px;
  border: 0.5px solid var(--border-strong);
  background: var(--bg-0);
  border-radius: 4px;
  cursor: pointer;
  font-size: 10px;
  color: var(--fg-2);
  transition: background 80ms;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: inherit;
}
.ndp-time-btn:hover {
  background: var(--bg-2);
}
.ndp-time-input {
  width: 52px;
  height: 40px;
  text-align: center;
  border: 0.5px solid var(--border-strong);
  border-radius: 6px;
  background: var(--bg-0);
  color: var(--fg-1);
  font-size: 20px;
  font-weight: 500;
  font-family: inherit;
  outline: none;
  transition: border-color 120ms, box-shadow 120ms;
}
.ndp-time-input:focus {
  border-color: var(--border-focus);
  box-shadow: var(--ring-focus);
}
.ndp-time-input::-webkit-outer-spin-button,
.ndp-time-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
}
.ndp-time-input[type=number] {
  -moz-appearance: textfield;
}
</style>
