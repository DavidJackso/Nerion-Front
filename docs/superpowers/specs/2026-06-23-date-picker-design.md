# NDatePicker — Design Spec

**Date:** 2026-06-23  
**Status:** Approved

## Overview

Custom date/datetime picker component replacing native `<input type="date">` and `<input type="datetime-local">` in the table record create/edit modals. Follows the NSelect popup pattern — trigger + Teleport dropdown, no external dependencies.

## Component API

**File:** `Nerion-Front/components/NDatePicker.vue`

```ts
Props:
  modelValue?: string    // ISO string: "2024-03-15" | "2024-03-15T14:30"
  type?: 'date' | 'datetime'  // default: 'date'
  placeholder?: string
  disabled?: boolean
  error?: string
  size?: 'sm' | 'md'

Emits:
  'update:modelValue': [value: string | undefined]
```

`modelValue` is always an ISO string matching the `type` — `YYYY-MM-DD` for `date`, `YYYY-MM-DDTHH:MM` for `datetime`. Emits `undefined` on clear.

## Trigger

Height matches NInput/NSelect: `36px` (md) / `30px` (sm). Border, focus ring, and background use the same CSS vars (`--border-strong`, `--border-focus`, `--ring-focus`, `--bg-0`).

Displays formatted date: `15 мар 2024` / `15 мар 2024, 14:30`. Empty state shows placeholder in `--fg-3`.

Clear button (`×` icon) appears on hover when value is set. Clicking it emits `undefined` and stops propagation.

## Dropdown

Teleported to `<body>`, positioned via `getBoundingClientRect()` of the trigger + 4px gap below. Closes on outside `mousedown` or `Escape`.

### Day grid mode

```
[ < ]   Март 2024   [ > ]
Пн  Вт  Ср  Чт  Пт  Сб  Вс
..  ..   1   2   3   4   5
 6   7   8   9  10  11  12
13  14  15  16  17  18  19
20  21  22  23  24  25  26
27  28  29  30  31  ..  ..
```

- `<` / `>` arrows — navigate months
- Clicking the month/year header — switches to year grid mode
- Days from adjacent months — displayed dimmed (`--fg-3`), still clickable
- Today — outlined ring in `--brand-primary`
- Selected day — `--brand-tint` background + `--brand-primary` text (matches `nsel-active`)
- Clicking a day:
  - `type='date'` → emits date string, closes dropdown
  - `type='datetime'` → sets temp date, transitions to time picker

### Year grid mode

Grid of ±6 years centered on current view year. Clicking a year returns to day grid for that year.

### Time picker (datetime only)

Shown after day selection. Two number inputs (HH, MM) with increment/decrement buttons. Confirm button emits the full ISO datetime string and closes the dropdown.

## Internal State

```ts
open: boolean
viewYear: number      // initialized from modelValue or current date
viewMonth: number     // 0–11
mode: 'days' | 'years'
tempDate: string | null  // selected date before time confirmation (datetime only)
```

## Integration

In `Nerion-Front/pages/spaces/[slug]/tables/[table].vue`, replace:

```html
<!-- before -->
<NInput
  :type="f.type === 'date' ? 'date' : f.type === 'datetime' ? 'datetime-local' : ..."
  ...
/>

<!-- after -->
<NDatePicker
  v-if="f.type === 'date' || f.type === 'datetime'"
  :type="f.type"
  :model-value="createVals[f.slug]"
  @update:model-value="createVals[f.slug] = $event"
/>
```

Same replacement in the edit modal block.

## Styling

Follows NSelect conventions: scoped `<style>`, CSS vars only, no hardcoded colors. Dropdown shadow: `0 4px 20px rgba(0,0,0,0.12)`. Border-radius: `8px` on dropdown, `6px` on trigger.
