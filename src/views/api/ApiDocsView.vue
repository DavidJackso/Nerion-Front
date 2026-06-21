<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import AppShell from '@/components/shell/AppShell.vue'
import NButton from '@/components/primitives/NButton.vue'
import NIcon from '@/components/primitives/NIcon.vue'
import NStatusDot from '@/components/primitives/NStatusDot.vue'
import { ENDPOINTS } from '@/data/mock.js'

const router = useRouter()
const picked = ref(0)
const tab = ref('curl')
const copied = ref(false)

const COURSES_EXTRA = [
  { method: 'GET',  path: '/api/math-dept/courses' },
  { method: 'POST', path: '/api/math-dept/courses' },
]

const METHOD_COLOR = {
  GET:    ['#DBEAFE', '#1E40AF'],
  POST:   ['#D1FAE5', '#065F46'],
  PATCH:  ['#FEF3C7', '#92400E'],
  DELETE: ['#FEE2E2', '#991B1B'],
}

const SAMPLES = {
  curl: (ep) => `curl -X ${ep.method} 'https://app.nerion.ru${ep.path.replace('{id}', 'rec_a8f2b4')}' \\
  -H 'Authorization: Bearer nrn_live_••••••••3f2a' \\
  -H 'Content-Type: application/json'`,
  js: (ep) => `const res = await fetch(
  'https://app.nerion.ru${ep.path.replace('{id}', 'rec_a8f2b4')}',
  {
    method: '${ep.method}',
    headers: {
      'Authorization': \`Bearer \${process.env.NERION_KEY}\`,
    },
  }
);
const data = await res.json();`,
  py: (ep) => `import requests, os
r = requests.${ep.method.toLowerCase()}(
  'https://app.nerion.ru${ep.path.replace('{id}', 'rec_a8f2b4')}',
  headers={'Authorization': f'Bearer {os.environ["NERION_KEY"]}'},
)
data = r.json()`,
}

const RESPONSE_JSON = `{
  "data": [
    {
      "id": "rec_a8f2b4e9c1",
      "fio": "Иванов Алексей Петрович",
      "degree": "д.ф.-м.н.",
      "position": "профессор",
      "rate": 1.0,
      "email": "ivanov@msu.ru",
      "active": true
    }
  ],
  "meta": { "total": 14, "page": 1, "per_page": 50 }
}`

const QUERY_PARAMS = [
  ['page',          'integer', 'Номер страницы, по умолчанию 1.'],
  ['per_page',      'integer', 'Записей на странице, до 200.'],
  ['sort',          'string',  'Поле сортировки, с минусом — убывание.'],
  ['filter[active]','boolean', 'Только активные записи.'],
]

const ep = computed(() => ENDPOINTS[picked.value])
const [mc, fc] = computed(() => METHOD_COLOR[ep.value.method] || ['#eee', '#333']).value

function copy() {
  copied.value = true
  setTimeout(() => { copied.value = false }, 1800)
}
</script>

