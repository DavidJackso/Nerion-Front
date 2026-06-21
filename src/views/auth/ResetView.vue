<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import NButton from '@/components/primitives/NButton.vue'
import NInput from '@/components/primitives/NInput.vue'
import NIcon from '@/components/primitives/NIcon.vue'

const router = useRouter()
const email = ref('anna.ivanova@msu.ru')
const sent = ref(false)
</script>

<template>
  <div style="min-height: 100vh; background: var(--bg-1); display: grid; grid-template-rows: auto 1fr auto">
    <header style="padding: 28px 40px; display: flex; align-items: center; gap: 10px">
      <div style="width: 28px; height: 28px; border-radius: 7px; background: var(--brand-primary); color: #fff; display: grid; place-items: center; font-weight: 700; font-size: 14px">N</div>
      <span style="font-size: 16px; font-weight: 700; letter-spacing: -0.01em; color: var(--fg-1)">Nerion</span>
    </header>

    <main style="display: grid; place-items: center; padding: 0 24px 48px">
      <div style="width: 100%; max-width: 400px; animation: slideUp 220ms both">

        <!-- Sent state -->
        <template v-if="sent">
          <div style="text-align: center; padding: 32px 0">
            <div style="width: 56px; height: 56px; border-radius: 50%; background: var(--green-100); color: var(--green-700); display: grid; place-items: center; margin: 0 auto 20px">
              <NIcon name="check" :size="24" />
            </div>
            <h1 style="font-size: 22px; font-weight: 700; margin-bottom: 10px; letter-spacing: -0.01em">Письмо отправлено</h1>
            <p style="color: var(--fg-2); font-size: 14px; margin-bottom: 28px">
              Проверь <strong>{{ email }}</strong> — там ссылка для сброса пароля.
            </p>
            <NButton variant="secondary" size="md" @click="router.push('/login')" style="width: 100%">← Назад к входу</NButton>
          </div>
        </template>

        <!-- Form state -->
        <template v-else>
          <h1 style="font-size: 26px; font-weight: 700; margin-bottom: 8px; letter-spacing: -0.02em">Сброс пароля</h1>
          <p style="color: var(--fg-2); font-size: 14px; margin-bottom: 28px">Пришлём ссылку для сброса на email.</p>
          <form @submit.prevent="sent = true" style="display: flex; flex-direction: column; gap: 14px">
            <div>
              <label style="font-size: 12px; color: var(--fg-2); font-weight: 500; display: block; margin-bottom: 6px">Email</label>
              <NInput v-model="email" placeholder="you@university.ru" type="email" />
            </div>
            <NButton type="submit" variant="primary" size="md" style="width: 100%; margin-top: 4px">Отправить ссылку</NButton>
          </form>
          <p style="margin-top: 24px; font-size: 13px; color: var(--fg-2); text-align: center">
            <span @click="router.push('/login')" style="color: var(--brand-primary); font-weight: 500; cursor: pointer">← Назад к входу</span>
          </p>
        </template>

      </div>
    </main>

    <footer style="padding: 20px 40px; display: flex; justify-content: space-between; color: var(--fg-3); font-size: 12px">
      <span>© Nerion · 2026</span><span>Помощь</span>
    </footer>
  </div>
</template>
