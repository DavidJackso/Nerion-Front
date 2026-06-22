import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    proxy: {
      '/auth': { target: 'https://nerionapp.ru', changeOrigin: true },
      '/me': { target: 'https://nerionapp.ru', changeOrigin: true },
      '/spaces': {
        target: 'https://nerionapp.ru',
        changeOrigin: true,
        bypass(req) {
          if (req.headers.accept?.includes('text/html')) return '/index.html'
        },
      },
      '/templates': { target: 'https://nerionapp.ru', changeOrigin: true },
      '/lists': { target: 'https://nerionapp.ru', changeOrigin: true },
      '/api': { target: 'https://nerionapp.ru', changeOrigin: true },
    }
  }
})
