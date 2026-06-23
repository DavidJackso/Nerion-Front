# NDatePicker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace native `<input type="datetime-local">` / `<input type="date">` with a styled custom `NDatePicker` component that matches the Nerion design system.

**Architecture:** Single `NDatePicker.vue` primitive component with a trigger div (NInput-styled), a Teleport-to-body dropdown containing a calendar grid and optional time scroll wheels. Value stored as `{ date: 'YYYY-MM-DD', time?: 'HH:MM' } | null`.

**Tech Stack:** Vue 3, Nuxt, CSS variables from `src/style.css`, existing primitives `NButton.vue` and `NIcon.vue`.

## Global Constraints

- All design tokens via CSS variables — never hardcode colors
- Font: `var(--font-sans)`, monospace only for code fields
- Border radius: 6–10px; match NInput exactly for the trigger
- Russian locale: month names, day-of-week abbreviations (Пн–Вс), button labels
- `mode='date'` → calendar only, closes on day select; `mode='datetime'` → calendar + time wheels, stays open
- v-model type: `{ date: string, time?: string } | null` where `date='YYYY-MM-DD'` and `time='HH:MM'`
- No external dependencies — pure Vue 3

---

### Task 1: Add icons to NIcon.vue

**Files:**
- Modify: `Nerion-Front/src/components/primitives/NIcon.vue`

**Interfaces:**
- Produces: `<NIcon name="calendar" />`, `<NIcon name="chevl" />`

- [ ] **Step 1: Add two icon paths to the `paths` object in NIcon.vue**

Open `Nerion-Front/src/components/primitives/NIcon.vue`. Inside the `paths` object (after the last entry, e.g. after `upload`), add:

```js
  calendar: '<rect width="18" height="18" x="3" y="4" rx="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/>',
  chevl:    '<polyline points="15 18 9 12 15 6"/>',
```

- [ ] **Step 2: Manual verify**

Run `npm run dev` from `Nerion-Front/`. Open the app. In browser console run:
```js
// No assertion needed — if NIcon renders without blank SVG, icons are wired.
// The component will be tested visually in Task 3.
```
Expected: app starts without errors.

- [ ] **Step 3: Commit**

```bash
git -C Nerion-Front add src/components/primitives/NIcon.vue
git -C Nerion-Front commit -m "feat(icon): add calendar and chevl icons"
```

---

### Task 2: Create NDatePicker.vue

**Files:**
- Create: `Nerion-Front/src/components/primitives/NDatePicker.vue`

**Interfaces:**
- Consumes: `NIcon` (names: `calendar`, `chevl`, `chev`), `NButton` (variants: `ghost`, size: `sm`)
- Produces:
  ```ts
  // Props
  modelValue: { date: string, time?: string } | null
  mode: 'date' | 'datetime'   // default 'datetime'
  placeholder: string          // default ''
  error: string                // default ''
  disabled: boolean            // default false
  // Emits
  'update:modelValue': (val: { date: string, time?: string } | null) => void
  ```

- [ ] **Step 1: Create the file with full implementation**

Create `Nerion-Front/src/components/primitives/NDatePicker.vue` with the following content:

