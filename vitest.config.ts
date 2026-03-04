import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['tests/**/*.test.ts'],
    setupFiles: ['tests/setup.ts'],
    alias: {
      '#supabase/server': resolve(__dirname, 'tests/__mocks__/supabase-server.ts'),
      '~~/': resolve(__dirname, './'),
    },
  },
})
