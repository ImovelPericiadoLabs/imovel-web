import path from 'path'
import os from 'os'

import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/postcss'
import autoprefixer from 'autoprefixer'
import { defineConfig } from 'vitest/config'

const enableCoverage =
  process.env.VITEST_COVERAGE === '1' || process.argv.includes('--coverage')
const cpuCount = os.cpus().length
const parsedMax = Number(process.env.VITEST_MAX_WORKERS)
const maxWorkers = Number.isFinite(parsedMax) && parsedMax > 0
  ? parsedMax
  : Math.min(4, Math.max(1, cpuCount - 1))

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './vitest.setup.ts',
    pool: 'threads',
    maxWorkers,
    testTimeout: 15_000,
    hookTimeout: 15_000,
    ...(enableCoverage
      ? {
          coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            include: ['src/**/*.{ts,tsx}'],
            exclude: [
              '**/*index.{ts,tsx}',
              '**/*validations.ts',
              'node_modules/',
              'vitest.setup.ts',
              '.next/',
              'src/types/**',
              '**/*.types.ts',
              '**/*.d.ts',
            ],
            thresholds: {
              lines: 70,
              functions: 70,
              branches: 70,
              statements: 70,
            },
          },
        }
      : {}),
  },
  css: {
    postcss: {
      plugins: [tailwindcss, autoprefixer],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