```vue
<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import NIcon from './NIcon.vue'
import NButton from './NButton.vue'

const props = defineProps({
  modelValue: { type: Object, default: null },
  mode:        { type: String,  default: 'datetime' },
  placeholder: { type: String,  default: '' },
  error:       { type: String,  default: '' },
  disabled:    { type: Boolean, default: false },
})
const emit = defineEmits(['update:modelValue'])

// ── State ──────────────────────────────────────────────────────
const open       = ref(false)
const triggerRef = ref(null)
const dropRef    = ref(null)
const dropPos    = ref({ top: 0, left: 0 })

const viewYear  = ref(new Date().getFullYear())
const viewMonth = ref(new Date().getMonth())   // 0-11
const selHour   = ref(0)
const selMin    = ref(0)
const hourRef   = ref(null)
const minRef    = ref(null)

const ITEM_H  = 32
const VISIBLE = 5
const PAD     = 2   // spacer items top + bottom so first/last items can center

const MONTHS_RU = ['Январь','Февраль','Март','Апрель','Май','Июнь',
                   'Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь']
const DAYS_RU   = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс']

// ── Sync modelValue → internal state ──────────────────────────
watch(() => props.modelValue, (val) => {
  if (!val) return
  if (val.date) {
    const [y, m] = val.date.split('-').map(Number)
    viewYear.value  = y
    viewMonth.value = m - 1
  }
  if (val.time) {
    const [h, min] = val.time.split(':').map(Number)
    selHour.value = h
    selMin.value  = min
  }
}, { immediate: true })

// ── Display ────────────────────────────────────────────────────
const displayValue = computed(() => {
  const v = props.modelValue
  if (!v?.date) return ''
  const [y, m, d] = v.date.split('-')
  if (props.mode === 'date') return `${d}.${m}.${y}`
  const t = v.time || '00:00'
  return `${d}.${m}.${y} ${t}`
})

const placeholderText = computed(() =>
  props.placeholder || (props.mode === 'date' ? 'ДД.ММ.ГГГГ' : 'ДД.ММ.ГГГГ --:--')
)

// ── Calendar ───────────────────────────────────────────────────
const todayStr   = new Date().toISOString().split('T')[0]
const monthLabel = computed(() => `${MONTHS_RU[viewMonth.value]} ${viewYear.value}`)

function dayKey(d) {
  return `${d.year}-${String(d.month + 1).padStart(2, '0')}-${String(d.day).padStart(2, '0')}`
}

const calendarDays = computed(() => {
  const year  = viewYear.value
  const month = viewMonth.value
  const first = new Date(year, month, 1)
  const last  = new Date(year, month + 1, 0)

  let startDow = first.getDay() - 1
  if (startDow < 0) startDow = 6

  const prevM   = month === 0  ? 11 : month - 1
  const prevY   = month === 0  ? year - 1 : year
  const nextM   = month === 11 ? 0  : month + 1
  const nextY   = month === 11 ? year + 1 : year
  const prevEnd = new Date(year, month, 0).getDate()

  const days = []
  for (let i = startDow - 1; i >= 0; i--)
    days.push({ day: prevEnd - i, month: prevM, year: prevY, other: true })
  for (let d = 1; d <= last.getDate(); d++)
    days.push({ day: d, month, year, other: false })
  let nx = 1
  while (days.length < 42)
    days.push({ day: nx++, month: nextM, year: nextY, other: true })

  return days
})

const isSelected = (d) => dayKey(d) === props.modelValue?.date
const isToday    = (d) => dayKey(d) === todayStr

function prevMonth() {
  if (viewMonth.value === 0) { viewMonth.value = 11; viewYear.value-- }
  else viewMonth.value--
}
function nextMonth() {
  if (viewMonth.value === 11) { viewMonth.value = 0; viewYear.value++ }
  else viewMonth.value++
}

function selectDay(d) {
  if (d.other) { viewYear.value = d.year; viewMonth.value = d.month }
  const val = { date: dayKey(d) }
  if (props.mode === 'datetime')
    val.time = `${String(selHour.value).padStart(2,'0')}:${String(selMin.value).padStart(2,'0')}`
  emit('update:modelValue', val)
  if (props.mode === 'date') close()
}

function setToday() {
  const t    = new Date()
  const date = t.toISOString().split('T')[0]
  viewYear.value  = t.getFullYear()
  viewMonth.value = t.getMonth()
  const val = { date }
  if (props.mode === 'datetime')
    val.time = `${String(selHour.value).padStart(2,'0')}:${String(selMin.value).padStart(2,'0')}`
  emit('update:modelValue', val)
}

function clearValue() {
  emit('update:modelValue', null)
  close()
}

// ── Time wheels ────────────────────────────────────────────────
function emitTime(h, m) {
  if (!props.modelValue?.date) return
  emit('update:modelValue', {
    date: props.modelValue.date,
    time: `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`,
  })
}

function scrollTo(el, idx, behavior = 'smooth') {
  if (!el) return
  el.scrollTo({ top: idx * ITEM_H, behavior })
}

let hourTimer = null
let minTimer  = null

function onHourScroll() {
  clearTimeout(hourTimer)
  hourTimer = setTimeout(() => {
    const idx = Math.round(hourRef.value.scrollTop / ITEM_H)
    selHour.value = Math.max(0, Math.min(23, idx))
    emitTime(selHour.value, selMin.value)
  }, 120)
}

function onMinScroll() {
  clearTimeout(minTimer)
  minTimer = setTimeout(() => {
    const idx = Math.round(minRef.value.scrollTop / ITEM_H)
    selMin.value = Math.max(0, Math.min(59, idx))
    emitTime(selHour.value, selMin.value)
  }, 120)
}

function pickHour(h) {
  selHour.value = h
  scrollTo(hourRef.value, h)
  emitTime(h, selMin.value)
}

function pickMin(m) {
  selMin.value = m
  scrollTo(minRef.value, m)
  emitTime(selHour.value, m)
}

// ── Dropdown ───────────────────────────────────────────────────
function updatePos() {
  if (!triggerRef.value) return
  const r = triggerRef.value.getBoundingClientRect()
  dropPos.value = {
    top:  r.bottom + window.scrollY + 4,
    left: r.left   + window.scrollX,
  }
}

function close() { open.value = false }

function toggle() {
  if (props.disabled) return
  if (open.value) { close(); return }
  open.value = true
  nextTick(() => {
    updatePos()
    if (props.mode === 'datetime') {
      nextTick(() => {
        scrollTo(hourRef.value, selHour.value, 'instant')
        scrollTo(minRef.value,  selMin.value,  'instant')
      })
    }
  })
}

function onOutside(e) {
  if (!open.value) return
  if (triggerRef.value?.contains(e.target)) return
  if (dropRef.value?.contains(e.target))    return
  close()
}

onMounted(()  => document.addEventListener('mousedown', onOutside))
onUnmounted(() => document.removeEventListener('mousedown', onOutside))
</script>

<template>
  <div style="position:relative;width:100%">

    <!-- ── Trigger ─────────────────────────────────────────── -->
    <div
      ref="triggerRef"
      @click="toggle"
      :style="{
        display: 'flex', alignItems: 'center', gap: '8px',
        height: '36px', padding: '0 12px', borderRadius: '6px',
        border: `0.5px solid ${error ? 'var(--danger-solid)' : open ? 'var(--border-focus)' : 'var(--border-strong)'}`,
        boxShadow: open ? 'var(--ring-focus)' : 'none',
        background: 'var(--bg-0)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        userSelect: 'none',
        transition: 'border-color 120ms, box-shadow 120ms',
        boxSizing: 'border-box', width: '100%',
      }"
    >
      <span :style="{
        flex: 1, fontSize: '14px', lineHeight: '36px',
        color: displayValue ? 'var(--fg-1)' : 'var(--fg-3)',
        fontFamily: 'var(--font-sans)',
      }">{{ displayValue || placeholderText }}</span>
      <NIcon name="calendar" :size="15" color="var(--fg-3)" />
    </div>

    <div v-if="error" style="font-size:11px;color:var(--danger-fg);margin-top:4px">{{ error }}</div>

    <!-- ── Dropdown ────────────────────────────────────────── -->
    <Teleport to="body">
      <Transition name="dp">
        <div
          v-if="open"
          ref="dropRef"
          :style="{
            position: 'absolute',
            top:  dropPos.top  + 'px',
            left: dropPos.left + 'px',
            zIndex: 9999,
            background: 'var(--bg-0)',
            border: '0.5px solid var(--border-default)',
            borderRadius: '10px',
            boxShadow: 'var(--shadow-3)',
            display: 'flex', flexDirection: 'column',
            overflow: 'hidden',
          }"
        >
          <div style="display:flex">

            <!-- Calendar -->
            <div style="padding:12px;flex:1;min-width:240px">
              <!-- Month header -->
              <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
                <span style="font-size:13px;font-weight:600;color:var(--fg-1)">{{ monthLabel }}</span>
                <div style="display:flex;gap:2px">
                  <button
                    @click.stop="prevMonth"
                    style="background:none;border:none;cursor:pointer;padding:4px;border-radius:4px;display:flex;align-items:center;color:var(--fg-2)"
                  ><NIcon name="chevl" :size="14" /></button>
                  <button
                    @click.stop="nextMonth"
                    style="background:none;border:none;cursor:pointer;padding:4px;border-radius:4px;display:flex;align-items:center;color:var(--fg-2)"
                  ><NIcon name="chev" :size="14" /></button>
                </div>
              </div>

              <!-- Day-of-week headers -->
              <div style="display:grid;grid-template-columns:repeat(7,32px);gap:1px;margin-bottom:2px">
                <div
                  v-for="lbl in DAYS_RU" :key="lbl"
                  style="height:28px;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:600;color:var(--fg-3)"
                >{{ lbl }}</div>
              </div>

              <!-- Day grid -->
              <div style="display:grid;grid-template-columns:repeat(7,32px);gap:1px">
                <button
                  v-for="(d, i) in calendarDays" :key="i"
                  @click.stop="selectDay(d)"
                  :style="{
                    width:'32px', height:'32px', borderRadius:'6px',
                    border: isToday(d) && !isSelected(d) ? '1.5px solid var(--brand-primary)' : 'none',
                    background: isSelected(d) ? 'var(--brand-primary)' : 'transparent',
                    color: isSelected(d) ? '#fff' : d.other ? 'var(--fg-mute)' : 'var(--fg-1)',
                    cursor: 'pointer', fontSize: '13px',
                    fontWeight: isSelected(d) ? 600 : 400,
                    display:'flex', alignItems:'center', justifyContent:'center',
                    transition:'background 100ms',
                    fontFamily:'var(--font-sans)',
                  }"
                >{{ d.day }}</button>
              </div>
            </div>

            <!-- Time wheels (datetime only) -->
            <div
              v-if="mode === 'datetime'"
              style="display:flex;align-items:center;border-left:0.5px solid var(--border-default);padding:8px 6px;gap:2px"
            >
              <!-- Hours -->
              <div
                ref="hourRef"
                @scroll="onHourScroll"
                :style="{
                  width: '44px',
                  height: (VISIBLE * ITEM_H) + 'px',
                  overflowY: 'scroll',
                  scrollSnapType: 'y mandatory',
                  scrollbarWidth: 'none',
                }"
              >
                <div :style="{ height: PAD * ITEM_H + 'px' }" />
                <div
                  v-for="h in 24" :key="h-1"
                  @click.stop="pickHour(h - 1)"
                  :style="{
                    height: ITEM_H + 'px', width: '100%',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    scrollSnapAlign: 'start',
                    fontSize: '14px',
                    fontWeight: selHour === h-1 ? 600 : 400,
                    color: selHour === h-1 ? 'var(--brand-primary)' : 'var(--fg-2)',
                    borderRadius: '4px',
                    background: selHour === h-1 ? 'var(--brand-tint)' : 'transparent',
                    cursor: 'pointer',
                    transition: 'color 80ms, background 80ms',
                    fontFamily: 'var(--font-sans)',
                  }"
                >{{ String(h - 1).padStart(2, '0') }}</div>
                <div :style="{ height: PAD * ITEM_H + 'px' }" />
              </div>

              <!-- Colon separator -->
              <div style="font-size:14px;font-weight:600;color:var(--fg-3);padding:0 2px;align-self:center">:</div>

              <!-- Minutes -->
              <div
                ref="minRef"
                @scroll="onMinScroll"
                :style="{
                  width: '44px',
                  height: (VISIBLE * ITEM_H) + 'px',
                  overflowY: 'scroll',
                  scrollSnapType: 'y mandatory',
                  scrollbarWidth: 'none',
                }"
              >
                <div :style="{ height: PAD * ITEM_H + 'px' }" />
                <div
                  v-for="m in 60" :key="m-1"
                  @click.stop="pickMin(m - 1)"
                  :style="{
                    height: ITEM_H + 'px', width: '100%',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    scrollSnapAlign: 'start',
                    fontSize: '14px',
                    fontWeight: selMin === m-1 ? 600 : 400,
                    color: selMin === m-1 ? 'var(--brand-primary)' : 'var(--fg-2)',
                    borderRadius: '4px',
                    background: selMin === m-1 ? 'var(--brand-tint)' : 'transparent',
                    cursor: 'pointer',
                    transition: 'color 80ms, background 80ms',
                    fontFamily: 'var(--font-sans)',
                  }"
                >{{ String(m - 1).padStart(2, '0') }}</div>
                <div :style="{ height: PAD * ITEM_H + 'px' }" />
              </div>
            </div>

          </div>

          <!-- Footer -->
          <div style="display:flex;justify-content:space-between;padding:6px 10px;border-top:0.5px solid var(--border-default)">
            <NButton variant="ghost" size="sm" @click.stop="clearValue">Удалить</NButton>
            <NButton variant="ghost" size="sm" @click.stop="setToday">Сегодня</NButton>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.dp-enter-active, .dp-leave-active { transition: opacity 120ms, transform 120ms; }
.dp-enter-from, .dp-leave-to       { opacity: 0; transform: translateY(-4px) scale(0.98); }

/* hide scrollbar in webkit */
div::-webkit-scrollbar { display: none; }
</style>
```