<template>
  <AppShell :breadcrumb="['Кафедра математики', 'REST API']">
    <template #actions>
      <NButton variant="secondary" size="sm" @click="router.push({ name: 'api02' })">
        <NIcon name="key" :size="13" />
        Ключи API
      </NButton>
    </template>

    <div style="display: grid; grid-template-columns: 260px 1fr; min-height: calc(100vh - 56px)">
      <!-- Endpoint sidebar -->
      <aside style="background: var(--bg-0); border-right: 0.5px solid var(--border-default); padding: 20px 0">
        <div style="display: flex; align-items: center; gap: 10px; padding: 0 16px 12px">
          <NStatusDot status="online" />
          <span style="font-size: 11px; color: var(--fg-3); margin-left: auto">API активен</span>
        </div>

        <div style="padding: 0 16px 8px; font-size: 10px; color: var(--fg-3); text-transform: uppercase; letter-spacing: 0.06em; font-weight: 600">Преподаватели</div>
        <button
          v-for="(e, i) in ENDPOINTS" :key="i"
          @click="picked = i"
          :style="{
            width: '100%', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 10,
            background: picked === i ? 'var(--brand-tint)' : 'transparent',
            border: 0, borderLeft: `3px solid ${picked === i ? 'var(--brand-primary)' : 'transparent'}`,
            cursor: 'pointer', textAlign: 'left',
          }"
        >
          <span :style="{
            fontSize: '9px', fontWeight: 700, padding: '2px 6px', borderRadius: '3px',
            background: (METHOD_COLOR[e.method] || ['#eee','#333'])[0],
            color: (METHOD_COLOR[e.method] || ['#eee','#333'])[1],
            fontFamily: 'var(--font-mono)', minWidth: '38px', textAlign: 'center',
          }">{{ e.method === 'DELETE' ? 'DEL' : e.method }}</span>
          <span style="font-size: 11px; font-family: var(--font-mono); color: var(--fg-2); overflow: hidden; text-overflow: ellipsis; white-space: nowrap">{{ e.path.replace('/api/math-dept/', '/') }}</span>
        </button>

        <div style="margin-top: 16px; padding: 0 16px 8px; font-size: 10px; color: var(--fg-3); text-transform: uppercase; letter-spacing: 0.06em; font-weight: 600">Курсы</div>
        <button
          v-for="([m, p], i) in COURSES_EXTRA" :key="'c'+i"
          :style="{
            width: '100%', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 10,
            background: 'transparent', border: 0, borderLeft: '3px solid transparent', cursor: 'pointer',
          }"
        >
          <span :style="{
            fontSize: '9px', fontWeight: 700, padding: '2px 6px', borderRadius: '3px',
            background: (METHOD_COLOR[m])[0], color: (METHOD_COLOR[m])[1],
            fontFamily: 'var(--font-mono)', minWidth: '38px', textAlign: 'center',
          }">{{ m }}</span>
          <span style="font-size: 11px; font-family: var(--font-mono); color: var(--fg-2)">{{ p.replace('/api/math-dept/', '/') }}</span>
        </button>
      </aside>

      <!-- Main content -->
      <main style="padding: 32px 40px 80px; max-width: 840px">
        <!-- Endpoint header -->
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px">
          <span :style="{
            fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '4px',
            background: (METHOD_COLOR[ep.method] || ['#eee','#333'])[0],
            color: (METHOD_COLOR[ep.method] || ['#eee','#333'])[1],
            fontFamily: 'var(--font-mono)',
          }">{{ ep.method }}</span>
          <code style="font-size: 14px; font-family: var(--font-mono); color: var(--fg-1)">{{ ep.path }}</code>
        </div>
        <p style="font-size: 14px; color: var(--fg-2); margin-bottom: 28px">{{ ep.desc }}.</p>

        <!-- Query params -->
        <section style="margin-bottom: 28px">
          <div style="font-size: 12px; font-weight: 600; color: var(--fg-3); text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 10px">Параметры query</div>
          <div style="background: var(--bg-0); border: 0.5px solid var(--border-default); border-radius: 8px; overflow: hidden">
            <div
              v-for="([k, t, d], i) in QUERY_PARAMS" :key="k"
              :style="{
                display: 'grid', gridTemplateColumns: '160px 90px 1fr',
                padding: '10px 16px', gap: 12,
                borderTop: i ? '0.5px solid var(--border-default)' : '0',
                alignItems: 'start',
              }"
            >
              <code style="font-size: 12px; font-family: var(--font-mono); color: var(--fg-1)">{{ k }}</code>
              <span style="font-size: 12px; color: var(--fg-3)">{{ t }}</span>
              <span style="font-size: 13px; color: var(--fg-2)">{{ d }}</span>
            </div>
          </div>
        </section>

        <!-- Request code -->
        <section style="margin-bottom: 28px">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px">
            <div style="font-size: 12px; font-weight: 600; color: var(--fg-3); text-transform: uppercase; letter-spacing: 0.06em">Запрос</div>
            <div style="display: flex; gap: 4px">
              <button
                v-for="[k, lbl] in [['curl','cURL'],['js','JavaScript'],['py','Python']]" :key="k"
                @click="tab = k"
                :style="{
                  padding: '5px 10px', fontSize: '12px',
                  background: tab === k ? 'var(--bg-0)' : 'transparent',
                  border: tab === k ? '0.5px solid var(--border-strong)' : '0.5px solid transparent',
                  borderRadius: '4px', cursor: 'pointer',
                  color: tab === k ? 'var(--fg-1)' : 'var(--fg-2)',
                  fontFamily: 'inherit',
                }"
              >{{ lbl }}</button>
            </div>
          </div>
          <div style="position: relative; background: #111827; border-radius: 8px; overflow: hidden">
            <button
              @click="copy"
              style="position: absolute; top: 12px; right: 12px; background: rgba(255,255,255,.08); border: 0; color: rgba(255,255,255,.7); padding: 5px 10px; border-radius: 4px; cursor: pointer; font-size: 11px; display: flex; align-items: center; gap: 4px; font-family: inherit"
            >
              <NIcon :name="copied ? 'check' : 'copy'" :size="11" color="rgba(255,255,255,.7)" />
              {{ copied ? 'Скопировано' : 'Копировать' }}
            </button>
            <pre style="margin: 0; padding: 20px 24px; color: rgba(255,255,255,.9); font-size: 13px; font-family: var(--font-mono); line-height: 1.6; overflow: auto; white-space: pre-wrap">{{ SAMPLES[tab](ep) }}</pre>
          </div>
        </section>

        <!-- Response -->
        <section>
          <div style="font-size: 12px; font-weight: 600; color: var(--fg-3); text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 10px">
            Ответ <span style="color: var(--green-600); font-family: var(--font-mono); margin-left: 8px; text-transform: none; font-weight: 500">200 OK</span>
          </div>
          <div style="background: #111827; border-radius: 8px; padding: 20px 24px">
            <pre style="margin: 0; color: rgba(255,255,255,.9); font-size: 13px; font-family: var(--font-mono); line-height: 1.6">{{ RESPONSE_JSON }}</pre>
          </div>
        </section>
      </main>
    </div>
  </AppShell>
</template>
