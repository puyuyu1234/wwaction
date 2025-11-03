import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import { writeFileSync } from 'fs'
import { join } from 'path'

export default defineConfig({
  plugins: [
    vue(),
    {
      name: 'stage-save-api',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url === '/api/save-stage' && req.method === 'POST') {
            let body = ''
            req.on('data', (chunk) => (body += chunk))
            req.on('end', () => {
              try {
                const { stageNumber, data } = JSON.parse(body)
                const filePath = join(process.cwd(), 'stages', `stage-${stageNumber}.json`)
                // string[][] を string[] に変換（各行を結合）
                const stringArray = data.map((row: string[]) => row.join(''))
                writeFileSync(filePath, JSON.stringify(stringArray, null, 2))
                res.writeHead(200, { 'Content-Type': 'application/json' })
                res.end(JSON.stringify({ success: true }))
              } catch (error) {
                res.writeHead(500, { 'Content-Type': 'application/json' })
                res.end(JSON.stringify({ error: String(error) }))
              }
            })
          } else {
            next()
          }
        })
      }
    }
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@core': fileURLToPath(new URL('./src/engine/core', import.meta.url)),
      '@components': fileURLToPath(new URL('./src/engine/components', import.meta.url)),
      '@entity': fileURLToPath(new URL('./src/engine/entity', import.meta.url)),
      '@game': fileURLToPath(new URL('./src/game', import.meta.url))
    }
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        editor: resolve(__dirname, 'editor/index.html')
      }
    }
  }
})
