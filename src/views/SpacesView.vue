<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import NButton from '@/components/primitives/NButton.vue'
import NIcon from '@/components/primitives/NIcon.vue'
import NModal from '@/components/primitives/NModal.vue'
import NInput from '@/components/primitives/NInput.vue'
import { SPACES } from '@/data/mock.js'

const router = useRouter()
const showCreate = ref(false)
const newName = ref('Кафедра информатики')
const newSlug = ref('informatics-dept')
const hovered = ref(null)

function createSpace() {
  showCreate.value = false
  router.push({ name: 'data-prep' })
}
</script>

<template>
  <div style="min-height: 100vh; background: var(--bg-1)">
    <header style="height: 56px; background: var(--bg-0); border-bottom: 0.5px solid var(--border-default); display: flex; align-items: center; padding: 0 32px; gap: 14px">
      <div style="width: 26px; height: 26px; border-radius: 6px; background: var(--brand-primary); color: #fff; display: grid; place-items: center; font-weight: 700; font-size: 13px">N</div>
      <span style="font-size: 14px; font-weight: 700; letter-spacing: -0.01em">Nerion</span>
      <div style="flex: 1" />
      <span style="font-size: 13px; color: var(--fg-2)">anna.ivanova@msu.ru</span>
      <div style="width: 28px; height: 28px; border-radius: 50%; background: var(--purple-200); color: var(--purple-700); display: grid; place-items: center; font-weight: 700; font-size: 12px">АИ</div>
    </header>

    <main style="max-width: 960px; margin: 0 auto; padding: 48px 32px">
      <div style="display: flex; align-items: flex-end; justify-content: space-between; margin-bottom: 32px">
        <div>
          <h1 style="font-size: 28px; font-weight: 700; margin-bottom: 6px; letter-spacing: -0.02em">Пространства</h1>
          <p style="font-size: 14px; color: var(--fg-2)">Каждое пространство — изолированная база с API и командой.</p>
        </div>
        <NButton variant="primary" size="md" @click="showCreate = true">
          <NIcon name="plus" :size="14" color="#fff" />
          Новое пространство
        </NButton>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px">
        <div
          v-for="s in SPACES" :key="s.id"
          @click="router.push({ name: 'data-prep' })"
          @mouseenter="hovered = s.id"
          @mouseleave="hovered = null"
          :style="{
            background: 'var(--bg-0)',
            border: '0.5px solid var(--border-default)',
            borderRadius: '12px', padding: '24px', cursor: 'pointer',
            boxShadow: hovered === s.id ? 'var(--shadow-2)' : 'var(--shadow-1)',
            transition: 'box-shadow 180ms, transform 120ms',
            transform: hovered === s.id ? 'translateY(-2px)' : 'none',
          }"
        >
          <div style="display: flex; align-items: center; gap: 14px; margin-bottom: 16px">
            <div :style="{
              width: '44px', height: '44px', borderRadius: '10px',
              background: s.color, color: s.fg,
              display: 'grid', placeItems: 'center', flexShrink: 0,
            }">
              <NIcon :name="s.icon" :size="20" />
            </div>
            <div style="flex: 1; min-width: 0">
              <div style="font-size: 15px; font-weight: 600; color: var(--fg-1); margin-bottom: 4px">{{ s.name }}</div>
              <span style="display: inline-block; padding: 2px 8px; border-radius: 4px; background: var(--bg-2); font-family: var(--font-mono); font-size: 12px; color: var(--fg-1)">{{ s.slug }}</span>
            </div>
            <NIcon name="chev" :size="14" color="var(--fg-3)" :style="{ opacity: hovered === s.id ? 1 : 0, transition: 'opacity 120ms' }" />
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; padding-top: 14px; border-top: 0.5px solid var(--border-default)">
            <div>
              <div style="font-size: 18px; font-weight: 600; font-variant-numeric: tabular-nums">{{ s.tables }}</div>
              <div style="font-size: 11px; color: var(--fg-3)">таблиц</div>
            </div>
            <div>
              <div style="font-size: 18px; font-weight: 600; font-variant-numeric: tabular-nums">{{ s.members }}</div>
              <div style="font-size: 11px; color: var(--fg-3)">в команде</div>
            </div>
            <div>
              <div style="font-size: 13px; font-weight: 500; color: var(--fg-2)">{{ s.updated }}</div>
              <div style="font-size: 11px; color: var(--fg-3)">обновлено</div>
            </div>
          </div>
        </div>
      </div>

      <div style="margin-top: 28px; padding: 16px 20px; background: var(--brand-tint); border: 0.5px solid var(--purple-100); border-radius: 8px; display: flex; align-items: center; gap: 14px">
        <NIcon name="box" :size="18" color="var(--purple-600)" />
        <div style="flex: 1">
          <div style="font-size: 13px; font-weight: 600; color: var(--purple-700)">На тарифе Free доступно ещё 1 пространство</div>
          <div style="font-size: 12px; color: var(--fg-2); margin-top: 2px">Pro снимает лимит и добавляет 100k записей в каждом.</div>
        </div>
        <NButton variant="secondary" size="sm">Сравнить тарифы</NButton>
      </div>
    </main>

    <NModal :open="showCreate" @close="showCreate = false" title="Новое пространство" subtitle="Изолированная база с собственным API и командой.">
      <div style="display: flex; flex-direction: column; gap: 18px">
        <div>
          <label style="font-size: 12px; color: var(--fg-2); font-weight: 500; display: block; margin-bottom: 6px">Название</label>
          <NInput v-model="newName" />
          <p style="font-size: 11px; color: var(--fg-3); margin-top: 5px">Видно только команде. Можно изменить позже.</p>
        </div>
        <div>
          <label style="font-size: 12px; color: var(--fg-2); font-weight: 500; display: block; margin-bottom: 6px">Slug</label>
          <div style="display: flex; align-items: center; height: 36px; border: 0.5px solid var(--border-strong); border-radius: 6px; overflow: hidden; font-family: var(--font-mono); font-size: 13px">
            <span style="padding: 0 10px; background: var(--bg-2); color: var(--fg-3); height: 100%; display: flex; align-items: center; border-right: 0.5px solid var(--border-default); white-space: nowrap">app.nerion.ru/</span>
            <input v-model="newSlug" style="flex: 1; height: 100%; padding: 0 10px; border: 0; outline: 0; font-family: inherit; font-size: 13px; color: var(--fg-1); background: transparent" />
            <span style="padding: 0 10px; color: var(--green-500)"><NIcon name="check" :size="14" /></span>
          </div>
          <p style="font-size: 11px; color: var(--fg-3); margin-top: 5px">Используется в URL API. a–z, 0–9, дефис.</p>
        </div>
      </div>
      <template #footer>
        <NButton variant="ghost" size="md" @click="showCreate = false">Отмена</NButton>
        <NButton variant="primary" size="md" @click="createSpace">Создать пространство</NButton>
      </template>
    </NModal>
  </div>
</template>
