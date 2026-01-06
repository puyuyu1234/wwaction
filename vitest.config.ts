import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfigFn from './vite.config'

export default defineConfig((env) =>
  mergeConfig(
    viteConfigFn(env),
    defineConfig({
      test: {
        globals: true,
        environment: 'jsdom',
        exclude: ['**/node_modules/**', '**/legacy2/**'],
        coverage: {
          provider: 'v8',
          reporter: ['text', 'html', 'json'],
          include: ['src/**/*.ts'],
          exclude: [
            'src/**/*.spec.ts',
            'src/**/*.test.ts',
            'src/main.ts',
            'src/vite-env.d.ts'
          ]
        }
      }
    })
  )
)
