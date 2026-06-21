<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import NButton from '@/components/primitives/NButton.vue'
import NInput from '@/components/primitives/NInput.vue'
import NIcon from '@/components/primitives/NIcon.vue'

const router = useRouter()
const email = ref('anna.ivanova@msu.ru')
const pwd = ref('••••••••••')
const showPwd = ref(false)

function submit() { router.push('/spaces') }
</script>

<template>
  <div style="min-height: 100vh; background: var(--bg-1); display: grid; grid-template-rows: auto 1fr auto">
    <header style="padding: 28px 40px; display: flex; align-items: center; gap: 10px">
      <div style="width: 28px; height: 28px; border-radius: 7px; background: var(--brand-primary); color: #fff; display: grid; place-items: center; font-weight: 700; font-size: 14px">N</div>
      <span style="font-size: 16px; font-weight: 700; letter-spacing: -0.01em; color: var(--fg-1)">Nerion</span>
    </header>

    <main style="display: grid; place-items: center; padding: 0 24px 48px">
      <div style="width: 100%; max-width: 400px; animation: slideUp 220ms both">
        <h1 style="font-size: 26px; font-weight: 700; margin-bottom: 8px; letter-spacing: -0.02em">С возвращением</h1>
        <p style="color: var(--fg-2); font-size: 14px; margin-bottom: 28px; line-height: 1.5">Войди, чтобы продолжить работу с пространствами.</p>

        <form @submit.prevent="submit" style="display: flex; flex-direction: column; gap: 14px">
          <div>
            <label style="font-size: 12px; color: var(--fg-2); font-weight: 500; display: block; margin-bottom: 6px">Email</label>
            <NInput v-model="email" placeholder="you@university.ru" type="email" />
          </div>
          <div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 6px">
              <label style="font-size: 12px; color: var(--fg-2); font-weight: 500">Пароль</label>
              <span @click="router.push('/reset')" style="font-size: 12px; color: var(--brand-primary); cursor: pointer">Забыл пароль?</span>
            </div>
            <div style="position: relative">
              <NInput v-model="pwd" :type="showPwd ? 'text' : 'password'" placeholder="••••••••" />
              <button type="button" @click="showPwd = !showPwd" :style="{
                position: 'absolute', right: '10px', top: '9px',
                background: 0, border: 0, cursor: 'pointer', color: 'var(--fg-3)', padding: '2px',
              }">
                <NIcon name="eye" :size="14" />
              </button>
            </div>
          </div>
          <NButton type="submit" variant="primary" size="md" style="width: 100%; margin-top: 4px">Войти</NButton>
          <div style="display: flex; align-items: center; gap: 10px; color: var(--fg-3); font-size: 12px">
            <div style="flex: 1; height: 0.5px; background: var(--border-default)"/> или
            <div style="flex: 1; height: 0.5px; background: var(--border-default)"/>
          </div>
          <NButton variant="secondary" size="md" style="width: 100%">Войти через Яндекс ID</NButton>
        </form>

        <p style="margin-top: 24px; font-size: 13px; color: var(--fg-2); text-align: center">
          Нет аккаунта?
          <span @click="router.push('/register')" style="color: var(--brand-primary); font-weight: 500; cursor: pointer">Зарегистрироваться</span>
        </p>
      </div>
    </main>

    <footer style="padding: 20px 40px; display: flex; justify-content: space-between; color: var(--fg-3); font-size: 12px">
      <span>© Nerion · 2026</span><span>Помощь</span>
    </footer>
  </div>
</template>
