<script setup lang="ts">
definePageMeta({
  layout: 'auth',
  middleware: []
})

import { getInvite, acceptInvite, type InviteInfo } from '~/api/invites'

const route = useRoute()
const token = computed(() => route.query.token as string)

const invite = ref<InviteInfo | null>(null)
const error = ref('')
const loading = ref(false)
const accepted = ref(false)

const auth = useAuthStore()
const isLoggedIn = computed(() => !!auth.accessToken)

onMounted(async () => {
  if (!token.value) {
    error.value = 'Неверная ссылка приглашения'
    return
  }
  try {
    invite.value = await getInvite(token.value)
  } catch (e: any) {
    error.value = e.message || 'Приглашение не найдено или истекло'
  }
})

async function accept() {
  if (!isLoggedIn.value) {
    await navigateTo(`/login?redirect=/invite?token=${token.value}`)
    return
  }
  loading.value = true
  error.value = ''
  try {
    await acceptInvite(token.value)
    accepted.value = true
    setTimeout(() => navigateTo('/spaces'), 1500)
  } catch (e: any) {
    error.value = e.message || 'Не удалось принять приглашение'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div>
    <h1 style="font-size: 26px; font-weight: 700; margin-bottom: 8px; letter-spacing: -0.02em">
      Приглашение в Nerion
    </h1>

    <div v-if="error" style="color: var(--red-600, #dc2626); font-size: 14px; margin-top: 16px">
      {{ error }}
    </div>

    <div v-else-if="accepted" style="color: var(--fg-1); font-size: 15px; margin-top: 16px">
      Вы добавлены в пространство. Переходим…
    </div>

    <div v-else-if="invite">
      <p style="color: var(--fg-2); font-size: 14px; margin-bottom: 28px">
        Вас пригласили в пространство <strong>{{ invite.space_name }}</strong>
      </p>

      <NButton
        variant="primary"
        size="md"
        :disabled="loading"
        style="width: 100%"
        @click="accept"
      >
        {{ loading ? 'Принимаем…' : isLoggedIn ? 'Принять приглашение' : 'Войти и принять' }}
      </NButton>
    </div>

    <div v-else style="color: var(--fg-2); font-size: 14px; margin-top: 16px">
      <NSpinner label="Загрузка…" />
    </div>
  </div>
</template>
