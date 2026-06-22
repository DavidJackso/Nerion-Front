import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth.js'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: () => import('@/views/LandingView.vue'), meta: { public: true } },
    { path: '/login',    component: () => import('@/views/auth/LoginView.vue'), meta: { public: true } },
    { path: '/register', component: () => import('@/views/auth/RegisterView.vue'), meta: { public: true } },
    { path: '/reset',    component: () => import('@/views/auth/ResetView.vue'), meta: { public: true } },
    {
      path: '/spaces',
      component: () => import('@/views/SpacesView.vue'),
    },
    {
      path: '/spaces/:slug',
      component: () => import('@/views/AppLayout.vue'),
      children: [
        { path: '', redirect: to => `/spaces/${to.params.slug}/tables` },
        { path: 'tables', name: 'tables', component: () => import('@/views/data/DataTableView.vue') },
        { path: 'tables/:table', name: 'table', component: () => import('@/views/data/DataTableView.vue') },
        { path: 'schema/new', name: 'schema-new', component: () => import('@/views/schema/TemplatePickerView.vue') },
        { path: 'schema/:table/fields', name: 'schema-fields', component: () => import('@/views/schema/FieldEditorView.vue') },
        { path: 'api/docs', name: 'api-docs', component: () => import('@/views/api/ApiDocsView.vue') },
        { path: 'api/keys', name: 'api-keys', component: () => import('@/views/api/ApiKeysView.vue') },
        { path: 'files', name: 'files', component: () => import('@/views/files/FilesView.vue') },
        { path: 'pdf', name: 'pdf', component: () => import('@/views/pdf/PdfView.vue') },
        { path: 'team', name: 'team', component: () => import('@/views/settings/TeamView.vue') },
        { path: 'settings', name: 'settings', component: () => import('@/views/settings/SettingsView.vue') },
      ]
    },
    { path: '/unauthorized', name: 'unauthorized', component: () => import('@/views/UnauthorizedView.vue'), meta: { public: true } },
    { path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('@/views/NotFoundView.vue'), meta: { public: true } },
  ]
})

router.beforeEach(async (to) => {
  if (to.meta.public) {
    if (to.path === '/') {
      const auth = useAuthStore()
      if (auth.accessToken) return { path: '/spaces' }
    }
    return true
  }
  const auth = useAuthStore()
  if (!auth.accessToken) return { path: '/unauthorized', query: { from: to.fullPath } }
  if (!auth.user) {
    try { await auth.fetchMe() } catch {}
  }
  if (!auth.user) return { path: '/unauthorized', query: { from: to.fullPath } }
  return true
})

export default router