- [ ] **Step 2: Manual verify — component compiles**

```bash
cd Nerion-Front && npm run typecheck
```
Expected: no errors related to NDatePicker.

- [ ] **Step 3: Commit**

```bash
git -C Nerion-Front add src/components/primitives/NDatePicker.vue
git -C Nerion-Front commit -m "feat(ui): add NDatePicker custom date/datetime picker component"
```

---

### Task 3: Integrate NDatePicker into DataTableView

**Files:**
- Modify: `Nerion-Front/src/views/data/DataTableView.vue`

**Interfaces:**
- Consumes: `NDatePicker` from `@/components/primitives/NDatePicker.vue`
  - props: `model-value`, `mode`, `placeholder`, `error`, `disabled`
  - emits: `update:modelValue` with `{ date, time? } | null`
- The existing `createVals[f.slug]` stores strings; the integration must convert between `{ date, time }` and the string format expected by the API.

**Note on value conversion:** The current `createVals` stores raw strings. `NDatePicker` uses `{ date, time }` objects. We need adapter computed getters/setters per field, or a helper. The simplest approach: store the object directly in `createVals` for datetime/date fields and serialize before POST. Check how `createRecord()` sends the data — if it sends `createVals` as-is, add a serialization step.

- [ ] **Step 1: Check how createRecord serializes the payload**

