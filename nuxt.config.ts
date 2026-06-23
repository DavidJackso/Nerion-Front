export default defineNuxtConfig({
  ssr: false,
  app: {
    head: {
      link: [{ rel: 'icon', type: 'image/png', href: '/favicon.png' }]
    }
  },
  modules: ['@pinia/nuxt'],
  css: ['~/assets/style.css'],
  runtimeConfig: {
    public: {
      apiUrl: ''
    }
  },
  imports: {
    dirs: ['stores', 'api']
  }
})
