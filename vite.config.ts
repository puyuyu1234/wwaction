import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@core': fileURLToPath(new URL('./src/engine/core', import.meta.url)),
      '@components': fileURLToPath(new URL('./src/engine/components', import.meta.url)),
      '@entity': fileURLToPath(new URL('./src/engine/entity', import.meta.url)),
      '@game': fileURLToPath(new URL('./src/game', import.meta.url))
    }
  }
})
