<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import NButton from '@/components/primitives/NButton.vue'
import NInput from '@/components/primitives/NInput.vue'

const router = useRouter()
const name = ref('Анна Иванова')
const email = ref('')
const pwd = ref('')
</script>

<template>
  <div style="min-height: 100vh; background: var(--bg-1); display: grid; grid-template-rows: auto 1fr auto">
    <header style="padding: 28px 40px; display: flex; align-items: center; gap: 10px">
      <div style="width: 28px; height: 28px; border-radius: 7px; background: var(--brand-primary); color: #fff; display: grid; place-items: center; font-weight: 700; font-size: 14px">N</div>
      <span style="font-size: 16px; font-weight: 700; letter-spacing: -0.01em; color: var(--fg-1)">Nerion</span>
    </header>

    <main style="display: grid; place-items: center; padding: 0 24px 48px">
      <div style="width: 100%; max-width: 400px; animation: slideUp 220ms both">
        <h1 style="font-size: 26px; font-weight: 700; margin-bottom: 8px; letter-spacing: -0.02em">Создать аккаунт</h1>
        <p style="color: var(--fg-2); font-size: 14px; margin-bottom: 28px">14 дней Pro бесплатно, карта не нужна.</p>

        <form @submit.prevent="router.push('/spaces')" style="display: flex; flex-direction: column; gap: 14px">
          <div>
            <label style="font-size: 12px; color: var(--fg-2); font-weight: 500; display: block; margin-bottom: 6px">Имя</label>
            <NInput v-model="name" placeholder="Как тебя зовут" />
          </div>
          <div>
            <label style="font-size: 12px; color: var(--fg-2); font-weight: 500; display: block; margin-bottom: 6px">Email</label>
            <NInput v-model="email" placeholder="you@university.ru" type="email" />
          </div>
          <div>
            <label style="font-size: 12px; color: var(--fg-2); font-weight: 500; display: block; margin-bottom: 6px">Пароль</label>
            <NInput v-model="pwd" type="password" placeholder="Минимум 8 символов" />
          </div>
          <NButton type="submit" variant="primary" size="md" style="width: 100%; margin-top: 4px">Зарегистрироваться</NButton>
        </form>

        <p style="margin-top: 24px; font-size: 13px; color: var(--fg-2); text-align: center">
          Уже есть аккаунт?
          <span @click="router.push('/login')" style="color: var(--brand-primary); font-weight: 500; cursor: pointer">Войти</span>
        </p>
        <p style="margin-top: 16px; font-size: 11px; color: var(--fg-3); text-align: center; line-height: 1.5">
          Регистрируясь, ты соглашаешься с условиями использования и политикой конфиденциальности.
        </p>
      </div>
    </main>

    <footer style="padding: 20px 40px; display: flex; justify-content: space-between; color: var(--fg-3); font-size: 12px">
      <span>© Nerion · 2026</span><span>Помощь</span>
    </footer>
  </div>
</template>
