import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import { writeFileSync } from 'fs'
import { join } from 'path'
import { execSync } from 'child_process'

export default defineConfig({
  base: '/wwaction/',  // GitHub Pagesのリポジトリ名に合わせる
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
                // string[][][] を string[][] に変換（各レイヤーの各行を結合）
                const layerArray = data.map((layer: string[][]) =>
                  layer.map((row: string[]) => row.join(''))
                )
                writeFileSync(filePath, JSON.stringify(layerArray, null, 2))

                // stages.ts を自動生成
                execSync('pnpm tsx scripts/generate-stages.ts', { stdio: 'inherit' })

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
      '@ptre': fileURLToPath(new URL('./src/ptre', import.meta.url)),
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
