import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/',         redirect: '/login' },
    { path: '/login',    component: () => import('@/views/auth/LoginView.vue') },
    { path: '/register', component: () => import('@/views/auth/RegisterView.vue') },
    { path: '/reset',    component: () => import('@/views/auth/ResetView.vue') },
    { path: '/spaces',   component: () => import('@/views/SpacesView.vue') },
    {
      path: '/app',
      component: () => import('@/views/AppLayout.vue'),
      children: [
        { path: 'schema/new',     name: 'sch02', component: () => import('@/views/schema/TemplatePickerView.vue') },
        { path: 'schema/fields',  name: 'sch03', component: () => import('@/views/schema/FieldEditorView.vue') },
        { path: 'data/teachers',  name: 'data-prep',    component: () => import('@/views/data/DataTableView.vue'), props: { tableKey: 'data-prep' } },
        { path: 'data/courses',   name: 'data-courses', component: () => import('@/views/data/DataTableView.vue'), props: { tableKey: 'data-courses' } },
        { path: 'data/plans',     name: 'data-plans',   component: () => import('@/views/data/DataTableView.vue'), props: { tableKey: 'data-plans' } },
        { path: 'api/docs',       name: 'api01', component: () => import('@/views/api/ApiDocsView.vue') },
        { path: 'api/keys',       name: 'api02', component: () => import('@/views/api/ApiKeysView.vue') },
        { path: 'files',          name: 'files', component: () => import('@/views/files/FilesView.vue') },
        { path: 'pdf',            name: 'pdf01', component: () => import('@/views/pdf/PdfView.vue') },
        { path: 'team',           name: 'set01', component: () => import('@/views/settings/TeamView.vue') },
        { path: 'settings',       name: 'set02', component: () => import('@/views/settings/SettingsView.vue') },
        { path: '',               redirect: '/app/data/teachers' },
      ]
    },
  ]
})

export default router