Read `DataTableView.vue` around the `createRecord` function to understand payload serialization.

```bash
grep -n "createRecord\|createVals\|axios\|fetch\|api\." Nerion-Front/src/views/data/DataTableView.vue | head -30
```

- [ ] **Step 2: Add import**

At the top of the `<script setup>` block in `DataTableView.vue`, add:

```js
import NDatePicker from '@/components/primitives/NDatePicker.vue'
```

- [ ] **Step 3: Add date value helpers**

After the existing `createVals` ref definition, add helpers for converting between the object format and the serialized string:

```js
// Convert NDatePicker value { date, time? } to API string
function datePickerToStr(val, mode) {
  if (!val?.date) return ''
  if (mode === 'date') return val.date
  return val.time ? `${val.date}T${val.time}` : val.date
}

// Convert stored API string back to NDatePicker value object
function strToDatePicker(str, mode) {
  if (!str) return null
  if (mode === 'date') return { date: str.slice(0, 10) }
  const iso = str.includes('T') ? str : str.replace(' ', 'T')
  const [date, timeFull] = iso.split('T')
  return { date, time: timeFull ? timeFull.slice(0, 5) : '00:00' }
}
```

- [ ] **Step 4: Replace the date/datetime branch in the create form**

Find the template line (around line 476–479) that renders `NInput` with a ternary type. Replace **only** the `f.type === 'date'` and `f.type === 'datetime'` branches by wrapping them in a new `v-else-if` before the catch-all `v-else`.

