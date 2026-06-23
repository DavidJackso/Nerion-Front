export default defineNuxtRouteMiddleware(async (to) => {
  if (!import.meta.client) return

  const publicPaths = ['/', '/login', '/register', '/reset', '/unauthorized']
  const isPublic = publicPaths.includes(to.path) || to.matched.length === 0

  const token = localStorage.getItem('nerion_access_token')

  // Rehydrate user after page reload if token exists but user not loaded yet
  if (token) {
    const auth = useAuthStore()
    if (!auth.user) {
      await auth.fetchMe()
    }
  }

  if (isPublic) {
    if (token && (to.path === '/login' || to.path === '/register')) {
      return navigateTo('/spaces')
    }
    if (token && to.path === '/') {
      return navigateTo('/spaces')
    }
    return
  }

  if (!token) {
    return navigateTo({ path: '/unauthorized', query: { from: to.fullPath } })
  }
})
