<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import AppShell from '@/components/shell/AppShell.vue'
import NButton from '@/components/primitives/NButton.vue'
import NIcon from '@/components/primitives/NIcon.vue'
import NToggle from '@/components/primitives/NToggle.vue'
import { FIELD_TYPES, FILE_ACCEPT, REL_TABLES, INITIAL_FIELDS } from '@/data/mock.js'

const router = useRouter()
const fields = ref(INITIAL_FIELDS.map(f => ({ ...f })))

function upd(i, nf) { fields.value[i] = nf }
function del(i) { fields.value.splice(i, 1) }

function onTypeChange(i, v) {
  const f = fields.value[i]
  if (v === 'relation') fields.value[i] = { ...f, type: v, target: f.target || REL_TABLES[0].name, many: f.many ?? false }
  else if (v === 'file') fields.value[i] = { ...f, type: v, accept: f.accept || 'img', many: f.many ?? true }
  else fields.value[i] = { ...f, type: v }
}
</script>

<template>
  <AppShell :breadcrumb="['Кафедра математики', 'Новая таблица', 'Преподаватели']">
    <div style="max-width: 860px; margin: 0 auto; padding: 32px 32px 80px">
      <div style="margin-bottom: 24px">
        <div style="font-size: 11px; color: var(--fg-3); margin-bottom: 8px; font-family: var(--font-mono); text-transform: uppercase; letter-spacing: 0.06em">Шаг 2 / 2</div>
        <h1 style="font-size: 24px; font-weight: 700; margin-bottom: 6px; letter-spacing: -0.01em">Поля таблицы «Преподаватели»</h1>
        <p style="font-size: 13px; color: var(--fg-2)">Перетащи, чтобы поменять порядок. Связи ссылаются на другие таблицы без технических терминов.</p>
      </div>

      <div style="display: grid; grid-template-columns: 18px 1fr 180px 80px 28px; gap: 10px; padding: 0 12px 8px; font-size: 10px; color: var(--fg-3); text-transform: uppercase; letter-spacing: 0.06em; font-weight: 600">
        <div/><div>Имя поля</div><div>Тип</div><div/><div/>
      </div>

      <div style="display: flex; flex-direction: column; gap: 6px">
        <div
          v-for="(f, i) in fields" :key="i"
          :style="{
            padding: '8px 12px',
            background: f.type === 'relation' ? 'var(--brand-tint)' : f.type === 'file' ? 'var(--bg-1)' : 'var(--bg-0)',
            border: `0.5px solid ${f.type === 'relation' ? 'var(--purple-200)' : f.type === 'file' ? 'var(--border-strong)' : 'var(--border-default)'}`,
            borderRadius: '6px',
          }"
        >
          <div style="display: grid; grid-template-columns: 18px 1fr 180px 80px 28px; gap: 10px; align-items: center">
            <NIcon name="drag" :size="13" color="var(--fg-3)" style="cursor: grab" />
            <input
              :value="f.name"
              @input="upd(i, { ...f, name: $event.target.value })"
              :style="{
                height: '30px', padding: '0 10px', borderRadius: '6px',
                border: '0.5px solid var(--border-strong)',
                background: 'var(--bg-0)', color: 'var(--fg-1)',
                fontSize: '13px', outline: 0, fontFamily: 'inherit', boxSizing: 'border-box', width: '100%',
              }"
            />
            <select :value="f.type" @change="onTypeChange(i, $event.target.value)" :style="{
              height: '30px', borderRadius: '6px', border: '0.5px solid var(--border-strong)',
              padding: '0 8px', fontSize: '12px', background: 'var(--bg-0)',
              color: f.type === 'relation' ? 'var(--purple-700)' : 'var(--fg-1)',
              fontWeight: f.type === 'relation' ? 500 : 400, outline: 0,
            }">
              <option v-for="(lbl, key) in FIELD_TYPES" :key="key" :value="key">{{ lbl }}</option>
            </select>
            <div style="display: flex; align-items: center; gap: 6px">
              <NToggle :model-value="f.req" @update:model-value="upd(i, { ...f, req: $event })" />
              <span style="font-size: 11px; color: var(--fg-3)">обяз.</span>
            </div>
            <button @click="del(i)" style="background: 0; border: 0; cursor: pointer; color: var(--fg-3); padding: 2px; display: flex">
              <NIcon name="x" :size="14" />
            </button>
          </div>

          <!-- Relation config -->
          <div v-if="f.type === 'relation'" style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap; row-gap: 8px; margin-top: 8px; margin-left: 28px; padding: 8px 10px; background: var(--bg-0); border: 0.5px solid var(--purple-200); border-radius: 6px">
            <span style="font-size: 12px; color: var(--purple-700); font-weight: 500; white-space: nowrap">↔ Ссылается на</span>
            <div style="position: relative">
              <select :value="f.target" @change="upd(i, { ...f, target: $event.target.value })" style="height: 30px; border-radius: 6px; border: 0.5px solid var(--purple-300); padding: 0 28px 0 10px; font-size: 12px; background: var(--bg-0); color: var(--purple-700); font-weight: 500; outline: 0; appearance: none; cursor: pointer; font-family: inherit">
                <option v-for="t in REL_TABLES" :key="t.name" :value="t.name">{{ t.name }} · {{ t.count }} записей</option>
              </select>
              <NIcon name="chevd" :size="11" color="var(--purple-500)" style="position: absolute; right: 9px; top: 50%; transform: translateY(-50%); pointer-events: none" />
            </div>
            <div style="display: flex; gap: 2px; padding: 2px; background: var(--bg-2); border-radius: 6px">
              <button v-for="[v, l] in [[false, 'одно значение'], [true, 'список']]" :key="String(v)"
                @click="upd(i, { ...f, many: v })" :style="{
                  height: '24px', padding: '0 10px', border: 0, borderRadius: '4px', cursor: 'pointer',
                  fontSize: '11px', fontWeight: 500, fontFamily: 'inherit',
                  background: f.many === v ? 'var(--bg-0)' : 'transparent',
                  color: f.many === v ? 'var(--purple-700)' : 'var(--fg-3)',
                  boxShadow: f.many === v ? 'var(--shadow-1)' : 'none',
                }">{{ l }}</button>
            </div>
          </div>

          <!-- File config -->
          <div v-if="f.type === 'file'" style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap; row-gap: 8px; margin-top: 8px; margin-left: 28px; padding: 8px 10px; background: var(--bg-0); border: 0.5px solid var(--border-strong); border-radius: 6px">
            <span style="font-size: 12px; color: var(--fg-2); font-weight: 500; display: inline-flex; align-items: center; gap: 5px; white-space: nowrap">
              <NIcon name="clip" :size="12" color="var(--fg-3)" />Принимать
            </span>
            <div style="position: relative">
              <select :value="f.accept || 'img'" @change="upd(i, { ...f, accept: $event.target.value })" style="height: 30px; border-radius: 6px; border: 0.5px solid var(--border-strong); padding: 0 26px 0 10px; font-size: 12px; background: var(--bg-0); color: var(--fg-1); outline: 0; appearance: none; cursor: pointer; font-family: inherit">
                <option v-for="[k, l] in FILE_ACCEPT" :key="k" :value="k">{{ l }}</option>
              </select>
              <NIcon name="chevd" :size="11" color="var(--fg-3)" style="position: absolute; right: 9px; top: 50%; transform: translateY(-50%); pointer-events: none" />
            </div>
            <div style="display: flex; gap: 2px; padding: 2px; background: var(--bg-2); border-radius: 6px">
              <button v-for="[v, l] in [[false, 'один файл'], [true, 'галерея']]" :key="String(v)"
                @click="upd(i, { ...f, many: v })" :style="{
                  height: '24px', padding: '0 10px', border: 0, borderRadius: '4px', cursor: 'pointer',
                  fontSize: '11px', fontWeight: 500, fontFamily: 'inherit',
                  background: (f.many ?? true) === v ? 'var(--bg-0)' : 'transparent',
                  color: (f.many ?? true) === v ? 'var(--fg-1)' : 'var(--fg-3)',
                  boxShadow: (f.many ?? true) === v ? 'var(--shadow-1)' : 'none',
                }">{{ l }}</button>
            </div>
            <span style="font-size: 11px; color: var(--fg-3); flex-basis: 100%">Прямые ссылки в API — собирай галерею или слайдер на своём сайте.</span>
          </div>
        </div>
      </div>

      <div style="display: flex; gap: 8px; margin-top: 12px">
        <button @click="fields.push({ name: '', type: 'text', req: false })" style="flex: 1; padding: 10px 14px; background: transparent; border: 0.5px dashed var(--border-strong); border-radius: 6px; color: var(--fg-2); font-size: 13px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; font-family: inherit">
          <NIcon name="plus" :size="14" />Добавить поле
        </button>
        <button @click="fields.push({ name: '', type: 'relation', req: false, target: REL_TABLES[0].name, many: false })" style="flex: 1; padding: 10px 14px; background: var(--brand-tint); border: 0.5px dashed var(--purple-300); border-radius: 6px; color: var(--purple-700); font-size: 13px; font-weight: 500; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; font-family: inherit">
          ↔ Добавить связь
        </button>
      </div>

      <div style="margin-top: 32px; display: flex; justify-content: space-between">
        <NButton variant="ghost" size="md" @click="router.push({ name: 'sch02' })">← Назад</NButton>
        <div style="display: flex; gap: 8px">
          <NButton variant="secondary" size="md">Сохранить черновик</NButton>
          <NButton variant="primary" size="md" @click="router.push({ name: 'data-prep' })">Создать таблицу</NButton>
        </div>
      </div>
    </div>
  </AppShell>
</template>