Before:
```html
<template v-else>
  <NInput :model-value="createVals[f.slug] || ''" @update:model-value="createVals[f.slug] = $event"
    :type="f.type === 'number' ? 'number' : f.type === 'email' ? 'email' : f.type === 'date' ? 'date' : f.type === 'datetime' ? 'datetime-local' : f.type === 'url' ? 'url' : f.type === 'phone' ? 'tel' : 'text'"
    :placeholder="`Введи ${f.name.toLowerCase()}…`" />
</template>
```

After:
```html
<template v-else-if="f.type === 'date' || f.type === 'datetime'">
  <NDatePicker
    :model-value="strToDatePicker(createVals[f.slug], f.type)"
    @update:model-value="createVals[f.slug] = datePickerToStr($event, f.type)"
    :mode="f.type"
    :placeholder="`Введи ${f.name.toLowerCase()}…`"
  />
</template>

<template v-else>
  <NInput :model-value="createVals[f.slug] || ''" @update:model-value="createVals[f.slug] = $event"
    :type="f.type === 'number' ? 'number' : f.type === 'email' ? 'email' : f.type === 'url' ? 'url' : f.type === 'phone' ? 'tel' : 'text'"
    :placeholder="`Введи ${f.name.toLowerCase()}…`" />
</template>
```

- [ ] **Step 5: Manual verify**

Run `npm run dev` from `Nerion-Front/`. Open the app, navigate to a table that has a `date` or `datetime` field. Click "Добавить запись". Verify:
1. Date/datetime fields render a styled trigger div (not native `<input type="datetime-local">`)
2. Clicking the trigger opens the dropdown with calendar
3. Selecting a day populates the trigger display as `ДД.ММ.ГГГГ`
4. In datetime mode, the time wheels appear to the right of the calendar
5. Scrolling or clicking hours/minutes updates the display
6. "Сегодня" selects today's date
7. "Удалить" clears the value and closes the picker
8. Clicking outside closes the picker
9. Submitting the form sends the correct ISO string to the API

- [ ] **Step 6: Commit**

```bash
git -C Nerion-Front add src/views/data/DataTableView.vue
git -C Nerion-Front commit -m "feat(data): use NDatePicker for date and datetime fields in create form"
```
